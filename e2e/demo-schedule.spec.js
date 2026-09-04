import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fixturesDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
);

test("uses the device language once and persists an explicit language choice", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3000",
    locale: "hu-HU",
  });
  const page = await context.newPage();
  await page.goto("/");

  const languageSelect = page.getByRole("combobox", { name: "Nyelv" });
  await expect(languageSelect).toHaveValue("hu");
  await expect(page.getByRole("button", { name: "Súgó" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hu");
  await expect(page.locator(".sx__calendar-header")).toBeHidden();
  await expect(
    page.locator(".sx__week-grid__date-number").first(),
  ).toBeHidden();

  await languageSelect.selectOption("en");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue(
    "en",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await context.close();
});

test("adds a DEMO class and keeps it after reload", async ({ page }) => {
  await page.route("**/api/subject/DEMO-1?by=name", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: '<table id="resulttable"><tbody></tbody></table>',
    });
  });
  await page.goto("/");

  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("DEMO-1");
  await page.getByRole("button", { name: "Find courses" }).click();

  const classSections = page.locator(".class-section");
  await expect(classSections.locator("h4")).toHaveText([
    "Lectures",
    "Practices",
  ]);
  await expect(classSections.nth(0).locator(".class-time strong")).toHaveText([
    "Monday 10:00–11:30",
    "Friday 10:00–11:30",
  ]);
  await expect(classSections.nth(1).locator(".class-time strong")).toHaveText([
    "Wednesday 14:00–15:30",
    "Thursday 16:00–17:30",
  ]);

  const selectedRow = page
    .locator(".class-row")
    .filter({ hasText: "Monday 10:00–11:30" })
    .filter({ hasText: "DEMO-1-1" });
  await expect(
    page.getByRole("heading", { name: "Introduction to Web Development" }),
  ).toBeVisible();
  await selectedRow.focus();
  await selectedRow.press("Enter");
  await expect(selectedRow).toHaveAttribute("aria-pressed", "true");
  await expect(selectedRow).toContainText("Selected");
  await expect(
    page.getByText(/Monday 10:00–11:30 selected.*Select another class/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Introduction to Web Development" }),
  ).toBeVisible();

  const selectedPractice = classSections
    .nth(1)
    .locator(".class-row")
    .filter({ hasText: "Wednesday 14:00–15:30" });
  await selectedPractice.click();
  await expect(selectedPractice).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText(/Wednesday 14:00–15:30 selected.*Select another class/),
  ).toBeVisible();
  await expect(classSections).toHaveCount(2);

  const subject = page.getByRole("checkbox", {
    name: "Introduction to Web Development",
  });
  await expect(subject).toBeChecked();
  await page
    .getByRole("button", {
      name: "Edit classes for Introduction to Web Development",
    })
    .click();
  const groupPanel = page.getByRole("group", {
    name: "Groups for Introduction to Web Development",
  });
  await expect(groupPanel.getByRole("heading", { level: 3 })).toHaveText([
    "Lectures",
    "Practices",
  ]);
  const mondayLecture = groupPanel.getByRole("radio", {
    name: "Lecture, group 1, Monday 10:00–11:30",
  });
  const fridayLecture = groupPanel.getByRole("radio", {
    name: "Lecture, group 2, Friday 10:00–11:30",
  });
  const wednesdayPractice = groupPanel.getByRole("radio", {
    name: "Practice, group 1, Wednesday 14:00–15:30",
  });
  await expect(mondayLecture).toBeChecked();
  await expect(wednesdayPractice).toBeChecked();
  await fridayLecture.click();
  await expect(mondayLecture).not.toBeChecked();
  await expect(fridayLecture).toBeChecked();
  await expect(wednesdayPractice).toBeChecked();

  const calendarEvent = page
    .locator(".sx__event.sx-event--is-lecture")
    .filter({ hasText: "Introduction to Web Development" })
    .first();
  await expect(calendarEvent).toBeVisible();
  await calendarEvent.click();
  const eventDetails = page.getByLabel(
    "Introduction to Web Development Lecture details",
  );
  await expect(eventDetails).toBeVisible();
  await expect(eventDetails.getByRole("heading")).toHaveText(
    "Introduction to Web Development",
  );
  await expect(eventDetails).toContainText("Dr. Jane Smith");
  await expect(eventDetails).toContainText("North Building 2.42");
  await expect(eventDetails).toContainText("DEMO-1-2");
  await expect(page.locator(".sx__event-modal__color-icon")).toHaveCount(0);

  const practiceEvent = page
    .locator(".sx__event.sx-event--is-practice")
    .filter({ hasText: "Introduction to Web Development" })
    .first();
  await practiceEvent.click();
  const practiceDetails = page.getByLabel(
    "Introduction to Web Development Practice details",
  );
  await expect(practiceDetails).toBeVisible();
  await expect(practiceDetails).toContainText("John Doe");
  await expect(practiceDetails).toContainText("South Building 1.12");
  await expect(practiceDetails).not.toContainText("Dr. Jane Smith");
  await expect(page.getByText("08:00", { exact: true })).toBeVisible();
  await expect(page.getByText("20:00", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".sx__week-grid__time-axis")
        .evaluate((element) => getComputedStyle(element, "::after").content),
    )
    .toBe('"21:00"');

  await page.reload();

  await expect(
    page.getByRole("checkbox", {
      name: "Introduction to Web Development",
    }),
  ).toBeChecked();
});

