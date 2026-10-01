import { distance } from "fastest-levenshtein";
import { dayName } from "./i18n.js";
import type { CalendarEvent, ParsedTime, Subject } from "../types/schedule.js";

export interface ParsedClassRow {
  time: string;
  title: string;
  type: string;
  location: string;
  instructor: string;
  code: string;
}

export async function fetchSubjectClasses(
  searchTerm: string,
  searchMode = "code",
): Promise<ParsedClassRow[]> {
  if (!new Set(["code", "name", "instructor"]).has(searchMode)) {
    throw new TypeError("Unsupported subject search mode");
  }

  const queryString = searchMode === "code" ? "" : `?by=${searchMode}`;
  const response = await fetch(
    `/api/subject/${encodeURIComponent(searchTerm)}${queryString}`,
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = doc.querySelectorAll("#resulttable tbody tr");
  return Array.from(rows)
    .map(parseTableRow)
    .filter((row): row is ParsedClassRow => Boolean(row));
}

export function parseTableRow(row: Element | null): ParsedClassRow | null {
  if (!row) return null;

  const cells = row.querySelectorAll("td");
  if (cells.length < 6) return null;

  const time = cells[0].textContent?.trim() ?? "";
  const codeAndType = cells[1].textContent?.trim() ?? "";
  const title = cells[2].textContent?.trim() ?? "";
  const location = cells[3].textContent?.trim() ?? "";
  const instructor = cells[5].textContent?.trim() ?? "";

  // Extract type from code (e.g., "IP-18fWPEG-90 (lecture)" -> "lecture")
  const typeMatch = codeAndType.match(/\((.*?)\)$/);
  const type = typeMatch ? typeMatch[1] : "";

  return {
    time,
    title,
    type,
    location: location !== "-" ? location : "",
    instructor,
    code: codeAndType.split(" (")[0],
  };
}

export function parseTimeString(timeStr?: string | null): ParsedTime | null {
  if (!timeStr || timeStr === "Weeks: ") return null;

  const dayTimeRegex =
    /(Monday|Tuesday|Wednesday|Thursday|Friday)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/;
  const match = timeStr.match(dayTimeRegex);

  if (!match) {
    return null;
  }

  return {
    dayOfWeek: match[1],
    startTime: match[2].padStart(2, "0") + ":" + match[3],
    endTime: match[4].padStart(2, "0") + ":" + match[5],
  };
}

export function parseSubjectCodes(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((code) => code.trim())
    .filter(Boolean);
}

// Tanrend codes such as DEMO-1 are already base codes. Only strip a group
// suffix when the code contains at least three dash-separated segments.
export function getTanrendSubjectCode(code: string): string {
  const parts = code.split("-");
  if (parts.length > 2) parts.pop();
  return parts.join("-");
}

function normalizeSearchValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function normalizeNameSearchValue(value: unknown): string {
  return normalizeSearchValue(value)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getNameMatchDistance(candidate: string, query: string): number {
  const normalizedCandidate = normalizeNameSearchValue(candidate);
  const normalizedQuery = normalizeNameSearchValue(query);
  if (!normalizedCandidate || !normalizedQuery) return Number.POSITIVE_INFINITY;
  if (normalizedCandidate.includes(normalizedQuery)) return 0;

  const candidateWords = normalizedCandidate.split(" ");
  const queryWords = normalizedQuery.split(" ");
  const windowLength = queryWords.length;
  let bestDistance = distance(normalizedCandidate, normalizedQuery);

  for (
    let index = 0;
    index <= candidateWords.length - windowLength;
    index += 1
  ) {
    bestDistance = Math.min(
      bestDistance,
      distance(
        candidateWords.slice(index, index + windowLength).join(" "),
        normalizedQuery,
      ),
    );
  }

  return bestDistance;
}

export function isTypoTolerantNameMatch(
  candidate: string,
  query: string,
): boolean {
  const normalizedQuery = normalizeNameSearchValue(query);
  if (normalizedQuery.length < 4) {
    return getNameMatchDistance(candidate, query) === 0;
  }

  const allowedDistance = Math.max(1, Math.ceil(normalizedQuery.length / 6));
  return getNameMatchDistance(candidate, query) <= allowedDistance;
}

export function rankSubjectMatches<
  T extends {
    title?: string;
    apiCode?: string;
    rows?: { instructor?: string }[];
    classes?: { instructor?: string }[];
  },
>(groups: T[], query: string, limit = 3): T[] {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery || !Array.isArray(groups) || limit <= 0) return [];

  const matchRank = (group: T): number => {
    const codes = String(group?.apiCode ?? "")
      .split(",")
      .map(normalizeSearchValue)
      .filter(Boolean);
    const title = normalizeSearchValue(group?.title);
    const titleWords = title.split(/\s+/);
    const instructors = [
      ...new Set(
        (group?.rows ?? group?.classes ?? [])
          .map((row) => normalizeSearchValue(row?.instructor))
          .filter(Boolean),
      ),
    ];
    const instructorWords = instructors.flatMap((instructor) =>
      instructor.split(/\s+/),
    );

    if (codes.includes(normalizedQuery)) return 0;
    if (title === normalizedQuery) return 1;
    if (instructors.includes(normalizedQuery)) return 2;
    if (codes.some((code) => code.startsWith(normalizedQuery))) return 3;
    if (title.startsWith(normalizedQuery)) return 4;
    if (instructors.some((name) => name.startsWith(normalizedQuery))) return 5;
    if (titleWords.some((word) => word.startsWith(normalizedQuery))) return 6;
    if (instructorWords.some((word) => word.startsWith(normalizedQuery)))
      return 7;
    if (codes.some((code) => code.includes(normalizedQuery))) return 8;
    if (title.includes(normalizedQuery)) return 9;
    if (instructors.some((name) => name.includes(normalizedQuery))) return 10;

    const titleDistance = getNameMatchDistance(group?.title ?? "", query);
    const instructorDistance = Math.min(
      ...instructors.map((name) => getNameMatchDistance(name, query)),
    );
    if (isTypoTolerantNameMatch(group?.title ?? "", query)) {
      return 20 + titleDistance;
    }
    if (instructors.some((name) => isTypoTolerantNameMatch(name, query))) {
      return 30 + instructorDistance;
    }
    return 100;
  };

  return groups
    .map((group, index) => ({ group, index, rank: matchRank(group) }))
    .sort(
      (first, second) =>
        first.rank - second.rank ||
        (first.group.title?.length ?? 0) - (second.group.title?.length ?? 0) ||
        (first.group.title ?? "").localeCompare(second.group.title ?? "") ||
        first.index - second.index,
    )
    .slice(0, limit)
    .map(({ group }) => group);
}

export function getEventGroupNumber(event: unknown): string {
  const e = event as { code?: string; description?: string } | null;
  const eventCode =
    typeof e?.code === "string" && e.code.trim()
      ? e.code.trim()
      : typeof e?.description === "string"
        ? e.description.split("\n")[0].trim()
        : "";
  const parts = eventCode.split("-");

  return parts.length >= 3 ? (parts.at(-1)?.trim() ?? "") : "";
}

export function getEventDisplayTitle(event: unknown): string {
  const e = event as {
    title?: string;
    extendedProps?: { type?: string };
    type?: string;
  } | null;
  const title = String(e?.title ?? "").trim();
  const type = String(e?.extendedProps?.type ?? e?.type ?? "").trim();

  if (!title || !type) return title;

  const appendedType = `(${type})`;
  return title.toLocaleLowerCase().endsWith(appendedType.toLocaleLowerCase())
    ? title.slice(0, -appendedType.length).trim()
    : title;
}

export function createCalendarEvents(classes: unknown[]): CalendarEvent[] {
  if (!Array.isArray(classes)) return [];

  return classes.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const subjectClass = item as Record<string, string>;
    const time = parseTimeString(subjectClass.time);
    if (!time) return [];

    return [
      {
        title: `${subjectClass.title} (${subjectClass.type})`,
        dayOfWeek: time.dayOfWeek,
        startTime: time.startTime,
        endTime: time.endTime,
        description: `${subjectClass.code}\nInstructor: ${subjectClass.instructor}`,
        code: subjectClass.code,
        extendedProps: {
          location: subjectClass.location,
          type: subjectClass.type,
          instructor: subjectClass.instructor,
        },
        enabled: false,
      },
    ];
  });
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function checkTimeOverlap(
  first: CalendarEvent,
  second: CalendarEvent,
): boolean {
  return (
    first.dayOfWeek === second.dayOfWeek &&
    timeToMinutes(first.startTime) < timeToMinutes(second.endTime) &&
    timeToMinutes(second.startTime) < timeToMinutes(first.endTime)
  );
}

