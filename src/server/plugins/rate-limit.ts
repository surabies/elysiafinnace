import { Elysia } from "elysia";
import { getEnv } from "@/lib/env";
import { ApiError } from "../core/errors";

const WINDOW_MS = 60_000;
const SWEEP_THRESHOLD = 5_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Fixed-window counter. Returns the remaining budget, or null when exceeded. */
export function consume(key: string, max: number, now = Date.now()) {
  if (buckets.size > SWEEP_THRESHOLD) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  if (bucket.count > max) return { allowed: false as const, retryAfterSeconds, remaining: 0 };
  return { allowed: true as const, retryAfterSeconds, remaining: max - bucket.count };
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Limits every mutating request (POST/PUT/PATCH/DELETE) to the Elysia API per client IP.
 * It runs in `onRequest`, i.e. BEFORE validation and authentication, so unauthenticated
 * or malformed floods are counted too and never reach the database.
 *
 * Best effort: counters live in the memory of ONE runtime instance, so on
 * serverless the effective limit is per instance. That is enough to blunt abuse
 * without extra infrastructure; use a shared store (e.g. Upstash Redis) or
 * Vercel's WAF rate limiting when you need a hard global limit.
 * Auth endpoints (/api/auth/*) are limited separately by Better Auth, which stores
 * its counters in the database.
 */
export const rateLimitPlugin = new Elysia({ name: "write-rate-limit" }).onRequest(
  ({ request, set }) => {
    if (!MUTATING_METHODS.has(request.method)) return;
    const max = getEnv().WRITE_RATE_LIMIT_MAX;
    const result = consume(`write:${clientIp(request)}`, max);
    set.headers["x-ratelimit-limit"] = String(max);
    set.headers["x-ratelimit-remaining"] = String(result.remaining);
    if (!result.allowed) {
      set.headers["retry-after"] = String(result.retryAfterSeconds);
      throw new ApiError(429, "RATE_LIMITED", "Too many requests, try again later");
    }
  },
);
