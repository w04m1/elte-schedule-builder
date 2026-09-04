import { describe, expect, it } from "vitest";
import {
  applyScheduleSuggestion,
  findScheduleSuggestions,
  getEventTypeClass,
} from "../../src/utils/scheduleOptimizer.js";
import { getConflictPairs } from "../../src/utils/schedule.js";
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
