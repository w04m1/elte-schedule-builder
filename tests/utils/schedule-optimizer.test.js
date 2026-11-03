import { describe, expect, it } from "vitest";
import {
  applyScheduleSuggestion,
  findScheduleSuggestions,
} from "../../src/utils/scheduleOptimizer.js";
import {
  getConflictPairs,
  getEventTypeClass,
} from "../../src/utils/schedule.js";
import { getEnabledEvents } from "../../src/utils/scheduleState.js";

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

function makeSubject(title, events, { enabled = true } = {}) {
  return { title, code: "SUBJ", events, enabled };
}

const lectureA = makeEvent({
  code: "SUBJ-1",
  extendedProps: { type: "lecture" },
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
});
const lectureB = makeEvent({
  code: "SUBJ-2",
  extendedProps: { type: "lecture" },
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
});
const practiceA = makeEvent({
  code: "SUBJ-1",
  extendedProps: { type: "practice" },
  dayOfWeek: "Tuesday",
  startTime: "12:00",
  endTime: "13:30",
});
const practiceB = makeEvent({
  code: "SUBJ-2",
  extendedProps: { type: "practice" },
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:30",
});

describe("getEventTypeClass", () => {
  it("normalizes raw event types into categories", () => {
    expect(getEventTypeClass("Lecture")).toBe("lecture");
    expect(getEventTypeClass("practice")).toBe("practice");
    expect(getEventTypeClass("seminar")).toBe("practice");
    expect(getEventTypeClass("classroom reservation")).toBe("practice");
    expect(getEventTypeClass(undefined)).toBe("practice");
    expect(getEventTypeClass("")).toBe("practice");
  });
});

