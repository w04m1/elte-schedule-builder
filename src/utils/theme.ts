import { get, writable } from "svelte/store";
import { STORAGE_KEYS } from "./storageKeys.js";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = "light" | "dark";

export const themePreference = writable<ThemePreference>("system");
export const resolvedTheme = writable<ResolvedTheme>("light");

function readStoredPreference(storage: Storage): ThemePreference {
  try {
    const stored = storage.getItem(STORAGE_KEYS.theme) as ThemePreference;
    return THEME_PREFERENCES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(
  preference: string,
  prefersDark = false,
): ResolvedTheme {
  if (preference === "light" || preference === "dark") return preference;
  return prefersDark ? "dark" : "light";
}

function systemPrefersDark(): boolean {
  return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
}

function applyPreference(preference: ThemePreference): void {
  const resolved = resolveTheme(preference, systemPrefersDark());
  resolvedTheme.set(resolved);
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.theme = resolved;
  }
}

let mediaQuery: MediaQueryList | undefined;
let mediaListener: (() => void) | undefined;

/**
 * Initialize the theme from the stored preference, following the device
 * color-scheme setting while no explicit preference was saved.
 */
export function initTheme(storage: Storage = localStorage): void {
  if (mediaQuery && mediaListener) {
    mediaQuery.removeEventListener?.("change", mediaListener);
  }

  const preference = readStoredPreference(storage);
  themePreference.set(preference);
  applyPreference(preference);

  if (typeof window !== "undefined" && window.matchMedia) {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaListener = () => {
      if (get(themePreference) === "system") applyPreference("system");
    };
    mediaQuery.addEventListener?.("change", mediaListener);
  }
}

export function setThemePreference(
  preference: ThemePreference,
  storage: Storage = localStorage,
): void {
  if (!THEME_PREFERENCES.includes(preference)) return;
  themePreference.set(preference);
  try {
    storage.setItem(STORAGE_KEYS.theme, preference);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies.
  }
  applyPreference(preference);
}

export function cycleThemePreference(
  storage: Storage = localStorage,
): ThemePreference {
  const current = get(themePreference);
  const next =
    THEME_PREFERENCES[
      (THEME_PREFERENCES.indexOf(current) + 1) % THEME_PREFERENCES.length
    ];
  setThemePreference(next, storage);
  return next;
}
