import { describe, it, expect } from "vitest";
import {
  decodeSchedule as processImportString,
  encodeSchedule as generateShareString,
} from "../../src/utils/schedule.js";

describe("Import/Export String Processing", () => {
  describe("processImportString", () => {
    it("should decode a simple import string with one subject", () => {
      // "IP-18fWPEG{90}|0" in base64
      const base64 = btoa("IP-18fWPEG{90}|0");
      const result = processImportString(base64);

      expect(result.baseCodes).toBe("IP-18fWPEG-90");
      expect(result.fullCodes).toEqual(["IP-18fWPEG-90"]);
      expect(result.lectureExemption).toBe(false);
    });

    it("should decode import string with lecture exemption enabled", () => {
      const base64 = btoa("IP-18fWPEG{90}|1");
      const result = processImportString(base64);

      expect(result.lectureExemption).toBe(true);
    });

    it("should decode import string with multiple groups of same subject", () => {
      const base64 = btoa("IP-18fWPEG{90,91}|0");
      const result = processImportString(base64);

      expect(result.baseCodes).toBe("IP-18fWPEG-90 IP-18fWPEG-91");
      expect(result.fullCodes).toEqual(["IP-18fWPEG-90", "IP-18fWPEG-91"]);
    });

    it("should decode import string with multiple subjects", () => {
      const base64 = btoa("IP-18fWPEG{90}|MATH-201{01}|0");
      const result = processImportString(base64);

      expect(result.baseCodes).toBe("IP-18fWPEG-90 MATH-201-01");
      expect(result.fullCodes).toEqual(["IP-18fWPEG-90", "MATH-201-01"]);
    });

    it("should handle OTHER prefix for standalone codes", () => {
      const base64 = btoa("OTHER{STANDALONE1,STANDALONE2}|0");
      const result = processImportString(base64);

      expect(result.baseCodes).toBe("STANDALONE1 STANDALONE2");
      expect(result.fullCodes).toEqual(["STANDALONE1", "STANDALONE2"]);
    });

    it("should handle mixed prefixes and OTHER", () => {
      const base64 = btoa("IP-18fWPEG{90}|OTHER{STANDALONE}|0");
      const result = processImportString(base64);

      expect(result.baseCodes).toBe("IP-18fWPEG-90 STANDALONE");
      expect(result.fullCodes).toEqual(["IP-18fWPEG-90", "STANDALONE"]);
    });

    it("should remove duplicate codes in baseCodes", () => {
      const base64 = btoa("IP-18fWPEG{90}|IP-18fWPEG{90}|0");
      const result = processImportString(base64);

      expect(result.baseCodes).toBe("IP-18fWPEG-90");
    });

    it("should handle empty groups", () => {
      const base64 = btoa("IP-18fWPEG{}|0");
      const result = processImportString(base64);

      // Empty groups produce 'IP-18fWPEG-' which is expected behavior
      expect(result.baseCodes).toBe("IP-18fWPEG-");
      expect(result.fullCodes).toEqual(["IP-18fWPEG-"]);
    });

    it("should return empty result for invalid base64", () => {
      const result = processImportString("invalid!!!base64");

      expect(result.baseCodes).toBe("");
      expect(result.fullCodes).toEqual([]);
      expect(result.lectureExemption).toBe(false);
    });

    it("should handle complex multi-subject import", () => {
      const base64 = btoa(
        "IP-18fWPEG{90,91}|MATH-201{01,02,03}|CS-101{A-01}|1",
      );
      const result = processImportString(base64);

      expect(result.lectureExemption).toBe(true);
      expect(result.fullCodes).toEqual([
        "IP-18fWPEG-90",
        "IP-18fWPEG-91",
        "MATH-201-01",
        "MATH-201-02",
        "MATH-201-03",
        "CS-101-A-01",
      ]);
    });
  });

  describe("generateShareString", () => {
    it("should generate share string for single subject", () => {
      const codes = ["IP-18fWPEG-90"];
      const result = generateShareString(codes, false);
      const decoded = atob(result);

      expect(decoded).toBe("IP{18fWPEG-90}|0");
    });

    it("should generate share string with lecture exemption", () => {
      const codes = ["IP-18fWPEG-90"];
      const result = generateShareString(codes, true);
      const decoded = atob(result);

      expect(decoded).toBe("IP{18fWPEG-90}|1");
    });

    it("should group multiple codes with same prefix", () => {
      const codes = ["IP-18fWPEG-90", "IP-18fWPEG-91"];
      const result = generateShareString(codes, false);
      const decoded = atob(result);

      expect(decoded).toBe("IP{18fWPEG-90,18fWPEG-91}|0");
    });

    it("should handle multiple different subjects", () => {
      const codes = ["IP-18fWPEG-90", "MATH-201-01"];
      const result = generateShareString(codes, false);
      const decoded = atob(result);

      // Order might vary, so check both possibilities
      expect([
        "IP{18fWPEG-90}|MATH{201-01}|0",
        "MATH{201-01}|IP{18fWPEG-90}|0",
      ]).toContain(decoded);
    });

    it("should handle standalone codes as OTHER", () => {
      const codes = ["STANDALONE"];
      const result = generateShareString(codes, false);
      const decoded = atob(result);

      expect(decoded).toBe("OTHER{STANDALONE}|0");
    });

    it("should handle mixed subject codes and standalone codes", () => {
      const codes = ["IP-18fWPEG-90", "STANDALONE"];
      const result = generateShareString(codes, false);
      const decoded = atob(result);

      // Should contain both types
      expect(decoded).toContain("IP{18fWPEG-90}");
      expect(decoded).toContain("OTHER{STANDALONE}");
      expect(decoded).toContain("|0");
    });

    it("should handle empty codes array", () => {
      const codes = [];
      const result = generateShareString(codes, false);
      const decoded = atob(result);

      expect(decoded).toBe("|0");
    });

    it("should be reversible with processImportString", () => {
      const originalCodes = ["IP-18fWPEG-90", "IP-18fWPEG-91", "MATH-201-01"];
      const exemption = true;

      const encoded = generateShareString(originalCodes, exemption);
      const decoded = processImportString(encoded);

      expect(decoded.lectureExemption).toBe(exemption);
      expect(decoded.fullCodes.sort()).toEqual(originalCodes.sort());
    });

    it("should handle complex multi-subject schedule", () => {
      const codes = [
        "IP-18fWPEG-90",
        "IP-18fWPEG-91",
        "MATH-201-01",
        "MATH-201-02",
        "CS-101-A-01",
        "STANDALONE",
      ];
      const result = generateShareString(codes, true);
      const decoded = atob(result);

      expect(decoded).toContain("IP{18fWPEG-90,18fWPEG-91}");
      expect(decoded).toContain("MATH{201-01,201-02}");
      expect(decoded).toContain("CS{101-A-01}");
      expect(decoded).toContain("OTHER{STANDALONE}");
      expect(decoded).toContain("|1");
    });
  });

  describe("Import/Export Round-trip", () => {
    it("round-trips instructor-aware event identities in the v2 payload", () => {
      const identities = [
        "esst116-1\u0000thursday\u000016:00\u000018:00\u0000practice\u0000lé 2.84\u0000szeitl blanka veronika",
      ];

      const encoded = generateShareString(["ESST116-1"], false, identities);
      const decoded = processImportString(encoded);

      expect(atob(encoded).startsWith("V2|")).toBe(true);
      expect(decoded).toEqual({
        baseCodes: "ESST116-1",
        fullCodes: ["ESST116-1"],
        eventIdentities: identities,
        lectureExemption: false,
      });
    });

    it("should maintain data integrity through encode-decode cycle", () => {
      const testCases = [
        {
          codes: ["IP-18fWPEG-90"],
          exemption: false,
        },
        {
          codes: ["IP-18fWPEG-90", "IP-18fWPEG-91", "MATH-201-01"],
          exemption: true,
        },
        {
          codes: ["STANDALONE1", "STANDALONE2"],
          exemption: false,
        },
        {
          codes: ["IP-18fWPEG-90", "MATH-201-01", "CS-101-A-01", "STANDALONE"],
          exemption: true,
        },
      ];

      testCases.forEach(({ codes, exemption }) => {
        const encoded = generateShareString(codes, exemption);
        const decoded = processImportString(encoded);

        expect(decoded.lectureExemption).toBe(exemption);
        expect(decoded.fullCodes.sort()).toEqual(codes.sort());
      });
    });
  });
});
