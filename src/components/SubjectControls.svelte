<script lang="ts">
  import Icon from "./Icon.svelte";
  import ClassOptionContent from "./ClassOptionContent.svelte";
  import type { CalendarEvent, Subject } from "../types/schedule.js";
  import {
    DAY_ORDER,
    formatEventConflictLabel,
    getConflictingEvents,
    getEventGroupNumber,
    isLectureType,
  } from "../utils/schedule.js";
  import {
    getEventCode,
    getEventInstructor,
    normalizeSubjectTitle,
  } from "../utils/scheduleState.js";
  import { dayName, language, t } from "../utils/i18n.js";

  interface Props {
    subjects?: Subject[];
    lectureExemption?: boolean;
    onToggleSubject?: (title: string) => void;
    onToggleEvent?: (title: string, eventIndex: number) => void;
    onDeleteSubject?: (title: string) => void;
  }

  let {
    subjects = [],
    lectureExemption = false,
    onToggleSubject,
    onToggleEvent,
    onDeleteSubject,
  }: Props = $props();

  let openSubject = $state<string | null>(null);

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

  const enabledEventEntries = $derived(
    subjects.flatMap((subject) =>
      subject.enabled
        ? (subject.events ?? [])
            .filter((event) => event.enabled)
            .map((event) => ({ event, subjectTitle: subject.title }))
        : [],
    ),
  );
  const enabledEvents = $derived(enabledEventEntries.map(({ event }) => event));
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

  function toggleEvents(title: string) {
    openSubject = openSubject === title ? null : title;
  }

  function formatEventLabel(event: CalendarEvent): string {
    const type = isLectureType(event.extendedProps?.type)
      ? t($language, "lecture")
      : t($language, "practice");
    const group = getEventGroupNumber(event);
    const groupLabel = group
      ? `, ${t($language, "group").toLocaleLowerCase($language)} ${group}`
      : "";
    return `${type}${groupLabel}, ${dayName($language, event.dayOfWeek)} ${event.startTime}–${event.endTime}`;
  }

  function getEventConflicts(
    subject: Subject,
    event: CalendarEvent,
  ): CalendarEvent[] {
    if (!subject.enabled) return [];

    const candidateIsLecture = isLectureType(event.extendedProps?.type);
    const retainedEvents = enabledEventEntries
      .filter(
        ({ event: selectedEvent, subjectTitle }) =>
          !(
            normalizeSubjectTitle(subjectTitle) ===
              normalizeSubjectTitle(subject.title) &&
            isLectureType(selectedEvent.extendedProps?.type) ===
              candidateIsLecture
          ),
      )
      .map(({ event: selectedEvent }) => selectedEvent);
    return getConflictingEvents(event, retainedEvents, lectureExemption);
  }

  function getSubjectCodes(subject: Subject): string {
    const codes = [
      ...new Set(
        (subject.events ?? [])
          .filter((event) => event.enabled && event.code)
          .map((event) => event.code),
      ),
    ];
    return codes.slice(0, 2).join(" · ");
  }

  function compareEvents(
    first: { event: CalendarEvent; eventIndex: number },
    second: { event: CalendarEvent; eventIndex: number },
  ): number {
    return (
      (DAY_ORDER[first.event.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) -
        (DAY_ORDER[second.event.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) ||
      first.event.startTime.localeCompare(second.event.startTime) ||
      first.event.endTime.localeCompare(second.event.endTime) ||
      (first.event.code ?? "").localeCompare(second.event.code ?? "") ||
      first.eventIndex - second.eventIndex
    );
  }

  function getEventGroups(subject: Subject) {
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
                        {@const conflicts = getEventConflicts(subject, event)}
                        <label
                          class="class-option event-toggle"
                          class:is-selected={event.enabled}
                          class:has-conflict={conflicts.length > 0}
                        >
                          <input
                            class="class-option-input"
                            type="radio"
                            name={`subject-${subjectIndex}-${group.key}`}
                            checked={event.enabled}
                            aria-label={`${formatEventLabel(event)}${conflicts.length > 0 ? `, ${t($language, "conflictsWithCourses", { courses: formatEventConflictLabel($language, conflicts) })}` : ""}`}
                            onchange={() =>
                              onToggleEvent?.(subject.title, eventIndex)}
                          />
                          <ClassOptionContent
                            selected={event.enabled}
                            day={dayName($language, event.dayOfWeek)}
                            startTime={event.startTime}
                            endTime={event.endTime}
                            instructor={getEventInstructor(event)}
                            location={String(
                              event.extendedProps?.location ??
                                event.location ??
                                "",
                            )}
                            code={getEventCode(event)}
                            {conflicts}
                          />
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

  .subject-checkbox {
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

  .event-group-lecture {
    --class-option-accent: var(--color-event-lecture);
  }

  .event-group-practice {
    --class-option-accent: var(--color-event-practice);
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
  }
</style>