describe("findScheduleSuggestions", () => {
  it("returns an empty list when no enabled subjects exist", () => {
    expect(findScheduleSuggestions([])).toEqual([]);
    expect(
      findScheduleSuggestions([
        makeSubject("Off", [lectureA], { enabled: false }),
      ]),
    ).toEqual([]);
  });

  it("ranks the current conflict-free selection first", () => {
    const subjects = [
      makeSubject("Subject", [
        { ...lectureA, enabled: true },
        { ...practiceA, enabled: true },
        lectureB,
        practiceB,
      ]),
    ];

    const suggestions = findScheduleSuggestions(subjects);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].conflicts).toBe(0);
    expect(suggestions[0].changedGroups).toBe(0);
    expect(suggestions[0].groups.map((group) => group.code)).toEqual([
      "SUBJ-1",
      "SUBJ-1",
    ]);
  });

  it("ranks current groups first even when they are not first in source data", () => {
    const subjects = [
      makeSubject("Subject", [
        lectureB,
        practiceB,
        { ...lectureA, enabled: true },
        { ...practiceA, enabled: true },
      ]),
    ];

    const suggestions = findScheduleSuggestions(subjects);

    expect(suggestions[0].conflicts).toBe(0);
    expect(suggestions[0].changedGroups).toBe(0);
    expect(suggestions[0].changes).toEqual([]);
    expect(suggestions[0].groups.map((group) => group.code)).toEqual([
      "SUBJ-1",
      "SUBJ-1",
    ]);
  });

  it("treats duplicate codes taught by different instructors as separate choices", () => {
    const first = makeEvent({
      code: "ESST116-1",
      enabled: true,
      extendedProps: {
        type: "practice",
        instructor: "Szeitl Blanka Veronika",
      },
    });
    const second = makeEvent({
      code: "ESST116-1",
      enabled: false,
      extendedProps: {
        type: "practice",
        instructor: "Németh Renáta Dr.",
      },
    });

    const suggestions = findScheduleSuggestions([
      makeSubject("Academic skills", [first, second]),
    ]);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].changedGroups).toBe(0);
    expect(suggestions[0].groups[0].events).toHaveLength(1);
    expect(suggestions[1].groups[0].events).toHaveLength(1);
  });

  it("prefers conflict-free combinations that swap fewer groups", () => {
    // lectureA and practiceB overlap (both Monday 10:00), so the current
    // selection conflicts; swapping either group resolves it.
    const subjects = [
      makeSubject("Subject", [
        { ...lectureA, enabled: true },
        { ...practiceB, enabled: true },
        lectureB,
        practiceA,
      ]),
    ];

    const suggestions = findScheduleSuggestions(subjects);

    expect(suggestions[0].conflicts).toBe(0);
    expect(suggestions[0].changedGroups).toBe(1);
    expect(suggestions[0].groups.map((group) => group.code).sort()).toEqual([
      "SUBJ-1",
      "SUBJ-1",
    ]);
    expect(suggestions[0].changes).toHaveLength(1);
    expect(suggestions[0].changes[0]).toMatchObject({
      subjectTitle: "Subject",
      from: expect.objectContaining({ key: expect.any(String) }),
      to: expect.objectContaining({ key: expect.any(String) }),
    });
    expect(suggestions[0].changes[0].from.key).not.toBe(
      suggestions[0].changes[0].to.key,
    );
  });

  it("does not stop before finding a later solution with fewer replacements", () => {
    const anchorMeetings = ["Monday", "Tuesday", "Wednesday"].map((dayOfWeek) =>
      makeEvent({
        code: "ANCHOR-1",
        dayOfWeek,
        enabled: true,
        extendedProps: { type: "lecture", instructor: "Anchor" },
      }),
    );
    const anchorAlternative = makeEvent({
      code: "ANCHOR-2",
      dayOfWeek: "Friday",
      startTime: "18:00",
      endTime: "19:00",
      extendedProps: { type: "lecture", instructor: "Anchor" },
    });
    const subjects = [
      makeSubject("Anchor", [...anchorMeetings, anchorAlternative]),
      ...["Monday", "Tuesday", "Wednesday"].map((dayOfWeek, index) =>
        makeSubject(`Choice ${index + 1}`, [
          makeEvent({
            code: `CHOICE-${index + 1}-CURRENT`,
            dayOfWeek,
            enabled: true,
            extendedProps: { type: "lecture" },
          }),
          makeEvent({
            code: `CHOICE-${index + 1}-A`,
            dayOfWeek: "Thursday",
            startTime: `${8 + index * 2}:00`,
            endTime: `${9 + index * 2}:00`,
            extendedProps: { type: "lecture" },
          }),
          makeEvent({
            code: `CHOICE-${index + 1}-B`,
            dayOfWeek: "Friday",
            startTime: `${8 + index * 2}:00`,
            endTime: `${9 + index * 2}:00`,
            extendedProps: { type: "lecture" },
          }),
        ]),
      ),
    ];

    const suggestions = findScheduleSuggestions(subjects, {
      maxSuggestions: 5,
    });

    expect(suggestions[0].conflicts).toBe(0);
    expect(suggestions[0].changedGroups).toBe(1);
    expect(suggestions[0].changes[0]).toMatchObject({
      subjectTitle: "Anchor",
      from: { code: "ANCHOR-1" },
      to: { code: "ANCHOR-2" },
    });
  });

  it("treats every non-lecture class as one practice choice", () => {
    const subjects = [
      makeSubject("Subject", [
        makeEvent({
          code: "SUBJ-ROOM",
          enabled: true,
          extendedProps: { type: "classroom reservation" },
        }),
        makeEvent({
          code: "SUBJ-PRACTICE",
          dayOfWeek: "Tuesday",
          extendedProps: { type: "practice" },
        }),
      ]),
    ];

    const suggestions = findScheduleSuggestions(subjects);

    expect(suggestions).toHaveLength(2);
    expect(
      suggestions.every((suggestion) => suggestion.groups.length === 1),
    ).toBe(true);
    expect(
      suggestions.every(
        (suggestion) => suggestion.groups[0].typeClass === "practice",
      ),
    ).toBe(true);
  });

  it("reports replacements when multiple groups in one section are enabled", () => {
    const subjects = [
      makeSubject("Subject", [
        { ...lectureA, enabled: true },
        {
          ...lectureB,
          enabled: true,
          dayOfWeek: "Wednesday",
          startTime: "14:00",
          endTime: "15:30",
        },
      ]),
    ];

    const suggestions = findScheduleSuggestions(subjects);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].changedGroups).toBe(1);
    expect(suggestions[0].changes).toHaveLength(1);
    expect(suggestions[1].changedGroups).toBe(1);
  });

  it("does not multiply conflicts for duplicate Tanrend rows", () => {
    const duplicate = {
      ...lectureA,
      enabled: false,
      extendedProps: {
        type: "lecture",
        instructor: "Same instructor",
        location: "Same room",
      },
    };
    const overlapping = makeEvent({
      code: "OTHER-1",
      enabled: true,
      extendedProps: { type: "lecture" },
    });

    const subjects = [
      makeSubject("Duplicated", [duplicate, { ...duplicate, enabled: true }]),
      makeSubject("Other", [overlapping]),
    ];
    const [suggestion] = findScheduleSuggestions(subjects);

    expect(suggestion.conflicts).toBe(1);
    expect(suggestion.changedGroups).toBe(0);
    expect(suggestion.groups[0].events).toHaveLength(1);
    expect(
      applyScheduleSuggestion(subjects, suggestion)[0].events.filter(
        (event) => event.enabled,
      ),
    ).toHaveLength(1);
  });

  it("reports the same conflict count that applying a suggestion produces", () => {
    const subjects = [
      makeSubject("Multi-meeting group", [
        makeEvent({
          code: "MULTI-1",
          enabled: true,
          dayOfWeek: "Monday",
          startTime: "10:00",
          endTime: "12:00",
          extendedProps: { type: "lecture", instructor: "Same instructor" },
        }),
        makeEvent({
          code: "MULTI-1",
          enabled: true,
          dayOfWeek: "Monday",
          startTime: "11:00",
          endTime: "13:00",
          extendedProps: { type: "lecture", instructor: "Same instructor" },
        }),
      ]),
    ];

    const [suggestion] = findScheduleSuggestions(subjects);
    const applied = applyScheduleSuggestion(subjects, suggestion);
    const actualConflicts = getConflictPairs(getEnabledEvents(applied)).length;

    expect(suggestion.conflicts).toBe(actualConflicts);
    expect(actualConflicts).toBe(1);
  });

  it("describes the exact current and proposed group in each replacement", () => {
    const alternative = makeEvent({
      code: "SUBJ-2",
      extendedProps: { type: "lecture" },
      dayOfWeek: "Wednesday",
      startTime: "14:00",
      endTime: "15:30",
    });
    const subjects = [
      makeSubject("Subject", [{ ...lectureA, enabled: true }, alternative]),
    ];

    const suggestions = findScheduleSuggestions(subjects);
    const replacement = suggestions.find(
      (suggestion) => suggestion.changedGroups === 1,
    ).changes[0];

    expect(replacement).toMatchObject({
      subjectTitle: "Subject",
      typeClass: "lecture",
      from: { code: "SUBJ-1" },
      to: { code: "SUBJ-2" },
    });
  });

  it("reports unavoidable conflicts when every combination overlaps", () => {
    const otherLecture = makeEvent({
      code: "OTHER-1",
      extendedProps: { type: "lecture" },
      dayOfWeek: "Monday",
      startTime: "10:00",
      endTime: "11:30",
    });

    const subjects = [
      makeSubject("First", [lectureA, lectureB]),
      makeSubject("Second", [otherLecture]),
    ];

    const suggestions = findScheduleSuggestions(subjects);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].conflicts).toBe(1);
    expect(suggestions[0].conflicts).toBeLessThanOrEqual(
      suggestions[1].conflicts,
    );
  });

  it("ignores lecture overlaps when the lecture exemption is on", () => {
    const otherLecture = makeEvent({
      code: "OTHER-1",
      extendedProps: { type: "lecture" },
      dayOfWeek: "Monday",
      startTime: "10:00",
      endTime: "11:30",
    });
    const subjects = [
      makeSubject("First", [lectureA]),
      makeSubject("Second", [otherLecture]),
    ];

    const [suggestion] = findScheduleSuggestions(subjects, {
      lectureExemption: true,
    });

    expect(suggestion.conflicts).toBe(0);
  });

  it("respects the suggestion limit", () => {
    const subjects = [
      makeSubject("Subject", [lectureA, practiceA, lectureB, practiceB]),
    ];

    const suggestions = findScheduleSuggestions(subjects, {
      maxSuggestions: 2,
    });

    expect(suggestions).toHaveLength(2);
  });

  it("still returns the best combinations found when the search is capped", () => {
    const subjects = [
      makeSubject("Subject", [lectureA, practiceA, lectureB, practiceB]),
    ];

    const suggestions = findScheduleSuggestions(subjects, {
      maxNodes: 3,
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(4);
  });

  it("treats a subject with a single group as a forced choice", () => {
    const subjects = [makeSubject("Subject", [lectureA, practiceA])];

    const suggestions = findScheduleSuggestions(subjects);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].conflicts).toBe(0);
    expect(suggestions[0].groups).toHaveLength(2);
  });

  it("does not count changes for variables without an enabled group", () => {
    const subjects = [makeSubject("Subject", [lectureA, practiceA])];

    const [suggestion] = findScheduleSuggestions(subjects);

    expect(suggestion.changedGroups).toBe(0);
  });
});

