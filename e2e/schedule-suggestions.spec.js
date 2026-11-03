import { expect, test } from "@playwright/test";

function meeting(
  code,
  instructor,
  dayOfWeek,
  enabled,
  type = "lecture",
  startTime = "10:00",
  endTime = "11:00",
) {
  return {
    title: "Choice lab",
    code,
    dayOfWeek,
    startTime,
    endTime,
    enabled,
    extendedProps: { type, instructor, location: "Room 1" },
  };
}

async function seed(page, events) {
  await page.addInitScript((meetings) => {
    if (!localStorage.getItem("scheduleManager")) {
      localStorage.setItem(
        "scheduleManager",
        JSON.stringify({
          version: 1,
          activeScheduleId: "fixture",
          schedules: [
            {
              id: "fixture",
              name: "Choices",
              lectureExemption: false,
              subjects: [
                {
                  title: "Choice lab",
                  code: "CHOICE",
                  enabled: true,
                  events: meetings,
                },
              ],
            },
          ],
        }),
      );
    }
    localStorage.setItem("language", "en");
    localStorage.setItem("warningShown", "true");
    localStorage.setItem("faqRead", "true");
  }, events);
  await page.goto("/");
}

async function enabledMeetings(page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("scheduleManager"))
      .schedules[0].subjects[0].events.filter((event) => event.enabled)
      .map((event) => `${event.extendedProps.instructor}/${event.dayOfWeek}`)
      .sort(),
  );
}

