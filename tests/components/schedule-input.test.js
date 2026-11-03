import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/schedule.js", async () => {
  const actual = await vi.importActual("../../src/utils/schedule.js");
  return { ...actual, fetchSubjectClasses: vi.fn() };
});

vi.mock("../../src/utils/registeredSubjectsFile.js", () => ({
  readRegisteredSubjectCodes: vi.fn(),
}));

import ScheduleInput from "../../src/components/ScheduleInput.svelte";
import { fetchSubjectClasses } from "../../src/utils/schedule.js";
import { readRegisteredSubjectCodes } from "../../src/utils/registeredSubjectsFile.js";
import { mergeScheduleEvents } from "../../src/utils/scheduleState.js";
import { createCalendarEvents } from "../../src/utils/schedule.js";

const demoClass = {
  time: "Monday 10:00-11:30",
  code: "DEMO-1-1",
  type: "lecture",
  title: "Introduction to Web Development",
  location: "North Building 2.42",
  instructor: "Dr. Jane Smith",
};

function subjectClass(code, title, time = "Monday 10:00-11:30") {
  return { ...demoClass, code, title, time };
}

describe("ScheduleInput", () => {
  let consoleError;

  beforeEach(() => {
    localStorage.clear();
    fetchSubjectClasses.mockReset();
    readRegisteredSubjectCodes.mockReset();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it.each(["lecture", "practice"])(
    "retains a failed practice choice alongside refreshed %s and retries its code",
    async (type) => {
      const lecture = {
        ...demoClass,
        code: "ALG-L-1",
        title: "Algorithms",
        type,
      };
      const practice = {
        ...lecture,
        code: "ALG-P-1",
        type: "practice",
        time: "Tuesday 12:00-13:00",
      };
      let subjects = [
        {
          title: "Algorithms",
          enabled: true,
          events: createCalendarEvents([lecture, practice]).map(
            (event, index) => ({
              ...event,
              enabled: index === 1 || type === "lecture",
            }),
          ),
        },
      ];
      fetchSubjectClasses.mockImplementation(async (code) => {
        if (code === "ALG-P") throw new Error("Unavailable");
        return [{ ...lecture, location: "New lecture room" }];
      });
      const view = render(ScheduleInput, {
        savedSubjects: subjects,
        onScheduleUpdate: (incoming, options) => {
          subjects = mergeScheduleEvents(subjects, incoming, options);
        },
      });
      await fireEvent.click(
        screen.getByRole("button", { name: "Refresh saved schedule" }),
      );
      await waitFor(() =>
        expect(subjects[0].events[0].extendedProps.location).toBe(
          "New lecture room",
        ),
      );
      expect(subjects[0].events.map((event) => event.code)).toEqual([
        "ALG-L-1",
        "ALG-P-1",
      ]);
      expect(subjects[0].events.map((event) => event.enabled)).toEqual([
        type === "lecture",
        true,
      ]);
      await view.rerender({ savedSubjects: subjects });
      fetchSubjectClasses.mockClear();
      await fireEvent.click(
        screen.getByRole("button", { name: "Refresh saved schedule" }),
      );
      await waitFor(() =>
        expect(fetchSubjectClasses).toHaveBeenCalledWith("ALG-P"),
      );
    },
  );

  it("keeps the selected instructor when refresh moves a meeting into an unselected slot", async () => {
    const alice = { ...demoClass, code: "ALG-1-1", instructor: "Alice" };
    const bob = {
      ...alice,
      code: "ALG-1-2",
      instructor: "Bob",
      time: "Tuesday 10:00-11:30",
    };
    const saved = [
      {
        title: demoClass.title,
        enabled: true,
        events: createCalendarEvents([alice, bob]).map((event, index) => ({
          ...event,
          enabled: index === 0,
        })),
      },
    ];
    let result;
    fetchSubjectClasses.mockResolvedValue([{ ...alice, time: bob.time }, bob]);
    render(ScheduleInput, {
      savedSubjects: saved,
      onScheduleUpdate: (incoming, options) => {
        result = mergeScheduleEvents(saved, incoming, options);
      },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Refresh saved schedule" }),
    );
    await waitFor(() => expect(result).toBeDefined());
    expect(result[0].enabled).toBe(true);
    expect(result[0].events.map((event) => event.enabled)).toEqual([
      true,
      false,
    ]);
    expect(result[0].events[0].dayOfWeek).toBe("Tuesday");
  });

  it("offers one radio per multi-meeting group while keeping same-time instructors distinct", async () => {
    const rows = [
      demoClass,
      { ...demoClass, time: "Wednesday 10:00-11:30" },
      { ...demoClass, instructor: "Alternative tutor" },
    ];
    const originalRows = structuredClone(rows);
    const selectedEvents = createCalendarEvents(rows.slice(0, 2)).map(
      (event) => ({ ...event, enabled: true }),
    );
    const originalSelection = structuredClone(selectedEvents);
    fetchSubjectClasses.mockImplementation(async (_code, mode) =>
      mode ? [] : rows,
    );
    const onClassSelection = vi.fn();
    render(ScheduleInput, {
      selectedEvents,
      onClassSelection,
    });
    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "DEMO-1" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));
    await screen.findByRole("heading", { name: demoClass.title });
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    const selected = screen.getByRole("radio", { name: /Dr. Jane Smith/ });
    expect(selected.checked).toBe(true);
    expect(selected.getAttribute("aria-label")).toContain("Wednesday");
    expect(selected.closest(".class-row").textContent).toContain("Monday");
    expect(selected.closest(".class-row").textContent).toContain("Wednesday");
    await fireEvent.click(
      screen.getByRole("radio", { name: /Alternative tutor/ }),
    );
    expect(onClassSelection).toHaveBeenCalledOnce();
    expect(onClassSelection.mock.calls[0][0]).toHaveLength(3);
    expect(onClassSelection.mock.calls[0][1].instructor).toBe(
      "Alternative tutor",
    );
    expect(rows).toEqual(originalRows);
    expect(selectedEvents).toEqual(originalSelection);
  });

  it("refreshes saved codes without a query, preserving selected groups and hidden subjects on partial failure", async () => {
    const rows = [
      demoClass,
      { ...demoClass, code: "DEMO-1-2", instructor: "Alternative tutor" },
    ];
    const savedSubjects = [
      {
        title: demoClass.title,
        enabled: false,
        events: createCalendarEvents(rows).map((event, index) => ({
          ...event,
          enabled: index === 1,
        })),
      },
      {
        title: "Unavailable subject",
        enabled: true,
        events: createCalendarEvents([
          subjectClass("OTHER-2-1", "Unavailable subject"),
        ]),
      },
    ];
    let refreshed;
    const onScheduleUpdate = (incoming) => {
      refreshed = mergeScheduleEvents(savedSubjects, incoming);
    };
    fetchSubjectClasses.mockImplementation(async (code) => {
      if (code === "OTHER-2") throw new Error("Unavailable");
      return rows.map((row) => ({ ...row, location: "Updated room" }));
    });
    render(ScheduleInput, { savedSubjects, onScheduleUpdate });
    expect(
      screen.getByLabelText("Subject code, course name, or professor").value,
    ).toBe("");
    await fireEvent.click(
      screen.getByRole("button", { name: "Refresh saved schedule" }),
    );
    await waitFor(() => expect(refreshed).toBeDefined());
    expect(fetchSubjectClasses.mock.calls).toEqual([["DEMO-1"], ["OTHER-2"]]);
    expect(refreshed[0].enabled).toBe(false);
    expect(refreshed[0].events.map((event) => event.enabled)).toEqual([
      false,
      true,
    ]);
    expect(
      refreshed[0].events.every(
        (event) => event.extendedProps.location === "Updated room",
      ),
    ).toBe(true);
    expect(refreshed[1]).toEqual(savedSubjects[1]);
    expect(screen.getByText(/OTHER-2/)).toBeTruthy();
  });

  it("does not issue the next refresh request until the previous one finishes", async () => {
    let finishFirst;
    fetchSubjectClasses.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFirst = resolve;
        }),
    );
    fetchSubjectClasses.mockResolvedValue([subjectClass("OTHER-2-1", "Other")]);
    const savedSubjects = [
      {
        title: demoClass.title,
        enabled: true,
        events: createCalendarEvents([demoClass]),
      },
      {
        title: "Other",
        enabled: true,
        events: createCalendarEvents([subjectClass("OTHER-2-1", "Other")]),
      },
    ];
    render(ScheduleInput, { savedSubjects });
    const refresh = screen.getByRole("button", {
      name: "Refresh saved schedule",
    });
    await fireEvent.click(refresh);
    expect(fetchSubjectClasses).toHaveBeenCalledTimes(1);
    expect(refresh.disabled).toBe(true);
    finishFirst([demoClass]);
    await waitFor(() => expect(fetchSubjectClasses).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(refresh.disabled).toBe(false));
  });

  it("searches Tanrend and adds all returned groups on request", async () => {
    const onScheduleUpdate = vi.fn();
    fetchSubjectClasses.mockResolvedValue([demoClass]);
    render(ScheduleInput, { onScheduleUpdate });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      {
        target: { value: "DEMO-1" },
      },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));
    await fireEvent.click(
      await screen.findByRole("button", { name: "Add all groups" }),
    );

    await waitFor(() => expect(onScheduleUpdate).toHaveBeenCalledOnce());
    expect(fetchSubjectClasses).toHaveBeenCalledWith("DEMO-1");
    expect(fetchSubjectClasses).toHaveBeenCalledWith("DEMO-1", "name");
    expect(fetchSubjectClasses).toHaveBeenCalledTimes(2);
    expect(onScheduleUpdate.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        description: expect.stringContaining("DEMO-1-1"),
        enabled: true,
      }),
    ]);
  });

  it("shows distinct code and name matches from one search", async () => {
    fetchSubjectClasses
      .mockResolvedValueOnce([
        {
          ...demoClass,
          code: "ALGORITHMS-1",
          title: "Algorithmic Thinking",
        },
      ])
      .mockResolvedValueOnce([
        {
          ...demoClass,
          code: "IK-ALG-E-1",
          title: "Algorithms L.",
        },
        {
          ...demoClass,
          time: "Wednesday 12:00-14:00",
          code: "IK-ALG-G-2",
          type: "practice",
          title: "Algorithms Pr.",
        },
      ])
      .mockResolvedValueOnce([]);
    render(ScheduleInput);

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      {
        target: { value: "Algorithms" },
      },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      await screen.findByRole("heading", { name: "Algorithms" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Algorithmic Thinking" }),
    ).toBeTruthy();
    expect(fetchSubjectClasses).toHaveBeenCalledWith("Algorithms");
    expect(fetchSubjectClasses).toHaveBeenCalledWith("Algorithms", "name");
    expect(fetchSubjectClasses).toHaveBeenCalledWith(
      "Algorithms",
      "instructor",
    );
    expect(
      screen.getAllByRole("radio", { name: /Select class: Algorithms/ }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Add all groups" }),
    ).toHaveLength(2);
  });

  it("deduplicates classes returned by both search modes", async () => {
    fetchSubjectClasses.mockResolvedValue([demoClass]);
    render(ScheduleInput);

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      {
        target: { value: "DEMO-1" },
      },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      await screen.findAllByRole("radio", {
        name: /Select class: Introduction to Web Development/,
      }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Add all groups" }),
    ).toHaveLength(1);
  });

  it("shows every course returned for a professor search", async () => {
    fetchSubjectClasses.mockImplementation((_query, mode) =>
      Promise.resolve(
        mode === "instructor"
          ? [
              subjectClass("IP-PROG-1", "Imperative Programming"),
              subjectClass("IP-LANG-1", "Programming Languages"),
            ].map((row) => ({
              ...row,
              instructor: "Pataki Norbert(0 %, administrator)",
            }))
          : [],
      ),
    );
    render(ScheduleInput);

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "Pataki Norbert" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      await screen.findByRole("heading", { name: "Imperative Programming" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Programming Languages" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Taught by Pataki Norbert")).toHaveLength(2);
    expect(fetchSubjectClasses).toHaveBeenCalledWith(
      "Pataki Norbert",
      "instructor",
    );
  });

  it("recovers a course-name search with a small typing error", async () => {
    fetchSubjectClasses.mockImplementation((searchTerm, mode) =>
      Promise.resolve(
        searchTerm === "Algor" && mode === "name"
          ? [subjectClass("IK-ALG-1", "Algorithms")]
          : [],
      ),
    );
    render(ScheduleInput);

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "Algoritms" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      await screen.findByRole("heading", { name: "Algorithms" }),
    ).toBeTruthy();
    expect(fetchSubjectClasses).toHaveBeenCalledWith("Algor", "name");
  });

  it("recovers a professor search with a small typing error", async () => {
    fetchSubjectClasses.mockImplementation((searchTerm, mode) =>
      Promise.resolve(
        searchTerm === "Norb" && mode === "instructor"
          ? [
              {
                ...subjectClass("IP-PROG-1", "Imperative Programming"),
                instructor: "Pataki Norbert",
              },
            ]
          : [],
      ),
    );
    render(ScheduleInput);

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "Patki Norbert" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      await screen.findByRole("heading", { name: "Imperative Programming" }),
    ).toBeTruthy();
    expect(screen.getByText("Taught by Pataki Norbert")).toBeTruthy();
    expect(fetchSubjectClasses).toHaveBeenCalledWith("Norb", "instructor");
  });

  it("does not apply typo fallback to subject codes", async () => {
    fetchSubjectClasses.mockResolvedValue([]);
    render(ScheduleInput);

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "DEM0-1" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(await screen.findByText(/No classes found/)).toBeTruthy();
    expect(
      fetchSubjectClasses.mock.calls.every(([searchTerm]) =>
        searchTerm.includes("DEM0-1"),
      ),
    ).toBe(true);
  });

  it("groups lectures before practices and sorts each group by weekday and time", async () => {
    fetchSubjectClasses.mockImplementation((_query, mode) =>
      Promise.resolve(
        mode === "name"
          ? []
          : [
              {
                ...demoClass,
                time: "Wednesday 17:45-19:15",
                code: "DEMO-1-L2",
                type: "lecture",
              },
              {
                ...demoClass,
                time: "Tuesday 12:00-14:00",
                code: "DEMO-1-P2",
                type: "practice",
              },
              {
                ...demoClass,
                time: "Monday 14:00-16:00",
                code: "DEMO-1-L1",
                type: "lecture",
              },
              {
                ...demoClass,
                time: "Tuesday 08:00-10:00",
                code: "DEMO-1-P1",
                type: "practice",
              },
              {
                ...demoClass,
                time: "Friday 15:00-18:00",
                code: "DEMO-1-R1",
                type: "classroom reservation",
              },
            ],
      ),
    );
    const { container } = render(ScheduleInput);

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      {
        target: { value: "DEMO-1" },
      },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    const lectureSection = await screen.findByRole("region", {
      name: "Lectures",
    });
    const practiceSection = screen.getByRole("region", { name: "Practices" });
    const sections = [...container.querySelectorAll(".class-section")];

    expect(sections).toEqual([lectureSection, practiceSection]);
    expect(screen.queryByText("1 subject found")).toBeNull();
    expect(screen.queryByText("5 class meetings")).toBeNull();
    expect(screen.queryByText("2 options")).toBeNull();
    expect(screen.queryByText("3 options")).toBeNull();
    expect(
      [...lectureSection.querySelectorAll(".class-option")].map((row) => ({
        time: row.querySelector(".class-option-time strong").textContent,
        day: row.querySelector(".class-option-time > span").textContent,
      })),
    ).toEqual([
      { time: "14:00–16:00", day: "Monday" },
      { time: "17:45–19:15", day: "Wednesday" },
    ]);
    expect(
      [...practiceSection.querySelectorAll(".class-option")].map((row) => ({
        time: row.querySelector(".class-option-time strong").textContent,
        day: row.querySelector(".class-option-time > span").textContent,
      })),
    ).toEqual([
      { time: "08:00–10:00", day: "Tuesday" },
      { time: "12:00–14:00", day: "Tuesday" },
      { time: "15:00–18:00", day: "Friday" },
    ]);
  });

  it("shows only the three best code and name suggestions", async () => {
    fetchSubjectClasses.mockImplementation((_query, mode) =>
      Promise.resolve(
        mode === "name"
          ? [
              subjectClass("CS-301-1", "Algorithms"),
              subjectClass("MATH-201-1", "Applied Algorithms"),
              subjectClass("HIST-1-1", "History of Algorithms"),
            ]
          : [subjectClass("ALG-101-1", "Algorithm Engineering")],
      ),
    );
    render(ScheduleInput);

    const input = screen.getByLabelText(
      "Subject code, course name, or professor",
    );
    await fireEvent.input(input, { target: { value: "alg" } });

    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toContain("Algorithm Engineering");
    expect(options[1].textContent).toContain("Algorithms");
    expect(options[2].textContent).toContain("Applied Algorithms");
    expect(
      options.every((option) => !option.textContent.includes("time")),
    ).toBe(true);
    expect(
      options.every((option) => option.querySelector("svg") === null),
    ).toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0].id);
    expect(options[0].getAttribute("aria-selected")).toBe("true");
  });

  it("selects the top-ranked suggestion with Enter", async () => {
    fetchSubjectClasses.mockImplementation((_query, mode) =>
      Promise.resolve(
        mode === "name"
          ? [subjectClass("CS-301-1", "Algorithms")]
          : [subjectClass("ALG-101-1", "Algorithm Engineering")],
      ),
    );
    render(ScheduleInput);

    const input = screen.getByLabelText(
      "Subject code, course name, or professor",
    );
    await fireEvent.input(input, { target: { value: "alg" } });
    await screen.findAllByRole("option");
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(input.value).toBe("ALG-101");
    expect(
      screen.getByRole("heading", { name: "Algorithm Engineering" }),
    ).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("supports arrow-key selection and Escape", async () => {
    fetchSubjectClasses.mockImplementation((_query, mode) =>
      Promise.resolve(
        mode === "name"
          ? [subjectClass("CS-301-1", "Algorithms")]
          : [subjectClass("ALG-101-1", "Algorithm Engineering")],
      ),
    );
    render(ScheduleInput);

    const input = screen.getByLabelText(
      "Subject code, course name, or professor",
    );
    await fireEvent.input(input, { target: { value: "alg" } });
    const options = await screen.findAllByRole("option");
    await fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(input.getAttribute("aria-activedescendant")).toBe(options[1].id);
    expect(options[1].getAttribute("aria-selected")).toBe("true");

    await fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input.value).toBe("alg");
  });

  it("shows an empty search error and does not update the schedule", async () => {
    const onScheduleUpdate = vi.fn();
    fetchSubjectClasses.mockRejectedValue(new Error("offline"));
    render(ScheduleInput, { onScheduleUpdate });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      {
        target: { value: "IK-FAIL" },
      },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(await screen.findByText(/No classes found/)).toBeTruthy();
    expect(onScheduleUpdate).not.toHaveBeenCalled();
  });

  it("keeps successful search results when another subject is empty", async () => {
    const onScheduleUpdate = vi.fn();
    fetchSubjectClasses
      .mockResolvedValueOnce([demoClass])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    render(ScheduleInput, { onScheduleUpdate });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      {
        target: { value: "DEMO-1 IK-EMPTY" },
      },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      await screen.findByText(/No usable classes found for: IK-EMPTY/),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add all groups" })).toBeTruthy();
    expect(onScheduleUpdate).not.toHaveBeenCalled();
  });

  it("loads codes from an uploaded registered subjects file", async () => {
    const onScheduleUpdate = vi.fn();
    fetchSubjectClasses.mockResolvedValue([demoClass]);
    readRegisteredSubjectCodes.mockResolvedValue(["DEMO-1"]);
    const { container } = render(ScheduleInput, { onScheduleUpdate });

    const fileInput = container.querySelector('input[type="file"]');
    await fireEvent.change(fileInput, {
      target: { files: [new File([""], "registered-subjects.xlsx")] },
    });

    await waitFor(() => expect(onScheduleUpdate).toHaveBeenCalledOnce());
    expect(readRegisteredSubjectCodes).toHaveBeenCalledOnce();
    expect(fetchSubjectClasses).toHaveBeenCalledWith("DEMO-1");
    expect(onScheduleUpdate.mock.calls[0][0]).toEqual([
      expect.objectContaining({ enabled: true }),
    ]);
  });

  it("imports all Neptun alternatives but selects only one group per section", async () => {
    const onScheduleUpdate = vi.fn();
    readRegisteredSubjectCodes.mockResolvedValue(["REAL-E", "REAL-G"]);
    fetchSubjectClasses.mockImplementation((code) =>
      Promise.resolve(
        code === "REAL-E"
          ? [
              subjectClass("REAL-E-1", "Real subject L.", "Monday 10:00-12:00"),
              subjectClass(
                "REAL-E-2",
                "Real subject L.",
                "Tuesday 10:00-12:00",
              ),
            ].map((row) => ({ ...row, type: "lecture" }))
          : [
              subjectClass(
                "REAL-G-1",
                "Real subject Pr.",
                "Wednesday 12:00-14:00",
              ),
              subjectClass(
                "REAL-G-2",
                "Real subject Pr.",
                "Thursday 12:00-14:00",
              ),
            ].map((row) => ({ ...row, type: "practice" })),
      ),
    );
    const { container } = render(ScheduleInput, { onScheduleUpdate });

    await fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [new File([""], "Registered subjects.xlsx")] },
    });

    await waitFor(() => expect(onScheduleUpdate).toHaveBeenCalledOnce());
    const importedEvents = onScheduleUpdate.mock.calls[0][0];
    expect(importedEvents).toHaveLength(4);
    expect(
      importedEvents
        .filter((event) => event.enabled)
        .map((event) => event.code),
    ).toEqual(["REAL-E-1", "REAL-G-1"]);
  });

  it("explains when an uploaded file has no codes", async () => {
    const onScheduleUpdate = vi.fn();
    readRegisteredSubjectCodes.mockResolvedValue([]);
    const { container } = render(ScheduleInput, { onScheduleUpdate });

    const fileInput = container.querySelector('input[type="file"]');
    await fireEvent.change(fileInput, {
      target: { files: [new File([""], "registered-subjects.xlsx")] },
    });

    expect(await screen.findByText(/No subject codes found/)).toBeTruthy();
    expect(fetchSubjectClasses).not.toHaveBeenCalled();
    expect(onScheduleUpdate).not.toHaveBeenCalled();
  });

  it("explains when an uploaded file cannot be read", async () => {
    const onScheduleUpdate = vi.fn();
    readRegisteredSubjectCodes.mockRejectedValue(new Error("bad zip"));
    const { container } = render(ScheduleInput, { onScheduleUpdate });

    const fileInput = container.querySelector('input[type="file"]');
    await fireEvent.change(fileInput, {
      target: { files: [new File([""], "corrupted.xlsx")] },
    });

    expect(await screen.findByText(/Could not read that file/)).toBeTruthy();
    expect(fetchSubjectClasses).not.toHaveBeenCalled();
    expect(onScheduleUpdate).not.toHaveBeenCalled();
  });

  it("keeps results open so more than one class can be selected", async () => {
    const onClassSelection = vi.fn();
    const practice = {
      ...demoClass,
      time: "Wednesday 14:00-15:30",
      code: "DEMO-1-2",
      type: "practice",
    };
    fetchSubjectClasses.mockResolvedValue([demoClass, practice]);
    render(ScheduleInput, { onClassSelection });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      {
        target: { value: "DEMO-1" },
      },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));
    const chooseButtons = await screen.findAllByRole("radio", {
      name: /Select class: Introduction/,
    });
    await fireEvent.click(chooseButtons[0]);

    expect(onClassSelection).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ enabled: false })]),
      expect.objectContaining({
        code: "DEMO-1-1",
        dayOfWeek: "Monday",
        startTime: "10:00",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Introduction to Web Development" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Practices" })).toBeTruthy();

    await fireEvent.click(chooseButtons[1]);
    expect(onClassSelection).toHaveBeenCalledTimes(2);
    expect(onClassSelection).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({
        code: "DEMO-1-2",
        dayOfWeek: "Wednesday",
        startTime: "14:00",
      }),
    );
    expect(
      screen.getByText(/Select another class or close the results/),
    ).toBeTruthy();
  });

  it("uses the full class row as an accessible selected or conflict control", async () => {
    const selectedLecture = {
      title: "Introduction to Web Development (lecture)",
      code: "DEMO-1-1",
      dayOfWeek: "Monday",
      startTime: "10:00",
      endTime: "11:30",
      extendedProps: { type: "lecture" },
      enabled: true,
    };
    const conflictingPractice = {
      ...demoClass,
      time: "Monday 10:30-12:00",
      code: "DEMO-1-2",
      type: "practice",
    };
    fetchSubjectClasses.mockResolvedValue([demoClass, conflictingPractice]);
    render(ScheduleInput, { selectedEvents: [selectedLecture] });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "DEMO-1" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    const selectedRow = await screen.findByRole("radio", {
      name: /Selected class: Introduction.*Monday 10:00/,
    });
    const conflictRow = screen.getByRole("radio", {
      name: /Select class: Introduction.*Conflicts with Introduction to Web Development, Monday 10:00/,
    });

    expect(selectedRow.checked).toBe(true);
    expect(selectedRow.closest(".class-option").classList).toContain(
      "is-selected",
    );
    expect(conflictRow.checked).toBe(false);
    expect(conflictRow.closest(".class-option").classList).toContain(
      "has-conflict",
    );
    expect(screen.getByText("Selected")).toBeTruthy();
    expect(screen.getByText("Conflicts")).toBeTruthy();
    expect(
      screen.getByText(
        "Conflicts with Introduction to Web Development · Monday 10:00–11:30",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Choose class")).toBeNull();
  });

  it("does not show a same-time lecture as selected when only the practice is enabled", async () => {
    const lecture = {
      ...demoClass,
      code: "SHARED-1",
      type: "lecture",
    };
    const practice = {
      ...demoClass,
      code: "SHARED-1",
      type: "practice",
    };
    fetchSubjectClasses.mockResolvedValue([lecture, practice]);
    render(ScheduleInput, {
      selectedEvents: [
        {
          title: "Introduction to Web Development (practice)",
          code: "SHARED-1",
          dayOfWeek: "Monday",
          startTime: "10:00",
          endTime: "11:30",
          extendedProps: { type: "practice" },
          enabled: true,
        },
      ],
    });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "SHARED-1" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      (
        await screen.findByRole("radio", {
          name: /Select class: Introduction.*lecture/i,
        })
      ).checked,
    ).toBe(false);
    expect(
      screen.getByRole("radio", {
        name: /Selected class: Introduction.*practice/i,
      }).checked,
    ).toBe(true);
  });

  it("marks only the selected instructor when duplicate rows share a code and time", async () => {
    const first = {
      ...demoClass,
      code: "ESST116-1",
      type: "practice",
      time: "Thursday 16:00-18:00",
      location: "LÉ 2.84",
      instructor: "Szeitl Blanka Veronika",
    };
    const second = {
      ...first,
      instructor: "Németh Renáta Dr.",
    };
    fetchSubjectClasses.mockResolvedValue([first, second]);
    render(ScheduleInput, {
      selectedEvents: [
        {
          title: `${first.title} (practice)`,
          code: first.code,
          description: `${first.code}\nInstructor: ${first.instructor}`,
          dayOfWeek: "Thursday",
          startTime: "16:00",
          endTime: "18:00",
          extendedProps: {
            type: "practice",
            location: first.location,
            instructor: first.instructor,
          },
          enabled: true,
        },
      ],
    });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "ESST116" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));

    expect(
      await screen.findAllByRole("radio", { name: /Selected class:/ }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("radio", { name: /Select class:/ }),
    ).toHaveLength(1);
  });

  it("reasserts an exact row choice when old state marked duplicate instructors", async () => {
    const onClassSelection = vi.fn();
    const first = {
      ...demoClass,
      code: "ESST116-1",
      type: "practice",
      time: "Thursday 16:00-18:00",
      location: "LÉ 2.84",
      instructor: "Szeitl Blanka Veronika",
    };
    const second = { ...first, instructor: "Németh Renáta Dr." };
    const selectedEvents = [first, second].map((row) => ({
      title: `${row.title} (practice)`,
      code: row.code,
      description: `${row.code}\nInstructor: ${row.instructor}`,
      dayOfWeek: "Thursday",
      startTime: "16:00",
      endTime: "18:00",
      extendedProps: {
        type: row.type,
        location: row.location,
        instructor: row.instructor,
      },
      enabled: true,
    }));
    fetchSubjectClasses.mockResolvedValue([first, second]);
    render(ScheduleInput, { selectedEvents, onClassSelection });

    await fireEvent.input(
      screen.getByLabelText("Subject code, course name, or professor"),
      { target: { value: "ESST116" } },
    );
    await fireEvent.click(screen.getByRole("button", { name: "Find courses" }));
    const selectedRows = await screen.findAllByRole("radio", {
      name: /Selected class:/,
    });
    await fireEvent.click(selectedRows[0]);

    expect(onClassSelection).toHaveBeenCalledOnce();
    expect(onClassSelection.mock.calls[0][1]).toMatchObject({
      code: "ESST116-1",
      instructor: "Szeitl Blanka Veronika",
    });
  });
});
