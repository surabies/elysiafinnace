import { z } from "zod";

/**
 * Limits shared by the API (TypeBox schemas in src/server) and the forms (zod below),
 * so the browser and the server can never drift apart.
 */
export const LIMITS = {
  echoMessageMax: 500,
  pageSizeMax: 100,
  pageSizeDefault: 20,
  passwordMin: 8,
  passwordMax: 128,
  nameMax: 80,
} as const;

export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(LIMITS.passwordMax),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(LIMITS.nameMax, `Use at most ${LIMITS.nameMax} characters`),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(LIMITS.passwordMin, `Use at least ${LIMITS.passwordMin} characters`)
    .max(LIMITS.passwordMax, `Use at most ${LIMITS.passwordMax} characters`),
});

export const echoFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Enter a message")
    .max(LIMITS.echoMessageMax, `Use at most ${LIMITS.echoMessageMax} characters`),
});

/** Only allow same-site relative redirects (blocks open redirects like //evil.com). */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
