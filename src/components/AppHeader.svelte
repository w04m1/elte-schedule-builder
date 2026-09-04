<script>
  import Icon from "./Icon.svelte";
  import { cycleThemePreference, themePreference } from "../utils/theme.js";
  import { language, setLanguage, t } from "../utils/i18n.js";

  let { faqRead = false, onOpenFAQ } = $props();

  const THEME_ICONS = { system: "monitor", light: "sun", dark: "moon" };

  const themeIcon = $derived(THEME_ICONS[$themePreference] ?? "monitor");
  const themeLabel = $derived(
    t($language, "colorTheme", {
      theme: t(
        $language,
        $themePreference === "light"
          ? "themeLight"
          : $themePreference === "dark"
            ? "themeDark"
            : "themeSystem",
      ),
    }),
  );
</script>

<header class="header">
  <div class="title">
    <div class="brand-mark" aria-hidden="true">
      <Icon name="calendar" size={22} />
    </div>
    <div>
      <h1>ELTE Schedule Builder</h1>
      <p>{t($language, "appSubtitle")}</p>
    </div>
  </div>
  <div class="header-buttons">
    <button
      type="button"
      class="button button-secondary button-icon theme-toggle"
      onclick={() => cycleThemePreference()}
      aria-label={themeLabel}
      title={themeLabel}
    >
      <Icon name={themeIcon} size={20} />
    </button>
    <label class="language-picker">
      <span class="sr-only">{t($language, "language")}</span>
      <select
        aria-label={t($language, "language")}
        value={$language}
        onchange={(event) => setLanguage(event.currentTarget.value)}
      >
        <option value="en">EN</option>
        <option value="hu">HU</option>
      </select>
    </label>
    <button
      type="button"
      class="button button-outline-info faq-btn"
      class:glow={!faqRead}
      onclick={() => onOpenFAQ?.()}
    >
      <Icon name="book-open" />
      {t($language, "help")}
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    min-height: 58px;
    margin-bottom: 10px;
    padding: 2px 2px 0;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    box-shadow: 0 5px 16px
      color-mix(in srgb, var(--color-primary) 24%, transparent);
  }

  h1 {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    letter-spacing: -0.025em;
    color: var(--color-text);
  }

  .title p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .header-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .theme-toggle {
    background: color-mix(
      in srgb,
      var(--color-primary) 10%,
      var(--color-surface)
    );
  }

  .language-picker {
    position: relative;
  }

  .language-picker select {
    height: var(--control-md);
    min-width: 66px;
    padding: 0 28px 0 11px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background-color: var(--color-surface-2);
    color: var(--color-text);
    cursor: pointer;
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-bold);
    box-shadow: var(--shadow-button);
  }

  .language-picker select:hover {
    background-color: var(--color-surface-2);
  }

  .theme-toggle:hover {
    background: var(--color-surface-2);
  }

  .faq-btn {
    background: color-mix(in srgb, var(--color-info) 10%, var(--color-surface));
    color: var(--color-info);
  }

  .faq-btn:hover {
    background: var(--color-surface-2);
  }

  .faq-btn.glow {
    box-shadow: 0 0 0 3px var(--color-surface-3);
    box-shadow: 0 0 0 3px
      color-mix(in srgb, var(--color-primary) 20%, transparent);
  }

  @media (max-width: 768px) {
    .header {
      align-items: center;
      gap: 8px;
    }

    h1 {
      font-size: 1rem;
      white-space: nowrap;
    }

    .header-buttons {
      flex-wrap: nowrap;
      justify-content: flex-end;
      gap: 6px;
    }

    .title {
      gap: 8px;
    }

    .brand-mark {
      width: 36px;
      height: 36px;
    }

    .title p {
      display: none;
    }

    .faq-btn {
      width: var(--control-md);
      min-height: var(--control-md);
      padding: 0;
      justify-content: center;
      font-size: 0;
    }

    .faq-btn :global(svg) {
      display: block;
    }
  }

  @media (max-width: 420px) {
    .header {
      gap: 6px;
    }

    .title {
      gap: 6px;
    }

    .brand-mark {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .header-buttons {
      gap: 4px;
    }

    .theme-toggle,
    .faq-btn {
      width: var(--control-sm);
      height: var(--control-sm);
      min-height: var(--control-sm);
    }

    .language-picker select {
      min-width: 56px;
      height: var(--control-sm);
      padding-left: 8px;
    }

    h1 {
      font-size: 0.84rem;
    }
  }
</style>