describe("applyScheduleSuggestion", () => {
  it("enables exactly the selected groups and updates the subject flag", () => {
    const subjects = [
      makeSubject("Subject", [
        { ...lectureA, enabled: true },
        practiceA,
        { ...lectureB, enabled: false },
        practiceB,
      ]),
    ];
    const [suggestion] = findScheduleSuggestions(subjects);

    const updated = applyScheduleSuggestion(subjects, suggestion);

    const enabledCodes = updated[0].events
      .filter((event) => event.enabled)
      .map((event) => `${event.code}:${event.extendedProps.type}`);
    expect(enabledCodes.sort()).toEqual(["SUBJ-1:lecture", "SUBJ-1:practice"]);
    expect(updated[0].enabled).toBe(true);
  });

  it("leaves disabled subjects untouched", () => {
    const untouched = makeSubject(
      "Untouched",
      [{ ...makeEvent({ code: "KEEP-1" }), enabled: true }],
      { enabled: false },
    );
    const subjects = [makeSubject("Subject", [lectureA, practiceA]), untouched];
    const [suggestion] = findScheduleSuggestions(subjects);

    const updated = applyScheduleSuggestion(subjects, suggestion);

    expect(updated[1]).toBe(untouched);
  });

  it("handles a missing suggestion gracefully", () => {
    const subjects = [makeSubject("Subject", [lectureA])];

    expect(applyScheduleSuggestion(subjects, undefined)).toEqual(subjects);
  });
});

