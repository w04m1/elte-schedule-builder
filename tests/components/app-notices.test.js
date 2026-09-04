import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import AppNotices from "../../src/components/AppNotices.svelte";

describe("AppNotices", () => {
  it("renders and closes the general notice", async () => {
    const onCloseWarning = vi.fn();
    render(AppNotices, { showWarning: true, onCloseWarning });

    expect(
      screen.getByRole("heading", {
        name: "Check important details before relying on this schedule",
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();

    await fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onCloseWarning).toHaveBeenCalledOnce();
  });

  it("does not render the notice after it has been dismissed", () => {
    render(AppNotices, { showWarning: false });

    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
  });
});