test("downloads every enabled class in complete calendar packs", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("DEMO-1");
  await page.getByRole("button", { name: "Find courses" }).click();
  await page
    .getByRole("button", {
      name: /Select class: Introduction to Web Development, Lecture, Monday/,
    })
    .click();
  await page
    .getByRole("button", {
      name: /Select class: Introduction to Web Development, Practice, Wednesday/,
    })
    .click();

  await page.getByRole("button", { name: "Export calendar" }).click();

  const icsDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download iCalendar pack" }).click();
  const icsPath = await (await icsDownloadPromise).path();
  const ics = await readFile(icsPath, "utf8");
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  expect(ics.match(/RRULE:FREQ=WEEKLY/g)).toHaveLength(2);

  const csvDownloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download Google Calendar CSV pack" })
    .click();
  const csvPath = await (await csvDownloadPromise).path();
  const csv = await readFile(csvPath, "utf8");
  expect(csv).toContain("Subject,Start Date,Start Time,End Date,End Time");
  expect(csv.match(/Introduction to Web Development/g)).toHaveLength(2);
});

test("keeps the mobile search action clickable while suggestions are open", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("DEMO-1");
  await expect(
    page.getByRole("option", { name: /Introduction to Web Development/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Find courses" }).click();
  await expect(page.locator(".class-row").first()).toBeVisible();
});

test("keeps same-time lecture and practice selections independent", async ({
  page,
}) => {
  const rows = [
    [
      "Wednesday 17:45-19:15",
      "COLLISION-90 (lecture)",
      "Selection identity",
      "Lecture room",
      "",
      "Lecture professor",
    ],
    [
      "Wednesday 17:45-19:15",
      "COLLISION-6 (practice)",
      "Selection identity",
      "Practice room",
      "",
      "Practice professor",
    ],
    [
      "Thursday 18:00-19:30",
      "COLLISION-4 (practice)",
      "Selection identity",
      "Other room",
      "",
      "Other professor",
    ],
  ];
  const body = `<table id="resulttable"><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
  await page.route("**/api/subject/COLLISION*", async (route) => {
    await route.fulfill({ contentType: "text/html", body });
  });
  await page.goto("/");

  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("COLLISION");
  await page.getByRole("button", { name: "Find courses" }).click();

  const classRows = page.locator(".class-row");
  const thursdayPractice = classRows.filter({ hasText: "COLLISION-4" });
  const wednesdayLecture = classRows.filter({ hasText: "COLLISION-90" });
  const wednesdayPractice = classRows.filter({ hasText: "COLLISION-6" });

  await thursdayPractice.click();
  await wednesdayLecture.click();

  await expect(wednesdayLecture).toHaveAttribute("aria-pressed", "true");
  await expect(thursdayPractice).toHaveAttribute("aria-pressed", "true");
  await expect(wednesdayPractice).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('.class-row[aria-pressed="true"]')).toHaveCount(2);
});

test("finds and adds a course by subject name", async ({ page }) => {
  await page.route("**/api/subject/Algorithms", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: '<table id="resulttable"><tbody></tbody></table>',
    });
  });
  await page.route("**/api/subject/Algorithms?by=name", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <table id="resulttable"><tbody><tr>
          <td>Monday 12:00-13:30</td>
          <td>DEMO-3-1 (lecture)</td>
          <td>Algorithms and Data Structures</td>
          <td>North Building 3.14</td>
          <td></td>
          <td>Dr. Alice Chen</td>
        </tr></tbody></table>
      `,
    });
  });
  await page.route("**/api/subject/Algorithms?by=instructor", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: '<table id="resulttable"><tbody></tbody></table>',
    });
  });
  await page.goto("/");

  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("Algorithms");
  const topSuggestion = page.getByRole("option", {
    name: /Algorithms and Data Structures/,
  });
  await expect(topSuggestion).toBeVisible();
  await expect(topSuggestion).toHaveAttribute("aria-selected", "true");
  await page
    .getByLabel("Subject code, course name, or professor")
    .press("Enter");

  await expect(
    page.getByRole("heading", { name: "Algorithms and Data Structures" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /Select class: Algorithms and Data Structures/,
    })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Algorithms and Data Structures" }),
  ).toBeChecked();
});

