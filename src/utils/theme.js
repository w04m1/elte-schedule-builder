import { get, writable } from "svelte/store";
import { STORAGE_KEYS } from "./storageKeys.js";

export const THEME_PREFERENCES = ["system", "light", "dark"];

export const themePreference = writable("system");
export const resolvedTheme = writable("light");

function readStoredPreference(storage) {
  try {
    const stored = storage.getItem(STORAGE_KEYS.theme);
    return THEME_PREFERENCES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference, prefersDark = false) {
  if (preference === "light" || preference === "dark") return preference;
  return prefersDark ? "dark" : "light";
}

function systemPrefersDark() {
  return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
}

function applyPreference(preference) {
  const resolved = resolveTheme(preference, systemPrefersDark());
  resolvedTheme.set(resolved);
  document.documentElement.dataset.theme = resolved;
}

let mediaQuery;
let mediaListener;

/**
 * Initialize the theme from the stored preference, following the device
 * color-scheme setting while no explicit preference was saved.
 */
export function initTheme(storage = localStorage) {
  mediaQuery?.removeEventListener?.("change", mediaListener);

  const preference = readStoredPreference(storage);
  themePreference.set(preference);
  applyPreference(preference);

  mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  mediaListener = () => {
    if (get(themePreference) === "system") applyPreference("system");
  };
  mediaQuery?.addEventListener?.("change", mediaListener);
}

export function setThemePreference(preference, storage = localStorage) {
  if (!THEME_PREFERENCES.includes(preference)) return;
  themePreference.set(preference);
  try {
    storage.setItem(STORAGE_KEYS.theme, preference);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies.
  }
  applyPreference(preference);
}

export function cycleThemePreference(storage = localStorage) {
  const current = get(themePreference);
  const next =
    THEME_PREFERENCES[
      (THEME_PREFERENCES.indexOf(current) + 1) % THEME_PREFERENCES.length
    ];
  setThemePreference(next, storage);
  return next;
}
