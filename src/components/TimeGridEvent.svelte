<script lang="ts">
  import { getEventDisplayTitle } from "../utils/schedule.js";
  import { language, t } from "../utils/i18n.js";
  import Icon from "./Icon.svelte";
  import type { CalendarEvent } from "../types/schedule.js";

  interface Props {
    calendarEvent: {
      title?: string;
      hasConflict?: boolean;
      originalEvent?: CalendarEvent;
      [key: string]: unknown;
    };
  }

  let { calendarEvent }: Props = $props();

  const event = $derived((calendarEvent.originalEvent ?? {}) as CalendarEvent);
  const title = $derived(
    getEventDisplayTitle(event) ||
      calendarEvent.title ||
      t($language, "classDetails"),
  );
</script>

<div class="event-card" class:has-conflict={calendarEvent.hasConflict}>
  {#if calendarEvent.hasConflict}
    <span class="conflict-icon" aria-hidden="true">
      <Icon name="alert-triangle" size={14} />
    </span>
  {/if}
  <div class="event-title">{title}</div>
  <div class="event-time">{event.startTime ?? ""}–{event.endTime ?? ""}</div>
  {#if event.extendedProps?.location}
    <div class="event-place">
      {event.extendedProps.location}
    </div>
  {/if}
</div>

<style>
  .event-card {
    position: relative;
    display: grid;
    gap: 2px;
    color: var(--color-event-contrast);
    padding: 6px 7px;
    font-size: var(--text-xs);
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .event-card.has-conflict {
    padding-right: 27px;
  }

  .conflict-icon {
    position: absolute;
    top: 5px;
    right: 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
  }

  .event-title {
    font-weight: var(--weight-bold);
    white-space: normal;
    word-break: break-word;
  }

  .event-time {
    font-weight: var(--weight-semibold);
    opacity: 0.95;
  }

  .event-place {
    opacity: 0.85;
    white-space: normal;
    word-break: break-word;
  }
</style>