test("keeps autocomplete suggestions above the timetable", async ({ page }) => {
  await page.route("**/api/subject/prog?by=name", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <table id="resulttable"><tbody>
          <tr>
            <td>Monday 10:00-11:30</td>
            <td>PROG-1-1 (lecture)</td>
            <td>Programming</td>
            <td>North Building 1.01</td>
            <td></td>
            <td>Dr. Ada Lovelace</td>
          </tr>
          <tr>
            <td>Tuesday 12:00-13:30</td>
            <td>PROG-2-1 (lecture)</td>
            <td>Programming Languages</td>
            <td>North Building 1.02</td>
            <td></td>
            <td>Dr. Grace Hopper</td>
          </tr>
          <tr>
            <td>Wednesday 14:00-15:30</td>
            <td>PROG-3-1 (lecture)</td>
            <td>Programming Language Theory</td>
            <td>North Building 1.03</td>
            <td></td>
            <td>Dr. Barbara Liskov</td>
          </tr>
        </tbody></table>
      `,
    });
  });
  await page.route("**/api/subject/prog?by=instructor", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: '<table id="resulttable"><tbody></tbody></table>',
    });
  });
  await page.goto("/");

  await page.getByLabel("Subject code, course name, or professor").fill("prog");
  const options = page
    .getByRole("listbox", { name: "Subject suggestions" })
    .getByRole("option");
  await expect(options).toHaveCount(3);

  const bottomOptionIsTopmost = await options.last().evaluate((option) => {
    const rect = option.getBoundingClientRect();
    const topmost = document.elementFromPoint(
      rect.left + Math.min(40, rect.width / 2),
      rect.top + 4,
    );
    return topmost?.closest('[role="option"]') === option;
  });

  expect(bottomOptionIsTopmost).toBe(true);
});

test("finds a professor's courses despite a small typing error", async ({
  page,
}) => {
  const emptyTable = '<table id="resulttable"><tbody></tbody></table>';
  for (const url of [
    "**/api/subject/Patki%20Norbert?by=name",
    "**/api/subject/Patki%20Norbert?by=instructor",
    "**/api/subject/Norb?by=name",
  ]) {
    await page.route(url, async (route) => {
      await route.fulfill({ contentType: "text/html", body: emptyTable });
    });
  }
  await page.route("**/api/subject/Norb?by=instructor", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <table id="resulttable"><tbody>
          <tr>
            <td>Monday 12:00-13:30</td>
            <td>IP-PROG-1 (lecture)</td>
            <td>Imperative Programming</td>
            <td>North Building 3.14</td>
            <td></td>
            <td>Pataki Norbert</td>
          </tr>
          <tr>
            <td>Tuesday 14:00-15:30</td>
            <td>IP-LANG-1 (lecture)</td>
            <td>Programming Languages</td>
            <td>North Building 2.08</td>
            <td></td>
            <td>Pataki Norbert</td>
          </tr>
        </tbody></table>
      `,
    });
  });
  await page.goto("/");

  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("Patki Norbert");
  await page.getByRole("button", { name: "Find courses" }).click();

  await expect(
    page.getByRole("heading", { name: "Imperative Programming" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Programming Languages" }),
  ).toBeVisible();
  await expect(page.getByText("Taught by Pataki Norbert")).toHaveCount(2);
});

test("builds the schedule from an uploaded registered subjects file", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import Neptun" }).click();
  await page.setInputFiles(
    'input[type="file"]',
    path.join(fixturesDirectory, "registered-subjects.xlsx"),
  );

  const subject = page.getByRole("checkbox", {
    name: "Introduction to Web Development",
  });
  await expect(subject).toBeChecked();
  await expect(
    page
      .locator(".sx__event")
      .filter({ hasText: "Introduction to Web Development" }),
  ).toHaveCount(2);

  await page
    .getByRole("button", {
      name: "Edit classes for Introduction to Web Development",
    })
    .click();
  const classChoices = page.locator(".event-options input[type=radio]");
  await expect(classChoices).toHaveCount(4);
  await expect(
    page.locator(".event-options input[type=radio]:checked"),
  ).toHaveCount(2);
});
