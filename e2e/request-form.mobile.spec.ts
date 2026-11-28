import {
  enlargeText,
  expect,
  expectNoHorizontalOverflow,
  expectNotUnderHeader,
  expectSelectsNotClipped,
  expectTapTargets,
  expectVisibleFocus,
  focusedLabel,
  seriousA11yViolations,
  signInAs,
  tabUntil,
  test,
  USERS,
} from "./helpers";

/**
 * TASK-016 AC1 / US-06 AC1 — the submit-request form is fully usable at mobile
 * widths (375 / 320 / landscape projects) with no horizontal scroll.
 */
test.describe("submit-request form on mobile", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "employee", USERS.ana);
    await page.goto("/requests/new");
    await expect(page.getByRole("heading", { name: "Request leave" })).toBeVisible();
  });

  const field = {
    type: (p: import("@playwright/test").Page) => p.locator('main button[role="combobox"]'),
    start: (p: import("@playwright/test").Page) => p.locator('input[name="startDate"]'),
    end: (p: import("@playwright/test").Page) => p.locator('input[name="endDate"]'),
    reason: (p: import("@playwright/test").Page) => p.locator('textarea[name="reason"]'),
    submit: (p: import("@playwright/test").Page) =>
      p.getByRole("button", { name: "Submit request" }),
  };

  test("no horizontal overflow in any state: initial, errors, over-balance alert, success", async ({
    page,
  }) => {
    await expectNoHorizontalOverflow(page);

    await field.submit(page).tap();
    await expect(page.locator('[data-slot="form-message"]').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await field.type(page).tap();
    await page.getByRole("option", { name: /Vacation/ }).tap();
    await field.start(page).fill("2027-04-05");
    await field.end(page).fill("2027-04-09"); // 5 days vs 0.25 available → alert
    await expect(page.getByText("This is more than your Vacation balance")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await field.reason(page).fill("Family trip");
    await field.submit(page).tap();
    await expect(page.locator("[data-sonner-toast]")).toContainText("Request sent for approval");
    await expectNoHorizontalOverflow(page);
  });

  test("every control works by touch, end to end", async ({ page }) => {
    await field.type(page).tap();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    const box = (await listbox.boundingBox())!;
    const vw = page.viewportSize()!.width;
    expect(box.x, "options must open inside the viewport").toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
    await page.getByRole("option", { name: /Sick/ }).tap();
    await expect(field.type(page)).toContainText("Sick");

    await field.start(page).fill("2027-03-01");
    await field.end(page).fill("2027-03-02");
    await field.reason(page).tap();
    await field.reason(page).fill("Recovering from a cold");
    await field.submit(page).scrollIntoViewIfNeeded();
    await field.submit(page).tap();

    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toContainText("Request sent for approval");
    const t = (await toast.boundingBox())!;
    expect(t.x).toBeGreaterThanOrEqual(0);
    expect(t.x + t.width).toBeLessThanOrEqual(vw + 1);
    await expect(field.reason(page)).toHaveValue(""); // form reset after success
  });

  test("tap targets are ≥44px and inside the viewport", async ({ page }) => {
    await expectTapTargets(page);
  });

  test("form fields use ≥16px text so iOS doesn't zoom on focus", async ({ page }) => {
    // iOS Safari zooms when a focused <input>/<textarea>/<select> is under 16px; the
    // Radix select trigger is a <button>, which doesn't trigger that zoom.
    for (const loc of [field.start(page), field.end(page), field.reason(page)]) {
      const px = await loc.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(px).toBeGreaterThanOrEqual(16);
    }
  });

  test("Submit is reachable and not covered by the sticky header; focused fields stay visible", async ({
    page,
  }) => {
    await expectNotUnderHeader(page, field.submit(page));
    await field.reason(page).focus();
    await expectNotUnderHeader(page, field.reason(page));
  });

  test("200% text: still no horizontal overflow (WCAG 1.4.4 / 1.4.10)", async ({ page }) => {
    await enlargeText(page);
    await expectNoHorizontalOverflow(page);
  });

  test("200% text: the leave-type field wraps — nothing clipped, still a 44px target (TASK-055)", async ({
    page,
  }) => {
    await enlargeText(page);
    await expectSelectsNotClipped(page);
  });

  test("keyboard only: logical order, operable select, submit with Enter", async ({ page }) => {
    // Skip link is the first stop and moves focus into main.
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");

    const stops = await tabUntil(page, field.submit(page));
    const order = ["Leave type", "Start date", "End date", "Reason", "Clear", "Submit request"];
    const idx = order.map((label) => stops.findIndex((s) => s.includes(label)));
    expect(
      idx.every((i) => i >= 0),
      `missing stops in: ${stops.join(" → ")}`,
    ).toBe(true);
    expect(
      [...idx].sort((a, b) => a - b),
      `focus order: ${stops.join(" → ")}`,
    ).toEqual(idx);

    // Fill everything with the keyboard only.
    await field.type(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    const highlighted = page.locator('[role="option"][data-highlighted]');
    await expect(highlighted).toContainText("Vacation"); // opens on the first option
    await page.keyboard.press("ArrowDown");
    await expect(highlighted).toContainText("Sick"); // wait for the key to be processed
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden(); // wait for the close to finish
    await expect(field.type(page)).toBeFocused(); // focus returns to the trigger
    await expect(field.type(page)).toContainText("Sick");

    await page.keyboard.press("Tab");
    await expect(field.start(page)).toBeFocused();
    await page.keyboard.type("03012027"); // mm dd yyyy segments (en-US)
    // Chromium makes each date segment (mm/dd/yyyy) its own Tab stop, so tab until the
    // next field instead of assuming one press (bounded, so a trap would still fail).
    await tabUntil(page, field.end(page), 5);
    await page.keyboard.type("03022027");
    await expect(field.start(page)).toHaveValue("2027-03-01");
    await expect(field.end(page)).toHaveValue("2027-03-02");

    await tabUntil(page, field.reason(page), 5);
    await page.keyboard.type("Keyboard-only request");
    await field.submit(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-sonner-toast]")).toContainText("Request sent for approval");
  });

  test("visible focus indicator on every form control, the menu button and the user menu", async ({
    page,
  }) => {
    const targets = [
      page.getByRole("button", { name: "Open navigation menu" }),
      page.getByRole("button", { name: /account menu/i }),
      field.type(page),
      field.start(page),
      field.end(page),
      field.reason(page),
      page.getByRole("button", { name: "Clear" }),
      field.submit(page),
    ];
    for (const t of targets) {
      await tabUntil(page, t);
      await expectVisibleFocus(t);
    }
    expect(await focusedLabel(page)).toContain("Submit request");
  });

  test("no serious/critical accessibility violations (empty and with errors)", async ({ page }) => {
    expect(await seriousA11yViolations(page)).toEqual([]);
    await field.submit(page).tap();
    await expect(page.locator('[data-slot="form-message"]').first()).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
});

test("Unpaid: no balance warning even for a long range, and it submits (US-08 AC2)", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  await page.goto("/requests/new");
  await page.locator('main button[role="combobox"]').tap();
  const unpaid = page.getByRole("option", { name: /Unpaid/ });
  await expect(unpaid).toContainText("not tracked");
  await unpaid.tap();
  await expect(page.getByRole("listbox")).toBeHidden();
  await page.locator('input[name="startDate"]').fill("2027-05-01");
  await page.locator('input[name="endDate"]').fill("2027-07-31");
  await expect(page.getByText("92 days requested")).toBeVisible();
  // The over-balance alert must NOT appear for an untracked type.
  await expect(page.getByText(/more than your .* balance/)).toHaveCount(0);
  await page.locator('textarea[name="reason"]').fill("Sabbatical");
  await page.getByRole("button", { name: "Submit request" }).tap();
  await expect(page.locator("[data-sonner-toast]")).toContainText("Request sent for approval");
});

test("sign-in through the real login form works by touch on mobile", async ({ page }) => {
  await page.goto("/login?next=%2Frequests%2Fnew");
  await page.locator("#userId").tap();
  await page.getByRole("option", { name: "Jordan Lee" }).tap();
  await page.getByRole("button", { name: "Sign in" }).tap();
  await expect(page).toHaveURL(/\/requests\/new$/);
  await expectNoHorizontalOverflow(page);
});
