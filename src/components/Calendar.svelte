<script>
  import { onDestroy } from "svelte";
  import { get } from "svelte/store";
  import "temporal-polyfill/global";
  import { ScheduleXCalendar } from "@schedule-x/svelte";
  import { createCalendar, createViewWeek } from "@schedule-x/calendar";
  import { createEventsServicePlugin } from "@schedule-x/events-service";

  import { createEventModalPlugin } from "@schedule-x/event-modal";
  import "@schedule-x/theme-default/dist/index.css";
  import {
    getConflictPairs,
    getEventDisplayTitle,
    getEventGroupNumber,
    getWeekDateForDay,
    isLectureType,
  } from "../utils/schedule.js";
  import { resolvedTheme } from "../utils/theme.js";
  import { language, t } from "../utils/i18n.js";
  import ColorLegend from "./ColorLegend.svelte";
  import EventDetailsCard from "./EventDetailsCard.svelte";
  import ScheduleSuggestions from "./ScheduleSuggestions.svelte";
  import TimeGridEvent from "./TimeGridEvent.svelte";
  import TimetableActions from "./TimetableActions.svelte";

  let {
    events = [],
    activeCodes = [],
    subjects = [],
    lectureExemption = false,
    onToggleLectureExemption,
    onApplySuggestion,
  } = $props();

  const CALENDAR_TIME_ZONE = "Europe/Budapest";
  const SCHEDULE_X_TRANSLATIONS = {
    huHU: {
      Date: "Dátum",
      "MM/DD/YYYY": "ÉÉÉÉ.HH.NN.",
      "Next month": "Következő hónap",
      "Previous month": "Előző hónap",
      "Choose Date": "Dátum kiválasztása",
      Month: "Hónap",
      Week: "Hét",
      List: "Lista",
      "+ {{n}} events": "+ {{n}} esemény",
      "+ 1 event": "+ 1 esemény",
      "No events": "Nincsenek események",
      to: "–",
      "Full day- and multiple day events": "Egész napos és többnapos események",
      "Link to {{n}} more events on {{date}}":
        "További {{n}} esemény megnyitása: {{date}}",
      "Link to 1 more event on {{date}}":
        "További 1 esemény megnyitása: {{date}}",
      CW: "{{week}}. hét",
      Time: "Idő",
      AM: "de.",
      PM: "du.",
      Cancel: "Mégse",
      OK: "OK",
      "Select time": "Idő kiválasztása",
    },
  };
  const eventModal = createEventModalPlugin();
  const eventsServicePlugin = createEventsServicePlugin();

  function formatTime(hour, minute) {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function formatEvents(rawEvents) {
    const overlappingEvents = new Set(
      getConflictPairs(rawEvents, lectureExemption).flatMap(
        ({ event1, event2 }) => [event1, event2],
      ),
    );

    return rawEvents.map((event, index) => {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const [endHour, endMin] = event.endTime.split(":").map(Number);

      const dateStr = getWeekDateForDay(event.dayOfWeek);

      const groupNumber = getEventGroupNumber(event);
      const isLecture = isLectureType(event.extendedProps?.type);
      const eventId = event.id || index.toString();
      const hasConflict = overlappingEvents.has(index);

      const classes = [
        isLecture ? "sx-event--is-lecture" : "sx-event--is-practice",
      ];

      if (hasConflict) {
        classes.push("sx-event--has-conflict");
      }

      return {
        id: eventId,
        title: getEventDisplayTitle(event),
        description: [
          groupNumber ? `${t($language, "group")} ${groupNumber}` : "",
          event.code,
        ]
          .filter(Boolean)
          .join(" · "),
        start: Temporal.ZonedDateTime.from(
          `${dateStr}T${formatTime(startHour, startMin)}:00[${CALENDAR_TIME_ZONE}]`,
        ),
        end: Temporal.ZonedDateTime.from(
          `${dateStr}T${formatTime(endHour, endMin)}:00[${CALENDAR_TIME_ZONE}]`,
        ),
        location: event.extendedProps?.location || "",
        people: event.extendedProps?.instructor
          ? [event.extendedProps.instructor]
          : [],
        _options: {
          additionalClasses: classes,
        },
        hasConflict,
        originalEvent: event,
      };
    });
  }

  const calendarApp = createCalendar({
    locale: $language === "hu" ? "hu-HU" : "en-US",
    translations: SCHEDULE_X_TRANSLATIONS,
    views: [createViewWeek()],
    timezone: CALENDAR_TIME_ZONE,
    isDark: get(resolvedTheme) === "dark",
    // The app owns its mobile agenda. Schedule-X's mount-time breakpoint can
    // otherwise replace the requested five-day view at intermediate widths.
    isResponsive: false,
    defaultView: "week",
    dayBoundaries: {
      start: "08:00",
      end: "21:00",
    },
    weekOptions: {
      gridHeight: 760,
      nDays: 5,
      eventWidth: 95,
      timeAxisFormatOptions: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    },
    plugins: [eventsServicePlugin, eventModal],
  });

  $effect(() => {
    eventsServicePlugin.set(formatEvents(events));
  });

  $effect(() => {
    calendarApp.setTheme($resolvedTheme === "dark" ? "dark" : "light");
  });

  onDestroy(() => {
    calendarApp.destroy();
  });

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const agendaByDay = $derived(
    DAYS.map((day) => ({
      day,
      events: events
        .map((event, index) => ({ event, index }))
        .filter(({ event }) => event.dayOfWeek === day)
        .sort(
          (a, b) =>
            a.event.startTime.localeCompare(b.event.startTime) ||
            a.event.endTime.localeCompare(b.event.endTime),
        ),
    })).filter(({ events: dayEvents }) => dayEvents.length > 0),
  );

  const conflictIndexes = $derived(
    new Set(
      getConflictPairs(events, lectureExemption).flatMap(
        ({ event1, event2 }) => [event1, event2],
      ),
    ),
  );

  function describeEvent({ event, index }) {
    const type = isLectureType(event.extendedProps?.type)
      ? t($language, "lecture")
      : t($language, "practice");
    const parts = [
      `${event.startTime} ${t($language, "to")} ${event.endTime}`,
      type,
      `${t($language, "group").toLocaleLowerCase($language)} ${getEventGroupNumber(event)}`,
    ];
    if (event.code) parts.push(`${t($language, "code")} ${event.code}`);
    if (event.extendedProps?.location)
      parts.push(`${t($language, "location")} ${event.extendedProps.location}`);
    if (event.extendedProps?.instructor)
      parts.push(
        `${t($language, "instructor")} ${event.extendedProps.instructor}`,
      );
    if (conflictIndexes.has(index))
      parts.push(t($language, "conflictsWithEvent"));
    return `${event.title}: ${parts.join(", ")}`;
  }
</script>

<section class="timetable" aria-labelledby="timetable-heading">
  <div class="timetable-heading">
    <div class="heading-copy">
      <h2 id="timetable-heading" tabindex="-1">
        {t($language, "yourTimetable")}
      </h2>
    </div>
    <div class="display-options">
      <ColorLegend {lectureExemption} {onToggleLectureExemption} />
    </div>
    <div class="heading-actions">
      {#if subjects.length > 0}
        <ScheduleSuggestions
          {subjects}
          {lectureExemption}
          {onApplySuggestion}
        />
      {/if}
      <TimetableActions {events} {activeCodes} {lectureExemption} />
    </div>
  </div>

  <div
    class="calendar-wrapper"
    class:is-empty={events.length === 0}
    role="region"
    aria-label={t($language, "weeklyGrid")}
  >
    <ScheduleXCalendar
      {calendarApp}
      timeGridEvent={TimeGridEvent}
      eventModal={EventDetailsCard}
    />
  </div>

  {#if events.length > 0}
    <div class="agenda" aria-label={t($language, "weeklyList")}>
      <h3>{t($language, "scheduleList")}</h3>
      <p class="agenda-intro">
        {t($language, "agendaIntro")}
      </p>
      {#each agendaByDay as { day, events: dayEvents } (day)}
        <h4>{t($language, day.toLocaleLowerCase("en-US"))}</h4>
        <ul>
          {#each dayEvents as entry (entry.index)}
            {@const { event, index } = entry}
            <li
              class="agenda-event"
              class:is-lecture={isLectureType(event.extendedProps?.type)}
              class:has-conflict={conflictIndexes.has(index)}
              aria-label={describeEvent(entry)}
            >
              <span class="sr-only">{describeEvent(entry)}</span>
              <div class="agenda-event-heading">
                <strong>{getEventDisplayTitle(event)}</strong>
                <span>{event.startTime}–{event.endTime}</span>
              </div>
              <div class="agenda-event-meta">
                <span class="agenda-type">
                  {isLectureType(event.extendedProps?.type)
                    ? t($language, "lecture")
                    : t($language, "practice")}
                </span>
                {#if getEventGroupNumber(event)}
                  <span
                    >{t($language, "group")} {getEventGroupNumber(event)}</span
                  >
                {/if}
                {#if event.code}<span>{event.code}</span>{/if}
              </div>
              {#if event.extendedProps?.location || event.extendedProps?.instructor}
                <p>
                  {[
                    event.extendedProps?.location,
                    event.extendedProps?.instructor,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              {/if}
              {#if conflictIndexes.has(index)}
                <span class="agenda-conflict">{t($language, "conflict")}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  {/if}
</section>

<style>
  .timetable {
    position: relative;
  }

  .timetable-heading {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) auto;
    align-items: center;
    min-height: 62px;
    gap: var(--space-3);
    padding: 10px 14px;
    background: var(--color-surface);
  }

  .timetable-heading h2 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    letter-spacing: -0.015em;
  }

  .agenda-intro {
    margin: 3px 0 0;
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }

  .heading-copy {
    min-width: 0;
    white-space: nowrap;
  }

  .display-options {
    min-width: 0;
  }

  .heading-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    min-width: 0;
  }

  .timetable-heading :global(.button) {
    min-height: 34px;
    gap: 6px;
    padding: 5px 9px;
    font-size: var(--text-xs);
  }

  .calendar-wrapper {
    position: relative;
    width: 100%;
    min-height: 760px;
    max-height: 140vh;
    height: auto;
    --sx-color-primary: var(--color-info);
    --sx-color-event-preview: var(--color-event-preview);
  }

  .agenda {
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

  :global(.sx__calendar) {
    font-family: inherit;
  }

  /* This is a recurring class timetable, not a date navigator. Schedule-X
     still provides the reliable week grid, while the app exposes one fixed
     Monday-Friday view and removes controls that lead to empty date ranges. */
  :global(.sx__calendar-header),
  :global(.sx__week-grid__date-number) {
    display: none;
  }

  :global(.sx__week-grid__day-name) {
    color: var(--color-text-muted);
    font-size: 0.76rem;
    font-weight: var(--weight-bold);
    letter-spacing: 0.055em;
  }

  :global(.sx__week-grid__hour) {
    border-top-color: var(--color-calendar-grid);
  }

  :global(.sx__week-grid__hour-text) {
    color: var(--color-text-muted);
    font-size: 0.74rem;
    font-variant-numeric: tabular-nums;
  }

  /* Schedule-X hides the first boundary label and omits the last one. Keep the
     08:00–21:00 range while making both requested boundary labels explicit. */
  :global(.sx__week-grid__hour:first-child) {
    visibility: visible;
  }

  :global(.sx__week-grid__hour:first-child .sx__week-grid__hour-text) {
    top: 0.2rem;
  }

  :global(.sx__week-grid__time-axis)::after {
    position: absolute;
    bottom: 0.2rem;
    left: -43px;
    color: var(--color-text-muted);
    content: "21:00";
    font-size: 0.74rem;
    font-variant-numeric: tabular-nums;
  }

  :global(.sx__time-grid-day) {
    border-left-color: var(--color-calendar-grid);
  }

  :global(.sx__week-header-border),
  :global(.sx__week-header) {
    border-color: var(--color-calendar-grid);
  }

  :global(.sx-event--is-lecture) {
    background-color: var(--color-event-lecture) !important;
  }

  :global(.sx-event--is-practice) {
    background-color: var(--color-event-practice) !important;
  }

  :global(.sx__event) {
    cursor: pointer;
  }

  :global(.sx__time-grid-event.sx__event) {
    padding: 0;
    border: 1px solid color-mix(in srgb, white 24%, transparent);
    border-radius: var(--radius-sm);
    box-shadow: 0 2px 7px color-mix(in srgb, black 16%, transparent);
  }

  :global(.sx__time-grid-event.sx__event:hover) {
    filter: brightness(1.07);
  }

  :global(.sx__event-modal) {
    width: min(340px, calc(100vw - 32px));
    max-height: min(560px, calc(100vh - 32px));
    overflow: auto;
    border: 0;
    border-radius: var(--radius-lg);
    background: transparent !important;
    box-shadow: var(--shadow-2);
  }

  :global(.sx__event-modal__color-icon) {
    display: none !important;
  }

  :global(.sx-event--has-conflict) {
    background-color: var(--color-event-conflict) !important;
    border: 2px solid var(--color-danger-solid-hover);
  }

  @media (max-width: 720px) {
    .timetable-heading {
      grid-template-columns: minmax(0, 1fr);
      align-items: flex-start;
      gap: 10px;
      padding-block: 12px;
    }

    .display-options {
      grid-column: auto;
      grid-row: auto;
      width: 100%;
    }

    .heading-actions {
      grid-column: auto;
      grid-row: auto;
      align-items: stretch;
      flex-direction: column;
      width: 100%;
    }

    .calendar-wrapper:not(.is-empty) {
      display: none;
    }

    .calendar-wrapper.is-empty {
      min-height: 520px;
      max-height: 520px;
      overflow: hidden;
    }

    .calendar-wrapper.is-empty :global(.sx__calendar) {
      min-width: 760px;
      transform: scale(0.68);
      transform-origin: top left;
    }

    .agenda {
      position: static;
      width: auto;
      height: auto;
      padding: 16px;
      margin: 0;
      overflow: visible;
      clip: auto;
      white-space: normal;
      border-radius: var(--radius-md);
      background: var(--color-surface-subtle);
    }

    .agenda h3 {
      margin: 0;
    }

    .agenda h4 {
      margin: 18px 0 6px;
    }

    .agenda ul {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .agenda-event {
      position: relative;
      display: grid;
      gap: 5px;
      padding: 12px;
      border-left: 3px solid var(--color-event-practice);
      border-radius: var(--radius-sm);
      background: var(--color-surface-2);
    }

    .agenda-event.is-lecture {
      border-left-color: var(--color-event-lecture);
    }

    .agenda-event.has-conflict {
      border-left-color: var(--color-danger);
      background: color-mix(
        in srgb,
        var(--color-danger) 8%,
        var(--color-surface-2)
      );
    }

    .agenda-event-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .agenda-event-heading strong {
      min-width: 0;
      font-size: 0.9rem;
      line-height: 1.3;
    }

    .agenda-event-heading > span {
      flex-shrink: 0;
      color: var(--color-text);
      font-size: 0.78rem;
      font-weight: var(--weight-bold);
    }

    .agenda-event-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
      color: var(--color-text-muted);
      font-size: 0.74rem;
    }

    .agenda-event-meta span + span::before {
      margin-right: 10px;
      color: var(--color-text-faint);
      content: "·";
    }

    .agenda-event p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.76rem;
      line-height: 1.4;
    }

    .agenda-conflict {
      color: var(--color-danger);
      font-size: 0.74rem;
      font-weight: var(--weight-bold);
    }
  }
</style>
