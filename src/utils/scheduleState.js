export function normalizeSubjectTitle(title) {
  return title
    .split("(")[0]
    .trim()
    .replace(/\s*L\+Pr\.\s*$/, "")
    .replace(/\s*(?:L|P|Pr)\.\s*$/, "")
    .trim();
}

export function getEventCode(event) {
  return (event.code ?? event.description?.split("\n")[0] ?? "").trim();
}

export function getEventType(event) {
  return (event.extendedProps?.type ?? event.type ?? "").trim().toLowerCase();
}

function normalizeIdentityValue(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function getEventInstructor(event) {
  const explicit = event.extendedProps?.instructor ?? event.instructor;
  if (String(explicit ?? "").trim()) return String(explicit).trim();

  const description = String(event.description ?? "");
  return description.match(/(?:^|\n)Instructor:\s*(.*)$/im)?.[1]?.trim() ?? "";
}

function getEventLocation(event) {
  return String(event.extendedProps?.location ?? event.location ?? "").trim();
}

function getEventVariantIdentity(event) {
  return [
    normalizeIdentityValue(getEventCode(event)),
    normalizeIdentityValue(getEventType(event)),
    normalizeIdentityValue(getEventInstructor(event)),
  ].join("\u0000");
}

export function getEventSlotIdentity(event) {
  return [
    normalizeIdentityValue(getEventCode(event)),
    normalizeIdentityValue(event.dayOfWeek),
    normalizeIdentityValue(event.startTime),
    normalizeIdentityValue(event.endTime),
    normalizeIdentityValue(getEventType(event)),
  ].join("\u0000");
}

export function getEventIdentity(event) {
  return [
    getEventSlotIdentity(event),
    normalizeIdentityValue(getEventLocation(event)),
    normalizeIdentityValue(getEventInstructor(event)),
  ].join("\u0000");
}

function getClassTypeGroup(type) {
  return (type ?? "").toLowerCase().includes("lecture")
    ? "lecture"
    : "practice";
}

/**
 * Keep every fetched class as an option while selecting one initial course
 * group from each subject's lecture and practice sections. Multiple distinct
 * meetings that belong to the same code/instructor group stay enabled, while
 * exact duplicate Tanrend rows do not.
 */
export function selectInitialScheduleGroups(events, existingEvents = []) {
  if (!Array.isArray(events)) return [];

  const selectedVariants = new Map();
  const enabledMeetings = new Set();

  const availableVariants = new Map();
  for (const event of events) {
    const subjectTitle = normalizeSubjectTitle(String(event.title ?? ""));
    const sectionKey = `${subjectTitle}\u0000${getClassTypeGroup(getEventType(event))}`;
    const variants = availableVariants.get(sectionKey) ?? new Set();
    variants.add(getEventVariantIdentity(event));
    availableVariants.set(sectionKey, variants);
  }

  // Re-importing a subject must keep the current group instead of resetting
  // it to whichever row Tanrend returned first.
  for (const event of existingEvents) {
    if (!event?.enabled) continue;
    const subjectTitle = normalizeSubjectTitle(String(event.title ?? ""));
    const sectionKey = `${subjectTitle}\u0000${getClassTypeGroup(getEventType(event))}`;
    const variantIdentity = getEventVariantIdentity(event);
    if (availableVariants.get(sectionKey)?.has(variantIdentity)) {
      selectedVariants.set(sectionKey, variantIdentity);
    }
  }

  return events.map((event) => {
    const subjectTitle = normalizeSubjectTitle(String(event.title ?? ""));
    const sectionKey = `${subjectTitle}\u0000${getClassTypeGroup(getEventType(event))}`;
    const variantIdentity = getEventVariantIdentity(event);
    if (!selectedVariants.has(sectionKey)) {
      selectedVariants.set(sectionKey, variantIdentity);
    }

    const meetingKey = `${sectionKey}\u0000${variantIdentity}\u0000${getEventIdentity(event)}`;
    const enabled =
      selectedVariants.get(sectionKey) === variantIdentity &&
      !enabledMeetings.has(meetingKey);
    if (enabled) enabledMeetings.add(meetingKey);
    return { ...event, enabled };
  });
}

function matchesExistingEvent(existingEvent, newEvent) {
  return getEventIdentity(existingEvent) === getEventIdentity(newEvent);
}

function matchesSameScheduleSlot(existingEvent, newEvent) {
  return (
    existingEvent.dayOfWeek === newEvent.dayOfWeek &&
    existingEvent.startTime === newEvent.startTime &&
    existingEvent.endTime === newEvent.endTime &&
    getEventType(existingEvent) === getEventType(newEvent)
  );
}

function findExistingEventIndex(events, newEvent, allowSlotFallback = false) {
  const exactIndex = events.findIndex((event) =>
    matchesExistingEvent(event, newEvent),
  );
  if (exactIndex !== -1 || !allowSlotFallback) return exactIndex;

  const slotMatches = events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => matchesSameScheduleSlot(event, newEvent));
  return slotMatches.length === 1 ? slotMatches[0].index : -1;
}

function isSameClassType(firstType, secondType) {
  return getClassTypeGroup(firstType) === getClassTypeGroup(secondType);
}

