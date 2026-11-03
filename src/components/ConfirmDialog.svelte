<script lang="ts">
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";
  import { language, t } from "../utils/i18n.js";

  interface Props {
    isOpen?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }

  let {
    isOpen = false,
    title = "",
    message = "",
    confirmLabel = "",
    cancelLabel = "",
    onConfirm,
    onCancel,
  }: Props = $props();
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
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.15rem;
    font-weight: 700;
  }

  p {
    color: var(--color-text-muted);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
