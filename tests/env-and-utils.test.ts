import { describe, expect, test } from "bun:test";
import { parseEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/validation";

const valid = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  NODE_ENV: "development",
};

describe("parseEnv", () => {
  test("accepts a valid configuration and applies defaults", () => {
    const env = parseEnv(valid);
    expect(env.appUrl).toBe("http://localhost:3000");
    expect(env.WRITE_RATE_LIMIT_MAX).toBe(30);
    expect(env.DATABASE_POOL_MAX).toBe(5);
    expect(env.ALLOWED_ORIGINS).toEqual([]);
    expect(env.trustedOrigins).toEqual(["http://localhost:3000"]);
  });

  test("fails fast and names the broken variables without printing their values", () => {
    let message = "";
    try {
      parseEnv({ ...valid, BETTER_AUTH_SECRET: "too-short-secret", DATABASE_URL: "mysql://nope" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("BETTER_AUTH_SECRET");
    expect(message).toContain("DATABASE_URL");
    expect(message).not.toContain("too-short-secret");
    expect(message).not.toContain("mysql://nope");
  });

  test("requires DATABASE_URL and BETTER_AUTH_SECRET", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL[\s\S]*BETTER_AUTH_SECRET|BETTER_AUTH_SECRET[\s\S]*DATABASE_URL/);
  });

  test("requires BETTER_AUTH_URL in production when Vercel URLs are absent", () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: "production", BETTER_AUTH_URL: undefined })).toThrow(
      "BETTER_AUTH_URL",
    );
  });

  test("derives and trusts the preview URL on Vercel when BETTER_AUTH_URL is unset", () => {
    const env = parseEnv({
      ...valid,
      NODE_ENV: "production",
      BETTER_AUTH_URL: undefined,
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_URL: "app-abc123-team.vercel.app",
      VERCEL_BRANCH_URL: "app-git-feature-team.vercel.app",
    });
    expect(env.appUrl).toBe("https://app-git-feature-team.vercel.app");
    expect(env.trustedOrigins).toContain("https://app-abc123-team.vercel.app");
    expect(env.trustedOrigins).toContain("https://app-git-feature-team.vercel.app");
  });

  test("parses the ALLOWED_ORIGINS allowlist into origins and rejects junk", () => {
    const env = parseEnv({ ...valid, ALLOWED_ORIGINS: "https://a.example, https://b.example/path " });
    expect(env.ALLOWED_ORIGINS).toEqual(["https://a.example", "https://b.example"]);
    expect(env.trustedOrigins).toEqual(["http://localhost:3000", "https://a.example", "https://b.example"]);
    expect(() => parseEnv({ ...valid, ALLOWED_ORIGINS: "*" })).toThrow("ALLOWED_ORIGINS");
    expect(() => parseEnv({ ...valid, ALLOWED_ORIGINS: "ftp://x.example" })).toThrow("ALLOWED_ORIGINS");
  });

  test("treats empty strings as unset", () => {
    const env = parseEnv({ ...valid, WRITE_RATE_LIMIT_MAX: "", ALLOWED_ORIGINS: "" });
    expect(env.WRITE_RATE_LIMIT_MAX).toBe(30);
  });
});

describe("safeNextPath", () => {
  test.each([
    ["/dashboard", "/dashboard"],
    ["/dashboard/settings?x=1", "/dashboard/settings?x=1"],
    [null, "/dashboard"],
    ["", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    ["https://evil.example", "/dashboard"],
    ["javascript:alert(1)", "/dashboard"],
  ])("%p -> %p", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