// Explicit weekly fixtures: alternatives share time, never identity.
function pickerEvent(code, type, instructor, overrides = {}) {
  return makeEvent({
    code,
    dayOfWeek: type === "lecture" ? "Monday" : "Tuesday",
    startTime: type === "lecture" ? "10:00" : "12:00",
    endTime: type === "lecture" ? "11:00" : "13:00",
    extendedProps: { type, instructor },
    ...overrides,
  });
}

function pickerSubjects({ sameCodes = false, sameInstructor = false } = {}) {
  return [
    makeSubject("Algorithms", [
      pickerEvent("L1", "lecture", "A"),
      pickerEvent(
        sameCodes ? "L1" : "L2",
        "lecture",
        sameInstructor ? "A" : "B",
      ),
      pickerEvent("P1", "practice", "C"),
      pickerEvent(
        sameCodes ? "P1" : "P2",
        "practice",
        sameInstructor ? "C" : "D",
      ),
    ]),
  ];
}

function chosenLabels(solution) {
  return solution.groups
    .map((group) => `${group.code}/${group.events[0].extendedProps.instructor}`)
    .sort();
}

function solutionLabels(solutions) {
  return solutions.map((solution) => chosenLabels(solution).join("+")).sort();
}

describe("optimizer acceptance matrix", () => {
  it("OPT-01 enumerates all four simultaneous lecture/practice alternatives", () => {
    const subjects = pickerSubjects();
    const before = structuredClone(subjects);
    const solutions = findScheduleSuggestions(subjects, { maxSuggestions: 4 });
    expect(solutionLabels(solutions)).toEqual([
      "L1/A+P1/C",
      "L1/A+P2/D",
      "L2/B+P1/C",
      "L2/B+P2/D",
    ]);
    for (const solution of solutions) {
      expect(solution.conflicts).toBe(0);
      expect(solution.changedGroups).toBe(0);
      expect(solution.groups.map((group) => group.typeClass).sort()).toEqual([
        "lecture",
        "practice",
      ]);
      const applied = applyScheduleSuggestion(subjects, solution);
      expect(
        applied[0].events
          .filter((event) => event.enabled)
          .map((event) => `${event.code}/${event.extendedProps.instructor}`)
          .sort(),
      ).toEqual(chosenLabels(solution));
    }
    expect(subjects).toEqual(before);
  });

  it("OPT-02 keeps same-code instructors distinct through application", () => {
    const subjects = pickerSubjects({ sameCodes: true });
    const solutions = findScheduleSuggestions(subjects, { maxSuggestions: 4 });
    expect(solutionLabels(solutions)).toEqual([
      "L1/A+P1/C",
      "L1/A+P1/D",
      "L1/B+P1/C",
      "L1/B+P1/D",
    ]);
    for (const solution of solutions) {
      expect(
        applyScheduleSuggestion(subjects, solution)[0]
          .events.filter((event) => event.enabled)
          .map((event) => `${event.code}/${event.extendedProps.instructor}`)
          .sort(),
      ).toEqual(chosenLabels(solution));
    }
  });

  it("OPT-03 retains different codes with the same instructor and time", () => {
    expect(
      solutionLabels(
        findScheduleSuggestions(pickerSubjects({ sameInstructor: true })),
      ),
    ).toEqual(["L1/A+P1/C", "L1/A+P2/C", "L2/A+P1/C", "L2/A+P2/C"]);
  });

  it("OPT-04 scopes identical codes and instructors to their subject", () => {
    const event = pickerEvent("L1", "lecture", "A");
    const subjects = [
      makeSubject("First", [event]),
      makeSubject("Second", [{ ...event }]),
    ];
    const [solution] = findScheduleSuggestions(subjects);
    expect(solution.groups.map((group) => group.subjectTitle)).toEqual([
      "First",
      "Second",
    ]);
    expect(solution.conflicts).toBe(1);
    expect(
      applyScheduleSuggestion(subjects, solution).map(
        (subject) => subject.events[0].enabled,
      ),
    ).toEqual([true, true]);
  });

  it("OPT-05/06 selects every meeting, removes exact duplicates, and counts the later conflict", () => {
    const monday = pickerEvent("L1", "lecture", "A");
    const subjects = [
      makeSubject("Multi", [
        monday,
        { ...monday },
        { ...monday, dayOfWeek: "Wednesday" },
        pickerEvent("L2", "lecture", "B", { dayOfWeek: "Tuesday" }),
        pickerEvent("L2", "lecture", "B", { dayOfWeek: "Thursday" }),
      ]),
      makeSubject("Anchor", [
        pickerEvent("X", "practice", "X", {
          dayOfWeek: "Wednesday",
          startTime: "10:00",
          endTime: "11:00",
        }),
      ]),
    ];
    const solutions = findScheduleSuggestions(subjects);
    expect(solutions.map((solution) => solution.conflicts)).toEqual([0, 1]);
    for (const solution of solutions) {
      const group = solution.groups.find(
        (entry) => entry.subjectTitle === "Multi",
      );
      expect(group.events).toHaveLength(2);
      const applied = applyScheduleSuggestion(subjects, solution);
      expect(
        applied[0].events
          .filter((event) => event.enabled)
          .map((event) => event.dayOfWeek),
      ).toEqual(
        group.code === "L1" ? ["Monday", "Wednesday"] : ["Tuesday", "Thursday"],
      );
      expect(getConflictPairs(getEnabledEvents(applied)).length).toBe(
        solution.conflicts,
      );
    }
  });

  it.each([false, true])(
    "OPT-07/09 keeps one group per type with lecture exemption %s",
    (lectureExemption) => {
      const subjects = pickerSubjects();
      subjects[0].events = subjects[0].events.map((event) => ({
        ...event,
        dayOfWeek: "Monday",
        startTime: "10:00",
        endTime: "11:00",
      }));
      const solutions = findScheduleSuggestions(subjects, { lectureExemption });
      expect(solutions).toHaveLength(4);
      for (const solution of solutions) {
        expect(solution.groups).toHaveLength(2);
        expect(solution.conflicts).toBe(lectureExemption ? 0 : 1);
        expect(
          getEnabledEvents(applyScheduleSuggestion(subjects, solution)),
        ).toHaveLength(2);
      }
    },
  );

  it("OPT-08 excludes unchosen conflicts and swaps to the conflict-free alternative", () => {
    const subjects = [
      makeSubject("Choice", [
        pickerEvent("L1", "lecture", "A", { enabled: true }),
        pickerEvent("L2", "lecture", "B", { dayOfWeek: "Wednesday" }),
      ]),
      makeSubject("Anchor", [
        pickerEvent("X", "lecture", "X", { enabled: true }),
      ]),
    ];
    const solutions = findScheduleSuggestions(subjects);
    expect(
      solutions.map((solution) => [solution.conflicts, solution.changedGroups]),
    ).toEqual([
      [0, 1],
      [1, 0],
    ]);
    expect(
      solutions[0].groups.find((group) => group.subjectTitle === "Choice").code,
    ).toBe("L2");
  });

  it.each([
    ["adjacent", "Monday", "11:00", "12:00", 0],
    ["different weekday", "Tuesday", "10:00", "11:00", 0],
    ["partial overlap", "Monday", "10:30", "11:30", 1],
  ])(
    "OPT-10 handles %s in the weekly scheduling model",
    (_name, dayOfWeek, startTime, endTime, conflicts) => {
      const subjects = [
        makeSubject("First", [pickerEvent("L1", "lecture", "A")]),
        makeSubject("Second", [
          pickerEvent("P1", "practice", "B", { dayOfWeek, startTime, endTime }),
        ]),
      ];
      expect(findScheduleSuggestions(subjects)[0].conflicts).toBe(conflicts);
    },
  );

  it.each(["lecture", "practice"])(
    "OPT-11 handles a forced %s without inventing another type",
    (type) => {
      const hidden = makeSubject(
        "Hidden",
        [pickerEvent("H", "lecture", "H", { enabled: true })],
        { enabled: false },
      );
      const subjects = [
        makeSubject("Only", [pickerEvent("ONE", type, "A")]),
        hidden,
      ];
      const [solution] = findScheduleSuggestions(subjects);
      expect(solution.groups).toHaveLength(1);
      expect(solution.groups[0].typeClass).toBe(type);
      expect(applyScheduleSuggestion(subjects, solution)[1]).toBe(hidden);
      expect(findScheduleSuggestions([])).toEqual([]);
    },
  );

  it("OPT-12 removes multiple active alternatives without mutating the input", () => {
    const subjects = pickerSubjects();
    subjects[0].events.forEach((event) => {
      event.enabled = true;
    });
    const before = structuredClone(subjects);
    for (const solution of findScheduleSuggestions(subjects)) {
      expect(solution.changedGroups).toBe(2);
      const applied = applyScheduleSuggestion(subjects, solution);
      expect(getEnabledEvents(applied)).toHaveLength(2);
      expect(getConflictPairs(getEnabledEvents(applied)).length).toBe(
        solution.conflicts,
      );
    }
    expect(subjects).toEqual(before);
  });

  it("OPT-13 preserves the full solution set after input permutation and repeat calculation", () => {
    const subjects = pickerSubjects();
    subjects[0].events[1].enabled = true;
    subjects[0].events[2].enabled = true;
    const original = findScheduleSuggestions(subjects);
    const reversed = findScheduleSuggestions([
      { ...subjects[0], events: [...subjects[0].events].reverse() },
    ]);
    expect(solutionLabels(reversed)).toEqual(solutionLabels(original));
    expect(findScheduleSuggestions(subjects)).toEqual(original);
    expect(chosenLabels(original[0])).toEqual(["L2/B", "P1/C"]);
    expect(chosenLabels(reversed[0])).toEqual(["L2/B", "P1/C"]);
    expect(original.map((solution) => solution.changedGroups)).toEqual([
      0, 1, 1, 2,
    ]);
  });

  it.each([1, 2, 5])(
    "OPT-14 respects maxSuggestions=%s and returns valid partial-search choices",
    (maxSuggestions) => {
      const subjects = pickerSubjects();
      expect(
        findScheduleSuggestions(subjects, { maxSuggestions }),
      ).toHaveLength(Math.min(maxSuggestions, 4));
      const partial = findScheduleSuggestions(subjects, {
        maxSuggestions,
        maxNodes: 3,
      });
      expect(partial).toHaveLength(1);
      expect(solutionLabels(findScheduleSuggestions(subjects))).toContain(
        solutionLabels(partial)[0],
      );
      expect(
        getEnabledEvents(applyScheduleSuggestion(subjects, partial[0])),
      ).toHaveLength(2);
    },
  );

  it("OPT-15 documents the current shared non-lecture choice for practice and laboratory", () => {
    const subjects = [
      makeSubject("Subject", [
        pickerEvent("P1", "practice", "A"),
        pickerEvent("LAB1", "laboratory", "B"),
      ]),
    ];
    const solutions = findScheduleSuggestions(subjects);
    expect(solutions).toHaveLength(2);
    expect(solutions.map((solution) => solution.groups.length)).toEqual([1, 1]);
    expect(solutions.map((solution) => solution.groups[0].typeClass)).toEqual([
      "practice",
      "practice",
    ]);
  });

  it("matches an independent exhaustive table for all combinations and top-k scores", () => {
    // Hand-authored conflict table, independent of production overlap/grouping/DFS:
    // L1 conflicts with P1; P2 conflicts with X; every other pair is disjoint.
    const subjects = [
      makeSubject("Choice", [
        pickerEvent("L1", "lecture", "A", { enabled: true }),
        pickerEvent("L2", "lecture", "B", { dayOfWeek: "Wednesday" }),
        pickerEvent("P1", "practice", "C", {
          dayOfWeek: "Monday",
          startTime: "10:00",
          endTime: "11:00",
          enabled: true,
        }),
        pickerEvent("P2", "practice", "D"),
      ]),
      makeSubject("Anchor", [
        pickerEvent("X", "practice", "X", { enabled: true }),
      ]),
    ];
    const conflictTable = { "L1/P1": 1, "L1/P2": 0, "L2/P1": 0, "L2/P2": 0 };
    const expected = ["L1", "L2"].flatMap((lecture) =>
      ["P1", "P2"].map((practice) => ({
        codes: [lecture, practice, "X"].sort().join("+"),
        conflicts:
          conflictTable[`${lecture}/${practice}`] + Number(practice === "P2"),
        changedGroups: Number(lecture !== "L1") + Number(practice !== "P1"),
      })),
    );
    const canonical = (rows) =>
      [...rows].sort((first, second) =>
        first.codes.localeCompare(second.codes),
      );
    const actual = findScheduleSuggestions(subjects, {
      maxSuggestions: 10,
    }).map((solution) => ({
      codes: solution.groups
        .map((group) => group.code)
        .sort()
        .join("+"),
      conflicts: solution.conflicts,
      changedGroups: solution.changedGroups,
    }));
    expect(canonical(actual)).toEqual(canonical(expected));
    const scores = expected
      .map((row) => [row.conflicts, row.changedGroups])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const maxSuggestions of [1, 2, 3, 4]) {
      expect(
        findScheduleSuggestions(subjects, { maxSuggestions }).map((row) => [
          row.conflicts,
          row.changedGroups,
        ]),
      ).toEqual(scores.slice(0, maxSuggestions));
    }
  });
});
