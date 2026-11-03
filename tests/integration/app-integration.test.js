import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/schedule.js", async () => {
  const actual = await vi.importActual("../../src/utils/schedule.js");
  return { ...actual, fetchSubjectClasses: vi.fn() };
});

import App from "../../src/App.svelte";
import {
  encodeSchedule,
  fetchSubjectClasses,
} from "../../src/utils/schedule.js";
import {
  addSchedule,
  getActiveSchedule,
  loadScheduleStore,
  saveScheduleStore,
  updateActiveSchedule,
} from "../../src/utils/scheduleStorage.js";
import { getEventIdentity } from "../../src/utils/scheduleState.js";

const importedClass = {
  time: "Monday 10:00-11:30",
  code: "DEMO-1-1",
  type: "lecture",
  title: "Introduction to Web Development",
  location: "North Building 2.42",
  instructor: "Dr. Jane Smith",
};

const savedEvent = {
  title: "Introduction to Web Development (lecture)",
  code: "DEMO-1-1",
  description: "DEMO-1-1\nInstructor: Dr. Jane Smith",
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
  enabled: true,
  extendedProps: {
    type: "lecture",
    location: "North Building 2.42",
    instructor: "Dr. Jane Smith",
  },
};

function savePopulatedSchedule() {
  let store = loadScheduleStore(localStorage, () => "schedule-one");
  store = updateActiveSchedule(store, {
    subjects: [
      {
        title: "Introduction to Web Development",
        code: "DEMO-1-1",
        enabled: true,
        events: [savedEvent],
      },
    ],
  });
  saveScheduleStore(localStorage, store);
  return store;
}

const alternativeEvent = {
  ...savedEvent,
  code: "DEMO-1-2",
  description: "DEMO-1-2\nInstructor: Dr. Jane Smith",
  dayOfWeek: "Friday",
  enabled: false,
};

const conflictingEvent = {
  ...savedEvent,
  title: "Conflicting Subject (lecture)",
  code: "OTHER-1",
  description: "OTHER-1\nInstructor: Someone Else",
};

