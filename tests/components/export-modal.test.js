import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExportModal from "../../src/components/ExportModal.svelte";

const event = {
  title: "Introduction to Web Development (lecture)",
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
  description: "DEMO-1-1\nInstructor: Dr. Jane Smith",
  extendedProps: {
    type: "lecture",
    location: "North Building 2.42",
  },
};

describe("ExportModal", () => {
  let createObjectURL;
  let revokeObjectURL;
  let click;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 5, 12));
    createObjectURL = vi.fn(() => "blob:calendar-export");
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    click.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("downloads the complete timetable as one recurring iCalendar pack", async () => {
    render(ExportModal, {
      props: {
        isOpen: true,
        events: [
          event,
          {
            ...event,
            title: "Second",
            description: "DEMO-2-1\nInstructor: Dr. Jane Smith",
          },
        ],
        onClose: vi.fn(),
      },
    });

    await fireEvent.click(
      screen.getByRole("button", { name: /Download iCalendar pack/ }),
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("2 classes");
  });

  it("downloads the complete timetable as one Google CSV pack", async () => {
    render(ExportModal, {
      props: { isOpen: true, events: [event], onClose: vi.fn() },
    });

    await fireEvent.click(
      screen.getByRole("button", { name: /Download Google Calendar CSV pack/ }),
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0][0].type).toBe(
      "text/csv;charset=utf-8",
    );
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("1 class");
  });
});
