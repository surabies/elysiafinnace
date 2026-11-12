import { describe, expect, test } from "bun:test";
import {
  PASSWORD,
  api,
  authRequest,
  authed,
  cookieHeader,
  createUser,
  uniqueEmail,
} from "./helpers";

describe("authentication", () => {
  test("sign-up creates a user and a session cookie", async () => {
    const email = uniqueEmail("signup");
    const response = await authRequest("/sign-up/email", {
      name: "New User",
      email,
      password: PASSWORD,
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { user: { email: string; name: string } };
    expect(body.user.email).toBe(email);
    expect(cookieHeader(response)).toContain("better-auth.session_token=");
  });

  test("sign-up rejects a duplicate email", async () => {
    const { email } = await createUser("dupe");
    const response = await authRequest("/sign-up/email", {
      name: "Again",
      email,
      password: PASSWORD,
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  test("sign-up rejects a short password", async () => {
    const response = await authRequest("/sign-up/email", {
      name: "Short",
      email: uniqueEmail("short"),
      password: "short",
    });
    expect(response.status).toBe(400);
  });

  test("sign-in works with the right password and fails with the wrong one", async () => {
    const { email } = await createUser("signin");
    const ok = await authRequest("/sign-in/email", { email, password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(cookieHeader(ok)).toContain("better-auth.session_token=");

    const bad = await authRequest("/sign-in/email", { email, password: "not-the-password" });
    expect(bad.status).toBe(401);
    expect(cookieHeader(bad)).toBe("");
  });

  test("get-session returns the user, and null without a cookie", async () => {
    const { cookie, email } = await createUser("session");
    const withCookie = await authRequest("/get-session", undefined, "GET", cookie);
    expect(withCookie.status).toBe(200);
    const body = (await withCookie.json()) as { user: { email: string } } | null;
    expect(body?.user.email).toBe(email);

    const without = await authRequest("/get-session", undefined, "GET");
    expect(await without.json()).toBeNull();
  });

  test("sign-out invalidates the session", async () => {
    const { cookie } = await createUser("signout");
    expect((await api("/api/me", authed(cookie))).status).toBe(200);

    const out = await authRequest("/sign-out", {}, "POST", cookie);
    expect(out.status).toBe(200);

    expect((await api("/api/me", authed(cookie))).status).toBe(401);
  });
});

describe("GET /api/me", () => {
  test("returns 401 without a session", async () => {
    const response = await api("/api/me");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  });

  test("returns 401 for a forged cookie", async () => {
    const response = await api("/api/me", authed("better-auth.session_token=forged.value"));
    expect(response.status).toBe(401);
  });

  test("returns the current user", async () => {
    const { cookie, email, userId } = await createUser("me");
    const response = await api("/api/me", authed(cookie));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: boolean;
      data: { id: string; email: string; name: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(userId);
    expect(body.data.email).toBe(email);
    expect(JSON.stringify(body)).not.toContain("password");
  });
});

describe("protected endpoints", () => {
  test("keuangan routes need a session", async () => {
    const create = await api("/api/keuangan/jurnal", {
      method: "POST",
      body: JSON.stringify({ deskripsi: "No auth", tanggal: "2026-01-01" }),
      headers: { "content-type": "application/json" },
    });
    expect(create.status).toBe(401);

    const get = await api("/api/keuangan/akun");
    expect(get.status).toBe(401);
  });
});
