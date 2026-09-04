import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import FAQ from "../../src/components/FAQ.svelte";
import { language } from "../../src/utils/i18n.js";

describe("FAQ", () => {
  it("does not render the guide while closed", () => {
    render(FAQ, { isOpen: false, onClose: vi.fn() });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the guide and calls onClose from its close button", async () => {
    const onClose = vi.fn();
    render(FAQ, { isOpen: true, onClose });

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Help and guide" }),
    ).toBeTruthy();
    expect(screen.getByText("1. Quick start")).toBeTruthy();
    expect(screen.getByText("6. Share or export")).toBeTruthy();
    expect(screen.getByText(/Always verify the final timetable/)).toBeTruthy();
    expect(
      screen.getByText(
        /Search checks subject codes, course names, and professor names together/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/Small typing errors are tolerated/)).toBeTruthy();
    expect(
      screen.getByText(/Opening a suggestion does not add it/),
    ).toBeTruthy();
    expect(
      screen.getByText("Clear schedule").parentElement.textContent,
    ).toMatch(/current plan/);
    expect(screen.queryByText(/under Search by/)).toBeNull();
    expect(screen.getByText(/does not include analytics/)).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Close guide" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders the complete Hungarian guide", () => {
    language.set("hu");
    render(FAQ, { isOpen: true, onClose: vi.fn() });

    expect(
      screen.getByRole("heading", { name: "Súgó és útmutató" }),
    ).toBeTruthy();
    expect(screen.getByText("1. Gyors kezdés")).toBeTruthy();
    expect(screen.getByText("6. Megosztás és exportálás")).toBeTruthy();
    expect(screen.getByText("Tárolás és adatvédelem")).toBeTruthy();
    language.set("en");
  });
});
