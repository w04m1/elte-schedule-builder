import { expect, test } from "@playwright/test";

test("long dialogs retain padding and reachable actions on a short phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("/");
  await page.getByRole("button", { name: "Help", exact: true }).click();
  const guide = page.getByRole("dialog");
  await expect(guide).toBeVisible();
  expect(
    await guide.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingLeft),
    ),
  ).toBeGreaterThanOrEqual(16);
  await page
    .getByRole("heading", { name: "Storage and privacy" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "Storage and privacy" }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("DEMO-1");
  await page.getByRole("button", { name: "Find courses", exact: true }).click();
  await page
    .getByRole("button", { name: "Add all groups", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Suggest schedules", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply option 3", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Apply option 3", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Export calendar", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download Google Calendar CSV pack",
      exact: true,
    })
    .click();
  expect((await download).suggestedFilename()).toContain(".csv");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("keeps the week beside expanded course choices on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("DEMO-1");
  await page.getByRole("button", { name: "Find courses", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(4);
  const choices = await page.locator(".builder-workspace").boundingBox();
  const week = await page.locator(".calendar-shell").boundingBox();
  expect(week.x).toBeGreaterThanOrEqual(choices.x + choices.width);
  expect(Math.abs(week.y - choices.y)).toBeLessThan(2);
  expect(week.y).toBeLessThan(360);
});

test("keeps Help reachable without page overflow at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Help", exact: true }),
  ).toBeFocused();
});
