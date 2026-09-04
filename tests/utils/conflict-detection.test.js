import { describe, it, expect } from "vitest";
import {
  checkTimeOverlap,
  getConflictPairs as computeConflicts,
  markConflicts,
} from "../../src/utils/schedule.js";

describe("Conflict Detection", () => {
  it("does not mark selected groups from hidden subjects as conflicts", () => {
    const overlappingEvent = {
      dayOfWeek: "Monday",
      startTime: "10:00",
      endTime: "12:00",
      enabled: true,
      extendedProps: { type: "practice" },
    };
    const subjects = markConflicts([
      { title: "Visible", enabled: true, events: [overlappingEvent] },
      { title: "Hidden", enabled: false, events: [{ ...overlappingEvent }] },
    ]);

    expect(subjects[0].events[0].hasConflict).toBe(false);
    expect(subjects[1].events[0].hasConflict).toBe(false);
  });

  describe("checkTimeOverlap", () => {
    it("should detect overlap for events on the same day with overlapping times", () => {
      const event1 = {
        dayOfWeek: "Monday",
        startTime: "14:00",
        endTime: "15:30",
      };
      const event2 = {
        dayOfWeek: "Monday",
        startTime: "15:00",
        endTime: "16:30",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(true);
    });

    it("should not detect overlap for events on different days", () => {
      const event1 = {
        dayOfWeek: "Monday",
        startTime: "14:00",
        endTime: "15:30",
      };
      const event2 = {
        dayOfWeek: "Tuesday",
        startTime: "14:00",
        endTime: "15:30",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(false);
    });

    it("should not detect overlap for consecutive events (no gap)", () => {
      const event1 = {
        dayOfWeek: "Monday",
        startTime: "14:00",
        endTime: "15:30",
      };
      const event2 = {
        dayOfWeek: "Monday",
        startTime: "15:30",
        endTime: "17:00",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(false);
    });

    it("should detect overlap for one event completely inside another", () => {
      const event1 = {
        dayOfWeek: "Wednesday",
        startTime: "10:00",
        endTime: "14:00",
      };
      const event2 = {
        dayOfWeek: "Wednesday",
        startTime: "11:00",
        endTime: "12:00",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(true);
    });

    it("should detect overlap for events with same start time", () => {
      const event1 = {
        dayOfWeek: "Thursday",
        startTime: "16:00",
        endTime: "17:30",
      };
      const event2 = {
        dayOfWeek: "Thursday",
        startTime: "16:00",
        endTime: "18:00",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(true);
    });

    it("should detect overlap for events with same end time", () => {
      const event1 = {
        dayOfWeek: "Friday",
        startTime: "14:00",
        endTime: "16:00",
      };
      const event2 = {
        dayOfWeek: "Friday",
        startTime: "15:00",
        endTime: "16:00",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(true);
    });

    it("should not detect overlap for events with a gap", () => {
      const event1 = {
        dayOfWeek: "Monday",
        startTime: "08:00",
        endTime: "10:00",
      };
      const event2 = {
        dayOfWeek: "Monday",
        startTime: "10:30",
        endTime: "12:00",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(false);
    });

    it("should handle events spanning different hours correctly", () => {
      const event1 = {
        dayOfWeek: "Tuesday",
        startTime: "09:45",
        endTime: "11:15",
      };
      const event2 = {
        dayOfWeek: "Tuesday",
        startTime: "11:00",
        endTime: "12:30",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(true);
    });

    it("should handle early morning events correctly", () => {
      const event1 = {
        dayOfWeek: "Wednesday",
        startTime: "08:00",
        endTime: "09:30",
      };
      const event2 = {
        dayOfWeek: "Wednesday",
        startTime: "09:00",
        endTime: "10:30",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(true);
    });

    it("should handle evening events correctly", () => {
      const event1 = {
        dayOfWeek: "Thursday",
        startTime: "18:00",
        endTime: "19:30",
      };
      const event2 = {
        dayOfWeek: "Thursday",
        startTime: "19:00",
        endTime: "20:30",
      };

      expect(checkTimeOverlap(event1, event2)).toBe(true);
    });
  });

  describe("computeConflicts", () => {
    it("should detect conflicts between two overlapping practices", () => {
      const events = [
        {
          dayOfWeek: "Monday",
          startTime: "14:00",
          endTime: "15:30",
          type: "practice",
        },
        {
          dayOfWeek: "Monday",
          startTime: "15:00",
          endTime: "16:30",
          type: "practice",
        },
      ];

      const conflicts = computeConflicts(events, false);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual({ event1: 0, event2: 1 });
    });

    it("should not detect conflicts for non-overlapping events", () => {
      const events = [
        {
          dayOfWeek: "Monday",
          startTime: "10:00",
          endTime: "11:30",
          type: "lecture",
        },
        {
          dayOfWeek: "Monday",
          startTime: "12:00",
          endTime: "13:30",
          type: "practice",
        },
      ];

      const conflicts = computeConflicts(events, false);
      expect(conflicts).toHaveLength(0);
    });

    it("should detect conflicts between lecture and practice when exemption is off", () => {
      const events = [
        {
          dayOfWeek: "Tuesday",
          startTime: "14:00",
          endTime: "15:30",
          type: "lecture",
        },
        {
          dayOfWeek: "Tuesday",
          startTime: "15:00",
          endTime: "16:30",
          type: "practice",
        },
      ];

      const conflicts = computeConflicts(events, false);
      expect(conflicts).toHaveLength(1);
    });

    it("should not detect conflicts between lecture and practice when exemption is on", () => {
      const events = [
        {
          dayOfWeek: "Tuesday",
          startTime: "14:00",
          endTime: "15:30",
          type: "lecture",
        },
        {
          dayOfWeek: "Tuesday",
          startTime: "15:00",
          endTime: "16:30",
          type: "practice",
        },
      ];

      const conflicts = computeConflicts(events, true);
      expect(conflicts).toHaveLength(0);
    });

    it("should not detect conflicts between two lectures when exemption is on", () => {
      const events = [
        {
          dayOfWeek: "Wednesday",
          startTime: "10:00",
          endTime: "11:30",
          type: "lecture",
        },
        {
          dayOfWeek: "Wednesday",
          startTime: "11:00",
          endTime: "12:30",
          type: "lecture",
        },
      ];

      const conflicts = computeConflicts(events, true);
      expect(conflicts).toHaveLength(0);
    });

    it("should detect conflicts between two lectures when exemption is off", () => {
      const events = [
        {
          dayOfWeek: "Wednesday",
          startTime: "10:00",
          endTime: "11:30",
          type: "lecture",
        },
        {
          dayOfWeek: "Wednesday",
          startTime: "11:00",
          endTime: "12:30",
          type: "lecture",
        },
      ];

      const conflicts = computeConflicts(events, false);
      expect(conflicts).toHaveLength(1);
    });

    it("should still detect conflicts between practices with exemption on", () => {
      const events = [
        {
          dayOfWeek: "Thursday",
          startTime: "14:00",
          endTime: "15:30",
          type: "practice",
        },
        {
          dayOfWeek: "Thursday",
          startTime: "15:00",
          endTime: "16:30",
          type: "practice",
        },
      ];

      const conflicts = computeConflicts(events, true);
      expect(conflicts).toHaveLength(1);
    });

    it("should handle multiple conflicts correctly", () => {
      const events = [
        {
          dayOfWeek: "Friday",
          startTime: "10:00",
          endTime: "12:00",
          type: "practice",
        },
        {
          dayOfWeek: "Friday",
          startTime: "11:00",
          endTime: "13:00",
          type: "practice",
        },
        {
          dayOfWeek: "Friday",
          startTime: "11:30",
          endTime: "13:30",
          type: "practice",
        },
      ];

      const conflicts = computeConflicts(events, false);
      expect(conflicts).toHaveLength(3); // 0-1, 0-2, 1-2
    });

    it("should handle events on different days without conflicts", () => {
      const events = [
        {
          dayOfWeek: "Monday",
          startTime: "14:00",
          endTime: "15:30",
          type: "practice",
        },
        {
          dayOfWeek: "Tuesday",
          startTime: "14:00",
          endTime: "15:30",
          type: "practice",
        },
        {
          dayOfWeek: "Wednesday",
          startTime: "14:00",
          endTime: "15:30",
          type: "practice",
        },
      ];

      const conflicts = computeConflicts(events, false);
      expect(conflicts).toHaveLength(0);
    });

    it("should handle case-insensitive type checking for lectures", () => {
      const events = [
        {
          dayOfWeek: "Monday",
          startTime: "14:00",
          endTime: "15:30",
          type: "Lecture",
        },
        {
          dayOfWeek: "Monday",
          startTime: "15:00",
          endTime: "16:30",
          type: "LECTURE",
        },
      ];

      const conflicts = computeConflicts(events, true);
      expect(conflicts).toHaveLength(0);
    });
  });
});
