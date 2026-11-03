<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { Schedule } from "../types/schedule.js";
  import { language, t } from "../utils/i18n.js";

  interface Props {
    schedules?: Schedule[];
    activeScheduleId?: string;
    onCreate?: () => void;
    onSwitch?: (id: string) => void;
    onRename?: (id: string, name: string) => void;
    onDelete?: (id: string) => void;
  }

  let {
    schedules = [],
    activeScheduleId = "",
    onCreate,
    onSwitch,
    onRename,
    onDelete,
  }: Props = $props();

  let actionsMenu = $state<HTMLDetailsElement | null>(null);

  function closeActions() {
    if (actionsMenu) actionsMenu.open = false;
  }

  let editingId = $state("");
  let editingName = $state("");
  let editingInput = $state<HTMLInputElement | null>(null);

  function beginRename(schedule?: Schedule) {
    if (!schedule) return;
    editingId = schedule.id;
    editingName = schedule.name;
    requestAnimationFrame(() => editingInput?.select());
  }

  function cancelRename() {
    editingId = "";
    editingName = "";
  }

  function finishRename() {
    if (editingName.trim()) onRename?.(editingId, editingName);
    cancelRename();
  }
</script>

<svelte:window
  onclick={(event) => {
    if (actionsMenu && !actionsMenu.contains(event.target as Node))
      closeActions();
  }}
  onkeydown={(event) => {
    if (event.key === "Escape" && actionsMenu?.open) {
      closeActions();
      actionsMenu.querySelector("summary")?.focus();
    }
  }}
/>

<section
  class="schedule-manager"
  aria-label={t($language, "scheduleWorkspace")}
>
  <div class="schedule-picker">
    <label class="sr-only" for="active-schedule"
      >{t($language, "schedule")}</label
    >
    {#if editingId}
      <form
        onsubmit={(event) => {
          event.preventDefault();
          finishRename();
        }}
      >
        <label class="sr-only" for={`schedule-name-${editingId}`}>
          {t($language, "scheduleName")}
        </label>
        <input
          id={`schedule-name-${editingId}`}
          bind:this={editingInput}
          bind:value={editingName}
          onkeydown={(event) => {
            if (event.key === "Escape") cancelRename();
          }}
        />
        <button
          type="submit"
          class="button button-primary button-icon icon-btn save"
          aria-label={t($language, "saveScheduleName")}
        >
          <Icon name="check" size={16} />
        </button>
        <button
          type="button"
          class="button button-secondary button-icon icon-btn"
          aria-label={t($language, "cancelRenaming")}
          onclick={cancelRename}
        >
          <Icon name="x" size={16} />
        </button>
      </form>
    {:else}
      <select
        id="active-schedule"
        value={activeScheduleId}
        onchange={(event) =>
          onSwitch?.((event.currentTarget as HTMLSelectElement).value)}
      >
        {#each schedules as schedule (schedule.id)}
          <option value={schedule.id}>{schedule.name}</option>
        {/each}
      </select>
      <button
        type="button"
        class="button button-secondary button-icon icon-btn"
        onclick={() =>
          beginRename(schedules.find(({ id }) => id === activeScheduleId))}
        aria-label={t($language, "renameSchedule", {
          name:
            schedules.find(({ id }) => id === activeScheduleId)?.name ??
            t($language, "schedule"),
        })}
        title={t($language, "renameSchedule", { name: "" }).trim()}
      >
        <Icon name="pencil" size={16} />
      </button>
    {/if}
  </div>
  <div class="schedule-actions">
    <details class="actions-menu" bind:this={actionsMenu}>
      <summary
        class="button button-secondary button-icon"
        aria-label={t($language, "scheduleActions")}
        title={t($language, "scheduleActions")}
      >
        <Icon name="ellipsis" size={18} />
      </summary>
      <div class="actions-panel">
        <button
          type="button"
          onclick={() => {
            closeActions();
            onDelete?.(activeScheduleId);
          }}
        >
          {t($language, "deleteSchedule")}
        </button>
      </div>
    </details>
    <button
      type="button"
      class="button button-secondary button-icon create-btn"
      title={t($language, "newSchedule")}
      onclick={() => onCreate?.()}
    >
      <Icon name="plus" size={16} />
      <span class="sr-only">{t($language, "newSchedule")}</span>
    </button>
  </div>
</section>

<style>
  .schedule-manager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text);
  }

  .schedule-picker {
    flex: 1;
    min-width: 0;
  }

  .schedule-picker,
  form {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  select,
  input {
    min-width: 0;
    width: 100%;
    height: var(--control-md);
    padding: 0 34px 0 10px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--weight-semibold);
  }

  .schedule-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .icon-btn {
    width: var(--control-md);
    height: var(--control-md);
  }

  form input {
    padding-inline: 10px;
  }

  form {
    min-width: 0;
    width: 100%;
  }
  .actions-menu {
    position: relative;
  }
  summary {
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .actions-panel {
    position: absolute;
    z-index: 10;
    right: 0;
    top: calc(100% + 6px);
    width: 220px;
    padding: 4px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
  .actions-panel button {
    display: block;
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-danger);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .actions-panel button:hover:not(:disabled) {
    background: var(--color-surface-2);
  }
  .actions-panel button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