export function getEventType(event: unknown): string {
  const e = event as {
    extendedProps?: { type?: string };
    type?: string;
  } | null;
  return (e?.extendedProps?.type ?? e?.type ?? "").trim().toLowerCase();
}

export function isLectureType(type?: unknown): boolean {
  return typeof type === "string" && type.toLowerCase().includes("lecture");
}

/**
 * Match the two sections used by the class picker: lectures and practices.
 * Tanrend uses several labels for non-lecture classes, but they are all
 * interchangeable choices within the practice section.
 */
export function getEventTypeClass(type: unknown): "lecture" | "practice" {
  return isLectureType(type) ? "lecture" : "practice";
}

function isLecture(event: CalendarEvent): boolean {
  return isLectureType(getEventType(event));
}

export function formatEventConflictLabel(
  activeLanguage: string,
  events: CalendarEvent[],
): string {
  return events
    .map(
      (event) =>
        `${getEventDisplayTitle(event)}, ${dayName(activeLanguage, event.dayOfWeek)} ${event.startTime}–${event.endTime}`,
    )
    .join("; ");
}

export function getConflictPairs(
  events: CalendarEvent[],
  lectureExemption = false,
): Array<{ event1: number; event2: number }> {
  const conflicts: Array<{ event1: number; event2: number }> = [];
  for (let first = 0; first < events.length; first += 1) {
    for (let second = first + 1; second < events.length; second += 1) {
      if (!checkTimeOverlap(events[first], events[second])) continue;
      if (
        lectureExemption &&
        (isLecture(events[first]) || isLecture(events[second]))
      )
        continue;
      conflicts.push({ event1: first, event2: second });
    }
  }
  return conflicts;
}

