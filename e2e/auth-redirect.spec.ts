import { expect, test } from "./helpers";

/**
 * TASK-020 / US-13 — a malicious `next` on the real sign-in form must never send the
 * user off-site. Every non-app request is aborted BEFORE the form is submitted, so the
 * test can never reach an external host even against vulnerable code.
 */
test.describe("sign-in redirect is same-origin only", () => {
  let offsite: string[];

  test.beforeEach(async ({ context, baseURL }) => {
    offsite = [];
    const app = new URL(baseURL!).host;
    await context.route(
      (url) => url.host !== app,
      async (route) => {
        offsite.push(route.request().url());
        await route.abort("blockedbyclient");
      },
    );
  });

  const signIn = async (page: import("@playwright/test").Page, next: string) => {
    await page.goto(`/login?next=${encodeURIComponent(next)}`);
    await page.locator("#userId").tap();
    await page.getByRole("option", { name: "Jordan Lee" }).tap();
    await page.getByRole("button", { name: "Sign in" }).tap();
  };

  for (const [label, next] of [
    ["tab", "/\t/evil.example"],
    ["newline", "/\n/evil.example"],
    ["backslash", "/\\evil.example"],
    ["absolute URL", "https://evil.example/phish"],
  ] as const) {
    test(`malicious next (${label}) lands on /dashboard`, async ({ page, baseURL }) => {
      await signIn(page, next);
      await expect(page).toHaveURL(`${baseURL}/dashboard`);
      expect(offsite, "no request may leave the app").toEqual([]);
    });
  }

  test("a legitimate next is still honoured", async ({ page, baseURL }) => {
    await signIn(page, "/requests/new");
    await expect(page).toHaveURL(`${baseURL}/requests/new`);
    expect(offsite).toEqual([]);
  });
});
