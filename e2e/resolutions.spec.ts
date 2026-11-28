import type { BrowserContext, Page } from "@playwright/test";
import {
  expect,
  expectNoHorizontalOverflow,
  expectTapTargets,
  seriousA11yViolations,
  signInAs,
  test,
  USERS,
} from "./helpers";

/**
 * TASK-032 (US-09) — HR proposes a negative-balance resolution in a real browser (mock store,
 * production build). Sam's Vacation goes to −1.25 when Maya approves his 5-day request.
 */
const SAM = "00000000-0000-4000-8000-000000000104";
const MAYA = "00000000-0000-4000-8000-000000000012";
const SAM_VACATION_REQUEST = "20000000-0000-4000-8000-000000000007";

async function samInDeficit(context: BrowserContext, page: Page) {
  await signInAs(context, "manager", MAYA);
  const res = await page.request.post(`/api/leave-requests/${SAM_VACATION_REQUEST}/decision`, {
    data: { decision: "approve" },
  });
  expect(res.status()).toBe(200);
}

test("HR proposes by keyboard; the row moves to Awaiting employee; Sam is notified (AC1, AC3)", async ({
  context,
  page,
}) => {
  await samInDeficit(context, page);
  await signInAs(context, "hr_admin", USERS.carla);
  await page.goto("/resolutions");
  await expect(page.getByRole("link", { name: /Needs proposal/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const propose = page
    .getByRole("button", { name: /Propose a resolution for Sam .*, Vacation/ })
    .first();
  await propose.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("1.25 days below zero");
  await expect(dialog.getByRole("status")).toContainText("Total 1.25 days of 1.25 days");
  await dialog.getByRole("button", { name: "Send proposal" }).press("Enter");
  await expect(page.locator("[data-sonner-toast]")).toContainText("Proposal sent");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: /Propose a resolution for Sam/ })).toHaveCount(0);

  await page.getByRole("link", { name: /Awaiting employee/ }).click();
  await expect(page.getByText("1.25 days unpaid").first()).toBeVisible();

  await signInAs(context, "employee", SAM);
  await page.goto("/notifications");
  await expect(
    page.getByText(/HR proposed how to resolve your Vacation deficit of 1.25 days/),
  ).toBeVisible();
});

test("the dialog rejects a split that doesn't add up, without sending (AC2)", async ({
  context,
  page,
}) => {
  await samInDeficit(context, page);
  await signInAs(context, "hr_admin", USERS.carla);
  await page.goto("/resolutions");
  await page
    .getByRole("button", { name: /Propose a resolution for Sam/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Convert to Unpaid (days)").fill("1");
  await dialog.getByRole("button", { name: "Send proposal" }).click();
  await expect(dialog.getByRole("alert")).toContainText("must add up to 1.25 days");
  await expect(dialog).toBeVisible();
});

test("managers and employees can't open Resolutions (AC4)", async ({ context, page }) => {
  for (const [role, id] of [
    ["manager", USERS.ben],
    ["employee", USERS.ana],
  ] as const) {
    await signInAs(context, role, id);
    await page.goto("/resolutions");
    await expect(page).toHaveURL(/\/forbidden/);
    const res = await page.request.post("/api/resolutions", {
      data: {
        userId: SAM,
        leaveTypeId: "10000000-0000-4000-8000-000000000001",
        unpaidDays: 1,
        recoveryDays: 0,
      },
    });
    expect(res.status()).toBe(403);
  }
});

test("mobile: no overflow, 44px targets, no serious axe violations on each tab", async ({
  context,
  page,
}) => {
  await samInDeficit(context, page);
  await signInAs(context, "hr_admin", USERS.carla);
  for (const tab of ["needs", "awaiting", "declined", "history"]) {
    await page.goto(`/resolutions?tab=${tab}`);
    await expectNoHorizontalOverflow(page);
    await expectTapTargets(page);
    expect(await seriousA11yViolations(page)).toEqual([]);
  }
  await page.goto("/resolutions");
  await page
    .getByRole("button", { name: /Propose a resolution for Sam/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(await seriousA11yViolations(page)).toEqual([]);
});
