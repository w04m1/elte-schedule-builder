<script lang="ts">
  import { language, t } from "../utils/i18n.js";

  interface Props {
    lectureExemption?: boolean;
    onToggleLectureExemption?: (value: boolean) => void;
  }

  let { lectureExemption = false, onToggleLectureExemption }: Props = $props();
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
    gap: var(--space-4);
    padding: 0 var(--space-1);
    color: var(--color-text-muted);
    font-size: 0.88rem;
  }

  .legend ul {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .color-box {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-sm);
    display: inline-block;
  }

  .color-box.lecture {
    background: var(--color-event-lecture);
  }

  .color-box.practice {
    background: var(--color-event-practice);
  }

  .color-box.conflict {
    background: var(--color-event-conflict);
  }

  .exemption-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  .exemption-item input {
    accent-color: var(--color-primary);
  }

  .exemption-item strong {
    color: var(--color-text);
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .calendar-options {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2);
    }
  }
</style>
