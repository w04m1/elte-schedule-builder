import { describe, expect, it } from "vitest";
import {
  getEnabledEventCodes,
  getEnabledEvents,
  getEventIdentity,
  mergeScheduleEvents,
  normalizeSubjectTitle,
  selectScheduleClass,
  selectInitialScheduleGroups,
  setSubjectEnabled,
  toggleScheduleEvent,
} from "../../src/utils/scheduleState.js";

function event(overrides = {}) {
  return {
    title: "Algorithms (practice)",
    dayOfWeek: "Monday",
    startTime: "10:00",
    endTime: "11:30",
    description: "IK-ALG-01\nInstructor: Ada",
    extendedProps: { type: "practice" },
    enabled: true,
    ...overrides,
  };
}

describe("schedule state", () => {
  it.each([
    ["Algorithms (practice)", "Algorithms"],
    ["Algorithms P.", "Algorithms"],
    ["Algorithms Pr.", "Algorithms"],
    ["Algorithms L+Pr.", "Algorithms"],
  ])("normalizes %s", (title, expected) => {
    expect(normalizeSubjectTitle(title)).toBe(expected);
  });

  it("adds new subjects and derives unique codes", () => {
    const subjects = mergeScheduleEvents(
      [],
      [
        event(),
        event({
          dayOfWeek: "Tuesday",
          description: "IK-ALG-02\nInstructor: Grace",
          enabled: false,
        }),
      ],
    );

    expect(subjects).toEqual([
      expect.objectContaining({
        title: "Algorithms",
        code: "IK-ALG-01, IK-ALG-02",
        enabled: true,
      }),
    ]);
    expect(subjects[0].events).toHaveLength(2);
  });

  it("selects one initial lecture and practice group without duplicate meetings", () => {
    const firstLecture = event({
      title: "Algorithms L.",
      code: "ALG-E-1",
      description: "ALG-E-1\nInstructor: Ada",
      extendedProps: { type: "lecture", instructor: "Ada" },
      enabled: false,
    });
    const secondLectureMeeting = event({
      ...firstLecture,
      dayOfWeek: "Wednesday",
    });
    const duplicateLectureMeeting = { ...firstLecture };
    const alternativeLecture = event({
      title: "Algorithms L.",
      code: "ALG-E-2",
      description: "ALG-E-2\nInstructor: Grace",
      extendedProps: { type: "lecture", instructor: "Grace" },
      dayOfWeek: "Tuesday",
      enabled: false,
    });
    const firstPractice = event({
      title: "Algorithms Pr.",
      code: "ALG-G-1",
      enabled: false,
    });
    const alternativePractice = event({
      title: "Algorithms Pr.",
      code: "ALG-G-2",
      description: "ALG-G-2\nInstructor: Grace",
      extendedProps: { type: "classroom reservation" },
      dayOfWeek: "Friday",
      enabled: false,
    });

    const selected = selectInitialScheduleGroups([
      firstLecture,
      secondLectureMeeting,
      duplicateLectureMeeting,
      alternativeLecture,
      firstPractice,
      alternativePractice,
    ]);

    expect(selected.map(({ enabled }) => enabled)).toEqual([
      true,
      true,
      false,
      false,
      true,
      false,
    ]);

    const preserved = selectInitialScheduleGroups(
      [firstLecture, alternativeLecture, firstPractice],
      [{ ...alternativeLecture, enabled: true }],
    );
    expect(preserved.map(({ enabled }) => enabled)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("replaces refreshed events while preserving matching enabled state", () => {
    const existing = {
      title: "Algorithms",
      code: "IK-ALG-01",
      enabled: false,
      events: [event({ enabled: false, location: "Old room" })],
    };

    const subjects = mergeScheduleEvents(
      [existing],
      [
        event({
          description: "IK-ALG-02\nInstructor: Ada",
          location: "New room",
        }),
      ],
    );

    expect(subjects[0]).toMatchObject({
      code: "IK-ALG-01, IK-ALG-02",
      enabled: false,
      events: [{ enabled: false, location: "New room" }],
    });
    expect(existing.events[0]).toMatchObject({
      enabled: false,
      location: "Old room",
    });
  });

  it("toggles subject visibility without losing its selected groups", () => {
    const first = {
      title: "Algorithms",
      enabled: true,
      events: [event(), event({ dayOfWeek: "Tuesday", enabled: false })],
    };
    const second = { title: "Databases", enabled: true, events: [] };

    const hidden = setSubjectEnabled([first, second], "Algorithms");
    const visible = setSubjectEnabled(hidden, "Algorithms");

    expect(hidden[0].enabled).toBe(false);
    expect(hidden[0].events.map((item) => item.enabled)).toEqual([true, false]);
    expect(visible[0].enabled).toBe(true);
    expect(visible[0].events.map((item) => item.enabled)).toEqual([
      true,
      false,
    ]);
    expect(hidden[1]).toBe(second);
  });

  it("toggles one event and derives the subject enabled state", () => {
    const subjects = [
      {
        title: "Algorithms",
        enabled: true,
        events: [event({ enabled: true })],
      },
    ];

    const disabled = toggleScheduleEvent(subjects, "Algorithms", 0);
    const enabled = toggleScheduleEvent(disabled, "Algorithms", 0);

    expect(disabled[0]).toMatchObject({
      enabled: false,
      events: [{ enabled: false }],
    });
    expect(enabled[0]).toMatchObject({
      enabled: true,
      events: [{ enabled: true }],
    });
  });

  it("replaces the selected class within one type and preserves the other type", () => {
    const subjects = [
      {
        title: "Algorithms",
        enabled: true,
        events: [
          event({
            code: "IK-ALG-L1",
            enabled: true,
            extendedProps: { type: "lecture" },
          }),
          event({
            code: "IK-ALG-L2",
            dayOfWeek: "Tuesday",
            enabled: false,
            extendedProps: { type: "lecture" },
          }),
          event({ code: "IK-ALG-P1", enabled: true }),
        ],
      },
    ];

    const result = toggleScheduleEvent(subjects, "Algorithms", 1);

    expect(result[0].events.map(({ enabled }) => enabled)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("selects enabled events and their share codes", () => {
    const enabled = event();
    const disabled = event({
      description: "IK-ALG-02\nInstructor: Grace",
      enabled: false,
    });
    const subjects = [
      { title: "Algorithms", enabled: true, events: [enabled, disabled] },
    ];

    expect(getEnabledEvents(subjects)).toEqual([enabled]);
    expect(getEnabledEventCodes(subjects)).toEqual(["IK-ALG-01"]);
  });

  it("selects one class group while keeping other groups available", () => {
    const first = event({ code: "IK-ALG-01", enabled: false });
    const second = event({
      code: "IK-ALG-02",
      description: "IK-ALG-02\nInstructor: Grace",
      dayOfWeek: "Tuesday",
      enabled: false,
    });

    const subjects = selectScheduleClass([], [first, second], {
      code: "IK-ALG-02",
      dayOfWeek: "Tuesday",
      startTime: "10:00",
      type: "practice",
    });

    expect(subjects[0].events.map(({ enabled }) => enabled)).toEqual([
      false,
      true,
    ]);
    expect(subjects[0]).toMatchObject({ enabled: true, title: "Algorithms" });
  });

  it("switches the enabled class within the same class type", () => {
    const existing = {
      title: "Algorithms",
      code: "IK-ALG-01",
      enabled: true,
      events: [event({ code: "IK-ALG-01", enabled: true })],
    };
    const next = event({
      code: "IK-ALG-02",
      description: "IK-ALG-02\nInstructor: Grace",
      dayOfWeek: "Tuesday",
      enabled: false,
    });

    const subjects = selectScheduleClass(
      [existing],
      [existing.events[0], next],
      {
        code: "IK-ALG-02",
        dayOfWeek: "Tuesday",
        startTime: "10:00",
        type: "practice",
      },
    );

    expect(subjects[0].events.map(({ enabled }) => enabled)).toEqual([
      false,
      true,
    ]);
  });

  it("does not replace or enable a same-time practice when selecting a lecture", () => {
    const lecture = event({
      title: "Programming languages (lecture)",
      code: "IP-LANG-90",
      description: "IP-LANG-90\nInstructor: Ada",
      dayOfWeek: "Wednesday",
      startTime: "17:45",
      endTime: "19:15",
      extendedProps: { type: "lecture" },
      enabled: false,
    });
    const sameTimePractice = event({
      title: "Programming languages (practice)",
      code: "IP-LANG-6",
      description: "IP-LANG-6\nInstructor: Grace",
      dayOfWeek: "Wednesday",
      startTime: "17:45",
      endTime: "19:15",
      enabled: false,
    });
    const retainedPractice = event({
      title: "Programming languages (practice)",
      code: "IP-LANG-4",
      description: "IP-LANG-4\nInstructor: Linus",
      dayOfWeek: "Thursday",
      startTime: "18:00",
      endTime: "19:30",
      enabled: true,
    });
    const existing = {
      title: "Programming languages",
      code: "IP-LANG-90, IP-LANG-6, IP-LANG-4",
      enabled: true,
      events: [lecture, sameTimePractice, retainedPractice],
    };

    const [subject] = selectScheduleClass(
      [existing],
      [lecture, sameTimePractice, retainedPractice],
      {
        code: "IP-LANG-90",
        dayOfWeek: "Wednesday",
        startTime: "17:45",
        endTime: "19:15",
        type: "lecture",
      },
    );

    expect(subject.events).toHaveLength(3);
    expect(
      Object.fromEntries(
        subject.events.map((item) => [item.code, item.enabled]),
      ),
    ).toEqual({
      "IP-LANG-90": true,
      "IP-LANG-6": false,
      "IP-LANG-4": true,
    });
  });

  it("uses class type as part of selection identity", () => {
    const lecture = event({
      title: "Shared code (lecture)",
      code: "SHARED-1",
      description: "SHARED-1\nInstructor: Ada",
      extendedProps: { type: "lecture" },
      enabled: false,
    });
    const practice = event({
      title: "Shared code (practice)",
      code: "SHARED-1",
      description: "SHARED-1\nInstructor: Grace",
      enabled: false,
    });

    const [subject] = selectScheduleClass([], [lecture, practice], {
      code: "SHARED-1",
      dayOfWeek: "Monday",
      startTime: "10:00",
      endTime: "11:30",
      type: "lecture",
    });

    expect(subject.events.map(({ enabled }) => enabled)).toEqual([true, false]);
  });

  it("distinguishes duplicate class rows by instructor", () => {
    const first = event({
      code: "ESST116-1",
      description: "ESST116-1\nInstructor: Szeitl Blanka Veronika",
      dayOfWeek: "Thursday",
      startTime: "16:00",
      endTime: "18:00",
      location: "LÉ 2.84",
      extendedProps: {
        type: "practice",
        location: "LÉ 2.84",
        instructor: "Szeitl Blanka Veronika",
      },
      enabled: false,
    });
    const second = event({
      ...first,
      description: "ESST116-1\nInstructor: Németh Renáta Dr.",
      extendedProps: {
        ...first.extendedProps,
        instructor: "Németh Renáta Dr.",
      },
    });

    expect(getEventIdentity(first)).not.toBe(getEventIdentity(second));

    const [subject] = selectScheduleClass([], [first, second], {
      code: "ESST116-1",
      dayOfWeek: "Thursday",
      startTime: "16:00",
      endTime: "18:00",
      type: "practice",
      location: "LÉ 2.84",
      instructor: "Szeitl Blanka Veronika",
    });

    expect(subject.events.map(({ enabled }) => enabled)).toEqual([true, false]);
  });

  it("preserves duplicate-code instructor choices independently on refresh", () => {
    const first = event({
      code: "ESST116-1",
      description: "ESST116-1\nInstructor: Szeitl Blanka Veronika",
      location: "LÉ 2.84",
      extendedProps: {
        type: "practice",
        location: "LÉ 2.84",
        instructor: "Szeitl Blanka Veronika",
      },
      enabled: true,
    });
    const second = event({
      ...first,
      description: "ESST116-1\nInstructor: Németh Renáta Dr.",
      extendedProps: {
        ...first.extendedProps,
        instructor: "Németh Renáta Dr.",
      },
      enabled: false,
    });
    const existing = {
      title: "Academic skills",
      code: "ESST116-1",
      enabled: true,
      events: [first, second],
    };

    const [subject] = mergeScheduleEvents(
      [existing],
      [
        { ...first, enabled: false },
        { ...second, enabled: true },
      ],
    );

    expect(subject.events.map(({ enabled }) => enabled)).toEqual([true, false]);
  });

  it("preserves independent same-time lecture and practice state on refresh", () => {
    const lecture = event({
      code: "SHARED-1",
      description: "SHARED-1\nInstructor: Ada",
      extendedProps: { type: "lecture" },
      enabled: false,
    });
    const practice = event({
      code: "SHARED-1",
      description: "SHARED-1\nInstructor: Grace",
      enabled: true,
    });
    const existing = {
      title: "Algorithms",
      code: "SHARED-1",
      enabled: true,
      events: [lecture, practice],
    };

    const [subject] = mergeScheduleEvents(
      [existing],
      [
        { ...lecture, enabled: true, location: "New lecture room" },
        { ...practice, enabled: false, location: "New practice room" },
      ],
    );

    expect(subject.events).toMatchObject([
      { enabled: false, location: "New lecture room" },
      { enabled: true, location: "New practice room" },
    ]);
  });
});
