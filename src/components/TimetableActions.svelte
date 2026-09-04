<script>
  import { onDestroy } from "svelte";
  import { encodeSchedule } from "../utils/schedule.js";
  import { getEventIdentity } from "../utils/scheduleState.js";
  import ExportModal from "./ExportModal.svelte";
  import Icon from "./Icon.svelte";
  import { language, t } from "../utils/i18n.js";

  let { events = [], activeCodes = [], lectureExemption = false } = $props();

  let showExportModal = $state(false);
  let shareStatus = $state("");
  let shareFailed = $state(false);
  let shareStatusTimeout;

  onDestroy(() => clearTimeout(shareStatusTimeout));

  function copyWithTextarea(value) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function shareSchedule() {
    const encoded = encodeSchedule(
      activeCodes,
      lectureExemption,
      events.map(getEventIdentity),
    );
    const shareUrl = `${window.location.origin}/import/${encoded}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (!copyWithTextarea(shareUrl)) {
        throw new Error("Clipboard copy failed");
      }

      clearTimeout(shareStatusTimeout);
      shareFailed = false;
      shareStatus = t($language, "shareCopied");
      shareStatusTimeout = setTimeout(() => {
        shareStatus = "";
      }, 2000);
    } catch {
      shareFailed = true;
      shareStatus = t($language, "shareFailed");
    }
  }
</script>

<div
  class="timetable-actions"
  role="group"
  aria-label={t($language, "timetableActions")}
>
  <button
    type="button"
    class="button button-small button-outline-info action-button export"
    onclick={() => (showExportModal = true)}
    disabled={events.length === 0}
  >
    <Icon name="download" size={16} />
    {t($language, "exportGoogle")}
  </button>
  <button
    type="button"
    class="button button-small button-transfer action-button share"
    onclick={shareSchedule}
    disabled={events.length === 0}
  >
    <Icon name="send" size={16} />
    {t($language, "copyShareLink")}
  </button>
</div>

<ExportModal
  isOpen={showExportModal}
  onClose={() => (showExportModal = false)}
  {events}
/>

{#if shareStatus}
  <div
    class="share-status"
    class:failed={shareFailed}
    role={shareFailed ? "alert" : "status"}
  >
    {shareStatus}
  </div>
{/if}

<style>
  .timetable-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .share-status {
    position: fixed;
    bottom: 20px;
    left: 50%;
    z-index: 1000;
    padding: 12px 24px;
    transform: translateX(-50%);
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    box-shadow: var(--shadow-2);
    color: var(--color-primary-contrast);
    animation: fade-in-out 2s ease-in-out;
  }

  .share-status.failed {
    background: var(--color-danger-solid);
    color: var(--color-danger-contrast);
  }

  @keyframes fade-in-out {
    0% {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    15% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    85% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }

  @media (max-width: 520px) {
    .timetable-actions {
      align-items: stretch;
      flex-direction: column;
      width: 100%;
    }

    .action-button {
      width: 100%;
    }
  }
</style>
