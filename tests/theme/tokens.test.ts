import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TASK-047 (US-24 AC2) — WCAG AA contrast for every colour pairing the UI uses, in BOTH themes,
 * computed from the hsl tokens in app/globals.css; and the two dark blocks (.dark and the
 * "system" media query) are identical. axe only checks what's on screen — this checks them all.
 */
const css = readFileSync(path.resolve(import.meta.dirname, "../../app/globals.css"), "utf8");

function block(selectorStart: string): Record<string, string> {
  const at = css.indexOf(selectorStart);
  if (at < 0) throw new Error(`block not found: ${selectorStart}`);
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  const vars: Record<string, string> = {};
  for (const m of css.slice(open + 1, close).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    vars[m[1]!] = m[2]!.trim();
  }
  return vars;
}
const light = block(":root {");
const dark = block(".dark {");
const systemDark = block(":root:not(.light) {");

function luminance(hsl: string): number {
  const m = /^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/.exec(hsl);
  if (!m) throw new Error(`not an hsl() token: ${hsl}`);
  const [h, s, l] = [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100];
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(f(0)) + 0.7152 * lin(f(8)) + 0.0722 * lin(f(4));
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** [foreground, background, minimum ratio] — text 4.5:1; UI accents (non-text) 3:1. */
const PAIRS: [string, string, number][] = [
  ["foreground", "background", 4.5],
  ["card-foreground", "card", 4.5],
  ["popover-foreground", "popover", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["accent-foreground", "accent", 4.5],
  ["destructive-foreground", "destructive", 4.5],
  ["status-pending-foreground", "status-pending", 4.5],
  ["status-approved-foreground", "status-approved", 4.5],
  ["status-rejected-foreground", "status-rejected", 4.5],
  ["status-cancelled-foreground", "status-cancelled", 4.5],
  ["leave-vacation", "leave-vacation-subtle", 4.5],
  ["leave-sick", "leave-sick-subtle", 4.5],
  ["leave-unpaid", "leave-unpaid-subtle", 4.5],
  // used directly on surfaces (alerts, balance card, idle dialog), not only on its own badge
  ["status-pending-foreground", "card", 4.5],
  ["status-pending-foreground", "background", 4.5],
  ["ring", "background", 3],
  ["role-employee-foreground", "role-employee", 4.5], // primary button text
  ["role-employee", "background", 4.5], // links
  ["role-employee", "card", 4.5],
  ["role-employee-subtle-foreground", "role-employee-subtle", 4.5], // menu / hover highlight
  ["role-manager-foreground", "role-manager", 4.5], // primary button text
  ["role-manager", "background", 4.5], // links
  ["role-manager", "card", 4.5],
  ["role-manager-subtle-foreground", "role-manager-subtle", 4.5], // menu / hover highlight
  ["role-hr-admin-foreground", "role-hr-admin", 4.5], // primary button text
  ["role-hr-admin", "background", 4.5], // links
  ["role-hr-admin", "card", 4.5],
  ["role-hr-admin-subtle-foreground", "role-hr-admin-subtle", 4.5], // menu / hover highlight
  ["brand-foreground", "brand", 4.5],
];

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme — WCAG AA contrast", (_name, t) => {
  it.each(PAIRS)("%s on %s ≥ %s:1", (fg, bg, min) => {
    expect(t[fg], fg).toBeDefined();
    expect(t[bg], bg).toBeDefined();
    expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min);
  });
});

describe("dark theme definitions", () => {
  it("the .dark block and the system (prefers-color-scheme) block are identical", () => {
    expect(systemDark).toEqual(dark);
  });

  it("every light colour token has a dark value (nothing half-themed)", () => {
    const colours = Object.keys(light).filter((k) => k !== "radius");
    expect(colours.filter((k) => !(k in dark))).toEqual([]);
  });
});

describe("role accent override (TASK-047)", () => {
  const ROLES = ["employee", "manager", "hr_admin"] as const;
  const INTERACTIVE = ["primary", "primary-foreground", "ring", "accent", "accent-foreground"];

  it.each(ROLES)("%s remaps exactly the interactive tokens to its role tokens", (role) => {
    const t = block(`:root:has([data-role-accent="${role}"]) {`);
    const r = role.replace("_", "-");
    expect(Object.keys(t).sort()).toEqual([...INTERACTIVE].sort());
    expect(t).toEqual({
      primary: `var(--role-${r})`,
      "primary-foreground": `var(--role-${r}-foreground)`,
      ring: `var(--role-${r})`,
      accent: `var(--role-${r}-subtle)`,
      "accent-foreground": `var(--role-${r}-subtle-foreground)`,
    });
  });

  it("the override comes after the dark blocks (same specificity as :root:not(.light))", () => {
    expect(css.indexOf(':root:has([data-role-accent="employee"])')).toBeGreaterThan(
      css.indexOf(":root:not(.light) {"),
    );
  });

  it("role hues stay clear (≥ 25°) of every saturated semantic hue (status, leave, destructive)", () => {
    const hueSat = (v: string) => {
      const m = /^hsl\(\s*([\d.]+)\s+([\d.]+)%/.exec(v)!;
      return [Number(m[1]), Number(m[2])] as const;
    };
    const semantic = Object.entries(light)
      .filter(([k]) => /^(status-|leave-|destructive)/.test(k) && !/subtle|foreground/.test(k))
      .map(([k, v]) => [k, ...hueSat(v)] as const)
      .filter(([, , sat]) => sat >= 40); // greys (cancelled, unpaid) have no meaningful hue
    for (const r of ["employee", "manager", "hr-admin"]) {
      for (const theme of [light, dark]) {
        const [h] = hueSat(theme[`role-${r}`]!);
        for (const [k, sh] of semantic) {
          const d = Math.min(Math.abs(h - sh), 360 - Math.abs(h - sh));
          expect(d, `role-${r} vs ${k}`).toBeGreaterThanOrEqual(25);
        }
      }
    }
  });
});
