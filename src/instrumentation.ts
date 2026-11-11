/**
 * Runs once when the server starts. Validates the environment so a broken
 * deployment fails immediately with a clear message instead of on the first request.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("@/lib/env");
    getEnv();
  }
}
