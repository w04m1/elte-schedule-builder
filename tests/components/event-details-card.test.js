import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import EventDetailsCard from "../../src/components/EventDetailsCard.svelte";

describe("EventDetailsCard", () => {
  it("presents the class hierarchy without the generic color swatch", () => {
    const calendarEvent = {
      title: "Research Seminar in Algebra and Number Theory I.",
      originalEvent: {
        title: "Research Seminar in Algebra and Number Theory I. (practice)",
        dayOfWeek: "Thursday",
        startTime: "16:00",
        endTime: "18:00",
        code: "ELTE-mm1n9l62m-1",
        extendedProps: {
          type: "practice",
          instructor: "Gyarmati Katalin",
          location: "LD 3-204",
        },
      },
    };

    const { container } = render(EventDetailsCard, { calendarEvent });

    expect(
      screen.getByRole("heading", {
        name: "Research Seminar in Algebra and Number Theory I.",
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/\(practice\)/i)).toBeNull();
    expect(screen.queryByText("Class details")).toBeNull();
    expect(screen.queryByText("Thursday · 16:00–18:00")).toBeNull();
    expect(screen.getByText("Gyarmati Katalin")).toBeTruthy();
    expect(screen.getByText("LD 3-204")).toBeTruthy();
    expect(screen.getByText("Course")).toBeTruthy();
    expect(screen.getByText("ELTE-mm1n9l62m-1")).toBeTruthy();
    expect(screen.getByText("Group")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(container.querySelector(".is-practice")).toBeTruthy();
    expect(container.querySelectorAll("svg")).toHaveLength(4);
    expect(container.querySelector(".sx__event-modal__color-icon")).toBeNull();
  });

  it("omits empty metadata instead of showing placeholders", () => {
    const { container } = render(EventDetailsCard, {
      calendarEvent: {
        title: "Independent Study",
        originalEvent: {
          title: "Independent Study",
          dayOfWeek: "Monday",
          startTime: "08:00",
          endTime: "09:30",
          extendedProps: { type: "lecture" },
        },
      },
    });

    expect(screen.queryByText("Class details")).toBeNull();
    expect(container.querySelector(".is-lecture")).toBeTruthy();
    expect(screen.queryByText("Professor")).toBeNull();
    expect(screen.queryByText("Room")).toBeNull();
    expect(screen.queryByText("Course")).toBeNull();
  });
});
