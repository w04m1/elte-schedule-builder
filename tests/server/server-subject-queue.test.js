import { describe, expect, it, vi } from "vitest";
import {
  QueueCapacityError,
  SubjectRequestQueue,
} from "../../server/subject-queue.js";

describe("SubjectRequestQueue", () => {
  it("waits for the configured delay between upstream requests", async () => {
    vi.useFakeTimers();
    const handler = vi.fn().mockResolvedValue("done");
    const queue = new SubjectRequestQueue({
      handler,
      delay: 500,
      maxQueued: 2,
    });

    try {
      const first = queue.enqueue("FIRST", "term");
      const second = queue.enqueue("SECOND", "term");

      await first;
      expect(handler).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(499);
      expect(handler).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(1);
      await second;
      expect(handler.mock.calls.map(([code]) => code)).toEqual([
        "FIRST",
        "SECOND",
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("coalesces matching requests", async () => {
    let release;
    const handler = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const queue = new SubjectRequestQueue({ handler, delay: 0, maxQueued: 2 });

    const first = queue.enqueue("IP-18fWPEG", "2025-2026-1");
    const duplicate = queue.enqueue("IP-18fWPEG", "2025-2026-1");
    release("result");

    await expect(first).resolves.toBe("result");
    await expect(duplicate).resolves.toBe("result");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not coalesce code and name searches with the same text", async () => {
    const handler = vi.fn((_query, _term, mode) => Promise.resolve(mode));
    const queue = new SubjectRequestQueue({ handler, delay: 0, maxQueued: 2 });

    await expect(queue.enqueue("Algorithms", "term", "code")).resolves.toBe(
      "code",
    );
    await expect(queue.enqueue("Algorithms", "term", "name")).resolves.toBe(
      "name",
    );

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("rejects work beyond the queue capacity", async () => {
    let releaseActive;
    const handler = vi.fn((code) =>
      code === "ACTIVE"
        ? new Promise((resolve) => {
            releaseActive = resolve;
          })
        : Promise.resolve("done"),
    );
    const queue = new SubjectRequestQueue({ handler, delay: 0, maxQueued: 1 });

    const active = queue.enqueue("ACTIVE", "term");
    const queued = queue.enqueue("QUEUED", "term");
    await expect(queue.enqueue("REJECTED", "term")).rejects.toBeInstanceOf(
      QueueCapacityError,
    );

    releaseActive("done");
    await active;
    await queued;
  });

  it("propagates upstream failures to every coalesced request", async () => {
    let release;
    const handler = vi.fn(
      () =>
        new Promise((_resolve, reject) => {
          release = reject;
        }),
    );
    const queue = new SubjectRequestQueue({ handler, delay: 0, maxQueued: 2 });

    const first = queue.enqueue("IK-FAIL", "term");
    const duplicate = queue.enqueue("IK-FAIL", "term");
    release(new Error("upstream down"));

    await expect(first).rejects.toThrow("upstream down");
    await expect(duplicate).rejects.toThrow("upstream down");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
