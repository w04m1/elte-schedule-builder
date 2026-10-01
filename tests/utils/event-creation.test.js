import { describe, it, expect } from "vitest";
import { createCalendarEvents } from "../../src/utils/schedule.js";

describe("Event Creation", () => {
  describe("createCalendarEvents", () => {
    it("should create event from valid class data", () => {
      const classes = [
        {
          time: "Monday 14:00-15:30",
          code: "IP-18fWPEG-90",
          title: "Introduction to Programming",
          type: "lecture",
          location: "North Building 0.101",
          instructor: "Dr. John Smith",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        title: "Introduction to Programming (lecture)",
        dayOfWeek: "Monday",
        startTime: "14:00",
        endTime: "15:30",
        description: "IP-18fWPEG-90\nInstructor: Dr. John Smith",
        code: "IP-18fWPEG-90",
        extendedProps: {
          location: "North Building 0.101",
          type: "lecture",
          instructor: "Dr. John Smith",
        },
        enabled: false,
      });
    });

    it("should create multiple events from multiple classes", () => {
      const classes = [
        {
          time: "Monday 14:00-15:30",
          code: "IP-18fWPEG-90",
          title: "Introduction to Programming",
          type: "lecture",
          location: "North Building 0.101",
          instructor: "Dr. John Smith",
        },
        {
          time: "Wednesday 16:00-17:30",
          code: "IP-18fKVFPG-91",
          title: "Introduction to Programming",
          type: "practice",
          location: "South Building 2.202",
          instructor: "Teaching Assistant",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe(undefined); // type is in extendedProps
      expect(events[0].extendedProps.type).toBe("lecture");
      expect(events[1].extendedProps.type).toBe("practice");
    });

    it("should filter out classes with invalid time", () => {
      const classes = [
        {
          time: "Invalid time format",
          code: "IP-18fWPEG-90",
          title: "Introduction to Programming",
          type: "lecture",
          location: "North Building 0.101",
          instructor: "Dr. John Smith",
        },
        {
          time: "Wednesday 16:00-17:30",
          code: "IP-18fKVFPG-91",
          title: "Introduction to Programming",
          type: "practice",
          location: "South Building 2.202",
          instructor: "Teaching Assistant",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events).toHaveLength(1);
      expect(events[0].code).toBe("IP-18fKVFPG-91");
      expect(events[0].description).toContain("IP-18fKVFPG-91");
    });

    it("should handle empty array", () => {
      const events = createCalendarEvents([]);
      expect(events).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      const events = createCalendarEvents("not an array");
      expect(events).toEqual([]);
    });

    it("should filter out null/undefined classes", () => {
      const classes = [
        {
          time: "Monday 14:00-15:30",
          code: "IP-18fWPEG-90",
          title: "Introduction to Programming",
          type: "lecture",
          location: "North Building 0.101",
          instructor: "Dr. John Smith",
        },
        null,
        undefined,
        {
          time: "Wednesday 16:00-17:30",
          code: "IP-18fKVFPG-91",
          title: "Introduction to Programming",
          type: "practice",
          location: "South Building 2.202",
          instructor: "Teaching Assistant",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events).toHaveLength(2);
    });

    it("should set enabled to false by default", () => {
      const classes = [
        {
          time: "Monday 14:00-15:30",
          code: "IP-18fWPEG-90",
          title: "Introduction to Programming",
          type: "lecture",
          location: "North Building 0.101",
          instructor: "Dr. John Smith",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events[0].enabled).toBe(false);
    });

    it("should include all extendedProps correctly", () => {
      const classes = [
        {
          time: "Thursday 10:00-11:30",
          code: "MATH-201-01",
          title: "Advanced Mathematics",
          type: "seminar",
          location: "Math Building 1.101",
          instructor: "Prof. Jane Doe",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events[0].extendedProps).toEqual({
        location: "Math Building 1.101",
        type: "seminar",
        instructor: "Prof. Jane Doe",
      });
    });

    it("should format title with type in parentheses", () => {
      const classes = [
        {
          time: "Friday 12:00-13:30",
          code: "CS-101-01",
          title: "Computer Science Basics",
          type: "laboratory",
          location: "Lab 3.301",
          instructor: "Lab Tech",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events[0].title).toBe("Computer Science Basics (laboratory)");
    });

    it("should format description with code and instructor", () => {
      const classes = [
        {
          time: "Tuesday 08:00-09:30",
          code: "PHYS-101-01",
          title: "Physics I",
          type: "lecture",
          location: "Physics Building",
          instructor: "Dr. Einstein",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events[0].description).toBe(
        "PHYS-101-01\nInstructor: Dr. Einstein",
      );
    });

    it("should handle classes with early morning time", () => {
      const classes = [
        {
          time: "Monday 8:00-9:30",
          code: "EARLY-101",
          title: "Early Morning Class",
          type: "lecture",
          location: "Building A",
          instructor: "Morning Person",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events[0].startTime).toBe("08:00");
      expect(events[0].endTime).toBe("09:30");
    });

    it("should handle all weekdays", () => {
      const classes = [
        {
          time: "Monday 10:00-11:30",
          code: "C1",
          title: "Class 1",
          type: "lecture",
          location: "A",
          instructor: "T1",
        },
        {
          time: "Tuesday 10:00-11:30",
          code: "C2",
          title: "Class 2",
          type: "lecture",
          location: "B",
          instructor: "T2",
        },
        {
          time: "Wednesday 10:00-11:30",
          code: "C3",
          title: "Class 3",
          type: "lecture",
          location: "C",
          instructor: "T3",
        },
        {
          time: "Thursday 10:00-11:30",
          code: "C4",
          title: "Class 4",
          type: "lecture",
          location: "D",
          instructor: "T4",
        },
        {
          time: "Friday 10:00-11:30",
          code: "C5",
          title: "Class 5",
          type: "lecture",
          location: "E",
          instructor: "T5",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events).toHaveLength(5);
      expect(events[0].dayOfWeek).toBe("Monday");
      expect(events[1].dayOfWeek).toBe("Tuesday");
      expect(events[2].dayOfWeek).toBe("Wednesday");
      expect(events[3].dayOfWeek).toBe("Thursday");
      expect(events[4].dayOfWeek).toBe("Friday");
    });

    it("should handle empty location", () => {
      const classes = [
        {
          time: "Monday 14:00-15:30",
          code: "ONLINE-101",
          title: "Online Class",
          type: "lecture",
          location: "",
          instructor: "Dr. Remote",
        },
      ];

      const events = createCalendarEvents(classes);

      expect(events[0].extendedProps.location).toBe("");
    });
  });
});
