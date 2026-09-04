import { STORAGE_KEYS } from "./storageKeys.js";
import {
  getEventCode,
  getEventSlotIdentity,
  getEventType,
} from "./scheduleState.js";

export const SCHEDULES_STORAGE_KEY = STORAGE_KEYS.schedules;
const DEFAULT_SCHEDULE_NAME = "Default schedule";

function createScheduleId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function repairDuplicateSelections(subjects) {
  return subjects.map((subject) => {
    if (!Array.isArray(subject?.events)) return subject;

    const enabledSlots = new Set();
    let repaired = false;
    const events = subject.events.map((event) => {
      if (
        !event?.enabled ||
        !getEventCode(event) ||
        !event.dayOfWeek ||
        !event.startTime ||
        !getEventType(event)
      ) {
        return event;
      }

      const slotIdentity = getEventSlotIdentity(event);
      if (!enabledSlots.has(slotIdentity)) {
        enabledSlots.add(slotIdentity);
        return event;
      }

      repaired = true;
      return { ...event, enabled: false };
    });

    if (!repaired) return subject;
    return {
      ...subject,
      events,
      enabled: events.some((event) => event.enabled),
    };
  });
}

function normalizeSchedule(schedule, fallbackName, makeId) {
  return {
    id:
      typeof schedule?.id === "string" && schedule.id ? schedule.id : makeId(),
    name:
      typeof schedule?.name === "string" && schedule.name.trim()
        ? schedule.name.trim()
        : fallbackName,
    subjects: repairDuplicateSelections(
      Array.isArray(schedule?.subjects) ? schedule.subjects : [],
    ),
    lectureExemption: schedule?.lectureExemption === true,
  };
}

export function saveScheduleStore(storage, store) {
  storage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(store));
  return store;
}

export function readScheduleStore(storage, makeId = createScheduleId) {
  const stored = readJson(storage, SCHEDULES_STORAGE_KEY, null);
  if (
    stored &&
    Array.isArray(stored.schedules) &&
    stored.schedules.length > 0
  ) {
    const schedules = stored.schedules.map((schedule, index) =>
      normalizeSchedule(schedule, `Schedule ${index + 1}`, makeId),
    );
    const activeScheduleId = schedules.some(
      (schedule) => schedule.id === stored.activeScheduleId,
    )
      ? stored.activeScheduleId
      : schedules[0].id;
    return { version: 1, activeScheduleId, schedules };
  }

  const legacySubjects = readJson(
    storage,
    STORAGE_KEYS.legacySavedSubjects,
    [],
  );
  const legacyExemption = readJson(
    storage,
    STORAGE_KEYS.legacyLectureExemption,
    false,
  );
  const schedule = normalizeSchedule(
    {
      name: DEFAULT_SCHEDULE_NAME,
      subjects: Array.isArray(legacySubjects) ? legacySubjects : [],
      lectureExemption: legacyExemption === true,
    },
    DEFAULT_SCHEDULE_NAME,
    makeId,
  );
  return {
    version: 1,
    activeScheduleId: schedule.id,
    schedules: [schedule],
  };
}

export function loadScheduleStore(storage, makeId = createScheduleId) {
  const stored = readJson(storage, SCHEDULES_STORAGE_KEY, null);
  const store = readScheduleStore(storage, makeId);
  if (!stored || JSON.stringify(store) !== JSON.stringify(stored)) {
    return saveScheduleStore(storage, store);
  }
  return store;
}

export function getActiveSchedule(store) {
  return (
    store.schedules.find(
      (schedule) => schedule.id === store.activeScheduleId,
    ) ?? store.schedules[0]
  );
}

export function updateActiveSchedule(store, updates) {
  return {
    ...store,
    schedules: store.schedules.map((schedule) =>
      schedule.id === store.activeScheduleId
        ? { ...schedule, ...updates, id: schedule.id }
        : schedule,
    ),
  };
}

/**
 * @param {object} store
 * @param {{ name?: string, subjects?: object[], lectureExemption?: boolean }} [options]
 * @param {() => string} [makeId]
 */
export function addSchedule(store, options = {}, makeId = createScheduleId) {
  const { name, subjects = [], lectureExemption = false } = options;
  const schedule = normalizeSchedule(
    { name, subjects, lectureExemption },
    getUniqueScheduleName(store, "New schedule"),
    makeId,
  );
  return {
    ...store,
    activeScheduleId: schedule.id,
    schedules: [...store.schedules, schedule],
  };
}

export function renameSchedule(store, scheduleId, name) {
  const trimmedName = name.trim();
  if (!trimmedName) return store;
  return {
    ...store,
    schedules: store.schedules.map((schedule) =>
      schedule.id === scheduleId
        ? { ...schedule, name: trimmedName }
        : schedule,
    ),
  };
}

export function removeSchedule(store, scheduleId) {
  if (store.schedules.length === 1) return store;
  const removedIndex = store.schedules.findIndex(
    (schedule) => schedule.id === scheduleId,
  );
  if (removedIndex === -1) return store;

  const schedules = store.schedules.filter(
    (schedule) => schedule.id !== scheduleId,
  );
  const activeScheduleId =
    store.activeScheduleId === scheduleId
      ? schedules[Math.min(removedIndex, schedules.length - 1)].id
      : store.activeScheduleId;
  return { ...store, activeScheduleId, schedules };
}

export function activateSchedule(store, scheduleId) {
  if (!store.schedules.some((schedule) => schedule.id === scheduleId)) {
    return store;
  }
  return { ...store, activeScheduleId: scheduleId };
}

export function getUniqueScheduleName(store, preferredName) {
  const baseName = preferredName.trim() || "Schedule";
  const existingNames = new Set(
    store.schedules.map((schedule) => schedule.name),
  );
  if (!existingNames.has(baseName)) return baseName;
  let suffix = 2;
  while (existingNames.has(`${baseName} ${suffix}`)) suffix += 1;
  return `${baseName} ${suffix}`;
}
