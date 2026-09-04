export async function fetchSubjectClasses(searchTerm, searchMode = "code") {
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
  return Array.from(rows).map(parseTableRow).filter(Boolean);
}

export function parseTableRow(row) {
  if (!row) return null;

  const cells = row.querySelectorAll("td");
  if (cells.length < 6) return null;

  const time = cells[0].textContent.trim();
  const codeAndType = cells[1].textContent.trim();
  const title = cells[2].textContent.trim();
  const location = cells[3].textContent.trim();
  const instructor = cells[5].textContent.trim();

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

export function parseTimeString(timeStr) {
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

export function parseSubjectCodes(input) {
  return input
    .split(/[\s,]+/)
    .map((code) => code.trim())
    .filter(Boolean);
}

export function processSubjectCode(code) {
  const parts = code.split("-");
  if (parts.length > 1) parts.pop();
  return parts.join("-");
}

// Tanrend codes such as DEMO-1 are already base codes. Only strip a group
// suffix when the code contains at least three dash-separated segments.
export function getTanrendSubjectCode(code) {
  const parts = code.split("-");
  if (parts.length > 2) parts.pop();
  return parts.join("-");
}

function normalizeSearchValue(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function normalizeNameSearchValue(value) {
  return normalizeSearchValue(value)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(first, second) {
  const previous = Array.from(
    { length: second.length + 1 },
    (_, index) => index,
  );

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex];
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] +
          (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[second.length];
}

export function getNameMatchDistance(candidate, query) {
  const normalizedCandidate = normalizeNameSearchValue(candidate);
  const normalizedQuery = normalizeNameSearchValue(query);
  if (!normalizedCandidate || !normalizedQuery) return Number.POSITIVE_INFINITY;
  if (normalizedCandidate.includes(normalizedQuery)) return 0;

  const candidateWords = normalizedCandidate.split(" ");
  const queryWords = normalizedQuery.split(" ");
  const windowLength = queryWords.length;
  let bestDistance = editDistance(normalizedCandidate, normalizedQuery);

  for (
    let index = 0;
    index <= candidateWords.length - windowLength;
    index += 1
  ) {
    bestDistance = Math.min(
      bestDistance,
      editDistance(
        candidateWords.slice(index, index + windowLength).join(" "),
        normalizedQuery,
      ),
    );
  }

  return bestDistance;
}

export function isTypoTolerantNameMatch(candidate, query) {
  const normalizedQuery = normalizeNameSearchValue(query);
  if (normalizedQuery.length < 4) {
    return getNameMatchDistance(candidate, query) === 0;
  }

  const allowedDistance = Math.max(1, Math.ceil(normalizedQuery.length / 6));
  return getNameMatchDistance(candidate, query) <= allowedDistance;
}

export function rankSubjectMatches(groups, query, limit = 3) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery || !Array.isArray(groups) || limit <= 0) return [];

  const matchRank = (group) => {
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

    const titleDistance = getNameMatchDistance(group?.title, query);
    const instructorDistance = Math.min(
      ...instructors.map((name) => getNameMatchDistance(name, query)),
    );
    if (isTypoTolerantNameMatch(group?.title, query)) {
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
        first.group.title.length - second.group.title.length ||
        first.group.title.localeCompare(second.group.title) ||
        first.index - second.index,
    )
    .slice(0, limit)
    .map(({ group }) => group);
}

export function getEventGroupNumber(event) {
  const eventCode =
    typeof event?.code === "string" && event.code.trim()
      ? event.code.trim()
      : typeof event?.description === "string"
        ? event.description.split("\n")[0].trim()
        : "";
  const parts = eventCode.split("-");

  return parts.length >= 3 ? parts.at(-1).trim() : "";
}

export function getEventDisplayTitle(event) {
  const title = String(event?.title ?? "").trim();
  const type = String(event?.extendedProps?.type ?? event?.type ?? "").trim();

  if (!title || !type) return title;

  const appendedType = `(${type})`;
  return title.toLocaleLowerCase().endsWith(appendedType.toLocaleLowerCase())
    ? title.slice(0, -appendedType.length).trim()
    : title;
}

export function createCalendarEvents(classes) {
  if (!Array.isArray(classes)) return [];

  return classes.flatMap((subjectClass) => {
    if (!subjectClass) return [];
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

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function checkTimeOverlap(first, second) {
  return (
    first.dayOfWeek === second.dayOfWeek &&
    timeToMinutes(first.startTime) < timeToMinutes(second.endTime) &&
    timeToMinutes(second.startTime) < timeToMinutes(first.endTime)
  );
}

export function isLectureType(type) {
  return (type ?? "").toLowerCase().includes("lecture");
}

function isLecture(event) {
  return isLectureType(event.extendedProps?.type ?? event.type);
}

export function getConflictPairs(events, lectureExemption = false) {
  const conflicts = [];
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

export function markConflicts(subjects, lectureExemption = false) {
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

export function decodeSchedule(encodedSchedule) {
  try {
    const decoded = atob(encodedSchedule);
    if (decoded.startsWith("V2|")) {
      const payload = JSON.parse(decodeURIComponent(decoded.slice(3)));
      const fullCodes = Array.isArray(payload.codes)
        ? payload.codes.filter((code) => typeof code === "string" && code)
        : [];
      const eventIdentities = Array.isArray(payload.eventIdentities)
        ? payload.eventIdentities.filter(
            (identity) => typeof identity === "string" && identity,
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
  codes,
  lectureExemption = false,
  eventIdentities = [],
) {
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

  const groups = new Map();
  for (const code of uniqueCodes) {
    const parts = code.split("-");
    const prefix = parts.length > 2 ? parts.shift() : "OTHER";
    const value = prefix === "OTHER" ? code : parts.join("-");
    groups.set(prefix, [...(groups.get(prefix) ?? []), value]);
  }

  const sections = [...groups]
    .sort(([prefix]) => (prefix === "OTHER" ? 1 : -1))
    .map(([prefix, values]) => `${prefix}{${values.join(",")}}`);
  return btoa(`${sections.join("|")}|${lectureExemption ? "1" : "0"}`);
}

const DAY_OF_WEEK_INDEX = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

/**
 * Get the date for a specific weekday in a timezone-safe manner.
 * Avoids using toISOString() which can cause date shifts near midnight in non-UTC timezones.
 *
 * @param {string} dayOfWeek - Day name: "Monday", "Tuesday", etc.
 * @param {number} weekOffset - 0 for the current week, 1 for the next week
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
function getWeekdayDate(dayOfWeek, weekOffset) {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const daysToAdd = DAY_OF_WEEK_INDEX[dayOfWeek] - 1;

  // Create date object to handle month/year overflow correctly
  const eventDateObj = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysToMonday + weekOffset * 7 + daysToAdd,
  );

  return formatDateToISO(eventDateObj);
}

/**
 * Get the date for a specific day of the current week in a timezone-safe manner.
 *
 * @param {string} dayOfWeek - Day name: "Monday", "Tuesday", etc.
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
export function getWeekDateForDay(dayOfWeek) {
  return getWeekdayDate(dayOfWeek, 0);
}

/**
 * Get the date for a specific day of next week in a timezone-safe manner.
 *
 * @param {string} dayOfWeek - Day name: "Monday", "Tuesday", etc.
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
export function getNextWeekDateForDay(dayOfWeek) {
  return getWeekdayDate(dayOfWeek, 1);
}

/**
 * Format a Date object to ISO string (YYYY-MM-DD) without timezone conversion.
 * This prevents the bug where toISOString() converts to UTC and shifts dates.
 *
 * @param {Date} date - Date object to format
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
export function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to compact format (YYYYMMDD) for Google Calendar URLs.
 *
 * @param {Date} date - Date object to format
 * @returns {string} Compact date string in YYYYMMDD format
 */
export function formatDateToCompact(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
