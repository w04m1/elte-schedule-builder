<script lang="ts">
  import GitHubStarLink from "./GitHubStarLink.svelte";
  import Icon from "./Icon.svelte";
  import { language, t } from "../utils/i18n.js";

  interface Props {
    githubRepositoryUrl?: string;
  }

  let { githubRepositoryUrl = "" }: Props = $props();
</script>

<footer class="footer" aria-label={t($language, "projectInformation")}>
  <div class="footer-main">
    <div class="project-note">
      <strong>{t($language, "notAffiliated")}</strong>
      <p>
        {t($language, "builtBy")}
        <a href="https://jalols.page/" target="_blank" rel="noopener noreferrer"
          >Jaloliddin Ismailov<span class="sr-only">
            ({t($language, "opensNewTab")})</span
          ></a
        >.
      </p>
    </div>

    <nav class="footer-actions" aria-label={t($language, "projectLinks")}>
      {#if githubRepositoryUrl}
        <div class="github-action">
          <GitHubStarLink href={githubRepositoryUrl} />
        </div>
      {/if}
      <a href="mailto:me@jismailov.com" class="contact-action">
        <Icon name="mail" size={17} />
        <span>
          <small>{t($language, "email")}</small>
          me@jismailov.com
        </span>
      </a>
    </nav>
  </div>
</footer>

<style>
  .footer {
    margin-top: var(--space-4);
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-1);
  }

  .footer-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .project-note {
    min-width: 0;
  }

  .project-note strong {
    display: block;
    color: var(--color-text);
    font-size: 0.95rem;
    font-weight: 700;
  }

  .project-note p {
    margin-top: 4px;
    color: var(--color-text-muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .project-note a {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
  }

  .project-note a:hover {
    text-decoration: underline;
  }

  .footer-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .contact-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    font-size: 0.85rem;
    text-decoration: none;
    transition:
      border-color 0.2s,
      background-color 0.2s;
  }

  .contact-action:hover {
    border-color: var(--color-primary);
    background: var(--color-surface);
  }

  .contact-action span {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .contact-action small {
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 768px) {
    .footer-main {
      grid-template-columns: 1fr;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .footer-actions {
      width: 100%;
      justify-content: flex-start;
    }

    .github-action,
    .contact-action {
      flex: 1 1 160px;
    }

    .contact-action {
      justify-content: center;
    }
  }
</style>
