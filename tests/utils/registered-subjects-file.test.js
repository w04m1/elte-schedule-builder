import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("read-excel-file/browser", () => ({ readSheet: vi.fn() }));

import { readSheet } from "read-excel-file/browser";
import {
  extractSubjectCodesFromRows,
  readRegisteredSubjectCodes,
} from "../../src/utils/registeredSubjectsFile.js";

const { mockResolvedValue, mockReset } = vi.mocked(readSheet);

const registeredSubjectsRows = [
  [
    "Name",
    "Status",
    "Code",
    "Credit",
    "No. of times registered for",
    "Requirement",
  ],
  ["Analysis I", "On waiting list", "IP-18fAN1E", 2, 1, "exam"],
  ["Analysis I", "On waiting list", "IP-18fAN1G", 3, 1, "term mark"],
  ["Web programming L+Pr.", "On waiting list", "IP-18fWPEG", 4, 1, "term mark"],
];

describe("extractSubjectCodesFromRows", () => {
  it("extracts unique codes from the Code column", () => {
    expect(extractSubjectCodesFromRows(registeredSubjectsRows)).toEqual([
      "IP-18fAN1E",
      "IP-18fAN1G",
      "IP-18fWPEG",
    ]);
  });

  it("ignores rows without a code value", () => {
    const rows = [
      ["Name", "Code"],
      ["Subject", "IP-18fAA1E"],
      [null, null],
      ["Subject", "  "],
      ["Subject", "IP-18fAA1E"],
    ];

    expect(extractSubjectCodesFromRows(rows)).toEqual(["IP-18fAA1E"]);
  });

  it("finds the Code column even when headers are reordered", () => {
    const rows = [
      ["Credit", "Name", "Code"],
      [2, "Analysis I", "IP-18fAN1E"],
    ];

    expect(extractSubjectCodesFromRows(rows)).toEqual(["IP-18fAN1E"]);
  });

  it("matches the header case-insensitively", () => {
    const rows = [
      ["Name", "code"],
      ["Subject", "IP-18fAN1E"],
    ];

    expect(extractSubjectCodesFromRows(rows)).toEqual(["IP-18fAN1E"]);
  });

  it("returns no codes when no Code column exists", () => {
    expect(
      extractSubjectCodesFromRows([
        ["Name", "Status"],
        ["A", "B"],
      ]),
    ).toEqual([]);
    expect(extractSubjectCodesFromRows([])).toEqual([]);
    expect(extractSubjectCodesFromRows(null)).toEqual([]);
  });
});

describe("readRegisteredSubjectCodes", () => {
  beforeEach(() => {
    mockReset();
  });

  it("reads codes from the uploaded workbook", async () => {
    mockResolvedValue(registeredSubjectsRows);
    const file = new File([""], "registered-subjects.xlsx");

    await expect(readRegisteredSubjectCodes(file)).resolves.toEqual([
      "IP-18fAN1E",
      "IP-18fAN1G",
      "IP-18fWPEG",
    ]);
    expect(readSheet).toHaveBeenCalledWith(file);
  });

  it("propagates parsing failures", async () => {
    mockResolvedValue([["Name"], ["Subject"]]);

    await expect(
      readRegisteredSubjectCodes(new File([""], "bad.xlsx")),
    ).resolves.toEqual([]);
  });
});
