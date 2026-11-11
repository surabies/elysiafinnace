import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Data access layer for sessions (Server Components, Server Actions).
 * Reads request headers, so with Cache Components every caller must render
 * inside a <Suspense> boundary. React `cache()` dedupes the lookup per request.
 * This validates the session against the database; the proxy only checks that a cookie exists.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
