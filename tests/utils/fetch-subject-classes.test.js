import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSubjectClasses } from "../../src/utils/schedule.js";

describe("fetchSubjectClasses", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("encodes the subject code as one path segment", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<table id="resulttable"><tbody></tbody></table>',
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchSubjectClasses("IP&k=other");

    expect(fetchMock).toHaveBeenCalledWith("/api/subject/IP%26k%3Dother");
  });

  it("requests the Tanrend subject-name search mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<table id="resulttable"><tbody></tbody></table>',
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchSubjectClasses("Algorithms and Data Structures", "name");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/subject/Algorithms%20and%20Data%20Structures?by=name",
    );
  });

  it("requests the Tanrend instructor search mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<table id="resulttable"><tbody></tbody></table>',
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchSubjectClasses("Pataki Norbert", "instructor");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/subject/Pataki%20Norbert?by=instructor",
    );
  });

  it("rejects unknown search modes before sending a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSubjectClasses("Algorithms", "tutor")).rejects.toThrow(
      "Unsupported subject search mode",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects HTTP failures so the UI can show an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(fetchSubjectClasses("IK-FAIL")).rejects.toThrow(
      "HTTP error! status: 503",
    );
  });

  it("rejects network failures so the UI can show an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchSubjectClasses("IK-OFFLINE")).rejects.toThrow("offline");
  });
});
