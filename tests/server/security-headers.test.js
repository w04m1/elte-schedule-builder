import express from "express";
import { describe, expect, it } from "vitest";
import { createSecurityHeaders } from "../../server/security-headers.js";

async function getHeaders(enableHsts) {
  const app = express();
  app.use(createSecurityHeaders({ enableHsts }));
  app.get("/", (_req, res) => res.send("ok"));

  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () =>
      resolve(listeningServer),
    );
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    return response.headers;
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

describe("security headers", () => {
  it("protects SPA and API responses without forcing HTTPS in development", async () => {
    const headers = await getHeaders(false);
    const csp = headers.get("content-security-policy");

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("yep-im-trackinnnn.w04m1.dev");
    expect(csp).not.toContain("i.imgur.com");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("referrer-policy")).toBe("no-referrer");
    expect(headers.get("strict-transport-security")).toBeNull();
    expect(headers.get("x-powered-by")).toBeNull();
  });

  it("enables HSTS for production responses", async () => {
    const headers = await getHeaders(true);

    expect(headers.get("strict-transport-security")).toBe("max-age=31536000");
    expect(headers.get("content-security-policy")).toContain(
      "upgrade-insecure-requests",
    );
  });
});
