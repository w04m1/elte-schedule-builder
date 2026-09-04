import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_PREFERENCES,
  cycleThemePreference,
  initTheme,
  resolveTheme,
  setThemePreference,
  resolvedTheme,
  themePreference,
} from "../../src/utils/theme.js";
import { get } from "svelte/store";
import { readFileSync } from "node:fs";
import { STORAGE_KEYS } from "../../src/utils/storageKeys.js";

const appStyles = readFileSync("src/app.css", "utf8");

function readHexTokens(selector) {
  const selectorStart = appStyles.indexOf(selector);
  const blockStart = appStyles.indexOf("{", selectorStart);
  const blockEnd = appStyles.indexOf("}", blockStart);
  return Object.fromEntries(
    [
      ...appStyles
        .slice(blockStart + 1, blockEnd)
        .matchAll(/(--[\w-]+):\s*(#[\da-f]{6})/gi),
    ].map(([, name, value]) => [name, value]),
  );
}

function contrastRatio(first, second) {
  const luminance = (hex) => {
    const value = Number.parseInt(hex.slice(1), 16);
    const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    return channels
      .map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      })
      .reduce(
        (total, channel, index) =>
          total + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    dump: () => values,
  };
}

function mockMatchMedia(prefersDark) {
  const listeners = [];
  const query = {
    matches: prefersDark,
    addEventListener: (_type, listener) => listeners.push(listener),
    removeEventListener: (_type, listener) => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
    trigger: () => listeners.forEach((listener) => listener()),
    listenerCount: () => listeners.length,
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query),
  );
  return query;
}

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
  });

  it("resolves explicit preferences and follows the device setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("unknown", true)).toBe("dark");
  });

  it("defaults to the device color scheme and applies it to the document", () => {
    mockMatchMedia(true);
    const storage = createStorage();

    initTheme(storage);

    expect(get(themePreference)).toBe("system");
    expect(get(resolvedTheme)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("restores a stored preference over the device setting", () => {
    mockMatchMedia(true);
    const storage = createStorage();
    storage.setItem(STORAGE_KEYS.theme, "light");

    initTheme(storage);

    expect(get(themePreference)).toBe("light");
    expect(get(resolvedTheme)).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("persists an explicit preference and ignores invalid values", () => {
    mockMatchMedia(false);
    const storage = createStorage();

    setThemePreference("dark", storage);
    expect(storage.dump().get(STORAGE_KEYS.theme)).toBe("dark");
    expect(get(resolvedTheme)).toBe("dark");

    setThemePreference("neon", storage);
    expect(storage.dump().get(STORAGE_KEYS.theme)).toBe("dark");
    expect(get(themePreference)).toBe("dark");
  });

  it("survives unavailable storage", () => {
    mockMatchMedia(false);
    const failingStorage = {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      },
    };

    initTheme(failingStorage);
    expect(get(themePreference)).toBe("system");

    setThemePreference("dark", failingStorage);
    expect(get(resolvedTheme)).toBe("dark");
  });

  it("follows device changes while the preference is system", () => {
    const query = mockMatchMedia(false);
    const storage = createStorage();
    initTheme(storage);
    expect(get(resolvedTheme)).toBe("light");

    query.matches = true;
    query.trigger();
    expect(get(resolvedTheme)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("replaces the previous device listener when initialized again", () => {
    const query = mockMatchMedia(false);
    const storage = createStorage();

    initTheme(storage);
    initTheme(storage);

    expect(query.listenerCount()).toBe(1);
    query.matches = true;
    query.trigger();
    expect(get(resolvedTheme)).toBe("dark");
  });

  it("does not follow device changes after an explicit preference", () => {
    const query = mockMatchMedia(false);
    const storage = createStorage();
    initTheme(storage);
    setThemePreference("light", storage);

    query.matches = true;
    query.trigger();
    expect(get(resolvedTheme)).toBe("light");
  });

  it("cycles through all preferences in order", () => {
    mockMatchMedia(false);
    const storage = createStorage();
    initTheme(storage);

    const visited = [];
    for (let i = 0; i < THEME_PREFERENCES.length; i += 1) {
      visited.push(cycleThemePreference(storage));
    }
    expect(visited).toEqual(["light", "dark", "system"]);
    expect(cycleThemePreference(storage)).toBe("light");
  });
});

describe.each([
  ["light", ":root"],
  ["dark", ':root[data-theme="dark"]'],
])("%s palette", (_theme, selector) => {
  const tokens = readHexTokens(selector);

  it("keeps text and solid actions at WCAG AA contrast", () => {
    const pairs = [
      ["--color-text", "--color-bg"],
      ["--color-text-muted", "--color-surface"],
      ["--color-text-faint", "--color-surface"],
      ["--color-accent", "--color-surface"],
      ["--color-danger", "--color-surface"],
      ["--color-warning", "--color-surface"],
      ["--color-info", "--color-surface"],
      ["--color-success", "--color-surface"],
      ["--color-primary-contrast", "--color-primary"],
      ["--color-danger-contrast", "--color-danger-solid"],
      ["--color-warning-contrast", "--color-warning-solid"],
      ["--color-info-contrast", "--color-info-solid"],
      ["--color-event-contrast", "--color-event-lecture"],
      ["--color-event-contrast", "--color-event-practice"],
      ["--color-event-contrast", "--color-event-conflict"],
    ];

    for (const [foreground, background] of pairs) {
      expect(
        contrastRatio(tokens[foreground], tokens[background]),
        `${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps interactive control borders distinguishable", () => {
    expect(
      contrastRatio(tokens["--color-border-strong"], tokens["--color-surface"]),
    ).toBeGreaterThanOrEqual(3);
  });
});
