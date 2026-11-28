import AxeBuilder from "@axe-core/playwright";
import {
  test as base,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { newSessionId, signSessionToken } from "../lib/auth/session-token";

export const USERS = {
  ana: "00000000-0000-4000-8000-000000000101", // employee (Ben's team)
  jordan: "00000000-0000-4000-8000-000000000102",
  ben: "00000000-0000-4000-8000-000000000011", // manager
  carla: "00000000-0000-4000-8000-000000000001", // hr_admin
} as const;
export type Role = "employee" | "manager" | "hr_admin";

/**
 * `test` with an AUTO fixture: every test starts from the seed via the gated
 * reset hook, so tests are isolated from each other's writes regardless of order.
 */
export const test = base.extend<{ resetData: void }>({
  resetData: [
    async ({ request }, use) => {
      const res = await request.post("/api/test/reset", {
        headers: { "x-e2e-reset-token": process.env.E2E_RESET_TOKEN ?? "" },
      });
      expect(res.status(), "e2e reset hook must be enabled for the test server").toBe(200);
      await use();
    },
    { auto: true },
  ],
});
export { expect };

/**
 * Sign in by setting the SIGNED session cookie directly (TASK-023), signed with the
 * per-run SESSION_SECRET that playwright.config.ts also gives the server.
 * TASK-025: v2 claims. `signedInSecondsAgo` / `idleSecondsAgo` backdate the sign-in time and
 * the last activity, to test the absolute and idle limits without waiting.
 */
export async function signInAs(
  context: BrowserContext,
  role: Role,
  userId: string,
  { signedInSecondsAgo = 0, idleSecondsAgo = 0 } = {},
) {
  const url = test.info().project.use.baseURL!;
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be set by playwright.config.ts");
  const now = Math.floor(Date.now() / 1000);
  // Last activity can't precede sign-in: an idle-only backdate moves the sign-in back too.
  const iat = now - Math.max(signedInSecondsAgo, idleSecondsAgo);
  const lat = now - idleSecondsAgo;
  await context.clearCookies();
  await context.addCookies([
    {
      name: "lt-session",
      value: signSessionToken(
        { uid: userId, role, sid: newSessionId(), iat, lat, exp: iat + 8 * 60 * 60 },
        secret,
      ),
      url,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/** No horizontal scroll; the failure message lists the offending elements. */
export async function expectNoHorizontalOverflow(page: Page) {
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return b.width > 0 && b.right > vw + 1 && !el.closest(".sr-only");
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`);
    return { scroll: document.documentElement.scrollWidth, vw, offenders };
  });
  expect(r.scroll, `horizontal overflow: ${r.offenders.join(" | ")}`).toBeLessThanOrEqual(r.vw);
}

/**
 * TASK-055: every visible Select trigger shows its whole value — nothing clipped horizontally or
 * vertically (wrap, don't truncate: WCAG 1.4.4) — and stays a ≥44px tap target.
 */
export async function expectSelectsNotClipped(page: Page) {
  const bad = await page.evaluate(() =>
    [...document.querySelectorAll('button[role="combobox"]')]
      .filter((t) => t.getBoundingClientRect().width > 0)
      .flatMap((t) => {
        const value = t.querySelector('[data-slot="select-value"]') ?? t;
        const clipped = [t, value].some(
          (el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
        );
        const h = t.getBoundingClientRect().height;
        return clipped || h < 44
          ? [`"${(t.textContent ?? "").trim()}" ${clipped ? "clipped" : ""} h=${Math.round(h)}`]
          : [];
      }),
  );
  expect(bad, `select content clipped or too small: ${bad.join(" | ")}`).toEqual([]);
}

/** Visible interactive controls are ≥44px tall and fully inside the viewport width. */
export async function expectTapTargets(page: Page, scope = "header, main") {
  const bad = await page.evaluate((scope) => {
    const vw = document.documentElement.clientWidth;
    const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="combobox"]';
    return [...document.querySelectorAll(scope)]
      .flatMap((root) => [...root.querySelectorAll(sel)])
      .filter((el) => {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (!b.width || !b.height || cs.visibility === "hidden" || el.closest(".sr-only"))
          return false;
        if (el.tagName === "SELECT" && cs.position === "absolute") return false; // Radix hidden native select
        return b.height < 44 || b.left < -1 || b.right > vw + 1;
      })
      .map((el) => {
        const b = el.getBoundingClientRect();
        const name = (
          el.getAttribute("aria-label") ||
          (el as HTMLElement).innerText ||
          el.getAttribute("name") ||
          ""
        ).trim();
        return `${el.tagName.toLowerCase()} "${name.slice(0, 30)}" ${Math.round(b.height)}px tall, x ${Math.round(b.left)}–${Math.round(b.right)}`;
      });
  }, scope);
  expect(bad, "tap targets must be ≥44px tall and inside the viewport").toEqual([]);
}

/** The element is not under the sticky header and is the topmost element at its centre. */
export async function expectNotUnderHeader(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const r = await target.evaluate((el) => {
    const header = document.querySelector("header");
    const b = el.getBoundingClientRect();
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return {
      headerBottom: header ? header.getBoundingClientRect().bottom : 0,
      top: b.top,
      topmost: !!hit && (hit === el || el.contains(hit)),
    };
  });
  expect(r.top, "element is hidden under the sticky header").toBeGreaterThanOrEqual(
    r.headerBottom - 1,
  );
  expect(r.topmost, "element is covered by another element").toBe(true);
}

/**
 * The focus indicator must be a VISIBLE CHANGE between focused and blurred: a drawn
 * box-shadow layer (non-transparent, non-zero size), an outline, or a border-colour change.
 * Zero-width/transparent shadow changes don't count. (A resting shadow such as `shadow-xs` is not a
 * focus indicator — TASK-016 VALIDATE caught that false green.) Re-focuses the element
 * afterwards so Tab order continues from it; keyboard modality keeps :focus-visible.
 */
export async function focusIndicatorChange(page: Page): Promise<{ ok: boolean; label: string }> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { ok: true, label: "(body)" };

    /** Only shadow layers that actually draw something: non-transparent and non-zero size. */
    const visibleShadows = (value: string): string[] => {
      if (value === "none") return [];
      const layers = value.split(/,(?![^(]*\))/).map((l) => l.trim());
      return layers.filter((layer) => {
        const color = layer.match(/rgba?\(([^)]+)\)/);
        const alpha = color ? Number(color[1]!.split(",")[3] ?? 1) : 1;
        const lengths = (layer.replace(/rgba?\([^)]*\)/, "").match(/-?\d*\.?\d+px/g) ?? []).map(
          parseFloat,
        );
        return alpha > 0 && lengths.some((n) => n !== 0);
      });
    };
    const read = () => {
      // Settle CSS transitions (e.g. `transition-[box-shadow]`) so we read end states.
      el.getAnimations().forEach((a) => a.finish());
      const cs = getComputedStyle(el);
      const outlineOn = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      return {
        shadows: visibleShadows(cs.boxShadow).join(" | "),
        outline: outlineOn ? `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` : "",
        border: `${cs.borderTopColor} ${cs.borderTopWidth}`,
      };
    };
    const focused = read();
    el.blur();
    const rest = read();
    el.focus();
    const changed =
      (focused.shadows !== "" && focused.shadows !== rest.shadows) ||
      (focused.outline !== "" && focused.outline !== rest.outline) ||
      (parseFloat(focused.border.split(" ").at(-1) ?? "0") > 0 && focused.border !== rest.border);
    const visible = el.getBoundingClientRect().width > 0;
    return {
      ok: visible && changed,
      label: `${el.outerHTML.slice(0, 70)} | focused=${JSON.stringify(focused)} rest=${JSON.stringify(rest)}`,
    };
  });
}

/** After KEYBOARD focus, the element shows a visible focus indicator (a visible change). */
export async function expectVisibleFocus(target: Locator) {
  await expect(target).toBeFocused();
  const r = await focusIndicatorChange(target.page());
  expect(r.ok, `no visible focus change: ${r.label}`).toBe(true);
  await expect(target).toBeFocused();
}

/** Press Tab until `target` has focus; returns the labels of every stop on the way. */
export async function tabUntil(page: Page, target: Locator, max = 40): Promise<string[]> {
  const stops: string[] = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    stops.push(await focusedLabel(page));
    if (await target.evaluate((el) => el === document.activeElement)) return stops;
  }
  throw new Error(`never reached the target after ${max} Tab presses: ${stops.join(" → ")}`);
}

export function focusedLabel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "(body)";
    const labelled = el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent : null;
    return (
      el.getAttribute("aria-label") ||
      labelled ||
      el.getAttribute("name") ||
      el.innerText ||
      el.tagName
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
  });
}

/** WCAG 2.1 A/AA scan; returns serious/critical violations only. */
export async function seriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(", ")}`,
    );
}

/** Simulate 200% text size (WCAG 1.4.4): Tailwind sizes are rem-based. */
export async function enlargeText(page: Page) {
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  // TASK-055: measure the SETTLED layout. With reduced motion (playwright.config) every element
  // has a 0.01ms transition (app/globals.css, B34), so for the first frame(s) after the style
  // is injected the page keeps its old geometry — a measurement there passes falsely. Wait
  // until the page's size is unchanged for 3 consecutive frames (at least 4 frames, at most ~60).
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const size = () =>
          `${document.documentElement.scrollWidth}x${document.body.getBoundingClientRect().height}`;
        let last = size();
        let stable = 0;
        let frames = 0;
        const tick = () => {
          frames++;
          const now = size();
          stable = now === last ? stable + 1 : 0;
          last = now;
          if ((stable >= 3 && frames >= 4) || frames >= 60) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}
