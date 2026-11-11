import { expect, test } from "@playwright/test";

/**
 * These run against the real Next.js production server, not the in-process Elysia app.
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

  test("protected endpoints return 401 without a session", async ({ request }) => {
    expect((await request.get("/api/me")).status()).toBe(401);
    expect((await request.get("/api/keuangan/akun")).status()).toBe(401);
  });

  test("user lifecycle: register, view profile, call authenticated endpoint", async ({ playwright, baseURL }) => {
    const user = await playwright.request.newContext({ baseURL });
    const origin = baseURL ?? "http://localhost:3000";
    const tag = crypto.randomUUID().slice(0, 8);

    const signUp = await user.post("/api/auth/sign-up/email", {
      headers: { origin },
      data: { name: "Finance User", email: `finance-${tag}@example.test`, password },
    });
    expect(signUp.status()).toBe(200);

    const me = await user.get("/api/me");
    expect(me.status()).toBe(200);
    const meData = await me.json();
    expect(meData.success).toBe(true);
    expect(meData.data.email).toBe(`finance-${tag}@example.test`);

    await user.dispose();
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