function eventMatchesClass(event, selectedClass) {
  const selectedInstructor = getEventInstructor(selectedClass);
  const selectedLocation = getEventLocation(selectedClass);
  return (
    getEventCode(event) === getEventCode(selectedClass) &&
    event.dayOfWeek === selectedClass.dayOfWeek &&
    event.startTime === selectedClass.startTime &&
    (!selectedClass.endTime || event.endTime === selectedClass.endTime) &&
    getEventType(event) === getEventType(selectedClass) &&
    (!selectedInstructor ||
      normalizeIdentityValue(getEventInstructor(event)) ===
        normalizeIdentityValue(selectedInstructor)) &&
    (!selectedLocation ||
      normalizeIdentityValue(getEventLocation(event)) ===
        normalizeIdentityValue(selectedLocation))
  );
}

/**
 * Select one Tanrend class while retaining the other fetched groups as options.
 * Existing groups of the same type are disabled, matching a normal timetable
 * choice without removing lectures when a practice is selected (or vice versa).
 */
export function selectScheduleClass(subjects, eventData, selectedClass) {
  if (eventData.length === 0) return subjects;

  const title = normalizeSubjectTitle(eventData[0].title);
  const incomingEvents = eventData.map((event) => ({
    ...event,
    code: getEventCode(event),
    enabled: eventMatchesClass(event, selectedClass),
  }));
  const existingIndex = subjects.findIndex(
    (subject) => subject.title === title,
  );

  if (existingIndex === -1) {
    return [
      ...subjects,
      {
        title,
        code: [...new Set(incomingEvents.map(getEventCode))].join(", "),
        events: incomingEvents,
        enabled: incomingEvents.some((event) => event.enabled),
      },
    ];
  }

  const existingSubject = subjects[existingIndex];
  const mergedEvents = [...existingSubject.events];

  for (const incomingEvent of incomingEvents) {
    const existingEventIndex = findExistingEventIndex(
      mergedEvents,
      incomingEvent,
    );
    const previousEvent = mergedEvents[existingEventIndex];
    const enabled = eventMatchesClass(incomingEvent, selectedClass)
      ? true
      : isSameClassType(incomingEvent.extendedProps?.type, selectedClass.type)
        ? false
        : (previousEvent?.enabled ?? incomingEvent.enabled);
    const nextEvent = { ...incomingEvent, enabled };

    if (existingEventIndex === -1) mergedEvents.push(nextEvent);
    else mergedEvents[existingEventIndex] = nextEvent;
  }

  const updatedSubjects = [...subjects];
  updatedSubjects[existingIndex] = {
    ...existingSubject,
    code: [...new Set(mergedEvents.map(getEventCode))].join(", "),
    events: mergedEvents,
    enabled: mergedEvents.some((event) => event.enabled),
  };
  return updatedSubjects;
}

export function mergeScheduleEvents(subjects, eventData) {
  const eventsByTitle = new Map();

  for (const event of eventData) {
    const title = normalizeSubjectTitle(event.title);
    const events = eventsByTitle.get(title) ?? [];
    events.push({ ...event, code: getEventCode(event) });
    eventsByTitle.set(title, events);
  }

  const updatedSubjects = [...subjects];
  for (const [title, events] of eventsByTitle) {
    const existingIndex = updatedSubjects.findIndex(
      (subject) => subject.title === title,
    );

    if (existingIndex === -1) {
      updatedSubjects.push({
        title,
        code: [...new Set(events.map((event) => event.code))].join(", "),
        events,
        enabled: events.some((event) => event.enabled),
      });
      continue;
    }

    const existingSubject = updatedSubjects[existingIndex];
    const updatedEvents = events.map((newEvent) => {
      const existingEventIndex = findExistingEventIndex(
        existingSubject.events,
        newEvent,
        true,
      );
      const existingEvent = existingSubject.events[existingEventIndex];
      return {
        ...newEvent,
        enabled: existingEvent ? existingEvent.enabled : newEvent.enabled,
      };
    });

    updatedSubjects[existingIndex] = {
      ...existingSubject,
      events: updatedEvents,
      code: [
        ...new Set([
          ...existingSubject.code.split(", ").filter(Boolean),
          ...events.map((event) => event.code),
        ]),
      ].join(", "),
      enabled:
        existingSubject.enabled && updatedEvents.some((event) => event.enabled),
    };
  }

  return updatedSubjects;
}

export function getEnabledEvents(subjects) {
  return subjects
    .filter((subject) => subject.enabled)
    .flatMap((subject) => subject.events.filter((event) => event.enabled));
}

export function setSubjectEnabled(subjects, title, enabled = null) {
  return subjects.map((subject) => {
    if (subject.title !== title) return subject;
    const nextEnabled = enabled ?? !subject.enabled;
    return {
      ...subject,
      enabled: nextEnabled,
    };
  });
}

export function toggleScheduleEvent(subjects, subjectTitle, eventIndex) {
  return subjects.map((subject) => {
    if (subject.title !== subjectTitle) return subject;
    const selectedEvent = subject.events[eventIndex];
    if (!selectedEvent) return subject;

    const nextEnabled = !selectedEvent.enabled;
    const events = subject.events.map((event, index) => {
      if (index === eventIndex) return { ...event, enabled: nextEnabled };
      if (
        nextEnabled &&
        isSameClassType(getEventType(event), getEventType(selectedEvent))
      ) {
        return { ...event, enabled: false };
      }
      return event;
    });
    return {
      ...subject,
      enabled: events.some((event) => event.enabled),
      events,
    };
  });
}

export function getEnabledEventCodes(subjects) {
  return getEnabledEvents(subjects).map(getEventCode);
}
