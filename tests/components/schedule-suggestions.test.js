import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ScheduleSuggestions from "../../src/components/ScheduleSuggestions.svelte";

function makeEvent(overrides = {}) {
  return {
    title: "Subject",
    dayOfWeek: "Monday",
    startTime: "10:00",
    endTime: "11:30",
    code: "SUBJ-1",
    enabled: false,
    extendedProps: { type: "lecture" },
    ...overrides,
  };
}

const subjects = [
  {
    title: "Subject",
    code: "SUBJ",
    enabled: true,
    events: [
      makeEvent({
        code: "SUBJ-1",
        enabled: true,
        dayOfWeek: "Monday",
        startTime: "10:00",
        endTime: "11:30",
      }),
      makeEvent({
        code: "SUBJ-2",
        enabled: false,
        dayOfWeek: "Wednesday",
        startTime: "14:00",
        endTime: "15:30",
      }),
      makeEvent({
        code: "SUBJ-2",
        enabled: false,
        dayOfWeek: "Wednesday",
        startTime: "14:00",
        endTime: "15:30",
      }),
    ],
  },
];

describe("ScheduleSuggestions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows only current-to-suggested replacements grouped by day", async () => {
    render(ScheduleSuggestions, { subjects, lectureExemption: false });

    await fireEvent.click(
      screen.getByRole("button", { name: "Suggest schedules" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Schedule suggestions" }),
    ).toBeTruthy();
    expect(screen.getByText("Option 1")).toBeTruthy();
    expect(screen.queryByText("Option 2")).toBeNull();
    expect(screen.getByText("No conflicts")).toBeTruthy();
    expect(screen.getByText("1 replacement")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Wednesday" })).toBeTruthy();
    expect(screen.getByText("Current")).toBeTruthy();
    expect(screen.getByText("Suggested")).toBeTruthy();
    expect(screen.getByText("SUBJ-1")).toBeTruthy();
    expect(screen.getByText("SUBJ-2")).toBeTruthy();
    expect(screen.getByText("Monday 10:00–11:30")).toBeTruthy();
    expect(screen.getByText("Wednesday 14:00–15:30")).toBeTruthy();
    expect(
      screen.queryByText("Wednesday 14:00–15:30 · Wednesday 14:00–15:30"),
    ).toBeNull();
  });

  it("does not offer unchanged or equally conflicting schedules", async () => {
    const alwaysConflicting = [
      {
        title: "First",
        code: "FIRST",
        enabled: true,
        events: [makeEvent({ code: "FIRST-1", enabled: true })],
      },
      {
        title: "Second",
        code: "SECOND",
        enabled: true,
        events: [makeEvent({ code: "SECOND-1", enabled: true })],
      },
    ];
    render(ScheduleSuggestions, {
      subjects: alwaysConflicting,
      lectureExemption: false,
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Suggest schedules" }),
    );

    expect(
      screen.getByText(/No group swap that reduces these conflicts was found/),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Apply option/ })).toBeNull();
  });

  it("applies a suggestion through the callback and closes the dialog", async () => {
    const onApplySuggestion = vi.fn();
    render(ScheduleSuggestions, {
      subjects,
      lectureExemption: false,
      onApplySuggestion,
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Suggest schedules" }),
    );
    const applyButtons = await screen.findAllByRole("button", {
      name: /Apply option/,
    });
    await fireEvent.click(applyButtons[0]);

    await waitFor(() => expect(onApplySuggestion).toHaveBeenCalledOnce());
    const [suggestion] = onApplySuggestion.mock.calls[0];
    expect(suggestion.groups).toHaveLength(1);
    expect(suggestion.groups[0]).toMatchObject({
      subjectTitle: "Subject",
      code: "SUBJ-2",
      typeClass: "lecture",
    });
    expect(
      screen.queryByRole("dialog", { name: "Schedule suggestions" }),
    ).toBeNull();
  });

  it("closes the dialog from the close button", async () => {
    render(ScheduleSuggestions, { subjects, lectureExemption: false });

    await fireEvent.click(
      screen.getByRole("button", { name: "Suggest schedules" }),
    );
    await fireEvent.click(
      screen.getByRole("button", { name: "Close suggestions" }),
    );

    expect(
      screen.queryByRole("dialog", { name: "Schedule suggestions" }),
    ).toBeNull();
  });

  it("distinguishes same-code same-time teachers for lectures and practices and applies the exact option", async () => {
    const onApplySuggestion = vi.fn();
    const alternatives = [
      {
        title: "Subject",
        enabled: true,
        events: [
          makeEvent({
            code: "L",
            enabled: true,
            extendedProps: { type: "lecture", instructor: "Alice" },
          }),
          makeEvent({
            code: "L",
            extendedProps: { type: "lecture", instructor: "Beatrice" },
          }),
          makeEvent({
            code: "P",
            dayOfWeek: "Tuesday",
            enabled: true,
            extendedProps: { type: "practice", instructor: "Carlos" },
          }),
          makeEvent({
            code: "P",
            dayOfWeek: "Tuesday",
            extendedProps: { type: "practice", instructor: "Dora" },
          }),
        ],
      },
    ];
    const original = structuredClone(alternatives);
    const { container } = render(ScheduleSuggestions, {
      subjects: alternatives,
      onApplySuggestion,
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Suggest schedules" }),
    );
    const options = [...container.querySelectorAll(".option")];
    expect(options).toHaveLength(3);
    const bothChanges = options.find((option) =>
      option.textContent.includes("2 replacements"),
    );
    expect(bothChanges).toBeTruthy();
    for (const label of [
      "Alice",
      "Beatrice",
      "Carlos",
      "Dora",
      "Lecture",
      "Practice",
    ]) {
      expect(within(bothChanges).getByText(label)).toBeTruthy();
    }
    await fireEvent.click(
      within(bothChanges).getByRole("button", { name: /Apply option/ }),
    );
    expect(onApplySuggestion).toHaveBeenCalledOnce();
    expect(
      onApplySuggestion.mock.calls[0][0].groups
        .map((group) => group.events[0].extendedProps.instructor)
        .sort(),
    ).toEqual(["Beatrice", "Dora"]);
    expect(alternatives).toEqual(original);
  });

  it("opening and cancelling suggestions leaves the schedule unchanged", async () => {
    const original = structuredClone(subjects);
    const onApplySuggestion = vi.fn();
    render(ScheduleSuggestions, { subjects, onApplySuggestion });
    await fireEvent.click(
      screen.getByRole("button", { name: "Suggest schedules" }),
    );
    await fireEvent.click(
      screen.getByRole("button", { name: "Close suggestions" }),
    );
    expect(onApplySuggestion).not.toHaveBeenCalled();
    expect(subjects).toEqual(original);
  });

  it("reports that no alternative was found without claiming global impossibility", async () => {
    render(ScheduleSuggestions, {
      subjects: [{ ...subjects[0], events: [subjects[0].events[0]] }],
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Suggest schedules" }),
    );
    expect(
      screen.getByText("No other conflict-free combination was found."),
    ).toBeTruthy();
    expect(screen.queryByText(/only possible combination/)).toBeNull();
  });
});
