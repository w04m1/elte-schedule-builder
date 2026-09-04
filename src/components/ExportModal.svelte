<script>
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";
  import {
    buildGoogleCalendarCsv,
    buildICalendar,
    getCalendarEventCount,
  } from "../utils/calendarExport.js";
  import { language, t } from "../utils/i18n.js";

  let { isOpen = false, onClose, events = [] } = $props();
  let exportError = $state("");
  let exportStatus = $state("");
  let eventCount = $derived(getCalendarEventCount(events));

  function downloadFile(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function handleExport(format) {
    exportError = "";
    exportStatus = "";

    try {
      if (format === "ics") {
        downloadFile(
          buildICalendar(events),
          "elte-timetable.ics",
          "text/calendar;charset=utf-8",
        );
      } else {
        downloadFile(
          buildGoogleCalendarCsv(events),
          "elte-timetable-google.csv",
          "text/csv;charset=utf-8",
        );
      }
      exportStatus = t(
        $language,
        eventCount === 1 ? "exportComplete" : "exportCompletePlural",
        { count: eventCount },
      );
    } catch {
      exportError = t($language, "calendarExportFailed");
    }
  }
</script>

<Modal open={isOpen} wide label={t($language, "exportDialogTitle")} {onClose}>
  <div class="export-panel">
    <button
      type="button"
      class="button button-ghost button-icon close-btn"
      aria-label={t($language, "closeExport")}
      onclick={onClose}
    >
      <Icon name="x" size={22} />
    </button>

    <header>
      <p class="eyebrow">{t($language, "calendarPack")}</p>
      <h2>{t($language, "exportDialogTitle")}</h2>
      <p class="intro">{t($language, "exportDialogDescription")}</p>
    </header>

    <p class="included">
      {t($language, eventCount === 1 ? "classIncluded" : "classesIncluded", {
        count: eventCount,
      })}
    </p>

    {#if exportError}
      <p class="message error" role="alert">{exportError}</p>
    {/if}
    {#if exportStatus}
      <p class="message success" role="status">{exportStatus}</p>
    {/if}

    <div class="formats">
      <section class="format-card recommended">
        <div class="format-copy">
          <div class="format-heading">
            <h3>{t($language, "icalendarTitle")}</h3>
            <span class="badge">{t($language, "recommended")}</span>
          </div>
          <p>{t($language, "icalendarDescription")}</p>
        </div>
        <button
          type="button"
          class="button button-primary"
          disabled={eventCount === 0}
          onclick={() => handleExport("ics")}
        >
          <Icon name="download" size={18} />
          {t($language, "downloadICalendar")}
        </button>
      </section>

      <section class="format-card">
        <div class="format-copy">
          <div class="format-heading">
            <h3>{t($language, "googleCsvTitle")}</h3>
          </div>
          <p>{t($language, "googleCsvDescription")}</p>
        </div>
        <button
          type="button"
          class="button button-secondary"
          disabled={eventCount === 0}
          onclick={() => handleExport("csv")}
        >
          <Icon name="download" size={18} />
          {t($language, "downloadGoogleCsv")}
        </button>
      </section>
    </div>
  </div>
</Modal>

<style>
  .export-panel {
    position: relative;
  }
  header {
    max-width: 680px;
  }
  .eyebrow {
    margin: 0 0 var(--space-2);
    color: var(--color-accent);
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h2 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--text-2xl);
  }
  .intro {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
    line-height: 1.55;
  }
  .close-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    width: var(--control-sm);
    min-width: var(--control-sm);
    min-height: var(--control-sm);
  }
  .included {
    margin: var(--space-5) 0 var(--space-3);
    color: var(--color-text);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
  }
  .message {
    margin: 0 0 var(--space-3);
    font-size: var(--text-sm);
  }
  .error {
    color: var(--color-danger);
  }
  .success {
    color: var(--color-success);
  }
  .formats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
  .format-card {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-5);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-2);
  }
  .format-card.recommended {
    border-color: var(--color-accent);
  }
  .format-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
  h3 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--text-lg);
  }
  .format-copy p {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .badge {
    padding: 3px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    color: var(--color-accent-strong);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
  }
  .format-card .button {
    align-self: flex-start;
  }

  @media (max-width: 680px) {
    .formats {
      grid-template-columns: 1fr;
    }
    .format-card {
      padding: var(--space-4);
    }
    .format-card .button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
