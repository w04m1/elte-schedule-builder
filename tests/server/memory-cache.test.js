import { describe, expect, it, vi } from "vitest";
import { createMemoryCacheStore } from "../../server/cache.js";

describe("memory cache store", () => {
  it("expires entries and keeps the configured maximum", async () => {
    let timestamp = 100;
    const cache = createMemoryCacheStore({
      cacheDuration: 10,
      maxEntries: 2,
      now: () => timestamp,
    });

    await cache.set("first", "one");
    timestamp += 1;
    await cache.set("second", "two");
    timestamp += 1;
    await cache.set("third", "three");

    expect(await cache.get("first")).toBeNull();
    expect(await cache.get("second")).toEqual({ data: "two", timestamp: 101 });

    timestamp = 112;
    expect(await cache.get("second")).toBeNull();
  });

  it("reports expired entries removed by cleanup", async () => {
    let timestamp = 50;
    const logger = { log: vi.fn() };
    const cache = createMemoryCacheStore({
      cacheDuration: 5,
      now: () => timestamp,
      logger,
    });
    await cache.set("subject", "data");

    timestamp = 56;
    await cache.cleanup();

    expect(await cache.get("subject")).toBeNull();
    expect(logger.log).toHaveBeenCalledWith(
      "Cleaned up 1 expired cache entries",
    );
  });
});
