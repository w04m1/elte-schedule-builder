import { describe, expect, it, vi } from "vitest";
import { createSubjectRateLimiter } from "../../server/rate-limit.js";

function createResponse() {
  const headers = {};
  return {
    headers,
    setHeader: vi.fn((name, value) => {
      headers[name.toLowerCase()] = value;
    }),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function createRequest(ip = "127.0.0.1") {
  // express-rate-limit validates the Express "trust proxy" setting through
  // req.app, so requests need a minimal app stub.
  return { ip, headers: {}, app: { get: () => false } };
}

describe("subject API rate limiter", () => {
  it("passes requests under the limit and sets standard headers", async () => {
    const limiter = createSubjectRateLimiter({ limit: 2 });
    const next = vi.fn();
    const response = createResponse();

    await limiter(createRequest(), response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
    expect(response.headers["ratelimit-limit"]).toBe("2");
    expect(response.headers["ratelimit-remaining"]).toBe("1");
  });

  it("returns 429 after the configured client limit", async () => {
    const limiter = createSubjectRateLimiter({ limit: 1, windowMs: 60_000 });
    const next = vi.fn();
    const firstResponse = createResponse();
    const limitedResponse = createResponse();

    await limiter(createRequest(), firstResponse, next);
    await limiter(createRequest(), limitedResponse, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(limitedResponse.status).toHaveBeenCalledWith(429);
    expect(limitedResponse.json).toHaveBeenCalledWith({
      error: "Too many subject requests",
    });
    const retryAfter = Number(limitedResponse.headers["retry-after"]);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("tracks clients independently", async () => {
    const limiter = createSubjectRateLimiter({ limit: 1 });
    const next = vi.fn();

    await limiter(createRequest("127.0.0.1"), createResponse(), next);
    await limiter(createRequest("127.0.0.2"), createResponse(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("starts a fresh window after the reset time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    try {
      const limiter = createSubjectRateLimiter({
        limit: 1,
        windowMs: 1000,
      });
      const next = vi.fn();

      await limiter(createRequest(), createResponse(), next);
      await limiter(createRequest(), createResponse(), next);
      expect(next).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date("2026-01-01T00:00:02Z"));
      await limiter(createRequest(), createResponse(), next);
      expect(next).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
