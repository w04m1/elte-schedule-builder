import { beforeEach, describe, expect, it } from "vitest";
import {
  SCHEDULES_STORAGE_KEY,
  activateSchedule,
  addSchedule,
  getActiveSchedule,
  loadScheduleStore,
  readScheduleStore,
  removeSchedule,
  renameSchedule,
  saveScheduleStore,
  updateActiveSchedule,
} from "../../src/utils/scheduleStorage.js";

describe("schedule storage", () => {
  let nextId;
  const makeId = () => `schedule-${nextId++}`;

  beforeEach(() => {
    localStorage.clear();
    nextId = 1;
  });

  it("creates a default schedule for a first-time visitor", () => {
    const store = loadScheduleStore(localStorage, makeId);

    expect(store).toEqual({
      version: 1,
      activeScheduleId: "schedule-1",
      schedules: [
        {
          id: "schedule-1",
          name: "Default schedule",
          subjects: [],
          lectureExemption: false,
        },
      ],
    });
    expect(JSON.parse(localStorage.getItem(SCHEDULES_STORAGE_KEY))).toEqual(
      store,
    );
  });

  it("migrates the legacy single schedule without losing its settings", () => {
    const subjects = [{ title: "Algorithms", events: [], enabled: false }];
    localStorage.setItem("savedSubjects", JSON.stringify(subjects));
    localStorage.setItem("lectureExemption", "true");

    const store = loadScheduleStore(localStorage, makeId);

    expect(getActiveSchedule(store)).toMatchObject({
      name: "Default schedule",
      subjects,
      lectureExemption: true,
    });
  });

  it("keeps subjects and settings isolated while switching schedules", () => {
    let store = loadScheduleStore(localStorage, makeId);
    store = updateActiveSchedule(store, {
      subjects: [{ title: "First" }],
      lectureExemption: true,
    });
    const firstId = store.activeScheduleId;
    store = addSchedule(store, { name: "Alternative" }, makeId);
    const secondId = store.activeScheduleId;
    store = updateActiveSchedule(store, { subjects: [{ title: "Second" }] });

    expect(getActiveSchedule(activateSchedule(store, firstId))).toMatchObject({
      subjects: [{ title: "First" }],
      lectureExemption: true,
    });
    expect(getActiveSchedule(activateSchedule(store, secondId))).toMatchObject({
      subjects: [{ title: "Second" }],
      lectureExemption: false,
    });
  });

  it("creates an imported schedule without modifying the existing schedule", () => {
    let store = loadScheduleStore(localStorage, makeId);
    const originalId = store.activeScheduleId;
    store = updateActiveSchedule(store, { subjects: [{ title: "Local" }] });
    store = addSchedule(
      store,
      {
        name: "Imported schedule",
        subjects: [{ title: "Shared" }],
        lectureExemption: true,
      },
      makeId,
    );

    expect(store.schedules).toHaveLength(2);
    expect(
      store.schedules.find(({ id }) => id === originalId).subjects,
    ).toEqual([{ title: "Local" }]);
    expect(getActiveSchedule(store)).toMatchObject({
      name: "Imported schedule",
      subjects: [{ title: "Shared" }],
      lectureExemption: true,
    });
  });

  it("renames and deletes schedules while selecting a remaining schedule", () => {
    let store = loadScheduleStore(localStorage, makeId);
    const firstId = store.activeScheduleId;
    store = addSchedule(store, {}, makeId);
    const secondId = store.activeScheduleId;
    store = renameSchedule(store, secondId, "  Registration plan  ");
    store = removeSchedule(store, secondId);

    expect(store.schedules).toHaveLength(1);
    expect(store.activeScheduleId).toBe(firstId);
    expect(removeSchedule(store, firstId)).toBe(store);
  });

  it("repairs an invalid active id when loading saved schedules", () => {
    saveScheduleStore(localStorage, {
      version: 1,
      activeScheduleId: "missing",
      schedules: [
        { id: "valid", name: "Plan", subjects: [], lectureExemption: false },
      ],
    });

    expect(loadScheduleStore(localStorage, makeId).activeScheduleId).toBe(
      "valid",
    );
  });

  it("repairs duplicate enabled variants from the old class identity", () => {
    const shared = {
      title: "Data Analysis I (practice)",
      code: "ESST116-1",
      dayOfWeek: "Thursday",
      startTime: "16:00",
      endTime: "18:00",
      enabled: true,
      extendedProps: {
        type: "practice",
        location: "LÉ 2.84",
      },
    };
    const subjects = [
      {
        title: "Data Analysis I",
        code: "ESST116-1",
        enabled: true,
        events: [
          {
            ...shared,
            description: "ESST116-1\nInstructor: Szeitl Blanka Veronika",
            extendedProps: {
              ...shared.extendedProps,
              instructor: "Szeitl Blanka Veronika",
            },
          },
          {
            ...shared,
            description: "ESST116-1\nInstructor: Németh Renáta Dr.",
            extendedProps: {
              ...shared.extendedProps,
              instructor: "Németh Renáta Dr.",
            },
          },
        ],
      },
    ];
    saveScheduleStore(localStorage, {
      version: 1,
      activeScheduleId: "saved",
      schedules: [
        {
          id: "saved",
          name: "Plan",
          subjects,
          lectureExemption: false,
        },
      ],
    });

    const store = loadScheduleStore(localStorage, makeId);

    expect(
      getActiveSchedule(store).subjects[0].events.map(({ enabled }) => enabled),
    ).toEqual([true, false]);
    expect(JSON.parse(localStorage.getItem(SCHEDULES_STORAGE_KEY))).toEqual(
      store,
    );
  });

  it("reads a default schedule without persisting it", () => {
    const store = readScheduleStore(localStorage, makeId);

    expect(store).toEqual({
      version: 1,
      activeScheduleId: "schedule-1",
      schedules: [
        {
          id: "schedule-1",
          name: "Default schedule",
          subjects: [],
          lectureExemption: false,
        },
      ],
    });
    expect(localStorage.getItem(SCHEDULES_STORAGE_KEY)).toBeNull();
  });

  it("reads a saved store without rewriting it", () => {
    const saved = {
      version: 1,
      activeScheduleId: "valid",
      schedules: [
        { id: "valid", name: "Plan", subjects: [], lectureExemption: false },
      ],
    };
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(saved));

    expect(readScheduleStore(localStorage, makeId)).toEqual(saved);
  });
});
