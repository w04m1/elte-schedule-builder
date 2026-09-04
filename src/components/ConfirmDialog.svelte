<script>
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";
  import { language, t } from "../utils/i18n.js";

  let {
    isOpen = false,
    title = "",
    message = "",
    confirmLabel = "",
    cancelLabel = "",
    onConfirm,
    onCancel,
  } = $props();
</script>

<Modal open={isOpen} role="alertdialog" label={title} onClose={onCancel}>
  <div class="confirm-modal">
    <h2>
      <Icon name="alert-triangle" size={20} />
      {title}
    </h2>
    <p>{message}</p>
    <div class="confirm-actions">
      <button
        type="button"
        class="button button-secondary cancel"
        onclick={() => onCancel?.()}
      >
        {cancelLabel || t($language, "cancel")}
      </button>
      <button
        type="button"
        class="button button-danger confirm"
        onclick={() => onConfirm?.()}
      >
        {confirmLabel || t($language, "confirm")}
      </button>
    </div>
  </div>
</Modal>

<style>
  .confirm-modal {
    color: var(--color-text);
  }

  h2 {
    margin: 0 0 12px;
    font-size: var(--text-xl);
    color: var(--color-warning);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin: 0 0 20px;
    color: var(--color-text);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
