<script>
  import { onMount } from "svelte";
  import App from "./App.svelte";
  import { language, t } from "./utils/i18n.js";

  onMount(() => {
    if (window.location.pathname.startsWith("/tanrend")) {
      window.history.replaceState({}, "", "/#course-finder");
      requestAnimationFrame(() => {
        document.getElementById("subject-code-search")?.focus();
      });
    }
  });
</script>

<div class="page-shell">
  <a class="skip-link" href="#main-content">{t($language, "skipToMain")}</a>
  <App />
</div>

<style>
  .page-shell {
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
  }
</style>
