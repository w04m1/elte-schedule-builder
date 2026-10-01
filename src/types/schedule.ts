export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface ParsedTime {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface EventExtendedProps {
  type?: string;
  location?: string;
  instructor?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  start?: string;
  end?: string;
  code?: string;
  enabled?: boolean;
  hasConflict?: boolean;
  extendedProps?: EventExtendedProps;
  [key: string]: unknown;
}

export interface Subject {
  title: string;
  code?: string;
  enabled: boolean;
  events: CalendarEvent[];
}

export interface Schedule {
  id: string;
  name: string;
  subjects: Subject[];
  lectureExemption: boolean;
}

export interface ScheduleStore {
  activeScheduleId: string;
  schedules: Schedule[];
}

export interface OptimizerGroup {
  key: string;
  subjectTitle: string;
  code: string;
  typeClass: "lecture" | "practice";
  events: CalendarEvent[];
}

export interface OptimizerVariable {
  subjectTitle: string;
  typeClass: "lecture" | "practice";
  groups: OptimizerGroup[];
  currentGroupKeys: string[];
}

export interface OptimizerChange {
  key: string;
  subjectTitle: string;
  typeClass: "lecture" | "practice";
  from: OptimizerGroup;
  to: OptimizerGroup;
}

export interface OptimizerSolution {
  conflicts: number;
  changedGroups: number;
  changes: OptimizerChange[];
  groups: OptimizerGroup[];
}

export type OptimizationSuggestion = OptimizerSolution;
export type OptimizerChangeInfo = OptimizerChange;
export type OptimizerGroupInfo = OptimizerGroup;
