import type { Page } from "@playwright/test";
import {
  daysFromToday,
  enlargeText,
  expect,
  expectNoHorizontalOverflow,
  expectTapTargets,
  expectVisibleFocus,
  seriousA11yViolations,
  signInAs,
  tabUntil,
  test,
  USERS,
} from "./helpers";

/**
 * TASK-030 (US-17 AC1, ADR-E007) — the header bell and the /notifications inbox in a real
 * browser (mock store, production build). Dates are relative to today.
 */
const bell = (page: Page) => page.getByRole("link", { name: /^Notifications/ });
const JORDAN_VACATION = "20000000-0000-4000-8000-000000000004"; // pending, Ben's report

test("a submitted request reaches the approver's bell and inbox; mark all as read clears it", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  const created = await page.request.post("/api/leave-requests", {
    data: {
      leaveTypeId: "10000000-0000-4000-8000-000000000001",
      startDate: daysFromToday(70),
      endDate: daysFromToday(72),
      reason: "Family visit",
    },
  });
  expect(created.status()).toBe(201);

  await signInAs(context, "manager", USERS.ben);
  await page.goto("/dashboard");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 unread");
  await expect(bell(page).locator('[data-slot="notification-count"]')).toHaveText("1");

  await bell(page).tap();
  await expect(page).toHaveURL(/\/notifications$/);
  const item = page
    .getByRole("listitem")
    .filter({ hasText: "Ana Reyes requested 3 days of Vacation" });
  await expect(item).toBeVisible();
  await expect(item.getByText("New", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Mark all as read" }).tap();
  await expect(page.getByText("All caught up.")).toBeVisible();
  await expect(bell(page)).toHaveAccessibleName("Notifications");
  await expect(item.getByText("New", { exact: true })).toHaveCount(0);
});

test("a decision reaches the requester's inbox", async ({ context, page }) => {
  await signInAs(context, "manager", USERS.ben);
  const decided = await page.request.post(`/api/leave-requests/${JORDAN_VACATION}/decision`, {
    data: { decision: "approve" },
  });
  expect(decided.status()).toBe(200);

  await signInAs(context, "employee", USERS.jordan);
  await page.goto("/notifications");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 unread");
  await expect(page.getByText(/request \(.+\) was approved by Ben Ortiz\./)).toBeVisible();
  // per-item mark as read
  await page.getByRole("button", { name: "Mark as read" }).tap();
  await expect(bell(page)).toHaveAccessibleName("Notifications");
});

test("someone else's notifications never show up (AC3)", async ({ context, page }) => {
  await signInAs(context, "manager", USERS.ben);
  await page.request.post(`/api/leave-requests/${JORDAN_VACATION}/decision`, {
    data: { decision: "approve" },
  });
  await signInAs(context, "employee", USERS.ana); // not Jordan
  await page.goto("/notifications");
  await expect(page.getByText("No notifications yet")).toBeVisible();
  await expect(bell(page)).toHaveAccessibleName("Notifications");
});

test("bell and inbox pass the mobile and accessibility checks (AC4)", async ({ context, page }) => {
  await signInAs(context, "employee", USERS.ana);
  await page.request.post("/api/leave-requests", {
    data: {
      leaveTypeId: "10000000-0000-4000-8000-000000000001",
      startDate: daysFromToday(70),
      endDate: daysFromToday(71),
      reason: "A long reason that should wrap nicely on a small phone screen",
    },
  });
  await signInAs(context, "manager", USERS.ben);
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/notifications");
    await expect(page.getByRole("listitem").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectTapTargets(page); // header (incl. the bell) and main
  }
  expect(await seriousA11yViolations(page)).toEqual([]);
  // keyboard: the bell and "Mark all as read" are reachable with visible focus
  await page.goto("/notifications");
  await tabUntil(page, bell(page));
  await expectVisibleFocus(bell(page));
  const markAll = page.getByRole("button", { name: "Mark all as read" });
  await tabUntil(page, markAll);
  await expectVisibleFocus(markAll);
  // 200 % text on the inbox page
  await enlargeText(page);
  await expectNoHorizontalOverflow(page);
});
