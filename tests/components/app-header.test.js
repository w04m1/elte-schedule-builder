import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { language } from "../../src/utils/i18n.js";
import AppHeader from "../../src/components/AppHeader.svelte";

describe("AppHeader language switch", () => {
  afterEach(() => {
    language.set("en");
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("switches the interface to Hungarian and persists the choice", async () => {
    render(AppHeader, { onOpenFAQ: vi.fn() });

    await fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "hu" },
    });

    expect(screen.getByRole("button", { name: "Súgó" })).toBeTruthy();
    expect(screen.getByText("A féléved átláthatóan megtervezve.")).toBeTruthy();
    expect(localStorage.getItem("language")).toBe("hu");
    expect(document.documentElement.lang).toBe("hu");
  });
});
