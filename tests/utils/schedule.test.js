import { describe, it, expect } from "vitest";
import { parseTableRow } from "../../src/utils/schedule.js";

describe("Schedule Utilities", () => {
  describe("parseTableRow", () => {
    function createMockRow(data) {
      const row = document.createElement("tr");
      data.forEach((text) => {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.appendChild(cell);
      });
      return row;
    }

    it("should parse a valid lecture row correctly", () => {
      const row = createMockRow([
        "Monday 14:00-15:30",
        "IP-18fWPEG-90 (lecture)",
        "Introduction to Programming",
        "North Building 0.101",
        "",
        "Dr. John Smith",
      ]);

      const result = parseTableRow(row);

      expect(result).toEqual({
        time: "Monday 14:00-15:30",
        title: "Introduction to Programming",
        type: "lecture",
        location: "North Building 0.101",
        instructor: "Dr. John Smith",
        code: "IP-18fWPEG-90",
      });
    });

    it("should parse a valid practice row correctly", () => {
      const row = createMockRow([
        "Wednesday 16:00-17:30",
        "IP-18fKVFPG-91 (practice)",
        "Introduction to Programming",
        "South Building 2.202",
        "",
        "Teaching Assistant",
      ]);

      const result = parseTableRow(row);

      expect(result).toEqual({
        time: "Wednesday 16:00-17:30",
        title: "Introduction to Programming",
        type: "practice",
        location: "South Building 2.202",
        instructor: "Teaching Assistant",
        code: "IP-18fKVFPG-91",
      });
    });

    it("should handle missing location (dash)", () => {
      const row = createMockRow([
        "Friday 10:00-11:30",
        "CS-101-01 (seminar)",
        "Computer Science Seminar",
        "-",
        "",
        "Prof. Jane Doe",
      ]);

      const result = parseTableRow(row);

      expect(result.location).toBe("");
    });

    it("should handle instructor with extra whitespace", () => {
      const row = createMockRow([
        "Tuesday 12:00-13:30",
        "MATH-201-01 (lecture)",
        "Advanced Mathematics",
        "Math Building 1.101",
        "",
        "  Dr. Space Person  ",
      ]);

      const result = parseTableRow(row);

      expect(result.instructor).toBe("Dr. Space Person");
    });

    it("should return null for row with insufficient cells", () => {
      const row = createMockRow([
        "Monday 14:00-15:30",
        "IP-18fWPEG-90 (lecture)",
        "Introduction to Programming",
      ]);

      const result = parseTableRow(row);

      expect(result).toBeNull();
    });

    it("should return null for null row", () => {
      const result = parseTableRow(null);
      expect(result).toBeNull();
    });

    it("should extract type without parentheses", () => {
      const row = createMockRow([
        "Monday 14:00-15:30",
        "IP-18fWPEG-90 (laboratory)",
        "Introduction to Programming",
        "Lab Building 3.301",
        "",
        "Lab Assistant",
      ]);

      const result = parseTableRow(row);

      expect(result.type).toBe("laboratory");
    });

    it("should handle code without type in parentheses", () => {
      const row = createMockRow([
        "Monday 14:00-15:30",
        "IP-18fWPEG-90",
        "Introduction to Programming",
        "North Building 0.101",
        "",
        "Dr. John Smith",
      ]);

      const result = parseTableRow(row);

      expect(result.type).toBe("");
      expect(result.code).toBe("IP-18fWPEG-90");
    });
  });
});
