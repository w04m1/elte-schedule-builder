<script>
  import Icon from "./Icon.svelte";
  import { language, t } from "../utils/i18n.js";
  import {
    createCalendarEvents,
    fetchSubjectClasses,
    getConflictPairs,
    getTanrendSubjectCode,
    isTypoTolerantNameMatch,
    isLectureType,
    parseSubjectCodes,
    parseTimeString,
    rankSubjectMatches,
  } from "../utils/schedule.js";
  import {
    getEventCode,
    getEventIdentity,
    getEventSlotIdentity,
    normalizeSubjectTitle,
    selectInitialScheduleGroups,
  } from "../utils/scheduleState.js";

  let {
    importedCodes = { baseCodes: "", fullCodes: [], eventIdentities: [] },
    selectedEvents = [],
    lectureExemption = false,
    onScheduleUpdate,
    onClassSelection,
    onImportComplete,
  } = $props();

  let query = $state("");
  let error = $state("");
  let notice = $state("");
  let isLoading = $state(false);
  let loadingProgress = $state({ current: 0, total: 0, searchTerm: "" });
  let resultGroups = $state([]);
  let failedSearches = $state([]);
  let suggestions = $state([]);
  let activeSuggestionIndex = $state(0);
  let suggestionsEnabled = $state(false);
  let isSuggesting = $state(false);
  let fileInput = $state(null);
  let handledImport = "";
  let suggestionRequestId = 0;

  const showSuggestions = $derived(
    suggestionsEnabled && (isSuggesting || suggestions.length > 0),
  );

  const dayPriority = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
  };

  const classSectionDefinitions = [
    {
      id: "lectures",
      label: "lectures",
      icon: "book-open",
      matches: (row) => isLectureType(row.type),
    },
    {
      id: "practices",
      label: "practices",
      icon: "clock",
      matches: (row) => !isLectureType(row.type),
    },
  ];

  function compareClassRows(first, second) {
    return (
      first.dayIndex - second.dayIndex ||
      first.startMinutes - second.startMinutes ||
      first.code.localeCompare(second.code)
    );
  }

  function getClassSections(rows) {
    return classSectionDefinitions
      .map((definition) => ({
        ...definition,
        label: t($language, definition.label),
        rows: rows.filter(definition.matches).sort(compareClassRows),
      }))
      .filter((section) => section.rows.length > 0);
  }

  function keepSearchFocusUntilClick(event) {
    // Suggestions are in normal flow on narrow screens. Keeping input focus
    // through pointer-down prevents blur from moving an action before click.
    event.preventDefault();
  }

  $effect(() => {
    const importKey = `${importedCodes.baseCodes}|${importedCodes.fullCodes?.join(",")}`;
    if (!importedCodes.baseCodes || importKey === handledImport) return;
    handledImport = importKey;
    query = importedCodes.baseCodes;
    void importSharedSchedule();
  });

  $effect(() => {
    const suggestionQuery = query.trim();
    if (!suggestionsEnabled || suggestionQuery.length < 2 || isLoading) {
      isSuggesting = false;
      if (suggestionQuery.length < 2) suggestions = [];
      return;
    }

    const requestId = ++suggestionRequestId;
    isSuggesting = true;
    const timeout = setTimeout(() => {
      void loadSuggestions(suggestionQuery, requestId);
    }, 300);

    return () => clearTimeout(timeout);
  });

  function refineRows(classes, apiCode) {
    return classes
      .map((row, index) => {
        const time = parseTimeString(row.time);
        if (!time) return null;
        const [hour, minute] = time.startTime.split(":").map(Number);
        return {
          ...row,
          apiCode,
          resultKey: `${apiCode}-${index}`,
          dayOfWeek: time.dayOfWeek,
          startTime: time.startTime,
          endTime: time.endTime,
          when: `${time.dayOfWeek} ${time.startTime}–${time.endTime}`,
          dayIndex: dayPriority[time.dayOfWeek] ?? Number.MAX_SAFE_INTEGER,
          startMinutes: hour * 60 + minute,
        };
      })
      .filter(Boolean)
      .sort(compareClassRows);
  }

  function groupRowsBySubject(classes, searchTerm, mode, searchIndex) {
    const groupedRows = [];

    for (const row of refineRows(classes, searchTerm)) {
      const title = normalizeSubjectTitle(row.title);
      let existing = groupedRows.find((group) => group.title === title);
      if (!existing) {
        existing = { title, rows: [], codes: [] };
        groupedRows.push(existing);
      }
      existing.rows.push(row);
      const baseCode = getTanrendSubjectCode(row.code);
      if (!existing.codes.includes(baseCode)) existing.codes.push(baseCode);
    }

    return groupedRows
      .sort((first, second) => first.title.localeCompare(second.title))
      .map((group, index) => ({
        id: `${mode}-${searchIndex}-${index}`,
        apiCode: group.codes.sort().join(", "),
        title: group.title,
        classes: group.rows,
        rows: group.rows,
      }));
  }

  function getSearchRequests(rawQuery, mode) {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) return [];

    if (mode === "code") {
      return [
        ...new Set(parseSubjectCodes(trimmedQuery).map(getTanrendSubjectCode)),
      ].map((searchTerm) => ({ searchTerm, mode: "code" }));
    }

    const parsedCodes = parseSubjectCodes(trimmedQuery).map(
      getTanrendSubjectCode,
    );
    const isCode = (value) => /^[A-Za-z0-9._-]+$/.test(value);
    const hasCodeMarker = (value) => /[0-9._-]/.test(value);
    const codeSearches =
      parsedCodes.length === 1 && isCode(parsedCodes[0])
        ? parsedCodes
        : parsedCodes.length > 1 &&
            parsedCodes.every((value) => isCode(value) && hasCodeMarker(value))
          ? parsedCodes
          : [];

    const searches = [...new Set(codeSearches)].map((searchTerm) => ({
      searchTerm,
      mode: "code",
    }));
    searches.push({ searchTerm: trimmedQuery, mode: "name" });
    if (!looksLikeSubjectCode(trimmedQuery)) {
      searches.push({ searchTerm: trimmedQuery, mode: "instructor" });
    }
    return searches;
  }

  function looksLikeSubjectCode(rawQuery) {
    const trimmedQuery = rawQuery.trim();
    return (
      /[0-9._]/.test(trimmedQuery) ||
      /^[A-Za-z]{2,}(?:-[A-Za-z0-9]+)+$/.test(trimmedQuery)
    );
  }

  function getFuzzySearchRequests(rawQuery) {
    if (looksLikeSubjectCode(rawQuery)) return [];

    const words = rawQuery
      .trim()
      .split(/\s+/)
      .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ""))
      .filter((word) => word.length >= 4)
      .sort((first, second) => second.length - first.length);
    const word = words[0];
    if (!word) return [];

    const prefixLength = Math.min(6, Math.max(3, Math.ceil(word.length / 2)));
    const searchTerm = word.slice(0, prefixLength);
    if (
      searchTerm.toLocaleLowerCase() === rawQuery.trim().toLocaleLowerCase()
    ) {
      return [];
    }

    return [
      { searchTerm, mode: "name", fuzzy: true },
      { searchTerm, mode: "instructor", fuzzy: true },
    ];
  }

  function getMatchingInstructor(group, rawQuery) {
    if (isTypoTolerantNameMatch(group.title, rawQuery)) return "";
    const instructor = group.rows.find(
      (row) =>
        row.instructor && isTypoTolerantNameMatch(row.instructor, rawQuery),
    )?.instructor;
    return (instructor ?? "")
      .replace(/\s*\(\s*\d+\s*%\s*,\s*administrator\s*\)\s*$/i, "")
      .trim();
  }

  function groupMatchesName(group, rawQuery) {
    return Boolean(
      isTypoTolerantNameMatch(group.title, rawQuery) ||
      getMatchingInstructor(group, rawQuery),
    );
  }

  function addSearchContext(groups, rawQuery) {
    return groups.map((group) => ({
      ...group,
      matchedInstructor: getMatchingInstructor(group, rawQuery),
    }));
  }

  function mergeSubjectGroups(groups) {
    const merged = [];

    for (const group of groups) {
      const subjectKey = group.title.toLocaleLowerCase();
      let subject = merged.find((candidate) => candidate.key === subjectKey);
      if (!subject) {
        subject = {
          key: subjectKey,
          title: group.title,
          codes: [],
          rows: [],
          rowKeys: [],
        };
        merged.push(subject);
      }

      for (const row of group.rows) {
        const baseCode = getTanrendSubjectCode(row.code);
        if (!subject.codes.includes(baseCode)) subject.codes.push(baseCode);
        const rowKey = [
          row.code,
          row.time,
          row.type,
          row.location,
          row.instructor,
        ].join("|");
        if (subject.rowKeys.includes(rowKey)) continue;
        subject.rowKeys.push(rowKey);
        subject.rows.push(row);
      }
    }

    return merged
      .sort((first, second) => first.title.localeCompare(second.title))
      .map((subject, subjectIndex) => {
        const rows = subject.rows
          .sort(compareClassRows)
          .map((row, rowIndex) => ({
            ...row,
            resultKey: `result-${subjectIndex}-${rowIndex}`,
          }));
        return {
          id: `result-${subjectIndex}`,
          apiCode: subject.codes.sort().join(", "),
          title: subject.title,
          classes: rows,
          rows,
          sections: getClassSections(rows),
        };
      });
  }

  async function fetchGroupsForRequest(searchRequest, searchIndex) {
    const { searchTerm, mode: searchMode } = searchRequest;
    const classes =
      searchMode === "code"
        ? await fetchSubjectClasses(searchTerm)
        : await fetchSubjectClasses(searchTerm, searchMode);
    return groupRowsBySubject(classes, searchTerm, searchMode, searchIndex);
  }

  async function loadSuggestions(rawQuery, requestId) {
    const searches = getSearchRequests(rawQuery, "all");
    const groups = [];

    for (const [index, searchRequest] of searches.entries()) {
      try {
        groups.push(...(await fetchGroupsForRequest(searchRequest, index)));
      } catch {
        // Suggestions are optional; the explicit search reports request errors.
      }
    }

    if (groups.length === 0) {
      const fuzzyGroups = [];
      for (const [index, searchRequest] of getFuzzySearchRequests(
        rawQuery,
      ).entries()) {
        try {
          fuzzyGroups.push(
            ...(await fetchGroupsForRequest(
              searchRequest,
              searches.length + index,
            )),
          );
        } catch {
          // Typo-tolerant suggestions are optional.
        }
      }
      groups.push(
        ...fuzzyGroups.filter((group) => groupMatchesName(group, rawQuery)),
      );
    }

    if (requestId !== suggestionRequestId || query.trim() !== rawQuery) return;
    suggestions = rankSubjectMatches(
      addSearchContext(mergeSubjectGroups(groups), rawQuery),
      rawQuery,
      3,
    );
    activeSuggestionIndex = 0;
    isSuggesting = false;
  }

  async function loadGroups(rawQuery, mode = "code") {
    const searches = getSearchRequests(rawQuery, mode);
    if (searches.length === 0) {
      error =
        mode === "all"
          ? t($language, "enterSearch")
          : t($language, "enterCode");
      return [];
    }

    isLoading = true;
    error = "";
    notice = "";
    failedSearches = [];
    loadingProgress = {
      current: 0,
      total: searches.length,
      searchTerm: searches[0].searchTerm,
    };
    const groups = [];
    const failedRequests = [];

    for (const [index, searchRequest] of searches.entries()) {
      const { searchTerm, mode: searchMode } = searchRequest;
      loadingProgress = {
        current: index,
        total: searches.length,
        searchTerm: t(
          $language,
          searchMode === "code"
            ? "progressCode"
            : searchMode === "instructor"
              ? "progressProfessor"
              : "progressCourse",
          { term: searchTerm },
        ),
      };
      try {
        const searchGroups = await fetchGroupsForRequest(searchRequest, index);
        if (searchGroups.length > 0) {
          groups.push(...searchGroups);
        } else {
          failedRequests.push(searchRequest);
        }
      } catch (fetchError) {
        console.error(`Error fetching data for ${searchTerm}:`, fetchError);
        failedRequests.push(searchRequest);
      }
      loadingProgress = {
        current: index + 1,
        total: searches.length,
        searchTerm,
      };
    }

    if (groups.length === 0) {
      const fuzzySearches = getFuzzySearchRequests(rawQuery);
      const totalSearches = searches.length + fuzzySearches.length;
      const fuzzyGroups = [];

      for (const [index, searchRequest] of fuzzySearches.entries()) {
        const progressIndex = searches.length + index;
        loadingProgress = {
          current: progressIndex,
          total: totalSearches,
          searchTerm: t(
            $language,
            searchRequest.mode === "instructor"
              ? "progressSimilarProfessor"
              : "progressSimilarCourse",
          ),
        };
        try {
          fuzzyGroups.push(
            ...(await fetchGroupsForRequest(searchRequest, progressIndex)),
          );
        } catch {
          // The primary searches report the useful error state below.
        }
        loadingProgress = {
          current: progressIndex + 1,
          total: totalSearches,
          searchTerm: searchRequest.searchTerm,
        };
      }

      groups.push(
        ...fuzzyGroups.filter((group) => groupMatchesName(group, rawQuery)),
      );
    }

    isLoading = false;
    const mergedGroups = addSearchContext(mergeSubjectGroups(groups), rawQuery);
    const codeSearchCount = searches.filter(
      (searchRequest) => searchRequest.mode === "code",
    ).length;
    failedSearches = [
      ...new Set(
        failedRequests
          .filter(
            (searchRequest) =>
              mode === "code" ||
              (mode === "all" &&
                codeSearchCount > 1 &&
                searchRequest.mode === "code"),
          )
          .map((searchRequest) => searchRequest.searchTerm),
      ),
    ];
    if (mergedGroups.length === 0) {
      error = t($language, mode === "all" ? "noClassesAll" : "noClassesCode");
    }
    return mergedGroups;
  }

  async function search() {
    closeSuggestions();
    resultGroups = await loadGroups(query, "all");
  }

  function handleQueryInput(event) {
    query = event.currentTarget.value;
    suggestionsEnabled = true;
    activeSuggestionIndex = 0;
    error = "";
  }

  function closeSuggestions() {
    suggestionRequestId += 1;
    suggestionsEnabled = false;
    isSuggesting = false;
    suggestions = [];
    activeSuggestionIndex = 0;
  }

  function selectSuggestion(group) {
    query = group.apiCode || group.title;
    resultGroups = [group];
    error = "";
    notice = "";
    failedSearches = [];
    closeSuggestions();
  }

  function handleSearchKeydown(event) {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === "Escape") closeSuggestions();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeSuggestionIndex =
        (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectSuggestion(suggestions[activeSuggestionIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeSuggestions();
    }
  }

  function addAllGroups(
    groups,
    enabledCodes = null,
    enabledEventIdentities = null,
  ) {
    const hasIdentitySelection = enabledEventIdentities?.length > 0;
    const hasCodeSelection = enabledCodes?.length > 0;
    let events = groups.flatMap(({ classes }) =>
      createCalendarEvents(classes).map((event) => ({
        ...event,
        enabled: hasIdentitySelection
          ? enabledEventIdentities.includes(getEventIdentity(event))
          : hasCodeSelection
            ? enabledCodes.includes(getEventCode(event))
            : false,
      })),
    );
    if (!hasIdentitySelection && !hasCodeSelection) {
      events = selectInitialScheduleGroups(events, selectedEvents);
    }
    if (events.length > 0) onScheduleUpdate?.(events);
    return events.length;
  }

  function addSubjectGroup(group) {
    const count = addAllGroups([group]);
    notice = t($language, count === 1 ? "addedMeeting" : "addedMeetings", {
      name: group.title,
      count,
    });
    finishAdding();
  }

  function addSelectedClass(group, row) {
    const events = createCalendarEvents(group.classes);
    onClassSelection?.(events, row);
    notice = t($language, "classSelected", {
      name: group.title,
      when: localizeWhen(row.when),
    });
  }

  function getClassRowState(row) {
    const [candidate] = createCalendarEvents([row]);
    if (!candidate) return { selected: false, conflict: false };

    const exactSelection = selectedEvents.some(
      (event) => getEventIdentity(event) === getEventIdentity(row),
    );
    const slotSelection = selectedEvents.some(
      (event) => getEventSlotIdentity(event) === getEventSlotIdentity(row),
    );
    const matchingResultRows = resultGroups
      .flatMap((group) => group.rows)
      .filter(
        (resultRow) =>
          getEventSlotIdentity(resultRow) === getEventSlotIdentity(row),
      );
    const selected =
      exactSelection || (slotSelection && matchingResultRows.length === 1);
    if (selected) return { selected: true, conflict: false };

    const candidateTitle = normalizeSubjectTitle(candidate.title);
    const candidateIsLecture = isLectureType(row.type);
    const retainedEvents = selectedEvents.filter(
      (event) =>
        !(
          normalizeSubjectTitle(event.title) === candidateTitle &&
          isLectureType(event.extendedProps?.type) === candidateIsLecture
        ),
    );
    const candidateIndex = retainedEvents.length;
    const conflict = getConflictPairs(
      [...retainedEvents, candidate],
      lectureExemption,
    ).some(
      ({ event1, event2 }) =>
        event1 === candidateIndex || event2 === candidateIndex,
    );

    return { selected: false, conflict };
  }

  function finishAdding() {
    resultGroups = [];
    requestAnimationFrame(() => {
      document.getElementById("timetable-heading")?.focus();
    });
  }

  async function importSharedSchedule() {
    const groups = await loadGroups(importedCodes.baseCodes, "code");
    resultGroups = groups;
    addAllGroups(
      groups,
      importedCodes.fullCodes,
      importedCodes.eventIdentities,
    );
    onImportComplete?.();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    error = "";
    try {
      // Load the sizeable spreadsheet parser only when a file is selected.
      const { readRegisteredSubjectCodes } =
        await import("../utils/registeredSubjectsFile.js");
      const codes = await readRegisteredSubjectCodes(file);
      if (codes.length === 0) {
        error = t($language, "noCodesInFile");
        return;
      }
      query = codes.join(" ");
      const groups = await loadGroups(query, "code");
      resultGroups = groups;
      const count = addAllGroups(groups);
      if (count > 0) {
        notice = t(
          $language,
          groups.length === 1 ? "neptunAddedOne" : "neptunAdded",
          { count: groups.length },
        );
        finishAdding();
      }
    } catch (fileError) {
      console.error("Error reading uploaded file:", fileError);
      error = t($language, "fileReadFailed");
    }
  }

  function localizeWhen(value = "") {
    return value.replace(
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/,
      (day) => t($language, day.toLocaleLowerCase("en-US")),
    );
  }

  function localizeType(value = "") {
    if (isLectureType(value)) return t($language, "lecture");
    if (/practice/i.test(value)) return t($language, "practice");
    return value || t($language, "class");
  }
</script>

<section
  id="course-finder"
  class="course-finder"
  class:suggestions-open={showSuggestions}
  aria-labelledby="course-finder-heading"
>
  <div class="finder-heading">
    <div>
      <h2 id="course-finder-heading">{t($language, "addCourses")}</h2>
    </div>
  </div>

  <form
    class="search-row"
    onsubmit={(event) => {
      event.preventDefault();
      search();
    }}
  >
    <label class="sr-only" for="subject-search-query">
      {t($language, "searchLabel")}
    </label>
    <div class="autocomplete">
      <div class="search-box">
        <Icon name="search" size={20} />
        <input
          id="subject-search-query"
          value={query}
          type="text"
          role="combobox"
          placeholder={t($language, "searchPlaceholder")}
          aria-invalid={error ? "true" : undefined}
          aria-autocomplete="list"
          aria-controls="subject-suggestions"
          aria-expanded={showSuggestions}
          aria-activedescendant={showSuggestions && suggestions.length > 0
            ? `subject-suggestion-${activeSuggestionIndex}`
            : undefined}
          aria-describedby="subject-search-hint"
          autocomplete="off"
          spellcheck="false"
          disabled={isLoading}
          oninput={handleQueryInput}
          onkeydown={handleSearchKeydown}
          onfocus={() => {
            if (query.trim().length >= 2 && suggestions.length > 0) {
              suggestionsEnabled = true;
            }
          }}
          onblur={() => closeSuggestions()}
        />
      </div>
      <span id="subject-search-hint" class="sr-only">
        {t($language, "searchHint")}
      </span>
      {#if showSuggestions}
        <div
          id="subject-suggestions"
          class="suggestions"
          role="listbox"
          aria-label={t($language, "subjectSuggestions")}
          aria-busy={isSuggesting}
        >
          {#if isSuggesting}
            <div class="suggestion-loading" role="status">
              {t($language, "findingMatches")}
            </div>
          {:else}
            <div class="suggestions-heading" aria-hidden="true">
              <strong>{t($language, "bestMatches")}</strong>
              <span>{t($language, "suggestionKeyboard")}</span>
            </div>
            {#each suggestions as suggestion, index (suggestion.id)}
              <button
                id={`subject-suggestion-${index}`}
                type="button"
                class:active-suggestion={index === activeSuggestionIndex}
                class="suggestion"
                role="option"
                aria-selected={index === activeSuggestionIndex}
                onpointerdown={keepSearchFocusUntilClick}
                onmouseenter={() => (activeSuggestionIndex = index)}
                onclick={() => selectSuggestion(suggestion)}
              >
                <span class="suggestion-main">
                  <strong>{suggestion.title}</strong>
                  <span title={suggestion.apiCode}>{suggestion.apiCode}</span>
                  {#if suggestion.matchedInstructor}
                    <small
                      >{t($language, "taughtBy", {
                        name: suggestion.matchedInstructor,
                      })}</small
                    >
                  {/if}
                </span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
    <button
      type="submit"
      class="button button-primary button-large"
      disabled={isLoading}
      onpointerdown={keepSearchFocusUntilClick}
    >
      <Icon name="search" size={18} />
      {isLoading ? t($language, "searching") : t($language, "findCourses")}
    </button>
    <button
      type="button"
      class="button button-transfer"
      onclick={() => fileInput?.click()}
      disabled={isLoading}
      title={t($language, "uploadNeptun")}
      onpointerdown={keepSearchFocusUntilClick}
    >
      <Icon name="upload" size={18} />
      {t($language, "importNeptun")}
    </button>
  </form>

  <div class="feedback" aria-live="polite">
    {#if isLoading}
      <div class="loading-status" role="status">
        <span
          >{t($language, "checking", {
            term: loadingProgress.searchTerm,
          })}</span
        >
        <progress max={loadingProgress.total} value={loadingProgress.current}
        ></progress>
        <span>{loadingProgress.current}/{loadingProgress.total}</span>
      </div>
    {/if}
    {#if error}
      <p class="message error" role="alert">
        <Icon name="alert-triangle" size={16} />{error}
      </p>
    {:else if notice}
      <p class="message success" role="status">
        <Icon name="check" size={16} />{notice}
      </p>
    {/if}
    {#if failedSearches.length > 0 && resultGroups.length > 0}
      <p class="message warning">
        {t($language, "failedSearches", { items: failedSearches.join(", ") })}
      </p>
    {/if}
  </div>

  {#if resultGroups.length > 0}
    <div class="results" aria-label={t($language, "searchResults")}>
      {#each resultGroups as group, groupIndex (group.id)}
        <section class="result-group" aria-labelledby={`result-${group.id}`}>
          <div class="result-group-heading">
            <div>
              <h3 id={`result-${group.id}`}>{group.title}</h3>
              <span>{group.apiCode}</span>
              {#if group.matchedInstructor}
                <small class="professor-match">
                  {t($language, "taughtBy", { name: group.matchedInstructor })}
                </small>
              {/if}
            </div>
            <div class="result-group-actions">
              <button
                type="button"
                class="button button-secondary button-small"
                onclick={() => addSubjectGroup(group)}
              >
                <Icon name="plus" size={16} />
                {t($language, "addAllGroups")}
              </button>
              {#if groupIndex === 0}
                <button
                  type="button"
                  class="close-results"
                  onclick={() => (resultGroups = [])}
                  aria-label={t($language, "closeResults")}
                >
                  <Icon name="x" size={18} />
                </button>
              {/if}
            </div>
          </div>
          <div class="class-list">
            {#each group.sections as section (section.id)}
              <section
                class={`class-section class-section-${section.id}`}
                aria-labelledby={`${group.id}-${section.id}-heading`}
              >
                <div class="class-section-heading">
                  <div class="class-section-title">
                    <span class="class-section-icon" aria-hidden="true">
                      <Icon name={section.icon} size={16} />
                    </span>
                    <h4 id={`${group.id}-${section.id}-heading`}>
                      {section.label}
                    </h4>
                  </div>
                </div>
                <div class="class-section-rows">
                  {#each section.rows as row (row.resultKey)}
                    {@const rowState = getClassRowState(row)}
                    <button
                      type="button"
                      class="class-row"
                      class:is-selected={rowState.selected}
                      class:has-conflict={rowState.conflict}
                      aria-pressed={rowState.selected}
                      aria-label={`${t($language, rowState.selected ? "selectedClass" : "selectClass")}: ${row.title}, ${localizeType(row.type)}, ${localizeWhen(row.when)}, ${row.code}${rowState.conflict ? `, ${t($language, "conflictsWithTimetable")}` : ""}`}
                      onclick={() => addSelectedClass(group, row)}
                    >
                      <div class="class-time">
                        <strong>{localizeWhen(row.when)}</strong>
                        <span>{localizeType(row.type)}</span>
                      </div>
                      <div class="class-details">
                        <span class="class-code">{row.code}</span>
                        <span
                          >{row.location ||
                            t($language, "locationMissing")}</span
                        >
                        <span
                          >{row.instructor ||
                            t($language, "instructorMissing")}</span
                        >
                      </div>
                      {#if rowState.selected}
                        <span class="class-status selected-status">
                          <Icon name="check" size={16} />
                          {t($language, "selected")}
                        </span>
                      {:else if rowState.conflict}
                        <span class="class-status conflict-status">
                          <Icon name="alert-triangle" size={16} />
                          {t($language, "conflicts")}
                        </span>
                      {/if}
                    </button>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}

  <input
    bind:this={fileInput}
    type="file"
    accept=".xlsx"
    class="file-input"
    onchange={handleFileChange}
    tabindex="-1"
    aria-hidden="true"
  />
</section>

<style>
  .course-finder {
    position: relative;
    overflow: visible;
    height: 100%;
    margin: 0;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .course-finder.suggestions-open {
    z-index: 50;
  }

  .finder-heading {
    display: flex;
    align-items: flex-start;
    min-height: 54px;
    padding: 14px 14px 7px;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  h2 {
    font-size: var(--text-lg);
    line-height: 1.25;
  }

  .search-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    padding: 6px 14px 12px;
  }

  .search-box {
    display: flex;
    align-items: center;
    min-width: 0;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text-muted);
    box-shadow: var(--shadow-control-inset);
  }

  .autocomplete {
    position: relative;
    min-width: 0;
  }

  .suggestions {
    position: absolute;
    z-index: 1;
    top: calc(100% + 6px);
    right: 0;
    left: 0;
    display: grid;
    gap: 5px;
    overflow: hidden;
    padding: 6px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-subtle);
    box-shadow: var(--shadow-2);
  }

  .suggestions-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 2px 6px 4px;
    color: var(--color-text-muted);
    font-size: var(--text-xs);
  }

  .suggestions-heading strong {
    color: var(--color-text);
    font-size: var(--text-xs);
    letter-spacing: 0.01em;
  }

  .suggestion,
  .suggestion-loading {
    width: 100%;
    min-height: 58px;
    padding: 9px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    text-align: left;
  }

  .suggestion {
    display: block;
    box-shadow: var(--shadow-control-inset);
    cursor: pointer;
  }

  .suggestion:hover {
    border-color: var(--color-border-strong);
    background: var(--color-surface-2);
  }

  .active-suggestion {
    border-color: var(--color-focus);
    background: color-mix(
      in srgb,
      var(--color-focus-ring) 48%,
      var(--color-surface)
    );
    box-shadow: 0 0 0 1px var(--color-focus);
  }

  .suggestion-main {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .suggestion-main strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .suggestion-main span,
  .suggestion-loading {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .suggestion-main span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-accent-strong);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-weight: 700;
  }

  .suggestion-main small,
  .professor-match {
    color: var(--color-text-muted);
    font-family: inherit;
    font-size: var(--text-xs);
    font-weight: 500;
  }

  .professor-match {
    display: block;
    margin-top: 2px;
  }

  .search-box :global(svg) {
    margin-left: 12px;
  }

  input[type="text"] {
    width: 100%;
    min-width: 0;
    height: 46px;
    padding: 0 12px 0 10px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-text);
    font: inherit;
  }

  .search-box:focus-within {
    border-color: var(--color-focus);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  .feedback:empty {
    display: none;
  }

  .loading-status,
  .message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    font-size: 0.84rem;
  }

  .loading-status progress {
    flex: 1;
    height: 6px;
    accent-color: var(--color-primary);
  }

  .error {
    color: var(--color-danger);
  }

  .success {
    color: var(--color-success);
  }

  .warning {
    color: var(--color-warning);
  }

  .results {
    max-height: 520px;
    overflow: auto;
    padding: 4px 10px 10px;
    background: var(--color-surface);
  }

  .result-group-heading,
  .class-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .close-results {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .close-results:hover {
    background: var(--color-surface-3);
    color: var(--color-text);
  }

  .result-group {
    margin: 0 0 8px;
    overflow: hidden;
    border-radius: var(--radius-md);
    background: var(--color-surface-subtle);
  }

  .result-group-heading {
    justify-content: space-between;
    padding: 10px 12px;
  }

  .result-group-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .result-group-heading h3 {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .result-group-heading span,
  .class-details span,
  .class-time span {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .class-section + .class-section {
    margin-top: 4px;
  }

  .class-section-heading,
  .class-section-title {
    display: flex;
    align-items: center;
  }

  .class-section-heading {
    padding: 8px 12px;
    background: color-mix(in srgb, var(--color-surface-2) 70%, transparent);
  }

  .class-section-title {
    gap: 8px;
  }

  .class-section-heading h4 {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.25;
  }

  .class-section-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
  }

  .class-section-lectures .class-section-icon {
    background: color-mix(in srgb, var(--color-success) 12%, transparent);
    color: var(--color-success);
  }

  .class-section-practices .class-section-icon {
    background: color-mix(in srgb, var(--color-info) 12%, transparent);
    color: var(--color-info);
  }

  .class-row {
    display: grid;
    grid-template-columns:
      minmax(200px, 0.75fr) minmax(420px, 1.7fr)
      minmax(110px, auto);
    column-gap: var(--space-5);
    width: 100%;
    min-height: 58px;
    padding: 10px 14px;
    border: 1px solid transparent;
    border-top-color: transparent;
    border-radius: 0;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .class-row:focus-visible {
    position: relative;
    z-index: 1;
    outline: 3px solid var(--color-focus-ring);
    outline-offset: -3px;
    border-color: var(--color-focus);
  }

  .class-row:hover {
    background: var(--color-surface-2);
  }

  .class-section-lectures
    .class-row:hover:not(.is-selected):not(.has-conflict) {
    border-color: var(--color-event-lecture);
  }

  .class-section-practices
    .class-row:hover:not(.is-selected):not(.has-conflict) {
    border-color: var(--color-event-practice);
  }

  .class-row.is-selected {
    border-color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 10%, transparent);
  }

  .class-row.has-conflict {
    border-color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  }

  .class-status {
    display: inline-flex;
    align-items: center;
    align-self: center;
    gap: 5px;
    font-size: 0.78rem;
    font-weight: 700;
    justify-self: end;
    white-space: nowrap;
  }

  .selected-status {
    color: var(--color-success);
  }

  .conflict-status {
    color: var(--color-danger);
  }

  .class-time,
  .class-details {
    display: grid;
    gap: var(--space-1);
    min-width: 0;
  }

  .class-time strong {
    font-size: var(--text-base);
    line-height: 1.3;
  }

  .class-details {
    grid-template-columns: minmax(130px, 0.8fr) minmax(150px, 1fr) minmax(
        180px,
        1.15fr
      );
    align-items: center;
    column-gap: var(--space-5);
  }

  .class-details span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .class-code {
    color: var(--color-accent-strong) !important;
    font-family: var(--font-mono);
    font-weight: var(--weight-bold);
  }

  .file-input {
    display: none;
  }

  @media (max-width: 800px) {
    .finder-heading {
      display: block;
    }

    .search-row {
      grid-template-columns: 1fr 1fr;
    }

    .autocomplete {
      grid-column: 1 / -1;
    }

    .suggestions {
      position: static;
      margin-top: 6px;
    }

    .class-row {
      grid-template-columns: 1fr auto;
    }

    .class-details {
      grid-column: 1 / -1;
      grid-row: 2;
      grid-template-columns: 1fr;
    }

    .results {
      max-height: none;
      overflow: visible;
    }
  }

  @media (max-width: 520px) {
    .finder-heading {
      min-height: 48px;
      padding: 12px 12px 5px;
    }

    .search-row {
      grid-template-columns: 1fr;
      padding: 6px 12px 12px;
    }

    .autocomplete {
      grid-column: auto;
    }

    .result-group-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .button-large,
    .button-transfer {
      min-height: 46px;
    }

    .results {
      padding-inline: 8px;
    }

    .result-group-actions {
      width: 100%;
    }

    .result-group-actions .button {
      flex: 1;
    }

    .class-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .class-details {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .class-status {
      grid-row: 1;
      grid-column: 2;
      justify-self: end;
    }
  }
</style>
