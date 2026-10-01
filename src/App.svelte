<script lang="ts">
  import type {
    CalendarEvent,
    OptimizationSuggestion,
    Schedule,
    ScheduleStore,
    Subject,
  } from "./types/schedule.js";
  import { onMount } from "svelte";
  import Calendar from "./components/Calendar.svelte";
  import FAQ from "./components/FAQ.svelte";
  import ScheduleManager from "./components/ScheduleManager.svelte";
  import SubjectControls from "./components/SubjectControls.svelte";
  import AppNotices from "./components/AppNotices.svelte";
  import AppFooter from "./components/AppFooter.svelte";
  import AppHeader from "./components/AppHeader.svelte";
  import ScheduleInput from "./components/ScheduleInput.svelte";
  import ConfirmDialog from "./components/ConfirmDialog.svelte";
  import { decodeSchedule, markConflicts } from "./utils/schedule.js";
  import { applyScheduleSuggestion } from "./utils/scheduleOptimizer.js";
  import {
    activateSchedule,
    addSchedule,
    getActiveSchedule,
    getUniqueScheduleName,
    loadScheduleStore,
    removeSchedule,
    renameSchedule,
    saveScheduleStore,
    updateActiveSchedule,
  } from "./utils/scheduleStorage.js";
  import {
    getEnabledEventCodes,
    getEnabledEvents,
    mergeScheduleEvents,
    selectScheduleClass,
    setSubjectEnabled,
    toggleScheduleEvent,
  } from "./utils/scheduleState.js";
  import { STORAGE_KEYS } from "./utils/storageKeys.js";
  import { language, t } from "./utils/i18n.js";

  let events = $state<CalendarEvent[]>([]);
  let allSubjects = $state<Subject[]>([]);
  let showFAQ = $state(false);
  let showWarning = $state(false);
  let faqRead = $state(false);
  interface ImportedCodes {
    baseCodes: string;
    fullCodes: string[];
    eventIdentities: string[];
  }
  let importedCodes = $state<ImportedCodes>({
    baseCodes: "",
    fullCodes: [],
    eventIdentities: [],
  });
  let lectureExemption = $state(false);
  let scheduleStore = $state<ScheduleStore | null>(null);
  let schedules = $state<Schedule[]>([]);
  let activeScheduleId = $state("");
  let activeCodes = $derived(getEnabledEventCodes(allSubjects));
  let confirmDialog = $state<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    action: (() => void) | null;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "",
    action: null,
  });
  const githubRepositoryUrl =
    import.meta.env.VITE_GITHUB_REPOSITORY_URL?.trim() ||
    "https://github.com/unnobatroo/elte-schedule-builder";

  onMount(() => {
    const path = window.location.pathname;
    let storedSchedules = loadScheduleStore(localStorage);

    // Shared schedules always get their own profile, preserving local schedules.
    if (path.startsWith("/import/")) {
      const base64String = path.split("/import/")[1];
      const {
        baseCodes,
        fullCodes,
        eventIdentities,
        lectureExemption: importedExemption,
      } = decodeSchedule(base64String);
      if (fullCodes.length > 0) {
        storedSchedules = addSchedule(storedSchedules, {
          name: getUniqueScheduleName(
            storedSchedules,
            t($language, "importedSchedule"),
          ),
          lectureExemption: importedExemption,
        });
        saveScheduleStore(localStorage, storedSchedules);
        importedCodes = { baseCodes, fullCodes, eventIdentities };
      }
      // Remove the import path from URL without reloading
      window.history.replaceState({}, "", "/");
    }
    applyScheduleStore(storedSchedules);

    // Check if warning was shown before
    const warningShown = localStorage.getItem(STORAGE_KEYS.warningShown);
    if (!warningShown) {
      showWarning = true;
    }

    // Check if FAQ was read before
    faqRead = localStorage.getItem(STORAGE_KEYS.faqRead) === "true";
  });

  function closeWarning() {
    showWarning = false;
    localStorage.setItem(STORAGE_KEYS.warningShown, "true");
  }

  function handleScheduleUpdate(eventData: CalendarEvent[]) {
    allSubjects = mergeScheduleEvents(allSubjects, eventData);
    saveAndUpdate();
  }

  function handleClassSelection(
    eventData: CalendarEvent[],
    selectedClass: CalendarEvent,
  ) {
    allSubjects = selectScheduleClass(allSubjects, eventData, selectedClass);
    saveAndUpdate();
  }

  function saveAndUpdate() {
    computeConflicts();
    const currentStore = scheduleStore ?? loadScheduleStore(localStorage);
    scheduleStore = updateActiveSchedule(currentStore, {
      subjects: allSubjects,
      lectureExemption,
    });
    saveScheduleStore(localStorage, scheduleStore);
    schedules = scheduleStore.schedules;
  }

  function applyScheduleStore(store: ScheduleStore) {
    scheduleStore = store;
    schedules = store.schedules;
    activeScheduleId = store.activeScheduleId;
    const activeSchedule = getActiveSchedule(store);
    allSubjects = activeSchedule.subjects;
    lectureExemption = activeSchedule.lectureExemption;
    computeConflicts();
  }

  function persistAndApply(store: ScheduleStore) {
    saveScheduleStore(localStorage, store);
    applyScheduleStore(store);
  }

  function createSchedule() {
    persistAndApply(
      addSchedule(scheduleStore ?? loadScheduleStore(localStorage), {
        name: getUniqueScheduleName(
          scheduleStore ?? loadScheduleStore(localStorage),
          t($language, "newScheduleName"),
        ),
      }),
    );
  }

  function switchSchedule(scheduleId: string) {
    if (scheduleId === activeScheduleId || !scheduleStore) return;
    persistAndApply(activateSchedule(scheduleStore, scheduleId));
  }

  function handleRenameSchedule(scheduleId: string, name: string) {
    if (!scheduleStore) return;
    scheduleStore = renameSchedule(scheduleStore, scheduleId, name);
    saveScheduleStore(localStorage, scheduleStore);
    schedules = scheduleStore.schedules;
  }

  function requestConfirm({
    title,
    message,
    confirmLabel,
    action,
  }: {
    title: string;
    message: string;
    confirmLabel: string;
    action: (() => void) | null;
  }) {
    confirmDialog = { open: true, title, message, confirmLabel, action };
  }

  function closeConfirmDialog() {
    confirmDialog = { ...confirmDialog, open: false, action: null };
  }

  function runConfirmedAction() {
    const { action } = confirmDialog;
    closeConfirmDialog();
    action?.();
  }

  function deleteSchedule(scheduleId: string) {
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule || schedules.length === 1 || !scheduleStore) return;
    requestConfirm({
      title: t($language, "deleteSchedule"),
      message: t($language, "deleteScheduleMessage", { name: schedule.name }),
      confirmLabel: t($language, "delete"),
      action: () =>
        scheduleStore &&
        persistAndApply(removeSchedule(scheduleStore, scheduleId)),
    });
  }

  function updateEvents() {
    events = getEnabledEvents(allSubjects);
  }

  function toggleSubject(title: string, allEnabled: boolean | null = null) {
    allSubjects = setSubjectEnabled(allSubjects, title, allEnabled);
    saveAndUpdate();
  }

  function toggleEvent(subjectTitle: string, eventIndex: number) {
    allSubjects = toggleScheduleEvent(allSubjects, subjectTitle, eventIndex);
    saveAndUpdate();
  }

  function applySuggestion(suggestion: OptimizationSuggestion) {
    allSubjects = applyScheduleSuggestion(allSubjects, suggestion);
    saveAndUpdate();
  }

  function deleteSubject(title: string) {
    allSubjects = allSubjects.filter((subject) => subject.title !== title);
    saveAndUpdate();
  }

  function resetAll() {
    requestConfirm({
      title: t($language, "resetSchedule"),
      message: t($language, "clearScheduleMessage"),
      confirmLabel: t($language, "clear"),
      action: () => {
        allSubjects = [];
        saveAndUpdate();
      },
    });
  }

  function computeConflicts() {
    allSubjects = markConflicts(allSubjects, lectureExemption);
    updateEvents();
  }

  function toggleLectureExemption(value: boolean) {
    lectureExemption = value;
    saveAndUpdate();
  }

  function closeFAQ() {
    showFAQ = false;
    if (!faqRead) {
      faqRead = true;
      localStorage.setItem(STORAGE_KEYS.faqRead, "true");
    }
  }

  function openFAQ() {
    showFAQ = true;
    if (!faqRead) {
      faqRead = true;
      localStorage.setItem(STORAGE_KEYS.faqRead, "true");
    }
  }
