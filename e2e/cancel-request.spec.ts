import type { APIRequestContext } from "@playwright/test";
import {
  daysFromToday,
  expect,
  expectNoHorizontalOverflow,
  expectTapTargets,
  focusedLabel,
  seriousA11yViolations,
  signInAs,
  tabUntil,
  test,
  USERS,
} from "./helpers";

/**
 * TASK-028 (US-16) — withdraw / cancel in a real browser (mock store, production build).
 * Dates are relative to today, so the spec never goes stale.
 */
const VACATION = "10000000-0000-4000-8000-000000000001";
const create = async (request: APIRequestContext, start: number, end: number) => {
  const res = await request.post("/api/leave-requests", {
    data: {
      leaveTypeId: VACATION,
      startDate: daysFromToday(start),
      endDate: daysFromToday(end),
      reason: "Family visit",
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.request.id as string;
};
const vacationAvailable = async (request: APIRequestContext) => {
  const { data } = await (await request.get("/api/leave-requests?scope=mine")).json();
  return data.balances.find((b: { leaveType: { name: string } }) => b.leaveType.name === "Vacation")
    .available as number;
};

test("withdraw a pending request: confirm, Cancelled, approver notified (AC1)", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  const id = await create(page.request, 70, 72);
  await page.goto("/requests");
  await page
    .getByRole("button", { name: /^Withdraw: Vacation/ })
    .first()
    .tap();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Withdraw this request?");
  await dialog.getByRole("button", { name: "Withdraw request" }).tap();
  await expect(page.locator("[data-sonner-toast]")).toContainText("Request withdrawn");
  const { data } = await (await page.request.get("/api/leave-requests?scope=mine")).json();
  expect(data.requests.find((r: { id: string }) => r.id === id).status).toBe("cancelled");

  await signInAs(context, "manager", USERS.ben);
  await page.goto("/notifications");
  await expect(page.getByText(/Ana Reyes withdrew a Vacation request/)).toBeVisible();
});

test("cancel approved future leave: its days go back to the balance (AC2)", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  const before = await vacationAvailable(page.request);
  const id = await create(page.request, 80, 81);
  await signInAs(context, "manager", USERS.ben);
  expect(
    (
      await page.request.post(`/api/leave-requests/${id}/decision`, {
        data: { decision: "approve" },
      })
    ).status(),
  ).toBe(200);

  await signInAs(context, "employee", USERS.ana);
  await page.goto("/requests");
  await page
    .getByRole("button", { name: /^Cancel leave: Vacation/ })
    .first()
    .tap();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("go back to your balance");
  await dialog.getByRole("button", { name: "Cancel leave" }).tap();
  await expect(page.locator("[data-sonner-toast]")).toContainText("Leave cancelled");
  expect(await vacationAvailable(page.request)).toBe(before);
});

test("leave that has started shows no cancel button (AC3)", async ({ context, page }) => {
  await signInAs(context, "employee", USERS.ana);
  const id = await create(page.request, 0, 0);
  await signInAs(context, "manager", USERS.ben);
  await page.request.post(`/api/leave-requests/${id}/decision`, { data: { decision: "approve" } });
  await signInAs(context, "employee", USERS.ana);
  const { data } = await (await page.request.get("/api/leave-requests?scope=mine")).json();
  expect(data.requests.find((r: { id: string }) => r.id === id)).toMatchObject({
    status: "approved",
    cancellable: false,
  });
  expect((await page.request.post(`/api/leave-requests/${id}/cancel`)).status()).toBe(409);
});

test("the withdraw flow passes the mobile and keyboard checks", async ({ context, page }) => {
  await signInAs(context, "employee", USERS.ana);
  await create(page.request, 90, 91);
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/requests");
    await expectNoHorizontalOverflow(page);
    await expectTapTargets(page);
  }
  expect(await seriousA11yViolations(page)).toEqual([]);
  const button = page.getByRole("button", { name: /^Withdraw: Vacation/ }).first();
  await tabUntil(page, button);
  const trigger = await focusedLabel(page);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  expect(await seriousA11yViolations(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(await focusedLabel(page)).toBe(trigger);
  // 200% text on /requests is NOT asserted: the status / leave-type badges don't wrap and
  // overflow at 320px (pre-existing, backlog B35 — same cause as /dashboard), not the new button.
});
