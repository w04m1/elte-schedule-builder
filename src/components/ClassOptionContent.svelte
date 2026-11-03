<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { CalendarEvent } from "../types/schedule.js";
  import { getEventDisplayTitle } from "../utils/schedule.js";
  import { dayName, language, t } from "../utils/i18n.js";

  interface Props {
    selected?: boolean;
    day?: string;
    startTime?: string;
    endTime?: string;
    instructor?: string;
    location?: string;
    code?: string;
    conflicts?: CalendarEvent[];
  }

  let {
    selected = false,
    day = "",
    startTime = "",
    endTime = "",
    instructor = "",
    location = "",
    code = "",
    conflicts = [],
  }: Props = $props();

  const conflictLabels = $derived([
    ...new Set(
      conflicts.map((event) => {
        const title = getEventDisplayTitle(event);
        const eventDay = event.dayOfWeek
          ? dayName($language, event.dayOfWeek)
          : "";
        const eventTime =
          event.startTime && event.endTime
            ? `${event.startTime}–${event.endTime}`
            : "";
        return [title, [eventDay, eventTime].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(" · ");
      }),
    ),
  ]);
</script>

<span class="class-option-time">
  <strong>{startTime}–{endTime}</strong>
  <span>{day}</span>
</span>
<span class="class-option-details">
  <strong>{instructor || t($language, "instructorMissing")}</strong>
  <span class="class-option-meta">
    <span>{location || t($language, "locationMissing")}</span>
    <span aria-hidden="true">·</span>
    <span class="class-option-code">{code}</span>
  </span>
</span>
<span class="class-option-status">
  {#if conflictLabels.length > 0}
    <span class="class-option-status-label conflict-status">
      <Icon name="alert-triangle" size={14} />
      {t($language, "conflicts")}
    </span>
    <small>
      {t($language, "conflictsWithCourses", {
        courses: conflictLabels.join("; "),
      })}
    </small>
  {:else if selected}
    <span class="class-option-status-label selected-status">
      <Icon name="check" size={14} />
      {t($language, "selected")}
    </span>
  {/if}
</span>

<style>
  .class-option-time,
  .class-option-details,
  .class-option-status {
    display: grid;
    min-width: 0;
  }

  .class-option-time {
    gap: 1px;
  }

  .class-option-time strong,
  .class-option-details > strong {
    overflow: hidden;
    color: var(--color-text);
    font-size: var(--text-base);
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .class-option-time span,
  .class-option-meta,
  .class-option-status small {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
  }

  .class-option-details {
    gap: 2px;
  }

  .class-option-meta {
    display: flex;
    gap: 6px;
    min-width: 0;
  }

  .class-option-meta > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .class-option-code {
    color: var(--color-accent-strong);
    font-family: var(--font-mono);
    font-weight: var(--weight-semibold);
  }

  .class-option-status {
    justify-items: end;
    gap: 2px;
    text-align: right;
  }

  .class-option-status:empty {
    display: none;
  }

  .class-option-status small {
    max-width: 220px;
    line-height: 1.3;
  }

  @media (max-width: 768px) {
    .class-option-status {
      grid-column: 1 / -1;
      justify-items: start;
      text-align: left;
    }

    .class-option-status small {
      max-width: none;
    }
  }
</style>
