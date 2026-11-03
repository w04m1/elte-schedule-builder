import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScheduleManager from "../../src/components/ScheduleManager.svelte";

describe("ScheduleManager", () => {
  beforeEach(() => localStorage.clear());

  it("switches and creates schedules through callback props", async () => {
    const onCreate = vi.fn();
    const onSwitch = vi.fn();
    render(ScheduleManager, {
      schedules: [
        { id: "one", name: "Default schedule" },
        { id: "two", name: "Alternative" },
      ],
      activeScheduleId: "one",
      onCreate,
      onSwitch,
    });

    await fireEvent.click(screen.getByRole("button", { name: "New schedule" }));
    await fireEvent.change(screen.getByRole("combobox", { name: "Schedule" }), {
      target: { value: "two" },
    });

    expect(onCreate).toHaveBeenCalledOnce();
    expect(onSwitch).toHaveBeenCalledWith("two");
  });

  it("renames schedules and prevents deleting the only schedule", async () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(ScheduleManager, {
      schedules: [{ id: "one", name: "Default schedule" }],
      activeScheduleId: "one",
      onRename,
      onDelete,
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Rename Default schedule" }),
    );
    await fireEvent.input(screen.getByLabelText("Schedule name"), {
      target: { value: "Semester plan" },
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Save schedule name" }),
    );

    expect(onRename).toHaveBeenCalledWith("one", "Semester plan");
    expect(
      screen.getByRole("button", { name: "Delete Default schedule" }).disabled,
    ).toBe(true);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("keeps the current schedule clear action with the schedule controls", async () => {
    const onReset = vi.fn();
    render(ScheduleManager, {
      schedules: [{ id: "one", name: "Default schedule" }],
      activeScheduleId: "one",
      hasSubjects: true,
      onReset,
    });

    await fireEvent.click(
      screen.getByRole("button", { name: "Clear schedule" }),
    );

    expect(onReset).toHaveBeenCalledOnce();
  });
});
