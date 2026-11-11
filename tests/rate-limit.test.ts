import { describe, expect, test } from "bun:test";
import { consume } from "@/server/plugins/rate-limit";
import { api, json } from "./helpers";

describe("consume()", () => {
  test("allows up to max, then blocks until the window resets", () => {
    const key = `unit-${crypto.randomUUID()}`;
    const start = 1_000_000;
    expect(consume(key, 2, start)).toMatchObject({ allowed: true, remaining: 1 });
    expect(consume(key, 2, start + 10)).toMatchObject({ allowed: true, remaining: 0 });
    const blocked = consume(key, 2, start + 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    // a new window opens after 60 s
    expect(consume(key, 2, start + 60_001)).toMatchObject({ allowed: true, remaining: 1 });
  });
});

describe("mutating requests", () => {
  test("return 429 with Retry-After once the per-IP budget is spent, even without a session", async () => {
    const headers = { "x-forwarded-for": "203.0.113.77", "content-type": "application/json" };
    const body = JSON.stringify({ name: "spam", longitude: 1, latitude: 1 });
    let lastStatus = 0;
    let retryAfter: string | null = null;
    let firstBlockedAt = -1;
    for (let i = 1; i <= 205; i++) {
      const response = await api("/api/places", { method: "POST", headers, body });
      lastStatus = response.status;
      if (response.status === 429 && firstBlockedAt === -1) {
        firstBlockedAt = i;
        retryAfter = response.headers.get("retry-after");
        const payload = (await response.json()) as { error: { code: string } };
        expect(payload.error.code).toBe("RATE_LIMITED");
      }
    }
    expect(firstBlockedAt).toBe(201); // WRITE_RATE_LIMIT_MAX is 200 in tests
    expect(lastStatus).toBe(429);
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  test("a different client is not affected", async () => {
    const response = await api("/api/places", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.78", "content-type": "application/json" },
      body: JSON.stringify({ name: "ok", longitude: 1, latitude: 1 }),
    });
    expect(response.status).toBe(401); // reaches the auth check, not rate limited
  });

  test("read endpoints are not limited", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await api("/api/health", { headers: { "x-forwarded-for": "203.0.113.77" } })).status).toBe(200);
    }
    expect((await api("/api/echo", json({ message: "still fine" }))).status).toBe(200);
  });
});