describe("App integration", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("warningShown", "true");
    fetchSubjectClasses.mockReset();
    fetchSubjectClasses.mockResolvedValue([importedClass]);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.unstubAllGlobals();
  });

  it("imports into a new active schedule while preserving local schedules", async () => {
    let store = loadScheduleStore(localStorage, () => "local-schedule");
    store = updateActiveSchedule(store, {
      subjects: [
        { title: "Local subject", code: "LOCAL-1", enabled: false, events: [] },
      ],
    });
    saveScheduleStore(localStorage, store);
    const encoded = encodeSchedule([importedClass.code], true);
    window.history.replaceState({}, "", `/import/${encoded}`);

    render(App);

    await waitFor(() => {
      const saved = loadScheduleStore(localStorage);
      expect(saved.schedules).toHaveLength(2);
      expect(getActiveSchedule(saved)).toMatchObject({
        name: "Imported schedule",
        lectureExemption: true,
        subjects: [
          expect.objectContaining({
            title: "Introduction to Web Development",
            enabled: true,
          }),
        ],
      });
      expect(saved.schedules[0].subjects).toEqual([
        expect.objectContaining({ title: "Local subject" }),
      ]);
    });
    expect(window.location.pathname).toBe("/");
  });

  it("imports only the shared instructor when duplicate classes use one code", async () => {
    const firstClass = {
      ...importedClass,
      code: "ESST116-1",
      type: "practice",
      title: "Academic skills",
      time: "Thursday 16:00-18:00",
      location: "LÉ 2.84",
      instructor: "Szeitl Blanka Veronika",
    };
    const secondClass = {
      ...firstClass,
      instructor: "Németh Renáta Dr.",
    };
    const selectedEvent = {
      title: "Academic skills (practice)",
      code: firstClass.code,
      description: `${firstClass.code}\nInstructor: ${firstClass.instructor}`,
      dayOfWeek: "Thursday",
      startTime: "16:00",
      endTime: "18:00",
      enabled: true,
      extendedProps: {
        type: firstClass.type,
        location: firstClass.location,
        instructor: firstClass.instructor,
      },
    };
    fetchSubjectClasses.mockResolvedValue([firstClass, secondClass]);
    const encoded = encodeSchedule([firstClass.code], false, [
      getEventIdentity(selectedEvent),
    ]);
    window.history.replaceState({}, "", `/import/${encoded}`);

    render(App);

    await waitFor(() => {
      const active = getActiveSchedule(loadScheduleStore(localStorage));
      expect(active.subjects[0].events.map(({ enabled }) => enabled)).toEqual([
        true,
        false,
      ]);
    });
  });

  it("shares the enabled schedule and persists lecture exemption", async () => {
    savePopulatedSchedule();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(App);

    await fireEvent.click(
      await screen.findByRole("button", { name: "Copy link" }),
    );
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/import/${encodeSchedule(["DEMO-1-1"], false, [getEventIdentity(savedEvent)])}`,
    );
    expect(
      await screen.findByText("Share link copied to clipboard."),
    ).toBeTruthy();

    const exemptionControl = screen.getByRole("checkbox", {
      name: /Ignore lecture conflicts/,
    });
    await fireEvent.change(exemptionControl);

    await waitFor(() => {
      expect(
        getActiveSchedule(loadScheduleStore(localStorage)).lectureExemption,
      ).toBe(true);
    });
  });

  it("reports when the share link cannot be copied", async () => {
    savePopulatedSchedule();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("permission denied")),
      },
    });

    render(App);
    await fireEvent.click(
      await screen.findByRole("button", { name: "Copy link" }),
    );

    const message = await screen.findByText(/share link could not be copied/i);
    expect(message.getAttribute("role")).toBe("alert");
  });

  it("opens export coordination for the active schedule", async () => {
    savePopulatedSchedule();
    render(App);

    await fireEvent.click(
      await screen.findByRole("button", {
        name: "Export calendar",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Export timetable" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Download iCalendar pack" }),
    ).toBeTruthy();
  });

  it("creates, renames, switches, and deletes schedules", async () => {
    const initial = loadScheduleStore(localStorage, () => "schedule-one");
    saveScheduleStore(localStorage, initial);
    render(App);

    await fireEvent.click(
      await screen.findByRole("button", { name: "New schedule" }),
    );
    await waitFor(() => {
      expect(loadScheduleStore(localStorage).schedules).toHaveLength(2);
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Rename New schedule" }),
    );
    await fireEvent.input(screen.getByLabelText("Schedule name"), {
      target: { value: "Exam plan" },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Save schedule name" }),
    );
    expect(loadScheduleStore(localStorage).schedules[1].name).toBe("Exam plan");

    await fireEvent.change(screen.getByRole("combobox", { name: "Schedule" }), {
      target: { value: "schedule-one" },
    });
    expect(loadScheduleStore(localStorage).activeScheduleId).toBe(
      "schedule-one",
    );

    const examPlanId = screen.getByRole("option", { name: "Exam plan" }).value;
    await fireEvent.change(screen.getByRole("combobox", { name: "Schedule" }), {
      target: { value: examPlanId },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Delete Exam plan" }),
    );
    expect(
      screen.getByRole("alertdialog", { name: "Delete schedule" }),
    ).toBeTruthy();
    await fireEvent.click(
      screen.getByRole("button", { name: "Delete", exact: true }),
    );
    expect(loadScheduleStore(localStorage).schedules).toHaveLength(1);
  });

  it("keeps the schedule when a delete confirmation is cancelled", async () => {
    const initial = loadScheduleStore(localStorage, () => "schedule-one");
    let store = updateActiveSchedule(initial, {
      subjects: [
        { title: "Local subject", code: "LOCAL-1", enabled: false, events: [] },
      ],
    });
    saveScheduleStore(localStorage, addSchedule(store, { name: "Exam plan" }));
    render(App);

    await fireEvent.click(
      screen.getByRole("button", { name: "Delete Exam plan" }),
    );
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(loadScheduleStore(localStorage).schedules).toHaveLength(2);
  });

  it("applies a suggested combination and persists the swapped groups", async () => {
    let store = loadScheduleStore(localStorage, () => "schedule-one");
    store = updateActiveSchedule(store, {
      subjects: [
        {
          title: "Introduction to Web Development",
          code: "DEMO-1-1, DEMO-1-2",
          enabled: true,
          events: [savedEvent, alternativeEvent],
        },
        {
          title: "Conflicting Subject",
          code: "OTHER-1",
          enabled: true,
          events: [conflictingEvent],
        },
      ],
    });
    saveScheduleStore(localStorage, store);
    render(App);

    await fireEvent.click(
      await screen.findByRole("button", { name: "Suggest schedules" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Schedule suggestions" }),
    ).toBeTruthy();
    expect(screen.getByText(/has 1 conflict/)).toBeTruthy();

    const applyButtons = await screen.findAllByRole("button", {
      name: /Apply option/,
    });
    await fireEvent.click(applyButtons[0]);

    await waitFor(() => {
      const active = getActiveSchedule(loadScheduleStore(localStorage));
      const subject = active.subjects.find(
        ({ title }) => title === "Introduction to Web Development",
      );
      expect(subject.events.map((event) => event.enabled)).toEqual([
        false,
        true,
      ]);
      expect(active.subjects[1].events[0].enabled).toBe(true);
    });
    expect(
      screen.queryByRole("dialog", { name: "Schedule suggestions" }),
    ).toBeNull();
  });
});
