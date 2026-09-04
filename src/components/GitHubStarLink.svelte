<script>
  import { language, t } from "../utils/i18n.js";

  let { href, label = "" } = $props();
  const displayLabel = $derived(label || t($language, "starOnGithub"));
</script>

<a
  class="github-star-link"
  {href}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`${displayLabel} (${t($language, "opensNewTab")})`}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m12 2.75 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.94l-5.56 2.93 1.06-6.2L3 9.28l6.22-.9L12 2.75Z"
    />
  </svg>
  <span>{displayLabel}</span>
</a>

<style>
  .github-star-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 600;
    text-decoration: none;
    transition:
      background-color 0.2s,
      border-color 0.2s,
      transform 0.2s;
  }

  .github-star-link:hover {
    border-color: var(--color-warning);
    background: var(--color-surface-2);
    color: var(--color-text);
    transform: translateY(-1px);
  }

  .github-star-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
    fill: var(--color-warning);
  }
</style>
