import { rateLimit } from "express-rate-limit";

/**
 * Per-IP limiter for the subject API.
 *
 * Emits standard RateLimit-* headers and keeps the previous response
 * contract: HTTP 429 with a JSON body and a Retry-After header.
 */
export function createSubjectRateLimiter({
  windowMs = 60 * 1000,
  limit = 60,
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-6",
    legacyHeaders: false,
    handler: (req, res) => {
      const resetSeconds = Math.max(
        1,
        Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      );
      res.setHeader("Retry-After", String(resetSeconds));
      res.status(429).json({ error: "Too many subject requests" });
    },
  });
}