/**
 * Return the enabled meetings that would overlap a candidate class.
 * Callers remove the candidate's current lecture/practice choice first so the
 * result describes the timetable after that choice is replaced.
 */
export function getConflictingEvents(
  candidate: CalendarEvent | null | undefined,
  otherEvents: CalendarEvent[],
  lectureExemption = false,
): CalendarEvent[] {
  if (!candidate || !Array.isArray(otherEvents)) return [];

  const candidateIndex = otherEvents.length;
  const events = [...otherEvents, candidate];
  return getConflictPairs(events, lectureExemption).flatMap(
    ({ event1, event2 }) => {
      if (event1 === candidateIndex) return [events[event2]];
      if (event2 === candidateIndex) return [events[event1]];
      return [];
    },
  );
}

export function markConflicts(
  subjects: Subject[],
  lectureExemption = false,
): Subject[] {
  const enabledEvents = subjects
    .filter((subject) => subject.enabled)
    .flatMap((subject) => subject.events.filter((event) => event.enabled));
  const conflictingEvents = new Set(
    getConflictPairs(enabledEvents, lectureExemption).flatMap(
      ({ event1, event2 }) => [enabledEvents[event1], enabledEvents[event2]],
    ),
  );

  return subjects.map((subject) => ({
    ...subject,
    events: subject.events.map((event) => ({
      ...event,
      hasConflict: conflictingEvents.has(event),
    })),
  }));
}

