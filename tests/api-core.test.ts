import { describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { errorHandler } from "@/server/plugins/error-handler";
import { api, json } from "./helpers";

describe("GET /api", () => {
  test("returns name and version", async () => {
    const response = await api("/api");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      name: "Elysia Backend API",
      version: "1.0.0",
    });
  });
});

describe("GET /api/health", () => {
  test("reports healthy", async () => {
    const response = await api("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, status: "healthy" });
  });
});

describe("POST /api/echo", () => {
  test("echoes a valid message", async () => {
    const response = await api("/api/echo", json({ message: "hello world" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { message: "hello world" } });
  });

  test("accepts a message at the max length", async () => {
    const message = "a".repeat(500);
    const response = await api("/api/echo", json({ message }));
    expect(response.status).toBe(200);
  });

  test.each([
    ["empty string", { message: "" }],
    ["whitespace only", { message: "   " }],
    ["missing field", {}],
    ["wrong type", { message: 42 }],
    ["too long", { message: "a".repeat(501) }],
  ])("rejects %s with 422 and a safe error shape", async (_label, body) => {
    const response = await api("/api/echo", json(body));
    expect(response.status).toBe(422);
    const payload = (await response.json()) as {
      success: boolean;
      error: { code: string; message: string; details: { path: string; message: string }[] };
    };
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(payload.error.details)).toBe(true);
    // never echoes the offending value back
    expect(JSON.stringify(payload)).not.toContain("aaaaaaaaaa");
  });

  test("rejects malformed JSON with 400", async () => {
    const response = await api("/api/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect([400, 422]).toContain(response.status);
    const payload = (await response.json()) as { success: boolean; error: { code: string } };
    expect(payload.success).toBe(false);
  });
});

describe("error handling", () => {
  test("unknown route returns a JSON 404", async () => {
    const response = await api("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Resource not found" },
    });
  });

  test("unexpected errors return a generic 500 and never leak internals", async () => {
    // Next's types mark NODE_ENV read-only; at runtime it is a plain env var.
    const env = process.env as Record<string, string | undefined>;
    const previous = env.NODE_ENV;
    env.NODE_ENV = "production";
    const logged = console.error;
    console.error = () => {};
    try {
      const boom = new Elysia()
        .use(errorHandler)
        .get("/boom", () => {
          throw new Error("secret-internal-detail postgres://user:pw@host/db");
        });
      const response = await boom.handle(new Request("http://localhost/boom"));
      const text = await response.text();
      expect(response.status).toBe(500);
      expect(JSON.parse(text)).toEqual({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      });
      expect(text).not.toContain("secret-internal-detail");
      expect(text).not.toContain("postgres://");
      expect(text).not.toMatch(/\bat \S+\(/); // no stack frames
    } finally {
      console.error = logged;
      env.NODE_ENV = previous;
    }
  });

  test("maps a Postgres unique violation (23505) to 409, even when wrapped", async () => {
    const logged = console.error;
    console.error = () => {};
    try {
      const wrapped = new Elysia().use(errorHandler).get("/dup", () => {
        const cause = Object.assign(new Error("duplicate key value"), { code: "23505" });
        throw new Error("Failed query", { cause });
      });
      const response = await wrapped.handle(new Request("http://localhost/dup"));
      expect(response.status).toBe(409);
      const payload = (await response.json()) as { error: { code: string } };
      expect(payload.error.code).toBe("CONFLICT");
    } finally {
      console.error = logged;
    }
  });
});
