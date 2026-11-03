import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../../src/utils/storageKeys.js";

describe("storage keys", () => {
  it("keeps persisted and legacy keys backward-compatible", () => {
    expect(STORAGE_KEYS).toEqual({
      schedules: "scheduleManager",
      legacySavedSubjects: "savedSubjects",
      legacyLectureExemption: "lectureExemption",
      warningShown: "warningShown",
      faqRead: "faqRead",
      theme: "theme",
      language: "language",
    });
  });
});
