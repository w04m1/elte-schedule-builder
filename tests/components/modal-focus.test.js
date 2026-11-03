import { fireEvent, render, screen } from "@testing-library/svelte";
import { expect, it, vi } from "vitest";
import ConfirmDialog from "../../src/components/ConfirmDialog.svelte";

it("keeps reverse tab inside a newly opened dialog", async () => {
  render(ConfirmDialog, {
    isOpen: true,
    title: "Clear plan",
    confirmLabel: "Clear",
    onCancel: vi.fn(),
  });
  const dialog = screen.getByRole("alertdialog");
  dialog.focus();
  await fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Clear" }),
  );
});
