import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPublicPath } from "@/lib/auth/roles";

/**
 * TASK-057 — the API docs routes: available locally, 404 (error envelope) in every deployed
 * stage, and the asset route serves ONLY its allowlist.
 */
const { GET: spec } = await import("@/app/api/openapi.json/route");
const { GET: page } = await import("@/app/api-docs/route");
const { GET: asset } = await import("@/app/api-docs/assets/[file]/route");

const getSpec = () => spec(new NextRequest("http://localhost/api/openapi.json"), undefined);
const getPage = () => page(new NextRequest("http://localhost/api-docs"), undefined);
const getAsset = (file: string) =>
  asset(new NextRequest(`http://localhost/api-docs/assets/${encodeURIComponent(file)}`), {
    params: Promise.resolve({ file }),
  });

const NOT_FOUND = { success: false, error: { code: "NOT_FOUND", message: "Not found." } };

afterEach(() => vi.unstubAllEnvs());

describe("local development: the docs are served", () => {
  it("/api/openapi.json → the RAW OpenAPI document (no success envelope), not cached", async () => {
    const res = await getSpec();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.openapi).toBe("3.1.0");
    expect(body).not.toHaveProperty("success");
    expect(body).not.toHaveProperty("data");
  });

  it("/api-docs → HTML that loads only same-origin scripts (no inline script)", async () => {
    const res = await getPage();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/html/);
    const html = await res.text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(scripts.map((s) => s[1]!.match(/src="([^"]+)"/)?.[1])).toEqual([
      "/api-docs/assets/swagger-ui-bundle.js",
      "/api-docs/assets/init.js",
    ]);
    for (const s of scripts) expect(s[2]!.trim()).toBe(""); // nothing inline
    expect(html).not.toMatch(/https?:\/\//); // no CDN
    expect(html).toMatch(/<html lang="en">/);
  });

  it.each([
    ["swagger-ui.css", /^text\/css/],
    ["swagger-ui-bundle.js", /^text\/javascript/],
    ["init.js", /^text\/javascript/],
  ])("asset %s → 200 %s", async (file, type) => {
    const res = await getAsset(file);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(type);
    expect((await res.text()).length).toBeGreaterThan(0);
  });

  it("init.js points Swagger UI at the same-origin document", async () => {
    expect(await (await getAsset("init.js")).text()).toContain('url: "/api/openapi.json"');
  });

  it.each([
    "../package.json",
    "../../.env.local",
    "..%2Fpackage.json",
    "package.json",
    "swagger-ui.js",
    "index.html",
    "swagger-initializer.js",
    "__proto__",
    "constructor",
    "toString",
    "hasOwnProperty",
    "",
  ])("asset %j outside the allowlist → 404 envelope", async (file) => {
    const res = await getAsset(file);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(NOT_FOUND);
  });
});

describe.each<[string, Record<string, string>]>([
  ["APP_ENV=production", { APP_ENV: "production" }],
  ["APP_ENV=staging", { APP_ENV: "staging" }],
  ["VERCEL_ENV=production", { VERCEL_ENV: "production" }],
  ["VERCEL_ENV=preview", { VERCEL_ENV: "preview" }],
])("deployed (%s): every docs route is a 404 envelope", (_label, env) => {
  it.each([
    ["/api/openapi.json", getSpec],
    ["/api-docs", getPage],
    ["/api-docs/assets/swagger-ui-bundle.js", () => getAsset("swagger-ui-bundle.js")],
    ["/api-docs/assets/init.js", () => getAsset("init.js")],
  ])("%s → 404", async (_path, call) => {
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    const res = await call();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(NOT_FOUND);
  });
});

describe("routing", () => {
  it("the docs routes are public paths (they gate themselves), nothing broader", () => {
    expect(isPublicPath("/api/openapi.json")).toBe(true);
    expect(isPublicPath("/api-docs")).toBe(true);
    expect(isPublicPath("/api-docs/assets/init.js")).toBe(true);
    expect(isPublicPath("/api/openapi")).toBe(false);
    expect(isPublicPath("/api-docsx")).toBe(false);
    expect(isPublicPath("/api/leave-requests")).toBe(false);
  });

  it("every docs route is forced dynamic (the deployed check runs per request, not at build)", async () => {
    for (const mod of [
      await import("@/app/api/openapi.json/route"),
      await import("@/app/api-docs/route"),
      await import("@/app/api-docs/assets/[file]/route"),
    ]) {
      expect(mod.dynamic).toBe("force-dynamic");
    }
  });
});
