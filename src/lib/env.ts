import { z } from "zod";

/**
 * Validated, typed environment variables (server only).
 *
 * - Call `getEnv()` wherever configuration is needed. The result is parsed once
 *   and memoised; a bad configuration throws a clear error that lists variable
 *   NAMES only (values are never printed).
 * - `instrumentation.ts` calls it at server start so a broken deployment fails
 *   fast instead of on the first request.
 * - Nothing here is exposed to the browser. The app needs no NEXT_PUBLIC_ variables.
 */
const csvOrigins = z
  .string()
  .optional()
  .transform((value, ctx) => {
    const items = (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const origins: string[] = [];
    for (const item of items) {
      try {
        const url = new URL(item);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error("unsupported protocol");
        }
        origins.push(url.origin);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "must be a comma-separated list of http(s) origins",
        });
        return z.NEVER;
      }
    }
    return origins;
  });

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, "must be a postgres:// or postgresql:// URL"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "must be at least 32 characters (openssl rand -base64 32)"),
  BETTER_AUTH_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  ALLOWED_ORIGINS: csvOrigins,
  WRITE_RATE_LIMIT_MAX: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(30),
  ),
  DATABASE_POOL_MAX: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(50).default(5),
  ),
  // Provided by Vercel at runtime (system environment variables).
  VERCEL: z.preprocess(emptyToUndefined, z.string().optional()),
  VERCEL_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(["production", "preview", "development"]).optional(),
  ),
  VERCEL_URL: z.preprocess(emptyToUndefined, z.string().optional()),
  VERCEL_BRANCH_URL: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type Env = z.infer<typeof envSchema> & {
  /** Canonical public origin of this deployment (no trailing slash). */
  appUrl: string;
  /** Origins Better Auth should trust (app origin + allowlist + Vercel URLs). */
  trustedOrigins: string[];
};

let cached: Env | undefined;

function resolveAppUrl(env: z.infer<typeof envSchema>): string {
  if (env.BETTER_AUTH_URL) return new URL(env.BETTER_AUTH_URL).origin;
  // Preview deployments get a fresh URL per deployment, so derive it.
  const vercelHost = env.VERCEL_BRANCH_URL ?? env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  if (env.NODE_ENV === "production") {
    throw new Error("Invalid environment: BETTER_AUTH_URL is required in production");
  }
  return "http://localhost:3000";
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${problems}`);
  }
  const appUrl = resolveAppUrl(parsed.data);
  const trusted = new Set<string>([appUrl, ...parsed.data.ALLOWED_ORIGINS]);
  for (const host of [parsed.data.VERCEL_URL, parsed.data.VERCEL_BRANCH_URL]) {
    if (host) trusted.add(`https://${host}`);
  }
  return { ...parsed.data, appUrl, trustedOrigins: [...trusted] };
}

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