export function decodeSchedule(encodedSchedule: string): {
  baseCodes: string;
  fullCodes: string[];
  eventIdentities: string[];
  lectureExemption: boolean;
} {
  try {
    const decoded = atob(encodedSchedule);
    if (decoded.startsWith("V2|")) {
      const payload = JSON.parse(decodeURIComponent(decoded.slice(3)));
      const fullCodes: string[] = Array.isArray(payload.codes)
        ? payload.codes.filter(
            (code: unknown): code is string =>
              typeof code === "string" && Boolean(code),
          )
        : [];
      const eventIdentities: string[] = Array.isArray(payload.eventIdentities)
        ? payload.eventIdentities.filter(
            (identity: unknown): identity is string =>
              typeof identity === "string" && Boolean(identity),
          )
        : [];
      return {
        baseCodes: [...new Set(fullCodes)].join(" "),
        fullCodes,
        eventIdentities,
        lectureExemption: payload.lectureExemption === true,
      };
    }

    const parts = decoded.split("|");
    const lectureExemption = parts.pop() === "1";
    const fullCodes = parts.flatMap((section) => {
      const match = section.match(/^([^{}]+)\{(.*)\}$/);
      if (!match) return [];
      const [, prefix, contents] = match;
      return contents
        .split(",")
        .map((item) => (prefix === "OTHER" ? item : `${prefix}-${item}`));
    });

    return {
      baseCodes: [...new Set(fullCodes)].join(" "),
      fullCodes,
      eventIdentities: [],
      lectureExemption,
    };
  } catch {
    return {
      baseCodes: "",
      fullCodes: [],
      eventIdentities: [],
      lectureExemption: false,
    };
  }
}

export function encodeSchedule(
  codes: string[],
  lectureExemption = false,
  eventIdentities: string[] = [],
): string {
  const uniqueCodes = [...new Set(codes)];
  const uniqueEventIdentities = [...new Set(eventIdentities.filter(Boolean))];
  if (uniqueEventIdentities.length > 0) {
    const payload = encodeURIComponent(
      JSON.stringify({
        codes: uniqueCodes,
        eventIdentities: uniqueEventIdentities,
        lectureExemption: Boolean(lectureExemption),
      }),
    );
    return btoa(`V2|${payload}`);
  }

  const groups = new Map<string, string[]>();
  for (const code of uniqueCodes) {
    const parts = code.split("-");
    const prefix = parts.length > 2 ? parts.shift()! : "OTHER";
    const value = prefix === "OTHER" ? code : parts.join("-");
    groups.set(prefix, [...(groups.get(prefix) ?? []), value]);
  }

  const sections = [...groups]
    .sort(([prefix]) => (prefix === "OTHER" ? 1 : -1))
    .map(([prefix, values]) => `${prefix}{${values.join(",")}}`);
  return btoa(`${sections.join("|")}|${lectureExemption ? "1" : "0"}`);
}

/** Zero-based weekday order shared by every day-sorted list in the UI. */
export const DAY_ORDER: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function getWeekdayDate(dayOfWeek: string, weekOffset: number): string {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const daysToAdd = DAY_ORDER[dayOfWeek] ?? 0;

  const eventDateObj = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysToMonday + weekOffset * 7 + daysToAdd,
  );

  return formatDateToISO(eventDateObj);
}

export function getWeekDateForDay(dayOfWeek: string): string {
  return getWeekdayDate(dayOfWeek, 0);
}

export function getNextWeekDateForDay(dayOfWeek: string): string {
  return getWeekdayDate(dayOfWeek, 1);
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateToCompact(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
