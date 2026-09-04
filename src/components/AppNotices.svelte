<script>
  import Icon from "./Icon.svelte";
  import { language, t } from "../utils/i18n.js";

  let { showWarning = false, onCloseWarning } = $props();
</script>

{#if showWarning}
  <aside class="notice" aria-labelledby="data-notice-heading">
    <Icon name="alert-triangle" size={20} />
    <div class="notice-copy">
      <h2 id="data-notice-heading">
        {t($language, "dataNoticeTitle")}
      </h2>
      <p>
        {t($language, "dataNoticeBody")}
      </p>
    </div>
    <button
      type="button"
      class="button button-secondary"
      onclick={onCloseWarning}>{t($language, "dismiss")}</button
    >
  </aside>
{/if}

<style>
  .notice {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: 12px;
    margin-bottom: 24px;
    padding: 14px 16px;
    border: 1px solid var(--color-warning);
    border-radius: var(--radius-md);
    background: var(--color-surface-2);
    background: color-mix(
      in srgb,
      var(--color-warning) 9%,
      var(--color-surface)
    );
    color: var(--color-text);
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    max-width: 76ch;
    margin: 4px 0 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  @media (max-width: 640px) {
    .notice {
      grid-template-columns: auto minmax(0, 1fr);
    }

    button {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
