<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * Accessible modal dialog wrapper.
   *
   * Provides role="dialog" semantics, focus trapping, Escape-to-close,
   * focus restoration, and body scroll locking. Content is fully supplied
   * by the caller through the children snippet.
   */
  interface Props {
    open?: boolean;
    label?: string;
    role?: "dialog" | "alertdialog";
    wide?: boolean;
    extraWide?: boolean;
    onClose?: () => void;
    children?: Snippet;
  }

  let {
    open = false,
    label = "",
    role = "dialog",
    wide = false,
    extraWide = false,
    onClose,
    children,
  }: Props = $props();

  let dialogElement = $state<HTMLDivElement | null>(null);
  let previouslyFocused: HTMLElement | null = null;

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  $effect(() => {
    if (!open) return;
    previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogElement?.focus();

    const handleDocumentKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    const handleDocumentMousedown = (event: MouseEvent) => {
      if (dialogElement && !dialogElement.contains(event.target as Node | null))
        onClose?.();
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

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Tab" || !dialogElement) return;

    const focusableElements = [
      ...dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
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
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    animation: fadeIn 0.15s ease-out;
  }

  .modal {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-3);
    max-height: calc(100vh - var(--space-4) * 2);
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: scaleIn 0.15s ease-out;
    outline: none;
  }

  .modal.wide {
    max-width: 680px;
  }

  .modal.extra-wide {
    max-width: 900px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: var(--space-2);
      align-items: flex-end;
    }

    .modal {
      max-height: 90vh;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
</style>
