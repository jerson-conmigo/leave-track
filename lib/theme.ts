import { z } from "zod";

/**
 * TASK-047 (US-24) — the colour theme, chosen per browser and stored in the `lt-theme` cookie. The
 * server renders <html class="light|dark"> from it; "system" renders no class and the CSS follows
 * the OS preference (app/globals.css). No script and no dependency, so there's never a flash of the
 * wrong theme. Pure module: the cookie is read in app/layout.tsx and written by app/theme/actions.ts.
 */
export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
export const ThemeSchema = z.enum(THEMES);
export const THEME_COOKIE = "lt-theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Any missing or unexpected cookie value means "system" — a raw value never reaches the page. */
export function parseTheme(raw: unknown): Theme {
  const parsed = ThemeSchema.safeParse(raw);
  return parsed.success ? parsed.data : "system";
}

/** The class on <html>: a fixed string per theme, never derived from input. */
export function htmlClassFor(theme: Theme): "light" | "dark" | "" {
  return theme === "light" ? "light" : theme === "dark" ? "dark" : "";
}