</script>

<main id="main-content" tabindex="-1">
  <div class="container">
    <AppHeader {faqRead} onOpenFAQ={openFAQ} />
    <AppNotices {showWarning} onCloseWarning={closeWarning} />
    <div class="planner-toolbar">
      <ScheduleManager
        {schedules}
        {activeScheduleId}
        onCreate={createSchedule}
        onSwitch={switchSchedule}
        onRename={handleRenameSchedule}
        onDelete={deleteSchedule}
        hasSubjects={allSubjects.length > 0}
        onReset={resetAll}
      />
    </div>
    <section
      class="builder-workspace"
      aria-label={t($language, "schedulePlanner")}
    >
      <div class="builder-pane search-pane">
        {#key activeScheduleId}
          <ScheduleInput
            {importedCodes}
            selectedEvents={events}
            {lectureExemption}
            onScheduleUpdate={handleScheduleUpdate}
            onClassSelection={handleClassSelection}
            onImportComplete={() =>
              (importedCodes = {
                baseCodes: "",
                fullCodes: [],
                eventIdentities: [],
              })}
          />
        {/key}
      </div>
      <div class="builder-pane selected-pane">
        <SubjectControls
          subjects={allSubjects}
          {lectureExemption}
          onToggleSubject={toggleSubject}
          onToggleEvent={toggleEvent}
          onDeleteSubject={deleteSubject}
        />
      </div>
    </section>
    <section
      class="calendar-shell"
      aria-label={t($language, "schedulePlanner")}
    >
      {#key $language}
        <Calendar
          {events}
          {activeCodes}
          subjects={allSubjects}
          {lectureExemption}
          onToggleLectureExemption={toggleLectureExemption}
          onApplySuggestion={applySuggestion}
        />
      {/key}
    </section>
    <AppFooter {githubRepositoryUrl} />
  </div>
</main>

<FAQ isOpen={showFAQ} onClose={closeFAQ} />

<ConfirmDialog
  isOpen={confirmDialog.open}
  title={confirmDialog.title}
  message={confirmDialog.message}
  confirmLabel={confirmDialog.confirmLabel}
  cancelLabel={t($language, "cancel")}
  onConfirm={runConfirmedAction}
  onCancel={closeConfirmDialog}
/>

<style>
  main {
    min-height: 100vh;
    padding: 14px 18px 28px;
  }

  .container {
    max-width: 1440px;
    margin: 0 auto;
  }

  .planner-toolbar {
    margin-bottom: 10px;
  }

  .builder-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1.03fr) minmax(0, 0.97fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  .builder-pane {
    min-width: 0;
    min-height: 240px;
    overflow: visible;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-1);
  }

  .selected-pane {
    overflow: hidden;
  }

  .calendar-shell {
    position: relative;
    z-index: 0;
    isolation: isolate;
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-1);
  }

  @media (max-width: 1240px) {
    .builder-workspace {
      grid-template-columns: minmax(0, 1fr);
    }

    .builder-pane {
      min-height: 0;
    }
  }

  @media (max-width: 768px) {
    main {
      padding: 8px;
    }

    .builder-workspace,
    .planner-toolbar {
      margin-bottom: 8px;
    }

    .builder-pane,
    .calendar-shell {
      border-radius: var(--radius-md);
    }
  }
</style>
