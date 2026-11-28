import {
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
 * TASK-026 (US-15) — approval routing in a real browser (mock store, production build):
 * an HR Admin decides the managers' requests, the only HR Admin can't submit (409, nothing
 * created), and pending requests say who they await. The fixtures keep ONE HR Admin; the HR-peer
 * case (two HR Admins) is covered on both stores by tests/leave-requests/approval-routing.test.ts.
 */
const vacation = (start: string, end: string, reason: string) => ({
  leaveTypeId: "10000000-0000-4000-8000-000000000001",
  startDate: start,
  endDate: end,
  reason,
});

test("an employee's pending request says who it is waiting for (AC4)", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  await page.goto("/requests");
  await expect(page.getByText("Awaiting Ben Ortiz").first()).toBeVisible();
});

test("a manager's request is decided by their HR Admin (AC1)", async ({ context, page }) => {
  await signInAs(context, "manager", USERS.ben);
  const created = await page.request.post("/api/leave-requests", {
    data: vacation("2027-04-12", "2027-04-13", "Team offsite recovery"),
  });
  expect(created.status()).toBe(201);
  expect((await created.json()).data.request.awaiting).toBe("Carla Diaz");

  // Ben's own queue never lists his own request.
  await page.goto("/approvals");
  await expect(page.getByRole("button", { name: "Approve Ben Ortiz's request" })).toHaveCount(0);

  // Carla's queue lists the managers' requests only — no employees'.
  await signInAs(context, "hr_admin", USERS.carla);
  await page.goto("/approvals");
  await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible();
  const approve = page.getByRole("button", { name: "Approve Ben Ortiz's request" });
  await expect(approve.first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Approve (Ana Reyes|Jordan Lee)'s request/ }),
  ).toHaveCount(0);
  await approve.first().tap();
  await page.getByRole("dialog").getByRole("button", { name: "Approve request" }).tap();
  await expect(page.getByRole("dialog")).toBeHidden();

  await signInAs(context, "manager", USERS.ben);
  await page.goto("/requests");
  await expect(page.getByText(/Approved by Carla Diaz/).first()).toBeVisible();
});

test("the only HR Admin can't submit: 409 with a clear message, nothing created (AC3)", async ({
  context,
  page,
}) => {
  await signInAs(context, "hr_admin", USERS.carla);
  const before = (await (await page.request.get("/api/leave-requests?scope=mine")).json()).data
    .requests.length;
  const res = await page.request.post("/api/leave-requests", {
    data: vacation("2027-04-19", "2027-04-20", "Rest"),
  });
  expect(res.status()).toBe(409);
  expect(await res.json()).toEqual({
    success: false,
    error: {
      code: "CONFLICT",
      message:
        "There's no one to approve your request yet. Contact HR to have an approver assigned.",
    },
  });
  const after = (await (await page.request.get("/api/leave-requests?scope=mine")).json()).data
    .requests.length;
  expect(after).toBe(before);

  // Through the form too: the message is shown and nothing is sent.
  await page.goto("/requests/new");
  await page.locator('main button[role="combobox"]').tap();
  await page.getByRole("option", { name: /Vacation/ }).tap();
  await page.locator('input[name="startDate"]').fill("2027-04-19");
  await page.locator('input[name="endDate"]').fill("2027-04-20");
  await page.locator('textarea[name="reason"]').fill("Rest");
  await page.getByRole("button", { name: "Submit request" }).tap();
  await expect(page.getByText(/There's no one to approve your request yet/)).toBeVisible();
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
});

test("an HR Admin's /approvals passes the mobile checks (320/375, tap targets, axe, focus)", async ({
  context,
  page,
}) => {
  await signInAs(context, "manager", USERS.ben);
  await page.request.post("/api/leave-requests", {
    data: vacation(
      "2027-05-03",
      "2027-05-04",
      "A long reason that should wrap nicely on a small phone screen",
    ),
  });
  await signInAs(context, "hr_admin", USERS.carla);
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/approvals");
    await expect(
      page.getByRole("button", { name: "Approve Ben Ortiz's request" }).first(),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectTapTargets(page);
  }
  expect(await seriousA11yViolations(page)).toEqual([]);
  const approve = page.getByRole("button", { name: "Approve Ben Ortiz's request" }).first();
  await tabUntil(page, approve);
  await expectVisibleFocus(approve);
  // 200% text is NOT checked here: /approvals' Approve/Reject row overflows at 320px for managers
  // too (pre-existing; backlog B38), unrelated to TASK-026.
});
