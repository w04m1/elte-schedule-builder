import { beforeEach, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import {
  detectDeviceLanguage,
  initLanguage,
  language,
  setLanguage,
  t,
} from "../../src/utils/i18n.js";
import { STORAGE_KEYS } from "../../src/utils/storageKeys.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    dump: () => values,
  };
}

describe("language", () => {
  beforeEach(() => {
    language.set("en");
    document.documentElement.lang = "en";
  });

  it("uses Hungarian only when the primary device language is Hungarian", () => {
    expect(detectDeviceLanguage(["hu-HU", "en-US"])).toBe("hu");
    expect(detectDeviceLanguage(["hu"])).toBe("hu");
    expect(detectDeviceLanguage(["en-US", "hu-HU"])).toBe("en");
    expect(detectDeviceLanguage(["de-DE"])).toBe("en");
  });

  it("initializes from the device and updates the document language", () => {
    expect(initLanguage(createStorage(), ["hu-HU"])).toBe("hu");
    expect(get(language)).toBe("hu");
    expect(document.documentElement.lang).toBe("hu");
  });

  it("restores a saved choice over the device language", () => {
    const storage = createStorage({ [STORAGE_KEYS.language]: "en" });
    expect(initLanguage(storage, ["hu-HU"])).toBe("en");
    expect(get(language)).toBe("en");
  });

  it("persists explicit changes and rejects unsupported languages", () => {
    const storage = createStorage();
    expect(setLanguage("hu", storage)).toBe(true);
    expect(storage.dump().get(STORAGE_KEYS.language)).toBe("hu");
    expect(document.documentElement.lang).toBe("hu");
    expect(setLanguage("de", storage)).toBe(false);
    expect(get(language)).toBe("hu");
  });

  it("keeps working when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      },
    };
    expect(initLanguage(storage, ["hu"])).toBe("hu");
    expect(setLanguage("en", storage)).toBe(true);
    expect(get(language)).toBe("en");
  });

  it("falls back to English and interpolates variables", () => {
    expect(t("hu", "deleteScheduleMessage", { name: "Őszi terv" })).toContain(
      "Őszi terv",
    );
    expect(t("de", "help")).toBe("Help");
  });
});
