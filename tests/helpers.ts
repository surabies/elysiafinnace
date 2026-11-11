import { auth } from "@/lib/auth";
import { app } from "@/server/app";

export const ORIGIN = "http://localhost:3000";

export function api(path: string, init: RequestInit = {}) {
  return app.handle(new Request(`${ORIGIN}${path}`, init));
}

export function json(body: unknown, extra: Record<string, string> = {}): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json", ...extra },
    body: JSON.stringify(body),
  };
}

export function uniqueEmail(label = "user") {
  return `${label}-${crypto.randomUUID().slice(0, 8)}@example.test`;
}

/** Turns Set-Cookie headers into a Cookie request header. */
export function cookieHeader(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

export function authRequest(path: string, body?: unknown, method = "POST", cookie?: string) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        ...(cookie ? { cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
}

export const PASSWORD = "correct-horse-battery";

/** Registers a user through the real Better Auth handler and returns a session cookie. */
export async function createUser(label = "user") {
  const email = uniqueEmail(label);
  const response = await authRequest("/sign-up/email", {
    name: `Test ${label}`,
    email,
    password: PASSWORD,
  });
  if (response.status !== 200) {
    throw new Error(`sign-up failed with status ${response.status}`);
  }
  const body = (await response.json()) as { user: { id: string } };
  return { email, userId: body.user.id, cookie: cookieHeader(response) };
}

export function authed(cookie: string, init: RequestInit = {}): RequestInit {
  return { ...init, headers: { ...(init.headers as Record<string, string>), cookie } };
}
