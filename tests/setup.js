import { afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

afterEach(async () => {
  const renderedScheduleX = document.querySelector(
    ".sx-svelte-calendar-wrapper",
  );
  cleanup();

  // Preact's browser fallback can leave a short post-render timer behind even
  // after Schedule-X is destroyed. Let it drain while jsdom globals still exist.
  if (renderedScheduleX) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});

if (typeof window !== "undefined") {
  global.window = window;
  global.document = document;
  // Node >= 25 exposes a global localStorage that vitest's jsdom setup will
  // not replace, so tests would run against Node's storage instead of the
  // browser API. Prefer the jsdom window's storage when it is available.
  global.localStorage =
    globalThis.jsdom?.window?.localStorage ?? window.localStorage;

  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
