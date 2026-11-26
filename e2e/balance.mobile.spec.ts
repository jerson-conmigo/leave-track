import {
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
 * TASK-016 AC2 / US-06 AC2 — the balance page renders correctly on a mobile
 * browser, without a desktop-only layout (375 / 320 / landscape projects).
 */
test.describe("balance page on mobile", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "employee", USERS.ana);
    await page.goto("/balance");
    await expect(page.getByRole("heading", { name: "Your leave balance" })).toBeVisible();
  });

  const cards = (p: import("@playwright/test").Page) => p.locator('main [data-slot="card"]');

  test("no horizontal overflow, including at 200% text", async ({ page }) => {
    await expectNoHorizontalOverflow(page);
    await enlargeText(page);
    await expectNoHorizontalOverflow(page);
  });

  test("mobile layout: sidebar hidden, menu button shown, no tables", async ({ page }) => {
    const vw = page.viewportSize()!.width;
    test.skip(vw >= 1024, "desktop-width project");
    await expect(page.locator("aside")).toBeHidden();
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible();
    await expect(page.locator("main table")).toHaveCount(0);
  });

  test("cards stack in a single column below the sm breakpoint", async ({ page }) => {
    const vw = page.viewportSize()!.width;
    test.skip(vw >= 640, "two-column grid is intended from sm (640px) up");
    const boxes = await cards(page).evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        return { x: Math.round(b.left), w: Math.round(b.width) };
      }),
    );
    expect(boxes).toHaveLength(3);
    const content = await page.locator("main").evaluate((m) => {
      const cs = getComputedStyle(m);
      return m.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    });
    for (const b of boxes) {
      expect(b.x).toBe(boxes[0]!.x);
      expect(Math.abs(b.w - content)).toBeLessThanOrEqual(2);
    }
  });

  test("each card shows its figures at mobile size; confirmed and pending stay separate", async ({
    page,
  }) => {
    await expect(page.getByText(/As of the last monthly accrual on/)).toBeVisible();
    const vacation = cards(page).filter({ hasText: "Vacation" });
    await expect(vacation).toContainText("days available");
    await expect(vacation).toContainText("Confirmed");
    await expect(vacation).toContainText("Pending");
    const unpaid = cards(page).filter({ hasText: "Unpaid" });
    await expect(unpaid).toContainText("Not tracked");
  });

  test("tap targets are ≥44px and inside the viewport", async ({ page }) => {
    await expectTapTargets(page);
  });

  test("keyboard: menu button focus ring, sheet traps focus, Escape returns focus", async ({
    page,
  }) => {
    const vw = page.viewportSize()!.width;
    test.skip(vw >= 1024, "sheet nav is mobile-only");
    const menu = page.getByRole("button", { name: "Open navigation menu" });
    await tabUntil(page, menu);
    await expectVisibleFocus(menu);

    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect.poll(() => sheet.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(
        await sheet.evaluate((d) => d.contains(document.activeElement)),
        "focus escaped the sheet",
      ).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test("no serious/critical accessibility violations", async ({ page }) => {
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
});
