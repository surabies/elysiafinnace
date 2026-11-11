import { expect, test } from "@playwright/test";

/**
 * These run against the real Next.js production server, not the in-process Elysia app.
 * They exist because bundling can change runtime behaviour: Turbopack once let
 * out-of-range query numbers through, and a DELETE handler that worked under Bun failed in production.
 */
const password = "correct-horse-battery";

test.describe("API on the production server", () => {
  test("core endpoints respond with the documented shapes", async ({ request }) => {
    const root = await request.get("/api");
    expect(root.status()).toBe(200);
    expect(await root.json()).toEqual({ success: true, name: "Elysia Backend API", version: "1.0.0" });

    const health = await request.get("/api/health");
    expect(await health.json()).toEqual({ success: true, status: "healthy" });

    const echo = await request.post("/api/echo", { data: { message: "ping" } });
    expect(await echo.json()).toEqual({ success: true, data: { message: "ping" } });

    const bad = await request.post("/api/echo", { data: { message: "" } });
    expect(bad.status()).toBe(422);
    expect((await bad.json()).error.code).toBe("VALIDATION_ERROR");

    const unknown = await request.get("/api/does-not-exist");
    expect(unknown.status()).toBe(404);
  });

  test("Better Auth owns /api/auth/* (route precedence over the Elysia catch-all)", async ({ request }) => {
    const ok = await request.get("/api/auth/ok");
    expect(await ok.json()).toEqual({ ok: true });
    const session = await request.get("/api/auth/get-session");
    expect(await session.json()).toBeNull();
  });

  test("query validation enforces numeric ranges", async ({ request }) => {
    for (const query of [
      "lon=999&lat=1",
      "lon=1&lat=-91",
      "lon=1&lat=1&radius=0",
      "lon=1&lat=1&radius=50001",
      "lon=abc&lat=1",
    ]) {
      const response = await request.get(`/api/places/nearby?${query}`);
      expect(response.status(), query).toBe(422);
    }
    expect((await request.get("/api/places?limit=101")).status()).toBe(422);
    expect((await request.get("/api/places?limit=100")).status()).toBe(200);
    const ok = await request.get("/api/places/nearby?lon=1.5&lat=1&radius=10");
    expect((await ok.json()).query).toEqual({ longitude: 1.5, latitude: 1, radiusMeters: 10 });
  });

  test("protected endpoints return 401 without a session", async ({ request }) => {
    expect((await request.get("/api/me")).status()).toBe(401);
    expect((await request.post("/api/places", { data: { name: "x", longitude: 1, latitude: 1 } })).status()).toBe(401);
    expect((await request.delete("/api/places/00000000-0000-4000-8000-000000000000")).status()).toBe(401);
  });

  test("full place lifecycle: create, validate body ranges, nearby, forbidden delete, delete", async ({ playwright, baseURL }) => {
    const owner = await playwright.request.newContext({ baseURL });
    const other = await playwright.request.newContext({ baseURL });
    const origin = baseURL ?? "http://localhost:3000";
    const tag = crypto.randomUUID().slice(0, 8);

    for (const [ctx, name] of [[owner, "Owner"], [other, "Other"]] as const) {
      const signUp = await ctx.post("/api/auth/sign-up/email", {
        headers: { origin },
        data: { name, email: `${name.toLowerCase()}-${tag}@example.test`, password },
      });
      expect(signUp.status()).toBe(200);
    }

    const me = await owner.get("/api/me");
    expect(me.status()).toBe(200);

    const outOfRange = await owner.post("/api/places", { data: { name: `bad-${tag}`, longitude: 181, latitude: 0 } });
    expect(outOfRange.status()).toBe(422);

    const created = await owner.post("/api/places", { data: { name: `Spot ${tag}`, longitude: 2.2945, latitude: 48.8584 } });
    expect(created.status()).toBe(201);
    const place = (await created.json()).data as { id: string };

    const duplicate = await owner.post("/api/places", { data: { name: `Spot ${tag}`, longitude: 3, latitude: 3 } });
    expect(duplicate.status()).toBe(409);

    const nearby = await owner.get("/api/places/nearby?lon=2.2950&lat=48.8584&radius=200");
    const hits = (await nearby.json()).data as { id: string; distanceMeters: number }[];
    const hit = hits.find((item) => item.id === place.id);
    expect(hit?.distanceMeters).toBeGreaterThan(30);
    expect(hit?.distanceMeters).toBeLessThan(45);

    const forbidden = await other.delete(`/api/places/${place.id}`);
    expect(forbidden.status()).toBe(403);

    const deleted = await owner.delete(`/api/places/${place.id}`);
    expect(deleted.status()).toBe(200);
    expect(await deleted.json()).toEqual({ success: true, data: { id: place.id } });
    expect((await owner.get(`/api/places/${place.id}`)).status()).toBe(404);

    await owner.dispose();
    await other.dispose();
  });

  test("sends the security headers and hides the framework banner", async ({ request }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
