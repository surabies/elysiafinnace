import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

const env = getEnv();
const isProduction = env.NODE_ENV === "production";

export const auth = betterAuth({
  appName: "Fullstack App",
  baseURL: env.appUrl,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  trustedOrigins: env.trustedOrigins,
  // Rate limiting is stored in the database so it holds across serverless instances.
  // It is off in dev/test by default to keep local iteration and tests fast.
  rateLimit: {
    enabled: isProduction,
    window: 60,
    max: 100,
    storage: "database",
  },
  advanced: {
    // Vercel overwrites these headers at the edge; they are the trustworthy client IP.
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"],
    },
  },
  // Must be the LAST plugin so Server Actions / RSC can set cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
