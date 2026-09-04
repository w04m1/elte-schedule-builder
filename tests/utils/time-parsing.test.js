import { describe, it, expect } from "vitest";
import { parseTimeString } from "../../src/utils/schedule.js";

describe("Time Parsing", () => {
  describe("parseTimeString", () => {
    it("should parse Monday morning time correctly", () => {
      const result = parseTimeString("Monday 8:00-9:30");
      expect(result).toEqual({
        dayOfWeek: "Monday",
        startTime: "08:00",
        endTime: "09:30",
      });
    });

    it("should parse Tuesday afternoon time correctly", () => {
      const result = parseTimeString("Tuesday 14:00-15:30");
      expect(result).toEqual({
        dayOfWeek: "Tuesday",
        startTime: "14:00",
        endTime: "15:30",
      });
    });

    it("should parse Wednesday evening time correctly", () => {
      const result = parseTimeString("Wednesday 18:00-19:30");
      expect(result).toEqual({
        dayOfWeek: "Wednesday",
        startTime: "18:00",
        endTime: "19:30",
      });
    });

    it("should parse Thursday time correctly", () => {
      const result = parseTimeString("Thursday 10:15-11:45");
      expect(result).toEqual({
        dayOfWeek: "Thursday",
        startTime: "10:15",
        endTime: "11:45",
      });
    });

    it("should parse Friday time correctly", () => {
      const result = parseTimeString("Friday 16:00-17:30");
      expect(result).toEqual({
        dayOfWeek: "Friday",
        startTime: "16:00",
        endTime: "17:30",
      });
    });

    it("should pad single-digit hours correctly", () => {
      const result = parseTimeString("Monday 9:00-10:30");
      expect(result).toEqual({
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:30",
      });
    });

    it("should handle two single-digit hours", () => {
      const result = parseTimeString("Wednesday 8:00-9:30");
      expect(result).toEqual({
        dayOfWeek: "Wednesday",
        startTime: "08:00",
        endTime: "09:30",
      });
    });

    it("should return null for empty string", () => {
      const result = parseTimeString("");
      expect(result).toBeNull();
    });

    it('should return null for "Weeks: " string', () => {
      const result = parseTimeString("Weeks: ");
      expect(result).toBeNull();
    });

    it("should return null for invalid format", () => {
      const result = parseTimeString("Invalid time format");
      expect(result).toBeNull();
    });

    it("should return null for missing day of week", () => {
      const result = parseTimeString("14:00-15:30");
      expect(result).toBeNull();
    });

    it("should return null for missing time range", () => {
      const result = parseTimeString("Monday");
      expect(result).toBeNull();
    });

    it("should return null for malformed time", () => {
      const result = parseTimeString("Monday 14:00");
      expect(result).toBeNull();
    });

    it("should return null for weekend days", () => {
      const result = parseTimeString("Saturday 10:00-11:30");
      expect(result).toBeNull();
    });

    it("should handle time with extra whitespace", () => {
      const result = parseTimeString("Monday  14:00-15:30");
      expect(result).toEqual({
        dayOfWeek: "Monday",
        startTime: "14:00",
        endTime: "15:30",
      });
    });
  });
});
