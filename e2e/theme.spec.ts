import type { BrowserContext, Page } from "@playwright/test";
import { expect, seriousA11yViolations, signInAs, test, USERS } from "./helpers";

/**
 * TASK-047 (US-24) — themes rendered by the server from the lt-theme cookie (no script, no flash),
 * dark contrast via axe on representative pages, and role accents that never stand alone.
 */
const setTheme = (context: BrowserContext, value: string) =>
  context.addCookies([{ name: "lt-theme", value, url: test.info().project.use.baseURL! }]);
/** Relative luminance of the body background: < 0.2 is a dark first paint. */
const bodyIsDark = async (page: Page) => {
  const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  const [r, g, b] = (bg.match(/\d+/g) ?? []).map(Number) as [number, number, number];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.2;
};

test.describe("no flash — JavaScript disabled, so only the server can have set the theme (AC1)", () => {
  test.use({ javaScriptEnabled: false });

  test("lt-theme=dark → the served HTML is dark", async ({ context, page }) => {
    await setTheme(context, "dark");
    await page.goto("/login");
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
    expect(await bodyIsDark(page)).toBe(true);
  });

  test("lt-theme=light wins over a dark OS preference", async ({ context, page }) => {
    await setTheme(context, "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    expect(await bodyIsDark(page)).toBe(false);
  });

  test("system (no cookie) follows the OS: dark and light", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)(dark|light)(\s|$)/);
    expect(await bodyIsDark(page)).toBe(true);
    // shadcn `dark:` utilities fire under system-dark too (the select trigger's dark background)
    const trigger = page.locator('button[role="combobox"]').first();
    const bg = await trigger.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/login");
    expect(await bodyIsDark(page)).toBe(false);
  });

  test("an invalid cookie is ignored (system), never echoed into the page", async ({
    context,
    page,
  }) => {
    await setTheme(context, "dark evil");
    await page.goto("/login");
    await expect(page.locator("html")).not.toHaveClass(/evil/);
  });
});

test("switching in the account menu applies at once and persists across a reload", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /account menu/ }).tap();
  await page.getByRole("menuitemradio", { name: "Dark" }).tap();
  await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
  await page.getByRole("button", { name: /account menu/ }).tap();
  await expect(page.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("dark theme: zero serious axe violations on representative pages (AC2)", async ({
  context,
  page,
}) => {
  await setTheme(context, "dark");
  await page.goto("/login");
  expect(await seriousA11yViolations(page), "/login").toEqual([]);
  await signInAs(context, "manager", USERS.ben);
  await setTheme(context, "dark");
  for (const path of ["/dashboard", "/requests", "/approvals", "/notifications"]) {
    await page.goto(path);
    expect(await seriousA11yViolations(page), path).toEqual([]);
  }
  // An OPEN account menu is not checked: Radix's modal menu hides the page with aria-hidden while
  // the skip link / header stay focusable — serious in light too (pre-existing, backlog B41).
});

test("dark theme: an open confirm dialog (destructive action, overlay) has no serious axe violations", async ({
  context,
  page,
}) => {
  await signInAs(context, "employee", USERS.ana);
  await setTheme(context, "dark");
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const day = (n: number) => new Date(today + n * 86_400_000).toISOString().slice(0, 10);
  await page.request.post("/api/leave-requests", {
    data: {
      leaveTypeId: "10000000-0000-4000-8000-000000000001",
      startDate: day(70),
      endDate: day(71),
      reason: "Family visit",
    },
  });
  await page.goto("/requests");
  await page
    .getByRole("button", { name: /^Withdraw: Vacation/ })
    .first()
    .tap();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  expect(await seriousA11yViolations(page)).toEqual([]);
});

test("each role's accent sits beside its role label — never colour alone (AC3)", async ({
  context,
  page,
}) => {
  for (const [role, id, label] of [
    ["employee", USERS.ana, "Employee"],
    ["manager", USERS.ben, "Manager"],
    ["hr_admin", USERS.carla, "HR Admin"],
  ] as const) {
    await signInAs(context, role, id);
    await page.goto("/dashboard");
    const header = page.locator(`header[data-role-accent="${role}"]`);
    await expect(header).toBeVisible();
    const edge = await header.evaluate((el) => getComputedStyle(el).borderLeftColor);
    expect(edge).not.toBe("rgba(0, 0, 0, 0)");
    await expect(page.getByRole("button", { name: /account menu/ })).toContainText(label);
  }
});

test.describe("role accent across the app (TASK-047 revision)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const bg = (page: Page, sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  const fg = (page: Page, sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((el) => getComputedStyle(el).color);
  const edge = (page: Page) =>
    page.locator("header[data-role-accent]").evaluate((el) => getComputedStyle(el).borderLeftColor);

  test("nav, primary buttons, links use the role colour; brand, statuses stay; public pages default", async ({
    context,
    page,
  }) => {
    await page.goto("/login");
    const defaultPrimary = await bg(page, 'main button[type="submit"]');
    const defaultBrand = await bg(page, ".bg-brand");
    const seen: Record<string, string> = {};
    const pendingBadge: string[] = [];
    for (const [role, id] of [
      ["employee", USERS.ana],
      ["manager", USERS.ben],
      ["hr_admin", USERS.carla],
    ] as const) {
      await signInAs(context, role, id);
      await page.goto("/requests/new");
      const accent = await edge(page);
      seen[role] = accent;
      expect(await bg(page, 'main button[type="submit"]'), `${role} primary button`).toBe(accent);
      expect(await bg(page, 'nav a[aria-current="page"]'), `${role} active nav`).toBe(accent);
      expect(await bg(page, ".bg-brand"), `${role} brand stays`).toBe(defaultBrand);
      await page.goto("/dashboard");
      expect(await fg(page, "main a.text-primary"), `${role} link`).toBe(accent);
      if (role !== "hr_admin") {
        await page.goto("/requests");
        pendingBadge.push(await bg(page, '[data-slot="badge"]:has-text("Pending")'));
      }
    }
    expect(seen.employee).toBe(defaultPrimary); // employees: unchanged teal
    expect(new Set(Object.values(seen)).size).toBe(3); // three distinct accents
    expect(pendingBadge[0]).toBe(pendingBadge[1]); // semantic status colour unchanged by role
  });

  test("portals inherit it: the account menu highlight differs by role", async ({
    context,
    page,
  }) => {
    const highlight = async () => {
      await page.goto("/dashboard");
      await page.getByRole("button", { name: /account menu/ }).click();
      const item = page.getByRole("menuitemradio", { name: "Light" });
      await item.focus(); // Radix highlights the focused item (data-highlighted → bg-accent)
      await expect(item).toHaveAttribute("data-highlighted", "");
      return item.evaluate((el) => {
        el.getAnimations().forEach((x) => x.finish());
        return getComputedStyle(el).backgroundColor;
      });
    };
    await signInAs(context, "employee", USERS.ana);
    const employee = await highlight();
    await signInAs(context, "manager", USERS.ben);
    const manager = await highlight();
    expect(employee).not.toBe("rgba(0, 0, 0, 0)");
    expect(manager).not.toBe(employee);
  });

  test("dark: the role accent applies and axe stays clean", async ({ context, page }) => {
    await signInAs(context, "manager", USERS.ben);
    await setTheme(context, "dark");
    await page.goto("/requests/new");
    expect(await bg(page, 'main button[type="submit"]')).toBe(await edge(page));
    for (const path of ["/dashboard", "/approvals"]) {
      await page.goto(path);
      expect(await seriousA11yViolations(page), path).toEqual([]);
    }
  });
});
