import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import TimeGridEvent from "../../src/components/TimeGridEvent.svelte";

describe("TimeGridEvent", () => {
  it("renders external event data as text instead of HTML", () => {
    const payload = '<img src=x onerror="alert(1)">';
    const calendarEvent = {
      title: "fallback",
      originalEvent: {
        title: payload,
        description: "IP-18fWPEG-90\nInstructor: test",
        code: payload,
        startTime: "10:00",
        endTime: "11:30",
        extendedProps: {
          instructor: payload,
          location: payload,
        },
      },
    };

    const { container } = render(TimeGridEvent, { calendarEvent });

    expect(screen.getAllByText(payload)).toHaveLength(2);
    expect(container.querySelector("img")).toBeNull();
  });

  it("keeps the grid card compact and leaves details for the popup", () => {
    const calendarEvent = {
      title: "fallback",
      originalEvent: {
        title: "Programming (lecture)",
        description: "IP-18fWPEG-90\nInstructor: Dr. Smith",
        code: "IP-18fWPEG-90",
        startTime: "10:00",
        endTime: "11:30",
        extendedProps: {
          type: "lecture",
          instructor: "Dr. Smith",
          location: "North Building 0.101",
        },
      },
    };

    render(TimeGridEvent, { calendarEvent });

    expect(screen.getByText("Programming")).toBeTruthy();
    expect(screen.queryByText("Programming (lecture)")).toBeNull();
    expect(screen.getByText("10:00–11:30")).toBeTruthy();
    expect(screen.getByText("North Building 0.101")).toBeTruthy();
    expect(screen.queryByText("Lecture")).toBeNull();
    expect(screen.queryByText("Group 90")).toBeNull();
    expect(screen.queryByText("IP-18fWPEG-90")).toBeNull();
    expect(screen.queryByText("Dr. Smith")).toBeNull();
  });
});
