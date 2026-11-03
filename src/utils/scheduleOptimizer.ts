import {
  checkTimeOverlap,
  getEventType,
  getEventTypeClass,
  isLectureType,
} from "./schedule.js";
import {
  getEventCode,
  getEventIdentity,
  getEventInstructor,
} from "./scheduleState.js";
import type {
  CalendarEvent,
  OptimizerChange,
  OptimizerGroup,
  OptimizerSolution,
  OptimizerVariable,
  Subject,
} from "../types/schedule.js";

function getGroupKey(
  subjectTitle: string,
  code: string,
  typeClass: string,
  instructor = "",
): string {
  return `${subjectTitle}\u0000${code}\u0000${typeClass}\u0000${instructor.trim().toLocaleLowerCase()}`;
}

function getEventGroupKey(subjectTitle: string, event: CalendarEvent): string {
  return getGroupKey(
    subjectTitle,
    getEventCode(event),
    getEventTypeClass(getEventType(event)),
    getEventInstructor(event),
  );
}

function eventsConflict(
  first: CalendarEvent,
  second: CalendarEvent,
  lectureExemption: boolean,
): boolean {
  if (!checkTimeOverlap(first, second)) return false;
  if (
    lectureExemption &&
    (isLectureType(getEventType(first)) || isLectureType(getEventType(second)))
  ) {
    return false;
  }
  return true;
}

function countConflictsBetween(
  events: CalendarEvent[],
  chosenEvents: CalendarEvent[],
  lectureExemption: boolean,
): number {
  let conflicts = 0;
  for (const event of events) {
    for (const chosenEvent of chosenEvents) {
      if (eventsConflict(event, chosenEvent, lectureExemption)) {
        conflicts += 1;
      }
    }
  }
  return conflicts;
}

function countConflictsWithin(
  events: CalendarEvent[],
  lectureExemption: boolean,
): number {
  let conflicts = 0;
  for (let first = 0; first < events.length; first += 1) {
    for (let second = first + 1; second < events.length; second += 1) {
      if (eventsConflict(events[first], events[second], lectureExemption)) {
        conflicts += 1;
      }
    }
  }
  return conflicts;
}

function buildVariables(subjects: Subject[]): OptimizerVariable[] {
  const variables: OptimizerVariable[] = [];

  for (const subject of subjects) {
    if (!subject.enabled || !Array.isArray(subject.events)) continue;

    const groups = new Map<string, OptimizerGroup>();
    for (const event of subject.events) {
      const code = getEventCode(event);
      const typeClass = getEventTypeClass(getEventType(event));
      const key = getGroupKey(
        subject.title,
        code,
        typeClass,
        getEventInstructor(event),
      );
      const group = groups.get(key) ?? {
        key,
        subjectTitle: subject.title,
        code,
        typeClass,
        events: [],
      };
      const eventIdentity = getEventIdentity(event);
      const duplicateIndex = group.events.findIndex(
        (existingEvent) => getEventIdentity(existingEvent) === eventIdentity,
      );
      if (duplicateIndex === -1) {
        group.events.push(event);
      } else if (event.enabled && !group.events[duplicateIndex].enabled) {
        // Preserve selection state when an enabled duplicate follows a
        // disabled copy of the same Tanrend meeting.
        group.events[duplicateIndex] = {
          ...group.events[duplicateIndex],
          enabled: true,
        };
      }
      groups.set(key, group);
    }

    const groupsByType = new Map<"lecture" | "practice", OptimizerGroup[]>();
    for (const group of groups.values()) {
      const list = groupsByType.get(group.typeClass) ?? [];
      list.push(group);
      groupsByType.set(group.typeClass, list);
    }

    for (const [typeClass, typeGroups] of groupsByType) {
      const currentGroupKeys = typeGroups
        .filter((group) => group.events.some((event) => event.enabled))
        .map((group) => group.key);
      const currentGroupKeySet = new Set(currentGroupKeys);
      const orderedGroups = [...typeGroups].sort(
        (first, second) =>
          Number(currentGroupKeySet.has(second.key)) -
          Number(currentGroupKeySet.has(first.key)),
      );
      variables.push({
        subjectTitle: subject.title,
        typeClass,
        groups: orderedGroups,
        currentGroupKeys,
      });
    }
  }

  // Explore the most constrained variables first to find solutions faster.
  return variables.sort((a, b) => a.groups.length - b.groups.length);
}

function compareSolutions(a: OptimizerSolution, b: OptimizerSolution): number {
  return a.conflicts - b.conflicts || a.changedGroups - b.changedGroups;
}

function countGroupReplacements(
  variable: OptimizerVariable,
  selectedGroup: OptimizerGroup,
): number {
  return variable.currentGroupKeys.reduce(
    (count, currentGroupKey) =>
      count + Number(currentGroupKey !== selectedGroup.key),
    0,
  );
}

