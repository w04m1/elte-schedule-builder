import { describe, expect, it, vi } from "vitest";
import {
  buildTanrendUrl,
  isValidSubjectCode,
  isValidSubjectName,
  MAX_SUBJECT_CODE_LENGTH,
  MAX_SUBJECT_NAME_LENGTH,
  validateSubjectCode,
  validateSubjectSearch,
} from "../../server/tanrend.js";

describe("subject code validation", () => {
  it.each(["IP-18fWPEG", "MATH-201", "DEMO-6", "code_1.test"])(
    "accepts %s",
    (code) => expect(isValidSubjectCode(code)).toBe(true),
  );

  it.each(["", "IP 18", "IP&k=other", "IP?x=1", "../subject", "code%26x"])(
    "rejects %s",
    (code) => expect(isValidSubjectCode(code)).toBe(false),
  );

  it("rejects oversized codes before continuing", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const next = vi.fn();

    validateSubjectCode(
      { params: { code: "A".repeat(MAX_SUBJECT_CODE_LENGTH + 1) } },
      { status, json },
      next,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Invalid subject code" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("subject name validation", () => {
  it.each([
    "Algorithms and Data Structures",
    "Valószínűségszámítás",
    "C++ programming (L+Pr.)",
  ])("accepts %s", (name) => expect(isValidSubjectName(name)).toBe(true));

  it.each(["", "   ", "Algorithms\nOther"])("rejects %s", (name) =>
    expect(isValidSubjectName(name)).toBe(false),
  );

  it("rejects oversized names and unsupported search modes", () => {
    expect(isValidSubjectName("A".repeat(MAX_SUBJECT_NAME_LENGTH + 1))).toBe(
      false,
    );

    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const next = vi.fn();
    validateSubjectSearch(
      { params: { query: "Algorithms" }, query: { by: "tutor" } },
      { status, json },
      next,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "Invalid subject search mode",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("Tanrend URL construction", () => {
  it("keeps subject input inside the k query parameter", () => {
    const url = new URL(buildTanrendUrl("IP&k=other", "2025-2026-1"));

    expect(url.origin).toBe("https://tanrend.elte.hu");
    expect(url.searchParams.get("f")).toBe("2025-2026-1");
    expect(url.searchParams.get("m")).toBe("keres_kod_azon");
    expect(url.searchParams.getAll("k")).toEqual(["IP&k=other"]);
  });

  it("uses Tanrend's subject-name search mode", () => {
    const url = new URL(
      buildTanrendUrl("Algorithms and Data Structures", "2025-2026-1", "name"),
    );

    expect(url.searchParams.get("m")).toBe("keresnevre");
    expect(url.searchParams.get("k")).toBe("Algorithms and Data Structures");
  });

  it("uses Tanrend's tutor-name search mode for professor searches", () => {
    const url = new URL(
      buildTanrendUrl("Pataki Norbert", "2025-2026-1", "instructor"),
    );

    expect(url.searchParams.get("m")).toBe("keres_okt");
    expect(url.searchParams.get("k")).toBe("Pataki Norbert");
  });
});
