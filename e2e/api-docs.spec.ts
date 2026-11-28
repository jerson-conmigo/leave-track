import { expect, test } from "./helpers";

/**
 * TASK-057 — Swagger UI at /api-docs, in a real browser against the PRODUCTION build (`next
 * start`: the strict CSP, no 'unsafe-eval'). It must render every documented operation from
 * /api/openapi.json with no CSP violation and no script error. Development tool: the layout
 * is Swagger UI's own, so the app's mobile layout checks don't apply here.
 */
const OPERATIONS = [
  "GET /api/health",
  "GET /api/leave-requests",
  "POST /api/leave-requests",
  "POST /api/leave-requests/{id}/decision",
  "GET /api/audit/{userId}",
  "GET /api/jobs/accrual",
  "POST /api/jobs/accrual",
  "POST /api/session/heartbeat", // TASK-025
  "POST /api/notifications/read", // TASK-030
  "POST /api/leave-requests/{id}/cancel", // TASK-028
  "POST /api/resolutions", // TASK-032
  "GET /api/jobs/resolution-expiry", // TASK-034
  "POST /api/jobs/resolution-expiry", // TASK-034
  "POST /api/resolutions/{id}/accept", // TASK-033
  "POST /api/resolutions/{id}/decline", // TASK-033
  "POST /api/resolutions/{id}/repropose", // TASK-033
  "POST /api/resolutions/{id}/finalize", // TASK-033
];

test("Swagger UI renders every operation under the unchanged CSP, with no errors", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || /Content Security Policy|unsafe-eval|EvalError/i.test(m.text()))
      problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`);
  });
  const specLoaded = page.waitForResponse((r) => r.url().endsWith("/api/openapi.json"));

  const res = await page.goto("/api-docs");
  expect(res?.status()).toBe(200);
  const csp = res?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("script-src 'self' 'unsafe-inline'");
  expect(csp).not.toContain("unsafe-eval");
  expect((await specLoaded).status()).toBe(200);

  await expect(page.locator(".opblock")).toHaveCount(OPERATIONS.length);
  const rendered = await page
    .locator(".opblock-summary")
    .evaluateAll((els) =>
      els.map(
        (el) =>
          `${el.querySelector(".opblock-summary-method")?.textContent?.trim()} ${el
            .querySelector(".opblock-summary-path")
            ?.textContent?.replace(/​/g, "")
            .trim()}`,
      ),
    );
  expect(rendered.sort()).toEqual([...OPERATIONS].sort());

  // Interact: expand an operation (Swagger UI renders its schemas on demand).
  await page.locator(".opblock-summary").first().click();
  await expect(page.locator(".opblock-body").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Try it out/i }).first()).toBeVisible();

  expect(problems).toEqual([]);
});

test("the raw document is served without the success envelope", async ({ request }) => {
  const res = await request.get("/api/openapi.json");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.openapi).toBe("3.1.0");
  expect(body).not.toHaveProperty("success");
});
