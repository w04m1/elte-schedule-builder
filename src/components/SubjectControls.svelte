<script>
  import Icon from "./Icon.svelte";
  import { getEventGroupNumber, isLectureType } from "../utils/schedule.js";
  import { getEventInstructor } from "../utils/scheduleState.js";
  import { language, t } from "../utils/i18n.js";

  let {
    subjects = [],
    onToggleSubject,
    onToggleEvent,
    onDeleteSubject,
  } = $props();

  let openSubject = $state(null);

  const sortedSubjectEntries = $derived(
    subjects
      .map((subject, subjectIndex) => ({ subject, subjectIndex }))
      .sort((first, second) =>
        first.subject.title.localeCompare(second.subject.title, undefined, {
          sensitivity: "base",
          numeric: true,
        }),
      ),
  );

  const enabledEvents = $derived(
    subjects.flatMap((subject) =>
      subject.enabled
        ? (subject.events ?? []).filter((event) => event.enabled)
        : [],
    ),
  );
  const lectureCount = $derived(
    enabledEvents.filter((event) => isLectureType(event.extendedProps?.type))
      .length,
  );
  const practiceCount = $derived(enabledEvents.length - lectureCount);
  const conflictCount = $derived(
    enabledEvents.filter((event) => event.hasConflict).length,
  );

  $effect(() => {
    if (
      openSubject &&
      !sortedSubjectEntries.some(({ subject }) => subject.title === openSubject)
    )
      openSubject = null;
  });

  const dayOrder = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  function toggleEvents(title) {
    openSubject = openSubject === title ? null : title;
  }

  function formatEventLabel(event) {
    const type = isLectureType(event.extendedProps?.type)
      ? t($language, "lecture")
      : t($language, "practice");
    const group = getEventGroupNumber(event);
    const groupLabel = group
      ? `, ${t($language, "group").toLocaleLowerCase($language)} ${group}`
      : "";
    return `${type}${groupLabel}, ${t($language, event.dayOfWeek.toLocaleLowerCase("en-US"))} ${event.startTime}–${event.endTime}`;
  }

  function formatEventWhen(event) {
    return `${t($language, event.dayOfWeek.toLocaleLowerCase("en-US"))} ${event.startTime}–${event.endTime}`;
  }

  function getSubjectCodes(subject) {
    const codes = [
      ...new Set(
        (subject.events ?? [])
          .filter((event) => event.enabled && event.code)
          .map((event) => event.code),
      ),
    ];
    return codes.slice(0, 2).join(" · ");
  }

  function compareEvents(first, second) {
    return (
      (dayOrder[first.event.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) -
        (dayOrder[second.event.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) ||
      first.event.startTime.localeCompare(second.event.startTime) ||
      first.event.endTime.localeCompare(second.event.endTime) ||
      (first.event.code ?? "").localeCompare(second.event.code ?? "") ||
      first.eventIndex - second.eventIndex
    );
  }

  function getEventGroups(subject) {
    const indexedEvents = subject.events.map((event, eventIndex) => ({
      event,
      eventIndex,
    }));

    return [
      {
        key: "lecture",
        label: t($language, "lectures"),
        events: indexedEvents
          .filter(({ event }) => isLectureType(event.extendedProps?.type))
          .sort(compareEvents),
      },
      {
        key: "practice",
        label: t($language, "practices"),
        events: indexedEvents
          .filter(({ event }) => !isLectureType(event.extendedProps?.type))
          .sort(compareEvents),
      },
    ].filter((group) => group.events.length > 0);
  }
</script>

<section class="subjects" aria-label={t($language, "selectedSubjects")}>
  <header class="subjects-heading">
    <h2>
      {t($language, "selectedSubjects")}
      <span>({subjects.length})</span>
    </h2>
    {#if subjects.length > 0}
      <ul class="selection-stats" aria-label={t($language, "selectedSubjects")}>
        <li class="lecture-stat">
          {t($language, "lectures")} <strong>{lectureCount}</strong>
        </li>
        <li class="practice-stat">
          {t($language, "practices")} <strong>{practiceCount}</strong>
        </li>
        {#if conflictCount > 0}
          <li class="conflict-stat">
            {t($language, "conflicts")} <strong>{conflictCount}</strong>
          </li>
        {/if}
      </ul>
    {/if}
  </header>

  {#if sortedSubjectEntries.length === 0}
    <div class="empty-subjects">
      <strong>{t($language, "weekReady")}</strong>
      <span>{t($language, "findThenChoose")}</span>
    </div>
  {:else}
    <div class="subject-scroll">
      <ul class="subject-list">
        {#each sortedSubjectEntries as { subject, subjectIndex } (subject.title)}
          <li class="subject-card">
            <div class="subject-row">
              <input
                class="subject-checkbox"
                type="checkbox"
                checked={subject.enabled}
                aria-label={t($language, "showSubject", {
                  name: subject.title,
                })}
                onchange={() => onToggleSubject?.(subject.title)}
              />
              <button
                type="button"
                class="subject-expand"
                class:expanded={openSubject === subject.title}
                aria-label={t($language, "editClasses", {
                  name: subject.title,
                })}
                aria-expanded={openSubject === subject.title}
                aria-controls={`subject-events-${subjectIndex}`}
                onclick={() => toggleEvents(subject.title)}
              >
                <span class="subject-title">
                  <strong>{subject.title}</strong>
                  {#if getSubjectCodes(subject)}
                    <small>{getSubjectCodes(subject)}</small>
                  {/if}
                </span>
                <Icon
                  name={openSubject === subject.title
                    ? "chevron-up"
                    : "chevron-down"}
                  size={16}
                />
              </button>
              <button
                type="button"
                class="delete-btn"
                title={t($language, "removeSubjectTitle")}
                aria-label={t($language, "removeSubject", {
                  name: subject.title,
                })}
                onclick={() => onDeleteSubject?.(subject.title)}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>

            {#if openSubject === subject.title}
              <fieldset
                id={`subject-events-${subjectIndex}`}
                class="event-options"
              >
                <legend>
                  {t($language, "groupsFor", { name: subject.title })}
                </legend>
                <div class="event-options-heading">
                  <span>{t($language, "chooseOneEach")}</span>
                </div>

                {#each getEventGroups(subject) as group (group.key)}
                  <section
                    class={`event-group event-group-${group.key}`}
                    aria-labelledby={`event-group-${subjectIndex}-${group.key}`}
                  >
                    <h3 id={`event-group-${subjectIndex}-${group.key}`}>
                      <span class="event-group-dot" aria-hidden="true"></span>
                      {group.label}
                    </h3>
                    <div class="event-group-options">
                      {#each group.events as { event, eventIndex } (eventIndex)}
                        <label
                          class:conflict={event.hasConflict}
                          class="event-toggle"
                        >
                          <input
                            type="radio"
                            name={`subject-${subjectIndex}-${group.key}`}
                            checked={event.enabled}
                            aria-label={formatEventLabel(event)}
                            onchange={() =>
                              onToggleEvent?.(subject.title, eventIndex)}
                          />
                          <span class="event-when">
                            <strong>{formatEventWhen(event)}</strong>
                          </span>
                          <span class="event-instructor">
                            {getEventInstructor(event) ||
                              t($language, "instructorMissing")}
                          </span>
                          <span class="event-status">
                            {#if event.hasConflict}
                              <span class="conflict-label">
                                <Icon name="alert-triangle" size={14} />
                                {t($language, "conflict")}
                              </span>
                            {/if}
                          </span>
                        </label>
                      {/each}
                    </div>
                  </section>
                {/each}
              </fieldset>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .subjects {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
  }

  .subjects-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 54px;
    padding: 10px 14px;
  }

  .subjects-heading h2 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--text-lg);
    line-height: 1.25;
  }

  .subjects-heading h2 span {
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .selection-stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .selection-stats li {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
  }

  .selection-stats li::before {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    content: "";
  }

  .selection-stats strong {
    color: inherit;
  }

  .lecture-stat {
    color: var(--color-event-lecture) !important;
  }

  .practice-stat {
    color: var(--color-event-practice) !important;
  }

  .conflict-stat {
    color: var(--color-event-conflict) !important;
  }

  .subject-scroll {
    min-height: 0;
    max-height: 590px;
    overflow: auto;
    padding: 0 10px 10px;
  }

  .empty-subjects {
    display: grid;
    place-content: center;
    flex: 1;
    min-height: 184px;
    padding: 28px;
    color: var(--color-text-muted);
    text-align: center;
  }

  .empty-subjects strong {
    color: var(--color-text);
    font-size: 0.92rem;
  }

  .empty-subjects span {
    margin-top: 3px;
    font-size: 0.78rem;
  }

  .subject-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .subject-card {
    border-radius: var(--radius-sm);
    background: var(--color-surface-subtle);
  }

  .subject-card:has(.event-options) {
    background: var(--color-surface-2);
  }

  .subject-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 4px;
    min-height: 46px;
    padding: 3px;
  }

  .subject-checkbox,
  .event-toggle input {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    accent-color: var(--color-primary);
  }

  .subject-checkbox {
    margin: 0 8px;
    cursor: pointer;
  }

  .subject-expand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    min-height: 40px;
    padding: 7px 10px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-bold);
    text-align: left;
  }

  .subject-expand > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .subject-title {
    display: grid;
    gap: 1px;
  }

  .subject-title strong {
    font-size: var(--text-base);
    line-height: 1.3;
  }

  .subject-title small {
    overflow: hidden;
    color: var(--color-accent);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subject-expand :global(svg) {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }

  .delete-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }

  .delete-btn {
    width: 36px;
    min-height: 36px;
    padding: 0;
    color: var(--color-danger);
  }

  .subject-expand:hover,
  .subject-expand.expanded {
    background: var(--color-surface-2);
  }

  .delete-btn:hover {
    background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  }

  .subject-expand:focus-visible,
  .delete-btn:focus-visible,
  .subject-checkbox:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 1px;
  }

  .event-options {
    display: grid;
    gap: var(--space-4);
    width: 100%;
    margin: 0 4px 4px;
    padding: var(--space-3);
    border: 0;
    border-radius: var(--radius-md);
    background: var(--color-surface-subtle);
  }

  legend {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .event-options-heading {
    display: block;
  }

  .event-options-heading span {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .event-group {
    min-width: 0;
  }

  .event-group h3 {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 6px;
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .event-group-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-event-practice);
  }

  .event-group-lecture .event-group-dot {
    background: var(--color-event-lecture);
  }

  .event-group-options {
    display: grid;
    gap: var(--space-2);
  }

  .event-toggle {
    display: grid;
    grid-template-columns:
      auto minmax(210px, 0.9fr) minmax(220px, 1.1fr)
      minmax(88px, auto);
    align-items: center;
    gap: var(--space-4);
    min-height: 54px;
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    cursor: pointer;
  }

  .event-toggle:hover {
    border-color: var(--color-focus);
    background: var(--color-surface);
  }

  .event-toggle:has(input:checked) {
    border-color: var(--color-success);
    background: color-mix(
      in srgb,
      var(--color-success) 8%,
      var(--color-surface)
    );
    box-shadow: inset 3px 0 0 var(--color-success);
  }

  .event-when {
    display: grid;
    min-width: 0;
  }

  .event-when strong {
    font-size: var(--text-base);
    line-height: 1.3;
  }

  .event-instructor {
    min-width: 0;
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-toggle.conflict {
    border-color: var(--color-danger);
  }

  .event-status {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
  }

  .conflict-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-danger);
    font-weight: 700;
  }

  @media (max-width: 640px) {
    .subjects-heading {
      align-items: flex-start;
      flex-direction: column;
      padding: 12px;
    }

    .selection-stats {
      justify-content: flex-start;
    }

    .subject-scroll {
      max-height: none;
      overflow: visible;
      padding-inline: 8px;
    }

    .subject-card {
      width: 100%;
    }

    .event-toggle {
      grid-template-columns: auto minmax(0, 1fr) auto;
    }

    .event-instructor {
      grid-column: 2;
    }

    .event-status {
      grid-column: 3;
      grid-row: 1 / span 2;
    }
  }
</style>