for (const viewport of [
  { width: 1400, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`same-time lecturer and practice choices apply and survive reload at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await seed(page, [
      meeting("L", "Alice", "Monday", true),
      meeting("L", "Beatrice", "Monday", false),
      meeting("L", "Beatrice", "Wednesday", false),
      meeting("P", "Carlos", "Tuesday", true, "practice"),
      meeting("P", "Dora", "Tuesday", false, "practice"),
    ]);
    const before = await enabledMeetings(page);
    await page.getByRole("button", { name: "Suggest schedules" }).click();
    await page.getByRole("button", { name: "Close suggestions" }).click();
    expect(await enabledMeetings(page)).toEqual(before);
    await page.getByRole("button", { name: "Suggest schedules" }).click();
    const option = page
      .locator(".option")
      .filter({ hasText: "Beatrice" })
      .filter({ hasText: "1 replacement" });
    await expect(option).toHaveCount(1);
    await expect(option).toContainText("Alice");
    await expect(option).toContainText("Wednesday 10:00–11:00");
    await option.getByRole("button", { name: /Apply option/ }).click();
    const expected = [
      "Beatrice/Monday",
      "Beatrice/Wednesday",
      "Carlos/Tuesday",
    ];
    await expect.poll(() => enabledMeetings(page)).toEqual(expected);
    await expect(
      page.getByRole("dialog", { name: "Schedule suggestions" }),
    ).toBeHidden();
    await page.reload();
    await expect(
      page.getByRole("checkbox", {
        name: "Show Choice lab in timetable",
        exact: true,
      }),
    ).toBeChecked();
    expect(await enabledMeetings(page)).toEqual(expected);
    await page
      .getByRole("button", { name: "Edit classes for Choice lab" })
      .click();
    const groups = page.getByRole("group", { name: "Groups for Choice lab" });
    await expect(groups.getByRole("radio")).toHaveCount(4);
    await expect(groups.getByRole("radio", { checked: true })).toHaveCount(2);
    const selectedLecture = groups.getByRole("radio", { name: /Beatrice/ });
    await expect(selectedLecture).toBeChecked();
    await expect(selectedLecture).toHaveAttribute(
      "aria-label",
      /Monday.*Wednesday/,
    );
    if (viewport.width > 768) {
      await expect(page.locator(".sx__event")).toHaveCount(3);
      await expect(page.locator(".sx__event").first()).toBeVisible();
    } else {
      await expect(page.locator(".agenda-event")).toHaveCount(3);
      await expect(page.locator(".agenda-event").first()).toBeVisible();
    }
    await groups.getByRole("radio", { name: /Alice/ }).check();
    await groups.getByRole("radio", { name: /Dora/ }).check();
    await expect
      .poll(() => enabledMeetings(page))
      .toEqual(["Alice/Monday", "Dora/Tuesday"]);
    await groups.getByRole("radio", { name: /Beatrice/ }).check();
    const manuallySelected = [
      "Beatrice/Monday",
      "Beatrice/Wednesday",
      "Dora/Tuesday",
    ];
    await expect.poll(() => enabledMeetings(page)).toEqual(manuallySelected);
    await page.reload();
    expect(await enabledMeetings(page)).toEqual(manuallySelected);
  });
}

test("evening meetings fit inside the desktop calendar and appear in mobile agenda", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await seed(page, [
    meeting(
      "EVENING",
      "Evening tutor",
      "Monday",
      true,
      "practice",
      "21:15",
      "21:45",
    ),
  ]);
  const event = page.locator(".sx__event").filter({ hasText: "Choice lab" });
  await expect(event).toHaveCount(1);
  await expect
    .poll(() =>
      event.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        let ancestor = element.parentElement;
        while (ancestor) {
          const style = getComputedStyle(ancestor);
          if (["hidden", "clip", "auto", "scroll"].includes(style.overflowY)) {
            const clipping = ancestor.getBoundingClientRect();
            if (
              bounds.top < clipping.top - 1 ||
              bounds.bottom > clipping.bottom + 1
            )
              return false;
          }
          ancestor = ancestor.parentElement;
        }
        return bounds.height > 0;
      }),
    )
    .toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  const agendaEvent = page.locator(".agenda-event");
  await expect(agendaEvent).toBeVisible();
  await expect(agendaEvent).toContainText("21:15");
  await expect(agendaEvent).toContainText("21:45");
});

test("links to the upstream repository and upstream social preview", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Star on GitHub/ }),
  ).toHaveAttribute("href", "https://github.com/w04m1/elte-schedule-builder");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://schedule.w04m1.dev/social-preview.png",
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    "https://schedule.w04m1.dev/social-preview.png",
  );
});

test("refreshes saved courses without retyping and preserves a hidden subject's group choice", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/subject/CHOICE-1", async (route) => {
    requests += 1;
    const rows = [
      ["CHOICE-1-1", "Alice"],
      ["CHOICE-1-2", "Beatrice"],
    ];
    await route.fulfill({
      contentType: "text/html",
      body: `<table id="resulttable"><tbody>${rows.map(([code, instructor]) => `<tr><td>Monday 10:00-11:00</td><td>${code} (lecture)</td><td>Choice lab</td><td>Updated room</td><td></td><td>${instructor}</td></tr>`).join("")}</tbody></table>`,
    });
  });
  await seed(page, [
    meeting("CHOICE-1-1", "Alice", "Monday", false),
    meeting("CHOICE-1-2", "Beatrice", "Monday", true),
  ]);
  await page
    .getByRole("checkbox", { name: "Show Choice lab in timetable" })
    .uncheck();
  await expect(
    page.getByLabel("Subject code, course name, or professor"),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Refresh saved schedule" }).click();
  await expect(
    page.getByText("Saved courses refreshed. Review your group selections."),
  ).toBeVisible();
  expect(requests).toBe(1);
  expect(await enabledMeetings(page)).toEqual(["Beatrice/Monday"]);
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("scheduleManager")).schedules[0]
        .subjects[0],
  );
  expect(stored.enabled).toBe(false);
  expect(stored.events.map((event) => event.extendedProps.location)).toEqual([
    "Updated room",
    "Updated room",
  ]);
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Show Choice lab in timetable" }),
  ).not.toBeChecked();
  expect(await enabledMeetings(page)).toEqual(["Beatrice/Monday"]);
});

test("search selects whole lecture and practice groups without merging same-time teachers", async ({
  page,
}) => {
  await page.route("**/api/subject/CHOICE-1*", async (route) => {
    const rows = route.request().url().includes("?")
      ? []
      : [
          ["Monday", "CHOICE-1-1", "lecture", "Alice"],
          ["Monday", "CHOICE-1-1", "lecture", "Beatrice"],
          ["Wednesday", "CHOICE-1-1", "lecture", "Beatrice"],
          ["Tuesday", "CHOICE-1-2", "practice", "Carlos"],
          ["Tuesday", "CHOICE-1-2", "practice", "Dora"],
        ];
    await route.fulfill({
      contentType: "text/html",
      body: `<table id="resulttable"><tbody>${rows.map(([day, code, type, instructor]) => `<tr><td>${day} 10:00-11:00</td><td>${code} (${type})</td><td>Choice lab</td><td>Room 1</td><td></td><td>${instructor}</td></tr>`).join("")}</tbody></table>`,
    });
  });
  await page.goto("/");
  await page
    .getByLabel("Subject code, course name, or professor")
    .fill("CHOICE-1");
  await page.getByRole("button", { name: "Find courses" }).click();
  const results = page.getByLabel("Search results");
  await expect(results.getByRole("radio")).toHaveCount(4);
  const lecture = results.getByRole("radio", { name: /Beatrice/ });
  await expect(lecture).toHaveAttribute("aria-label", /Monday.*Wednesday/);
  await lecture.check();
  await results.getByRole("radio", { name: /Carlos/ }).check();
  await expect(lecture).toBeChecked();
  await expect(results.getByRole("radio", { name: /Alice/ })).not.toBeChecked();
  await expect(results.getByRole("radio", { name: /Dora/ })).not.toBeChecked();
  await expect(results.getByRole("radio", { checked: true })).toHaveCount(2);
  await expect
    .poll(() => enabledMeetings(page))
    .toEqual(["Beatrice/Monday", "Beatrice/Wednesday", "Carlos/Tuesday"]);
  await page.reload();
  expect(await enabledMeetings(page)).toEqual([
    "Beatrice/Monday",
    "Beatrice/Wednesday",
    "Carlos/Tuesday",
  ]);
});
