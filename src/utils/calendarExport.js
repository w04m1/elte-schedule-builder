import { getNextWeekDateForDay } from "./schedule.js";
import { getEventIdentity } from "./scheduleState.js";

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
const dayOrder = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function uniqueSortedEvents(events) {
  const unique = new Map();
  for (const event of Array.isArray(events) ? events : []) {
    const identity = getEventIdentity(event);
    if (!unique.has(identity)) unique.set(identity, event);
  }
  return [...unique.values()].sort(
    (first, second) =>
      (dayOrder[first.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) -
        (dayOrder[second.dayOfWeek] ?? Number.MAX_SAFE_INTEGER) ||
      String(first.startTime).localeCompare(String(second.startTime)) ||
      String(first.title).localeCompare(String(second.title)),
  );
}

export function getCalendarEventCount(events) {
  return uniqueSortedEvents(events).length;
}

function compactDate(isoDate) {
  return String(isoDate).replaceAll("-", "");
}

function compactTime(time) {
  return `${String(time).replace(":", "")}00`;
}

function formatUtcTimestamp(date) {
  return date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeICalendarText(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function foldICalendarLine(line) {
  const encoder = new TextEncoder();
  const parts = [];
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

function hashIdentity(value) {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildEventUid(event) {
  return `${hashIdentity(getEventIdentity(event))}@elte-schedule-builder`;
}

function getEventDate(event) {
  return getNextWeekDateForDay(event.dayOfWeek);
}

/**
 * Build one RFC 5545-compatible calendar containing every visible class.
 * Each class repeats weekly and keeps ELTE's Budapest timezone.
 */
export function buildICalendar(events, { now = new Date() } = {}) {
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
      `DESCRIPTION:${escapeICalendarText(event.description)}`,
      `LOCATION:${escapeICalendarText(event.extendedProps?.location)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldICalendarLine).join("\r\n")}\r\n`;
}

function formatCsvDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

function formatCsvTime(time) {
  const [hourValue, minute] = time.split(":").map(Number);
  const suffix = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Build one Google Calendar-compatible CSV containing every visible class. */
export function buildGoogleCalendarCsv(events) {
  const rows = [CSV_HEADERS];
  for (const event of uniqueSortedEvents(events)) {
    const date = formatCsvDate(getEventDate(event));
    rows.push([
      event.title,
      date,
      formatCsvTime(event.startTime),
      date,
      formatCsvTime(event.endTime),
      "False",
      event.description,
      event.extendedProps?.location ?? "",
      "False",
    ]);
  }
  return `\uFEFF${rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n")}\r\n`;
}
