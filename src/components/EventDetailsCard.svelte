<script>
  import {
    getEventDisplayTitle,
    getEventGroupNumber,
    isLectureType,
  } from "../utils/schedule.js";
  import { language, t } from "../utils/i18n.js";
  import Icon from "./Icon.svelte";

  let { calendarEvent } = $props();

  const event = $derived(calendarEvent?.originalEvent ?? {});
  const title = $derived(
    getEventDisplayTitle(event) ||
      calendarEvent?.title ||
      t($language, "classDetails"),
  );
  const groupNumber = $derived(getEventGroupNumber(event));
  const typeLabel = $derived(
    isLectureType(event.extendedProps?.type)
      ? t($language, "lecture")
      : t($language, "practice"),
  );
  const hasConflict = $derived(calendarEvent?.hasConflict === true);
</script>

<article
  class="event-details-card"
  class:is-lecture={isLectureType(event.extendedProps?.type) && !hasConflict}
  class:is-practice={!isLectureType(event.extendedProps?.type) && !hasConflict}
  class:has-conflict={hasConflict}
  aria-label={`${title} ${typeLabel} ${t($language, "details")}`}
>
  <header>
    <h3>{title}</h3>
  </header>

  <dl>
    {#if event.extendedProps?.instructor}
      <div>
        <dt><Icon name="user" size={15} />{t($language, "professor")}</dt>
        <dd>{event.extendedProps.instructor}</dd>
      </div>
    {/if}
    {#if event.extendedProps?.location}
      <div>
        <dt><Icon name="map-pin" size={15} />{t($language, "room")}</dt>
        <dd>{event.extendedProps.location}</dd>
      </div>
    {/if}
    {#if event.code}
      <div>
        <dt><Icon name="book-open" size={15} />{t($language, "courseCode")}</dt>
        <dd class="event-code">{event.code}</dd>
      </div>
    {/if}
    {#if groupNumber}
      <div>
        <dt><Icon name="clock" size={15} />{t($language, "group")}</dt>
        <dd>{groupNumber}</dd>
      </div>
    {/if}
  </dl>
</article>

<style>
  .event-details-card {
    padding: 16px 18px;
    border: 1px solid color-mix(in srgb, white 20%, transparent);
    border-radius: var(--radius-lg);
    color: var(--color-event-contrast);
  }

  .is-lecture {
    background: var(--color-event-lecture);
  }

  .is-practice {
    background: var(--color-event-practice);
  }

  .has-conflict {
    background: var(--color-event-conflict);
  }

  header {
    padding-bottom: 12px;
    border-bottom: 1px solid color-mix(in srgb, white 24%, transparent);
  }

  h3 {
    margin: 0;
    color: inherit;
    font-size: var(--text-lg);
    line-height: 1.3;
  }

  dl {
    display: grid;
    gap: 9px;
    margin: 12px 0 0;
  }

  dl > div {
    display: grid;
    grid-template-columns: 86px minmax(0, 1fr);
    gap: 10px;
  }

  dt {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: color-mix(in srgb, white 78%, transparent);
    font-size: 0.74rem;
    font-weight: 700;
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 0.84rem;
    font-weight: 600;
  }

  .event-code {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      monospace;
  }

  @media (max-width: 460px) {
    .event-details-card {
      padding: 15px 16px;
    }

    dl > div {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }
</style>
