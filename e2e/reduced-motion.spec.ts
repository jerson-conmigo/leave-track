import { expect, signInAs, test, USERS } from "./helpers";

/**
 * TASK-016 / backlog B20 — with prefers-reduced-motion (set in playwright.config),
 * overlay animations are effectively instant, and closing an overlay restores
 * page interactivity (the TASK-011 lesson about stuck body pointer-events).
 */
const durationMs = (s: string) =>
  Math.max(
    ...s.split(",").map((v) => (v.trim().endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000)),
  );

test("dialog, sheet and select animate in ≤0.01ms and leave the page clickable", async ({
  context,
  page,
}) => {
  await signInAs(context, "manager", USERS.ben);

  // Dialog (approvals)
  await page.goto("/approvals");
  await page
    .getByRole("button", { name: /^Approve .*request$/ })
    .first()
    .tap();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  expect(
    durationMs(await dialog.evaluate((el) => getComputedStyle(el).animationDuration)),
  ).toBeLessThanOrEqual(0.01);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).pointerEvents))
    .not.toBe("none");

  // Sheet (mobile nav)
  await page.getByRole("button", { name: "Open navigation menu" }).tap();
  const sheet = page.locator('[data-slot="sheet-content"]');
  await expect(sheet).toBeVisible();
  expect(
    durationMs(await sheet.evaluate((el) => getComputedStyle(el).animationDuration)),
  ).toBeLessThanOrEqual(0.01);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).pointerEvents))
    .not.toBe("none");

  // Select (request form)
  await page.goto("/requests/new");
  await page.locator('main button[role="combobox"]').tap();
  const listbox = page.locator('[data-slot="select-content"]');
  await expect(listbox).toBeVisible();
  expect(
    durationMs(await listbox.evaluate((el) => getComputedStyle(el).animationDuration)),
  ).toBeLessThanOrEqual(0.01);
  await page.keyboard.press("Escape");
  await expect(listbox).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).pointerEvents))
    .not.toBe("none");
  // …and the page is genuinely interactive again: a tap reaches the Submit button.
  await page.getByRole("button", { name: "Submit request" }).tap();
  await expect(page.locator('[data-slot="form-message"]').first()).toBeVisible();
});
