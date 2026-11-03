import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleCalendarCsv,
  buildICalendar,
  getCalendarEventCount,
} from "../../src/utils/calendarExport.js";

const events = [
  {
    title: "Algorithms, lecture",
    code: "IK-ALG-01",
    description: "IK-ALG-01\nInstructor: Ada Lovelace",
    dayOfWeek: "Monday",
    startTime: "10:00",
    endTime: "11:30",
    extendedProps: {
      type: "lecture",
      location: 'North Building, Room "2.42"',
      instructor: "Ada Lovelace",
    },
  },
  {
    title: "Databases (practice)",
    code: "IK-DB-02",
    description: "IK-DB-02\nInstructor: Grace Hopper",
    dayOfWeek: "Wednesday",
    startTime: "14:00",
    endTime: "16:00",
    extendedProps: {
      type: "practice",
      location: "South Building 1.10",
      instructor: "Grace Hopper",
    },
  },
];

describe("whole-calendar exports", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 5, 12));
  });

  afterEach(() => vi.useRealTimers());

  it("builds one recurring iCalendar pack containing every enabled class", () => {
    const calendar = buildICalendar(events, {
      now: new Date("2026-08-05T10:00:00Z"),
    });

    expect(calendar.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(
      true,
    );
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(calendar).toContain("DTSTART;TZID=Europe/Budapest:20260810T100000");
    expect(calendar).toContain("DTSTART;TZID=Europe/Budapest:20260812T140000");
    expect(calendar.match(/RRULE:FREQ=WEEKLY/g)).toHaveLength(2);
    expect(calendar).toContain("SUMMARY:Algorithms\\, lecture");
    expect(calendar).toContain('LOCATION:North Building\\, Room "2.42"');
    expect(calendar).toContain(
      "DESCRIPTION:IK-ALG-01\\nInstructor: Ada Lovelace",
    );
    expect(calendar).toContain("DTSTAMP:20260805T100000Z");
  });

  it("deduplicates identical meetings in exported packs", () => {
    const duplicate = structuredClone(events[0]);

    expect(
      buildICalendar([events[0], duplicate]).match(/BEGIN:VEVENT/g),
    ).toHaveLength(1);
    expect(
      buildGoogleCalendarCsv([events[0], duplicate]).trim().split("\r\n"),
    ).toHaveLength(2);
    expect(getCalendarEventCount([events[0], duplicate])).toBe(1);
  });

  it("builds one Google-compatible CSV pack containing every class", () => {
    const csv = buildGoogleCalendarCsv(events);
    const rows = csv.slice(1).trim().split("\r\n");

    expect(csv.startsWith("\uFEFFSubject,Start Date,Start Time")).toBe(true);
    expect(rows).toHaveLength(3);
    expect(rows[1]).toContain('"Algorithms, lecture"');
    expect(rows[1]).toContain("08/10/2026");
    expect(rows[1]).toContain("10:00 AM");
    expect(rows[1]).toContain("11:30 AM");
    expect(rows[1]).toContain('"North Building, Room ""2.42"""');
    expect(rows[2]).toContain("08/12/2026");
    expect(rows[2]).toContain("2:00 PM");
    expect(rows[2]).toContain("4:00 PM");
  });
});
