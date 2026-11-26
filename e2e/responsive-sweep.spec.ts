import {
  expect,
  expectNoHorizontalOverflow,
  expectTapTargets,
  focusIndicatorChange,
  focusedLabel,
  signInAs,
  tabUntil,
  test,
  USERS,
  type Role,
} from "./helpers";

/**
 * TASK-016 — Day 0's responsive guarantees as regression tests for EVERY page and
 * role (mobile-375 project; the 320 sweep is parametrised below).
 */
const PAGES: [Role, string, string[]][] = [
  ["employee", USERS.ana, ["/dashboard", "/requests/new", "/requests", "/balance"]],
  ["manager", USERS.ben, ["/dashboard", "/approvals"]],
  ["hr_admin", USERS.carla, ["/dashboard", "/audit", "/policies"]],
];

for (const width of [375, 320]) {
  test.describe(`sweep at ${width}px`, () => {
    test.use({ viewport: { width, height: 700 } });

    test("login page", async ({ page }) => {
      await page.goto("/login");
      await expectNoHorizontalOverflow(page);
      await expectTapTargets(page, "main");
    });

    for (const [role, id, paths] of PAGES) {
      for (const path of paths) {
        test(`${role} ${path}: no overflow, tap targets, visible focus on tab stops`, async ({
          context,
          page,
        }) => {
          await signInAs(context, role, id);
          await page.goto(path);
          await expectNoHorizontalOverflow(page);
          await expectTapTargets(page);

          // Sample the first 25 tab stops: each must show a visible focus indicator.
          for (let i = 0; i < 25; i++) {
            await page.keyboard.press("Tab");
            if (await page.evaluate(() => document.activeElement === document.body)) break;
            const info = await focusIndicatorChange(page);
            expect(info.ok, `tab stop ${i + 1} has no visible focus change: ${info.label}`).toBe(
              true,
            );
          }
        });
      }
    }
  });
}

test("mobile nav sheet lists the role's links (HR)", async ({ context, page }) => {
  await signInAs(context, "hr_admin", USERS.carla);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation menu" }).tap();
  const nav = page.getByRole("dialog").getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveText([
    "Dashboard",
    "New request",
    "My requests",
    "Balance",
    "Audit report",
    "Leave policies",
  ]);
});

test("approvals dialog: Enter opens, focus moves in, Escape closes and returns focus", async ({
  context,
  page,
}) => {
  await signInAs(context, "manager", USERS.ben);
  await page.goto("/approvals");
  const approve = page.getByRole("button", { name: /^Approve .*request$/ }).first();
  await tabUntil(page, approve);
  const trigger = await focusedLabel(page);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(await focusedLabel(page)).toBe(trigger);
});
