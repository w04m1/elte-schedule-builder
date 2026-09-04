<script>
  import Icon from "./Icon.svelte";
  import { language, t } from "../utils/i18n.js";

  let {
    schedules = [],
    activeScheduleId = "",
    onCreate,
    onSwitch,
    onRename,
    onDelete,
    hasSubjects = false,
    onReset,
  } = $props();

  let editingId = $state("");
  let editingName = $state("");
  let editingInput = $state(null);

  function beginRename(schedule) {
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
        onchange={(event) => onSwitch?.(event.currentTarget.value)}
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
      <button
        type="button"
        class="button button-ghost button-icon icon-btn delete"
        onclick={() => onDelete?.(activeScheduleId)}
        disabled={schedules.length === 1}
        aria-label={t($language, "deleteNamed", {
          name:
            schedules.find(({ id }) => id === activeScheduleId)?.name ??
            t($language, "schedule"),
        })}
        title={schedules.length === 1
          ? t($language, "keepOneSchedule")
          : t($language, "deleteSchedule")}
      >
        <Icon name="trash" size={16} />
      </button>
    {/if}
  </div>
  <div class="schedule-actions">
    {#if hasSubjects}
      <button
        type="button"
        class="button button-outline-danger clear-btn"
        onclick={() => onReset?.()}
      >
        <Icon name="rotate-ccw" size={16} />
        {t($language, "clearSchedule")}
      </button>
    {/if}
    <button
      type="button"
      class="button button-primary create-btn"
      onclick={() => onCreate?.()}
    >
      <Icon name="plus" size={16} />
      {t($language, "newSchedule")}
    </button>
  </div>
</section>

<style>
  .schedule-manager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 12px;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-1);
  }

  .schedule-picker,
  form {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  select,
  input {
    min-width: min(260px, 42vw);
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
    gap: 8px;
  }

  .create-btn,
  .clear-btn {
    gap: var(--space-2);
  }

  .clear-btn {
    background: var(--color-surface);
  }

  .icon-btn {
    width: var(--control-md);
    height: var(--control-md);
  }

  .icon-btn.delete {
    color: var(--color-danger);
  }

  form input {
    padding-inline: 10px;
  }

  @media (max-width: 640px) {
    .schedule-manager {
      align-items: stretch;
      flex-direction: column;
    }

    .schedule-picker,
    .schedule-actions {
      width: 100%;
    }

    select,
    form,
    form input {
      min-width: 0;
      flex: 1;
    }

    .schedule-actions > button {
      flex: 1;
      justify-content: center;
    }
  }
</style>
