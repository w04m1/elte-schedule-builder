import { render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";
import Calendar from "../../src/components/Calendar.svelte";
import { language } from "../../src/utils/i18n.js";
import "@schedule-x/theme-default/dist/index.css";

const subjects = [
  {
    title: "Algorithms",
    startTime: "10:00",
    endTime: "11:30",
    dayOfWeek: "Monday",
    code: "IP-1234-1",
    extendedProps: {
      type: "practice",
      location: "North Building 2.42",
      instructor: "Dr. Jane Smith",
    },
  },
  {
    title: "Databases",
    startTime: "14:00",
    endTime: "15:30",
    dayOfWeek: "Wednesday",
    code: "IP-5678-1",
    extendedProps: { type: "lecture" },
  },
];

describe("Calendar", () => {
  afterEach(() => language.set("en"));

  it("exposes every event to screen readers through the agenda", () => {
    // The prop is named `events`, which collides with a Svelte mount option,
    // so it must be passed through the `props` key in tests.
    render(Calendar, { props: { events: subjects } });

    const agenda = screen.getByLabelText("Weekly schedule list");
    expect(agenda).toBeTruthy();

    expect(
      screen.getByText(
        "Algorithms: 10:00 to 11:30, Practice, group 1, code IP-1234-1, location North Building 2.42, instructor Dr. Jane Smith",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Databases: 14:00 to 15:30, Lecture, group 1, code IP-5678-1",
      ),
    ).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Monday" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Wednesday" })).toBeTruthy();
    expect(screen.queryByText("2 class meetings shown")).toBeNull();
  });

  it("announces conflicts in the agenda and labels the grid region", () => {
    const conflicting = [
      subjects[0],
      {
        ...subjects[1],
        dayOfWeek: "Monday",
        startTime: "11:00",
        endTime: "12:30",
      },
    ];

    render(Calendar, { props: { events: conflicting } });

    const agenda = screen.getByLabelText("Weekly schedule list");
    const items = agenda.querySelectorAll("li");
    expect(
      [...items].every((item) => item.textContent.includes("conflicts")),
    ).toBe(true);

    expect(
      screen.getByRole("region", { name: "Weekly schedule grid" }),
    ).toBeTruthy();
  });

  it("keeps the calendar visible when the schedule is empty", () => {
    render(Calendar, { props: { events: [] } });

    expect(
      screen.getByRole("region", { name: "Weekly schedule grid" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Monday" })).toBeNull();
  });

  it("keeps display settings and actions inside the timetable region", () => {
    render(Calendar, { props: { events: subjects } });

    const timetable = screen.getByRole("region", { name: "Your timetable" });
    const displayOptions = screen.getByRole("region", {
      name: "Timetable display options",
    });
    const actions = screen.getByRole("group", { name: "Timetable actions" });

    expect(timetable.contains(displayOptions)).toBe(true);
    expect(timetable.contains(actions)).toBe(true);
  });

  it("localizes the calendar, agenda, and accessible labels in Hungarian", () => {
    language.set("hu");
    render(Calendar, { props: { events: subjects } });

    expect(screen.getByLabelText("Heti órarendrács")).toBeTruthy();
    expect(screen.getByLabelText("Heti órarendlista")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Hétfő" })).toBeTruthy();
    expect(
      screen.getByText(
        "Algorithms: 10:00 – 11:30, Gyakorlat, csoport 1, kód IP-1234-1, helyszín North Building 2.42, oktató Dr. Jane Smith",
      ),
    ).toBeTruthy();
  });
});