/**
 * Find alternative group selections for the saved subjects.
 *
 * Every enabled subject needs one group per class type (lecture, practice),
 * matching how groups are swapped in the Tanrend search flow. Solutions are
 * ranked by conflict count first, then by how few groups they swap away from
 * the currently enabled ones.
 */
export function findScheduleSuggestions(
  subjects: Subject[],
  { lectureExemption = false, maxSuggestions = 5, maxNodes = 200000 } = {},
): OptimizerSolution[] {
  const variables = buildVariables(
    Array.isArray(subjects)
      ? subjects.filter((subject) => Boolean(subject))
      : [],
  );
  if (variables.length === 0) return [];

  const solutions: OptimizerSolution[] = [];
  let nodes = 0;
  let stopped = false;

  function buildChanges(selection: OptimizerGroup[]): OptimizerChange[] {
    const changes: OptimizerChange[] = [];
    for (let index = 0; index < variables.length; index += 1) {
      for (const currentGroupKey of variables[index].currentGroupKeys) {
        if (selection[index].key === currentGroupKey) continue;
        const currentGroup = variables[index].groups.find(
          (group) => group.key === currentGroupKey,
        );
        if (currentGroup) {
          changes.push({
            key: `${currentGroup.key}\u0001${selection[index].key}`,
            subjectTitle: variables[index].subjectTitle,
            typeClass: variables[index].typeClass,
            from: currentGroup,
            to: selection[index],
          });
        }
      }
    }
    return changes;
  }

  function insertSolution(
    selection: OptimizerGroup[],
    conflicts: number,
  ): void {
    const changes = buildChanges(selection);
    const solution: OptimizerSolution = {
      conflicts,
      changedGroups: changes.length,
      changes,
      groups: selection,
    };
    const insertAt = solutions.findIndex(
      (existing) => compareSolutions(existing, solution) > 0,
    );
    if (insertAt === -1) {
      if (solutions.length < maxSuggestions) solutions.push(solution);
    } else {
      solutions.splice(insertAt, 0, solution);
      if (solutions.length > maxSuggestions) solutions.pop();
    }
  }

  function dfs(
    index: number,
    chosenEvents: CalendarEvent[],
    conflicts: number,
    changedGroups: number,
    selection: OptimizerGroup[],
  ): void {
    if (stopped) return;
    if (nodes >= maxNodes) {
      stopped = true;
      return;
    }
    nodes += 1;
    if (index === variables.length) {
      insertSolution(selection, conflicts);
      return;
    }

    for (const group of variables[index].groups) {
      const worst =
        solutions.length >= maxSuggestions
          ? solutions[solutions.length - 1]
          : null;
      const newConflicts =
        conflicts +
        countConflictsWithin(group.events, lectureExemption) +
        countConflictsBetween(group.events, chosenEvents, lectureExemption);
      const newChangedGroups =
        changedGroups + countGroupReplacements(variables[index], group);
      // Both scores can only increase deeper in the tree. Pruning by both
      // preserves better low-change solutions that may appear later.
      if (
        worst &&
        (newConflicts > worst.conflicts ||
          (newConflicts === worst.conflicts &&
            newChangedGroups > worst.changedGroups))
      ) {
        continue;
      }
      dfs(
        index + 1,
        [...chosenEvents, ...group.events],
        newConflicts,
        newChangedGroups,
        [...selection, group],
      );
    }
  }

  dfs(0, [], 0, 0, []);
  return solutions;
}

/**
 * Apply a suggestion by enabling exactly the events of its selected groups.
 * Subjects without a selected group are left untouched.
 */
export function applyScheduleSuggestion(
  subjects: Subject[],
  suggestion: { groups: OptimizerGroup[] },
): Subject[] {
  const selectedGroups = new Map(
    (suggestion?.groups ?? []).map((group) => [
      group.key,
      {
        eventIdentities: new Set(group.events?.map(getEventIdentity) ?? []),
      },
    ]),
  );
  const suggestedSubjects = new Set(
    (suggestion?.groups ?? []).map((group) => group.subjectTitle),
  );

  return subjects.map((subject) => {
    if (!suggestedSubjects.has(subject.title)) return subject;
    const enabledMeetings = new Set<string>();
    const events = subject.events.map((event) => {
      const groupKey = getEventGroupKey(subject.title, event);
      const selectedGroup = selectedGroups.get(groupKey);
      const eventIdentity = getEventIdentity(event);
      const meetingKey = `${groupKey}\u0001${eventIdentity}`;
      const belongsToSelection =
        selectedGroup &&
        (selectedGroup.eventIdentities.size === 0 ||
          selectedGroup.eventIdentities.has(eventIdentity));
      const enabled = Boolean(
        belongsToSelection && !enabledMeetings.has(meetingKey),
      );
      if (enabled) enabledMeetings.add(meetingKey);
      return { ...event, enabled };
    });
    return {
      ...subject,
      events,
      enabled: events.some((event) => event.enabled),
    };
  });
}
