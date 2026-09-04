import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import SubjectControls from "../../src/components/SubjectControls.svelte";

const subjects = [
  {
    title: "Algorithms",
    enabled: true,
    events: [
      {
        code: "IK-ALG-01",
        dayOfWeek: "Monday",
        startTime: "10:00",
        endTime: "11:30",
        enabled: true,
        hasConflict: true,
        extendedProps: { type: "practice", instructor: "Dr. Jane Smith" },
      },
      {
        description: "IK-ALG-02\nInstructor",
        dayOfWeek: "Wednesday",
        startTime: "12:00",
        endTime: "13:30",
        enabled: false,
        hasConflict: false,
        extendedProps: { type: "lecture", instructor: "Dr. Alan Turing" },
      },
      {
        code: "IK-ALG-03",
        dayOfWeek: "Monday",
        startTime: "08:00",
        endTime: "09:30",
        enabled: false,
        hasConflict: false,
        extendedProps: { type: "lecture", instructor: "Dr. Ada Lovelace" },
      },
    ],
  },
];

describe("SubjectControls", () => {
  it("forwards subject and delete actions", async () => {
    const onToggleSubject = vi.fn();
    const onDeleteSubject = vi.fn();
    render(SubjectControls, { subjects, onToggleSubject, onDeleteSubject });

    await fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Show Algorithms in timetable",
      }),
    );
    await fireEvent.click(screen.getByTitle("Remove subject"));

    expect(onToggleSubject).toHaveBeenCalledWith("Algorithms");
    expect(onDeleteSubject).toHaveBeenCalledWith("Algorithms");
    expect(
      screen.getByRole("region", { name: "Selected subjects" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Selected subjects" }),
    ).toBeNull();
    expect(screen.queryByText("1 subject")).toBeNull();
  });

  it("reveals event controls and forwards the event index", async () => {
    const onToggleEvent = vi.fn();
    render(SubjectControls, { subjects, onToggleEvent });

    await fireEvent.click(
      screen.getByRole("button", { name: "Edit classes for Algorithms" }),
    );
    const menu = screen.getByRole("group", { name: "Groups for Algorithms" });
    const lecture = screen.getByRole("radio", {
      name: "Lecture, group 03, Monday 08:00–09:30",
    });
    await fireEvent.click(lecture);

    expect(lecture).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(
      screen.getAllByRole("heading", { level: 3 })[0].textContent.trim(),
    ).toBe("Lectures");
    expect(
      screen.getAllByRole("heading", { level: 3 })[1].textContent.trim(),
    ).toBe("Practices");
    expect(
      [...menu.querySelectorAll(".event-when strong")].map(
        (element) => element.textContent,
      ),
    ).toEqual([
      "Monday 08:00–09:30",
      "Wednesday 12:00–13:30",
      "Monday 10:00–11:30",
    ]);
    expect(
      [...menu.querySelectorAll(".event-instructor")].map((element) =>
        element.textContent.trim(),
      ),
    ).toEqual(["Dr. Ada Lovelace", "Dr. Alan Turing", "Dr. Jane Smith"]);
    expect(menu.textContent).not.toContain("IK-ALG-03");
    expect(menu.querySelector(".event-when span")).toBeNull();
    expect(onToggleEvent).toHaveBeenCalledWith("Algorithms", 2);
  });

  it("reveals event controls on click for touch and keyboard users", async () => {
    const onToggleSubject = vi.fn();
    render(SubjectControls, { subjects, onToggleSubject });

    const subjectToggle = screen.getByRole("button", {
      name: "Edit classes for Algorithms",
    });
    expect(subjectToggle.tagName).toBe("BUTTON");
    expect(
      screen
        .getByRole("checkbox", { name: "Show Algorithms in timetable" })
        .closest("button"),
    ).toBeNull();
    await fireEvent.click(subjectToggle);
    expect(onToggleSubject).not.toHaveBeenCalled();
    expect(
      screen.getByRole("group", { name: "Groups for Algorithms" }),
    ).toBeTruthy();

    await fireEvent.click(subjectToggle);
    expect(onToggleSubject).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("group", { name: "Groups for Algorithms" }),
    ).toBeNull();
  });

  it("toggles the subject without toggling the event dropdown", async () => {
    const onToggleSubject = vi.fn();
    render(SubjectControls, { subjects, onToggleSubject });

    await fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Show Algorithms in timetable",
      }),
    );

    expect(onToggleSubject).toHaveBeenCalledWith("Algorithms");
    expect(
      screen.queryByRole("group", { name: "Algorithms events" }),
    ).toBeNull();
  });

  it("sorts subject expansion controls alphabetically", () => {
    render(SubjectControls, {
      subjects: [
        { title: "Zoology", enabled: true, events: [] },
        ...subjects,
        { title: "climate policy", enabled: true, events: [] },
      ],
    });

    expect(
      screen
        .getAllByRole("button", { name: /Edit classes for/ })
        .map((button) =>
          button.querySelector(".subject-title strong").textContent.trim(),
        ),
    ).toEqual(["Algorithms", "climate policy", "Zoology"]);
  });
});
