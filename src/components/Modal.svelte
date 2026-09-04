<script>
  /**
   * Accessible modal dialog wrapper.
   *
   * Provides role="dialog" semantics, focus trapping, Escape-to-close,
   * focus restoration, and body scroll locking. Content is fully supplied
   * by the caller through the children snippet.
   */
  let {
    open = false,
    label = "",
    role = "dialog",
    wide = false,
    extraWide = false,
    onClose,
    children,
  } = $props();

  let dialogElement = $state(null);
  let previouslyFocused = null;

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  $effect(() => {
    if (!open) return;
    previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    dialogElement?.focus();

    const handleDocumentKeydown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    const handleDocumentMousedown = (event) => {
      if (dialogElement && !dialogElement.contains(event.target)) onClose?.();
    };
    document.addEventListener("keydown", handleDocumentKeydown);
    document.addEventListener("mousedown", handleDocumentMousedown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleDocumentKeydown);
      document.removeEventListener("mousedown", handleDocumentMousedown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus?.();
    };
  });

  function handleKeydown(event) {
    if (event.key !== "Tab" || !dialogElement) return;

    const focusableElements = [
      ...dialogElement.querySelectorAll(FOCUSABLE_SELECTOR),
    ];
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

{#if open}
  <div class="modal-backdrop">
    <div
      bind:this={dialogElement}
      class="modal"
      class:wide
      class:extra-wide={extraWide}
      {role}
      aria-modal="true"
      aria-label={label || undefined}
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      {@render children?.()}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
    padding: var(--space-5);
    overflow-y: auto;
  }

  .modal {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-2);
    width: 100%;
    max-width: 560px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    margin: auto;
    padding: var(--space-5);
    outline: none;
  }

  .modal.wide {
    max-width: 860px;
  }

  .modal.extra-wide {
    max-width: 1320px;
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: var(--space-3);
    }

    .modal {
      max-height: calc(100vh - 24px);
      padding: var(--space-4);
    }
  }
</style>
