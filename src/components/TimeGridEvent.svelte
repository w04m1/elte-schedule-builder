<script>
  import { getEventDisplayTitle } from "../utils/schedule.js";
  import { language, t } from "../utils/i18n.js";
  import Icon from "./Icon.svelte";

  let { calendarEvent } = $props();

  const event = $derived(calendarEvent.originalEvent ?? {});
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
    top: 7px;
    right: 7px;
    display: inline-flex;
  }

  .event-title {
    display: -webkit-box;
    overflow: hidden;
    font-size: var(--text-sm);
    font-weight: var(--weight-bold);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .event-place {
    overflow: hidden;
    opacity: 0.84;
    font-size: 0.6875rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-time {
    opacity: 0.92;
    font-weight: var(--weight-semibold);
  }
</style>
