<script>
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";
  import { getConflictPairs } from "../utils/schedule.js";
  import { getEnabledEvents } from "../utils/scheduleState.js";
  import { findScheduleSuggestions } from "../utils/scheduleOptimizer.js";
  import { language, t } from "../utils/i18n.js";

  let { subjects = [], lectureExemption = false, onApplySuggestion } = $props();

  let isOpen = $state(false);
  let suggestions = $state([]);
  let emptyState = $state("noSuggestionData");

  const currentConflicts = $derived(
    getConflictPairs(getEnabledEvents(subjects), lectureExemption).length,
  );

  function openSuggestions() {
    const ranked = findScheduleSuggestions(subjects, { lectureExemption });
    const alternatives = ranked.filter(
      (suggestion) => suggestion.changedGroups > 0,
    );

    if (ranked.length === 0) {
      suggestions = [];
      emptyState = "noSuggestionData";
    } else if (currentConflicts > 0) {
      suggestions = alternatives.filter(
        (suggestion) => suggestion.conflicts < currentConflicts,
      );
      emptyState = "noImprovingSchedule";
    } else {
      suggestions = alternatives.filter(
        (suggestion) => suggestion.conflicts === 0,
      );
      emptyState = "onlyCombination";
    }
    isOpen = true;
  }

  function closeSuggestions() {
    isOpen = false;
  }

  function applySuggestion(suggestion) {
    onApplySuggestion?.(suggestion);
    closeSuggestions();
  }

  const dayOrder = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  function uniqueSortedEvents(events = []) {
    const unique = events.filter(
      (event, index, allEvents) =>
        allEvents.findIndex(
          (candidate) =>
            candidate.dayOfWeek === event.dayOfWeek &&
            candidate.startTime === event.startTime &&
            candidate.endTime === event.endTime,
        ) === index,
    );
    return unique.sort(
      (first, second) =>
        (dayOrder[first.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) -
          (dayOrder[second.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) ||
        first.startTime.localeCompare(second.startTime) ||
        first.endTime.localeCompare(second.endTime),
    );
  }

  function formatGroupTimes(group) {
    return uniqueSortedEvents(group?.events)
      .map(
        (event) =>
          `${t($language, event.dayOfWeek.toLocaleLowerCase("en-US"))} ${event.startTime}–${event.endTime}`,
      )
      .join(" · ");
  }

  function formatType(typeClass) {
    if (typeClass === "lecture") return t($language, "lecture");
    if (typeClass === "practice") return t($language, "practice");
    return typeClass.charAt(0).toUpperCase() + typeClass.slice(1);
  }

  function getChangeDayGroups(suggestion) {
    return (suggestion.changes ?? [])
      .reduce((groups, change) => {
        const firstSuggestedEvent = uniqueSortedEvents(change.to.events)[0];
        const day = firstSuggestedEvent?.dayOfWeek ?? "Other";
        const existingGroup = groups.find((group) => group.day === day);
        if (existingGroup) {
          existingGroup.changes.push(change);
        } else {
          groups.push({ day, changes: [change] });
        }
        return groups;
      }, [])
      .map((group) => ({
        ...group,
        changes: group.changes.sort(
          (first, second) =>
            (
              uniqueSortedEvents(first.to.events)[0]?.startTime ?? ""
            ).localeCompare(
              uniqueSortedEvents(second.to.events)[0]?.startTime ?? "",
            ) || first.subjectTitle.localeCompare(second.subjectTitle),
        ),
      }))
      .sort(
        (first, second) =>
          (dayOrder[first.day] ?? Number.MAX_SAFE_INTEGER) -
            (dayOrder[second.day] ?? Number.MAX_SAFE_INTEGER) ||
          first.day.localeCompare(second.day),
      );
  }
</script>

<div class="suggest-bar">
  <button
    type="button"
    class="button button-small button-warning suggest-btn"
    onclick={openSuggestions}
  >
    <Icon name="sparkles" />
    {t($language, "suggestSchedules")}
  </button>
</div>

<Modal
  open={isOpen}
  extraWide
  label={t($language, "scheduleSuggestions")}
  onClose={closeSuggestions}
>
  <div class="suggestions-panel">
    <div class="suggestions-header">
      <h2>
        <Icon name="sparkles" size={20} />
        {t($language, "scheduleSuggestions")}
      </h2>
      <button
        type="button"
        class="button button-ghost button-icon close-btn"
        aria-label={t($language, "closeSuggestions")}
        onclick={closeSuggestions}
      >
        <Icon name="x" size={20} />
      </button>
    </div>

    <p class="current-state">
      {#if currentConflicts > 0}
        {t(
          $language,
          currentConflicts === 1
            ? "currentConflicts"
            : "currentConflictsPlural",
          { count: currentConflicts },
        )}
      {:else}
        {t($language, "noConflicts")}.
      {/if}
    </p>

    {#if suggestions.length === 0}
      <p class="empty">
        {t($language, emptyState)}
      </p>
    {:else}
      <ol class="options">
        {#each suggestions as suggestion, index (index)}
          <li class="option">
            <div class="option-header">
              <div class="option-heading">
                <span class="option-title"
                  >{t($language, "option", { number: index + 1 })}</span
                >
                <span class="option-changes">
                  {suggestion.changedGroups === 0
                    ? t($language, "noReplacements")
                    : t(
                        $language,
                        suggestion.changedGroups === 1
                          ? "replacement"
                          : "replacements",
                        { count: suggestion.changedGroups },
                      )}
                </span>
              </div>
              <span
                class="badge"
                class:conflict-free={suggestion.conflicts === 0}
              >
                {suggestion.conflicts === 0
                  ? t($language, "noConflicts")
                  : t(
                      $language,
                      suggestion.conflicts === 1
                        ? "conflictCount"
                        : "conflictCountPlural",
                      { count: suggestion.conflicts },
                    )}
              </span>
            </div>

            {#if suggestion.changedGroups === 0}
              <p class="no-changes">
                {t($language, "keepsSelection")}
              </p>
            {:else}
              <div class="option-days">
                {#each getChangeDayGroups(suggestion) as dayGroup (dayGroup.day)}
                  <section class="day-group">
                    <h3>
                      {t($language, dayGroup.day.toLocaleLowerCase("en-US"))}
                    </h3>
                    <div class="day-changes">
                      {#each dayGroup.changes as change (change.key)}
                        <article class="change-card">
                          <div class="change-heading">
                            <strong>{change.subjectTitle}</strong>
                            <span>{formatType(change.typeClass)}</span>
                          </div>
                          <dl class="replacement">
                            <div class="current-group">
                              <dt>{t($language, "current")}</dt>
                              <dd>
                                <strong>{change.from.code}</strong>
                                <span>{formatGroupTimes(change.from)}</span>
                              </dd>
                            </div>
                            <div class="suggested-group">
                              <dt>{t($language, "suggested")}</dt>
                              <dd>
                                <strong>{change.to.code}</strong>
                                <span>{formatGroupTimes(change.to)}</span>
                              </dd>
                            </div>
                          </dl>
                        </article>
                      {/each}
                    </div>
                  </section>
                {/each}
              </div>
            {/if}
            <button
              type="button"
              class="button button-primary button-small apply-btn"
              aria-label={t($language, "applyOption", { number: index + 1 })}
              onclick={() => applySuggestion(suggestion)}
            >
              <Icon name="check" size={16} />
              {t($language, "apply")}
            </button>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</Modal>

<style>
  .suggest-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .suggest-bar,
    .suggest-btn {
      width: 100%;
    }

    .suggest-btn {
      justify-content: center;
    }
  }

  .suggest-btn {
    font-weight: var(--weight-bold);
  }

  .suggestions-panel {
    color: var(--color-text);
  }

  .suggestions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .suggestions-header h2 {
    margin: 0;
    font-size: var(--text-xl);
    color: var(--color-warning);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .close-btn {
    width: var(--control-sm);
    min-width: var(--control-sm);
    min-height: var(--control-sm);
  }

  .current-state {
    margin: 0 0 18px;
    color: var(--color-text);
  }

  .empty {
    margin: 0 0 16px;
    color: var(--color-text-muted);
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
    align-items: start;
    gap: 14px;
    list-style: none;
    margin: 0;
    padding: 0;
    counter-reset: none;
  }

  .option {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 12px;
  }

  .option-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .option-heading {
    display: grid;
    gap: 1px;
  }

  .option-title {
    font-weight: 700;
    color: var(--color-text);
  }

  .badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.8em;
    background: var(--color-danger-solid);
    color: var(--color-danger-contrast);
  }

  .badge.conflict-free {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
  }

  .option-changes {
    color: var(--color-text-muted);
    font-size: 0.85em;
  }

  .no-changes {
    min-height: 64px;
    margin: 8px 0 16px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-size: 0.84rem;
  }

  .option-days {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
  }

  .day-group h3 {
    margin: 0 0 6px;
    color: var(--color-text-muted);
    font-size: 0.74rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .day-changes {
    display: grid;
    gap: 7px;
  }

  .change-card {
    padding: 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
  }

  .change-heading {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 7px;
  }

  .change-heading strong {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.86rem;
  }

  .change-heading span {
    flex-shrink: 0;
    color: var(--color-text-muted);
    font-size: 0.72rem;
  }

  .replacement {
    display: grid;
    gap: 6px;
    margin: 0;
  }

  .replacement > div {
    display: grid;
    grid-template-columns: 68px minmax(0, 1fr);
    gap: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
  }

  .replacement dt {
    color: var(--color-text-muted);
    font-size: 0.7rem;
    font-weight: 700;
  }

  .replacement dd {
    display: grid;
    gap: 1px;
    min-width: 0;
    margin: 0;
  }

  .replacement dd strong {
    overflow-wrap: anywhere;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 0.76rem;
  }

  .replacement dd span {
    color: var(--color-text-muted);
    font-size: 0.72rem;
    overflow-wrap: anywhere;
  }

  .suggested-group {
    border-top-color: color-mix(
      in srgb,
      var(--color-success) 45%,
      var(--color-border)
    ) !important;
  }

  .suggested-group dt,
  .suggested-group dd strong {
    color: var(--color-success);
  }

  .apply-btn {
    margin-top: auto;
  }

  @media (max-width: 640px) {
    .suggestions-header h2 {
      font-size: 1.05rem;
    }

    .current-state {
      font-size: 0.9rem;
    }

    .option {
      padding: 10px;
    }
  }
</style>
