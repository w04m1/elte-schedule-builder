import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../../server/index.js";
import { setupDatabase } from "../../server/cache.js";

const logger = { log: vi.fn(), error: vi.fn() };
const termProvider = () => "2026-2027-1";
let database;
let server;
let staticFixtureRoot;

async function startApp(options = {}) {
  const { app, cleanupCache } = createApp({
    database,
    requestDelay: 0,
    termProvider,
    logger,
    ...options,
  });
  server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () =>
      resolve(listeningServer),
    );
  });
  const { port } = server.address();
  return {
    cleanupCache,
    get: (path) => fetch(`http://127.0.0.1:${port}${path}`),
  };
}

beforeEach(async () => {
  database = await setupDatabase(":memory:");
  logger.log.mockClear();
  logger.error.mockClear();
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  }
  await database.close();
  if (staticFixtureRoot) {
    await rm(staticFixtureRoot, { recursive: true, force: true });
    staticFixtureRoot = undefined;
  }
});

describe("subject API integration", () => {
  it("serves only files inside the configured static root", async () => {
    staticFixtureRoot = await mkdtemp(
      path.join(tmpdir(), "elte-schedule-static-"),
    );
    const staticDirectory = path.join(staticFixtureRoot, "dist");
    await mkdir(staticDirectory);
    await writeFile(path.join(staticDirectory, "index.html"), "spa shell");
    await writeFile(path.join(staticDirectory, "guide.png"), "public image");
    await writeFile(
      path.join(staticFixtureRoot, "secret.txt"),
      "sibling secret",
    );
    await writeFile(path.join(staticDirectory, ".env"), "static secret");

    const { get } = await startApp({ staticDirectory });

    const publicAsset = await get("/guide.png");
    expect(publicAsset.status).toBe(200);
    expect(await publicAsset.text()).toBe("public image");

    const spaNavigation = await get("/tanrend");
    expect(spaNavigation.status).toBe(200);
    expect(await spaNavigation.text()).toBe("spa shell");

    for (const requestPath of [
      "/.env",
      "/.git/config",
      "/package.json",
      "/server.js",
      "/../secret.txt",
      "/%2e%2e%2fsecret.txt",
      "/%252e%252e%252fsecret.txt",
      "/api/private-file",
    ]) {
      const response = await get(requestPath);
      const body = await response.text();
      expect(response.status, requestPath).toBe(404);
      expect(body, requestPath).not.toContain("sibling secret");
      expect(body, requestPath).not.toContain("static secret");
    }
  });

  it("serves DEMO data without calling the upstream", async () => {
    const fetchSubject = vi.fn();
    const { get } = await startApp({ fetchSubject });

    const response = await get("/api/subject/DEMO-1");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Introduction to Web Development");
    expect(body).toContain("DEMO-1-1 (lecture)");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(fetchSubject).not.toHaveBeenCalled();
  });

  it("rejects invalid decoded subject codes", async () => {
    const { get } = await startApp();

    const response = await get("/api/subject/IP%26other");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid subject code",
    });
  });

  it("caches an upstream response and reuses it", async () => {
    const upstreamHtml =
      '<table id="resulttable"><tbody><tr><td>cached</td></tr></tbody></table>';
    const fetchSubject = vi.fn().mockResolvedValue(upstreamHtml);
    const { get } = await startApp({ fetchSubject });

    const first = await get("/api/subject/IK-TEST");
    const second = await get("/api/subject/IK-TEST");

    expect(await first.text()).toBe(upstreamHtml);
    expect(await second.text()).toBe(upstreamHtml);
    expect(fetchSubject).toHaveBeenCalledOnce();
    expect(fetchSubject).toHaveBeenCalledWith("IK-TEST", "2026-2027-1");
    await expect(
      database.get("SELECT COUNT(*) AS count FROM cache"),
    ).resolves.toEqual({ count: 1 });
  });

  it("searches by subject name and caches it separately from code search", async () => {
    const upstreamHtml =
      '<table id="resulttable"><tbody><tr><td>name result</td></tr></tbody></table>';
    const fetchSubject = vi.fn().mockResolvedValue(upstreamHtml);
    const { get } = await startApp({ fetchSubject });

    const first = await get(
      "/api/subject/Algorithms%20and%20Data%20Structures?by=name",
    );
    const second = await get(
      "/api/subject/Algorithms%20and%20Data%20Structures?by=name",
    );

    expect(first.status).toBe(200);
    expect(await first.text()).toBe(upstreamHtml);
    expect(await second.text()).toBe(upstreamHtml);
    expect(fetchSubject).toHaveBeenCalledOnce();
    expect(fetchSubject).toHaveBeenCalledWith(
      "Algorithms and Data Structures",
      "2026-2027-1",
      "name",
    );
  });

  it("searches by professor and caches it separately", async () => {
    const upstreamHtml =
      '<table id="resulttable"><tbody><tr><td>professor result</td></tr></tbody></table>';
    const fetchSubject = vi.fn().mockResolvedValue(upstreamHtml);
    const { get } = await startApp({ fetchSubject });

    const first = await get("/api/subject/Pataki%20Norbert?by=instructor");
    const second = await get("/api/subject/Pataki%20Norbert?by=instructor");

    expect(first.status).toBe(200);
    expect(await first.text()).toBe(upstreamHtml);
    expect(await second.text()).toBe(upstreamHtml);
    expect(fetchSubject).toHaveBeenCalledOnce();
    expect(fetchSubject).toHaveBeenCalledWith(
      "Pataki Norbert",
      "2026-2027-1",
      "instructor",
    );
  });

  it("coalesces concurrent cache misses for the same subject", async () => {
    let release;
    const fetchSubject = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const { get } = await startApp({ fetchSubject });

    const first = get("/api/subject/IK-SAME");
    const second = get("/api/subject/IK-SAME");
    await vi.waitFor(() => expect(fetchSubject).toHaveBeenCalledOnce());
    release("same response");

    expect(await (await first).text()).toBe("same response");
    expect(await (await second).text()).toBe("same response");
  });

  it("returns the upstream status without exposing upstream details", async () => {
    const upstreamError = Object.assign(new Error("private upstream detail"), {
      response: { status: 503 },
    });
    const { get } = await startApp({
      fetchSubject: vi.fn().mockRejectedValue(upstreamError),
    });

    const response = await get("/api/subject/IK-FAIL");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch subject data",
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("cleans expired cache entries while retaining current entries", async () => {
    let currentTime = 10_000;
    await database.run("INSERT INTO cache VALUES (?, ?, ?)", "old", '"old"', 1);
    await database.run(
      "INSERT INTO cache VALUES (?, ?, ?)",
      "current",
      '"current"',
      currentTime,
    );
    const { cleanupCache } = await startApp({
      cacheDuration: 1_000,
      now: () => currentTime,
    });

    await cleanupCache();

    await expect(
      database.all("SELECT key FROM cache ORDER BY key"),
    ).resolves.toEqual([{ key: "current" }]);
  });
});
