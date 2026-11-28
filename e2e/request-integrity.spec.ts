import type { Page } from "@playwright/test";
import {
  daysFromToday,
  expect,
  expectNoHorizontalOverflow,
  expectTapTargets,
  seriousA11yViolations,
  signInAs,
  test,
  USERS,
} from "./helpers";

/**
 * TASK-027 (US-16 AC1–AC2, BR-13) — the request rules in the real form (mock store, production
 * build). Dates are relative to today, so the spec never goes stale.
 */
const VACATION = "10000000-0000-4000-8000-000000000001";

async function fillForm(page: Page, type: RegExp, start: string, end: string) {
  await page.goto("/requests/new");
  await page.locator('main button[role="combobox"]').tap();
  await page.getByRole("option", { name: type }).tap();
  await expect(page.getByRole("listbox")).toBeHidden();
  await page.locator('input[name="startDate"]').fill(start);
  await page.locator('input[name="endDate"]').fill(end);
  await page.locator('textarea[name="reason"]').fill("Family visit");
}
const submit = (page: Page) => page.getByRole("button", { name: "Submit request" }).tap();
const formError = (page: Page) => page.locator("#form-error");

test("an overlapping request is refused in the form with a clear message (AC1)", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  const first = await page.request.post("/api/leave-requests", {
    data: {
      leaveTypeId: VACATION,
      startDate: daysFromToday(70),
      endDate: daysFromToday(72),
      reason: "Family visit",
    },
  });
  expect(first.status()).toBe(201);

  await fillForm(page, /Sick/, daysFromToday(72), daysFromToday(73));
  await submit(page);
  await expect(formError(page)).toContainText(
    "You already have a pending or approved request for some of these days.",
  );
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);

  // The error state passes the mobile checks.
  await expectNoHorizontalOverflow(page);
  await expectTapTargets(page);
  expect(await seriousA11yViolations(page)).toEqual([]);
  await page.setViewportSize({ width: 320, height: 640 });
  await expectNoHorizontalOverflow(page);
});

test("more than 90 days is refused before submitting (AC3)", async ({ context, page }) => {
  await signInAs(context, "employee", USERS.ana);
  await fillForm(page, /Unpaid/, daysFromToday(70), daysFromToday(70 + 90));
  await expect(page.getByText("91 days requested")).toBeVisible();
  await submit(page);
  await expect(page.getByText("A request can be at most 90 days.")).toBeVisible();
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
});

test("a Vacation starting yesterday is refused by the server (AC3)", async ({ context, page }) => {
  await signInAs(context, "employee", USERS.ana);
  await fillForm(page, /Vacation/, daysFromToday(-1), daysFromToday(0));
  await submit(page);
  await expect(formError(page)).toContainText("Start date can't be in the past.");
});

test("Sick leave starting 30 days ago is accepted (AC4)", async ({ context, page }) => {
  await signInAs(context, "employee", USERS.jordan);
  await fillForm(page, /Sick/, daysFromToday(-30), daysFromToday(-29));
  await submit(page);
  await expect(page.locator("[data-sonner-toast]")).toContainText("Request sent for approval");
});

test("the date pickers hint the allowed window (min start, max end)", async ({ context, page }) => {
  await signInAs(context, "employee", USERS.ana);
  await page.goto("/requests/new");
  await page.locator('main button[role="combobox"]').tap();
  await page.getByRole("option", { name: /Sick/ }).tap();
  const start = page.locator('input[name="startDate"]');
  // Browser-local date: within a day of the UTC-based expectation.
  const min = await start.getAttribute("min");
  expect([daysFromToday(-31), daysFromToday(-30), daysFromToday(-29)]).toContain(min);
  await start.fill(daysFromToday(10));
  await expect(page.locator('input[name="endDate"]')).toHaveAttribute("max", daysFromToday(99));
});
