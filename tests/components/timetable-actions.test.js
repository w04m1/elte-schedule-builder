import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import TimetableActions from "../../src/components/TimetableActions.svelte";
import { encodeSchedule } from "../../src/utils/schedule.js";
import { getEventIdentity } from "../../src/utils/scheduleState.js";

const event = {
  title: "Algorithms",
  code: "IK-ALG-01",
  description: "IK-ALG-01\nInstructor: Ada",
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
  extendedProps: { type: "lecture" },
};

describe("TimetableActions", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("disables timetable actions until classes are visible", () => {
    render(TimetableActions);

    expect(
      screen.getByRole("button", { name: "Export calendar" }).disabled,
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Copy link" }).disabled).toBe(
      true,
    );
  });

  it("opens export and copies the current timetable link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });
    render(TimetableActions, {
      props: {
        events: [event],
        activeCodes: [event.code],
        lectureExemption: true,
      },
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Export calendar" }),
    );
    expect(
      screen.getByRole("heading", { name: "Export timetable" }),
    ).toBeTruthy();

    await fireEvent.click(
      screen.getByRole("button", { name: "Close export dialog" }),
    );
    await fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/import/${encodeSchedule([event.code], true, [getEventIdentity(event)])}`,
    );
  });
});
