import Papa from "papaparse";
import fnv1a from "@sindresorhus/fnv1a";
import { DAY_ORDER, getNextWeekDateForDay } from "./schedule.js";
import { getEventIdentity } from "./scheduleState.js";
import type { CalendarEvent } from "../types/schedule.js";

const TIMEZONE = "Europe/Budapest";
const CSV_HEADERS = [
  "Subject",
  "Start Date",
  "Start Time",
  "End Date",
  "End Time",
  "All Day Event",
  "Description",
  "Location",
  "Private",
];

function uniqueSortedEvents(events: CalendarEvent[]): CalendarEvent[] {
  const unique = new Map<string, CalendarEvent>();
  for (const event of Array.isArray(events) ? events : []) {
    const identity = getEventIdentity(event);
    if (!unique.has(identity)) unique.set(identity, event);
  }
  return [...unique.values()].sort(
    (first, second) =>
      (DAY_ORDER[first.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) -
        (DAY_ORDER[second.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) ||
      String(first.startTime).localeCompare(String(second.startTime)) ||
      String(first.title).localeCompare(String(second.title)),
  );
}

export function getCalendarEventCount(events: CalendarEvent[]): number {
  return uniqueSortedEvents(events).length;
}

function compactDate(isoDate: string): string {
  return String(isoDate).replaceAll("-", "");
}

function compactTime(time: string): string {
  return `${String(time).replace(":", "")}00`;
}

function formatUtcTimestamp(date: Date): string {
  return date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeICalendarText(value: unknown): string {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function foldICalendarLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let part = "";
  let limit = 75;

  for (const character of line) {
    if (encoder.encode(part + character).length > limit && part) {
      parts.push(part);
      part = character;
      limit = 74;
    } else {
      part += character;
    }
  }
  parts.push(part);
  return parts.join("\r\n ");
}

function buildEventUid(event: CalendarEvent): string {
  const hash = fnv1a(getEventIdentity(event), { size: 32 })
    .toString(16)
    .padStart(8, "0");
  return `${hash}@elte-schedule-builder`;
}

function getEventDate(event: CalendarEvent): string {
  return getNextWeekDateForDay(event.dayOfWeek);
}

/**
 * Build one RFC 5545-compatible calendar containing every visible class.
 * Each class repeats weekly and keeps ELTE's Budapest timezone.
 */
export function buildICalendar(
  events: CalendarEvent[],
  { now = new Date() }: { now?: Date } = {},
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ELTE Schedule Builder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ELTE Schedule",
    `X-WR-TIMEZONE:${TIMEZONE}`,
  ];

  for (const event of uniqueSortedEvents(events)) {
    const date = compactDate(getEventDate(event));
    lines.push(
      "BEGIN:VEVENT",
      `UID:${buildEventUid(event)}`,
      `DTSTAMP:${formatUtcTimestamp(now)}`,
      `DTSTART;TZID=${TIMEZONE}:${date}T${compactTime(event.startTime)}`,
      `DTEND;TZID=${TIMEZONE}:${date}T${compactTime(event.endTime)}`,
      "RRULE:FREQ=WEEKLY",
      `SUMMARY:${escapeICalendarText(event.title)}`,
      `DESCRIPTION:${escapeICalendarText((event as Record<string, unknown>).description ?? event.extendedProps?.description)}`,
      `LOCATION:${escapeICalendarText(event.extendedProps?.location)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldICalendarLine).join("\r\n")}\r\n`;
}

function formatCsvDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

function formatCsvTime(time: string): string {
  const [hourValue, minute] = time.split(":").map(Number);
  const suffix = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/** Build one Google Calendar-compatible CSV containing every visible class. */
export function buildGoogleCalendarCsv(events: CalendarEvent[]): string {
  const rows: (string | undefined)[][] = [CSV_HEADERS];
  for (const event of uniqueSortedEvents(events)) {
    const date = formatCsvDate(getEventDate(event));
    rows.push([
      event.title,
      date,
      formatCsvTime(event.startTime),
      date,
      formatCsvTime(event.endTime),
      "False",
      ((event as Record<string, unknown>).description as string | undefined) ??
        (event.extendedProps?.description as string | undefined),
      event.extendedProps?.location ?? "",
      "False",
    ]);
  }
  return `\uFEFF${Papa.unparse(rows, { newline: "\r\n" })}\r\n`;
}
