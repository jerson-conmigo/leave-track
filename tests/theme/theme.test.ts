import { beforeEach, describe, expect, it, vi } from "vitest";
import { htmlClassFor, parseTheme, THEME_COOKIE, THEME_COOKIE_MAX_AGE } from "@/lib/theme";

/** TASK-047 — the theme cookie is validated (never echoed raw) and set with safe attributes. */
const jar = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => jar }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const { setThemeAction } = await import("@/app/theme/actions");

beforeEach(() => jar.set.mockReset());

describe("parseTheme / htmlClassFor", () => {
  it.each([
    ["light", "light", "light"],
    ["dark", "dark", "dark"],
    ["system", "system", ""],
    [undefined, "system", ""],
    ["DARK", "system", ""],
    ['dark" onload="x', "system", ""],
    ["dark evil-class", "system", ""],
  ])("%j → %s (class %j)", (raw, theme, cls) => {
    expect(parseTheme(raw)).toBe(theme);
    expect(htmlClassFor(parseTheme(raw))).toBe(cls);
  });
});

describe("setThemeAction", () => {
  it("sets lt-theme: httpOnly, SameSite=Lax, path /, one year", async () => {
    expect(await setThemeAction("dark")).toEqual({ success: true });
    expect(jar.set).toHaveBeenCalledWith(
      THEME_COOKIE,
      "dark",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: THEME_COOKIE_MAX_AGE,
      }),
    );
  });

  it("refuses anything that isn't a theme, and sets nothing", async () => {
    expect(await setThemeAction("purple")).toMatchObject({ success: false });
    expect(await setThemeAction({ theme: "dark" })).toMatchObject({ success: false });
    expect(jar.set).not.toHaveBeenCalled();
  });
});
