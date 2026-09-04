<script>
  import { language, t } from "../utils/i18n.js";
  let { lectureExemption = false, onToggleLectureExemption } = $props();
</script>

<section class="calendar-options" aria-label={t($language, "timetableOptions")}>
  <div class="legend">
    <ul>
      <li>
        <span class="color-box lecture" aria-hidden="true"></span>
        {t($language, "lecture")}
      </li>
      <li>
        <span class="color-box practice" aria-hidden="true"></span>
        {t($language, "practice")}
      </li>
      <li>
        <span class="color-box conflict" aria-hidden="true"></span>
        {t($language, "conflict")}
      </li>
    </ul>
  </div>

  <label class="exemption-item">
    <input
      type="checkbox"
      checked={lectureExemption}
      onchange={() => onToggleLectureExemption?.(!lectureExemption)}
    />
    <span>
      <strong>{t($language, "ignoreLectureConflicts")}</strong>
    </span>
  </label>
</section>

<style>
  .calendar-options {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    color: var(--color-text);
  }

  .legend {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  ul {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li,
  .exemption-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  li {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
  }

  .color-box {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .lecture {
    background: var(--color-event-lecture);
  }

  .practice {
    background: var(--color-event-practice);
  }

  .conflict {
    background: var(--color-event-conflict);
  }

  .exemption-item {
    cursor: pointer;
  }

  .exemption-item input {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
  }

  .exemption-item span {
    display: grid;
  }

  .exemption-item strong {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    white-space: nowrap;
  }

  @media (max-width: 720px) {
    .calendar-options {
      align-items: flex-start;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: var(--space-3);
    }

    .legend {
      width: 100%;
    }

    ul {
      flex-wrap: wrap;
    }

    .exemption-item strong {
      white-space: normal;
    }

    .exemption-item {
      width: 100%;
    }
  }
</style>
