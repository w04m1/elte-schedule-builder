import { describe, expect, it } from "vitest";
import {
  readHttpUrl,
  readPort,
  readPositiveInteger,
} from "../../config/runtime.js";

describe("runtime configuration", () => {
  it("uses defaults when optional values are absent", () => {
    expect(readPort(undefined, 3000, "PORT")).toBe(3000);
    expect(readPort("", 5173, "VITE_DEV_SERVER_PORT")).toBe(5173);
    expect(readHttpUrl(undefined, "http://localhost:3000", "PROXY")).toBe(
      "http://localhost:3000",
    );
  });

  it("accepts valid ports and HTTP(S) URLs", () => {
    expect(readPort("8080", 3000, "PORT")).toBe(8080);
    expect(readHttpUrl("https://example.com/api/", "", "PROXY")).toBe(
      "https://example.com/api",
    );
  });

  it.each(["0", "65536", "1.5", "not-a-port"])(
    "rejects invalid port %s",
    (value) => {
      expect(() => readPort(value, 3000, "PORT")).toThrow(
        "PORT must be an integer between 1 and 65535",
      );
    },
  );

  it.each(["not-a-url", "ftp://example.com"])(
    "rejects invalid proxy URL %s",
    (value) => {
      expect(() => readHttpUrl(value, "", "PROXY")).toThrow(
        "PROXY must be a valid HTTP(S) URL",
      );
    },
  );

  it("falls back to the default for invalid positive integers", () => {
    expect(readPositiveInteger("25", 10)).toBe(25);
    expect(readPositiveInteger(undefined, 10)).toBe(10);
    expect(readPositiveInteger("0", 10)).toBe(10);
    expect(readPositiveInteger("-5", 10)).toBe(10);
    expect(readPositiveInteger("not-a-number", 10)).toBe(10);
  });
});
