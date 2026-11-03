import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadableStream } from "node:stream/web";
import { createApp } from "../../server/index.js";
import { createMemoryCacheStore } from "../../server/cache.js";
import {
  buildTanrendUrl,
  fetchSubjectData,
  isValidSubjectCode,
  isValidSubjectName,
  MAX_SUBJECT_CODE_LENGTH,
  MAX_SUBJECT_NAME_LENGTH,
  validateSubjectSearch,
} from "../../server/tanrend.js";

const localFetch = globalThis.fetch;

afterEach(() => vi.unstubAllGlobals());

describe("Tanrend response bounds", () => {
  const limit = 2 * 1024 * 1024;

  it("accepts exactly 2 MiB of UTF-8 and preserves split characters", async () => {
    const text = "á".repeat(limit / 2);
    const bytes = new TextEncoder().encode(text);
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(bytes.subarray(0, 1));
          controller.enqueue(bytes.subarray(1));
          controller.close();
        },
      }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(fetchSubjectData("CODE", "2026-2027-1")).resolves.toBe(text);
  });

  it.each([undefined, "1", String(limit + 1)])(
    "rejects a response one byte over the limit with Content-Length %s",
    async (contentLength) => {
      const headers = contentLength ? { "Content-Length": contentLength } : {};
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(new Response("x".repeat(limit + 1), { headers })),
      );

      await expect(fetchSubjectData("CODE", "2026-2027-1")).rejects.toThrow(
        /exceeds.*2097152.*bytes/,
      );
    },
  );

  it("counts UTF-8 bytes rather than characters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("á".repeat(limit / 2) + "x")),
    );

    await expect(fetchSubjectData("CODE", "2026-2027-1")).rejects.toThrow(
      /exceeds.*2097152.*bytes/,
    );
  });

  it("cancels an oversized stream before requesting its remaining chunks", async () => {
    let pulls = 0;
    let cancelled = false;
    const response = new Response(
      new ReadableStream(
        {
          pull(controller) {
            pulls += 1;
            controller.enqueue(new Uint8Array(pulls === 1 ? limit : 1));
            if (pulls === 3) controller.close();
          },
          cancel() {
            cancelled = true;
          },
        },
        { highWaterMark: 0 },
      ),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(fetchSubjectData("CODE", "2026-2027-1")).rejects.toThrow(
      /exceeds/,
    );
    expect(cancelled).toBe(true);
    expect(pulls).toBe(2);
  });

  it("does not cache oversized upstream responses and still serves demo rows", async () => {
    const cacheStore = createMemoryCacheStore();
    const { app } = createApp({
      cacheStore,
      requestDelay: 0,
      termProvider: () => "2026-2027-1",
      logger: { log() {}, error() {} },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(async () => new Response("x".repeat(limit + 1))),
    );
    const server = await new Promise((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      const response = await localFetch(`${origin}/api/subject/CODE`);
      expect(response.status).toBe(502);
      expect(await cacheStore.get("2026-2027-1-code-CODE")).toBeNull();
      const demo = await localFetch(`${origin}/api/subject/DEMO-1`);
      expect(demo.status).toBe(200);
      expect(await demo.text()).toContain("<tr>");
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

describe("subject code validation", () => {
  it.each(["IP-18fWPEG", "MATH-201", "DEMO-6", "code_1.test"])(
    "accepts %s",
    (code) => expect(isValidSubjectCode(code)).toBe(true),
  );

  it.each(["", "IP 18", "IP&k=other", "IP?x=1", "../subject", "code%26x"])(
    "rejects %s",
    (code) => expect(isValidSubjectCode(code)).toBe(false),
  );

  it("rejects oversized codes", () => {
    expect(isValidSubjectCode("A".repeat(MAX_SUBJECT_CODE_LENGTH + 1))).toBe(
      false,
    );
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
