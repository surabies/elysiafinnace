import { treaty } from "@elysiajs/eden";
import type { App } from "@/server/app";

/**
 * Eden Treaty client for Client Components (goes over HTTP, same origin, cookies included).
 * Type-only import of the server app: no server code reaches the browser bundle.
 * Server Components use src/lib/api-server.ts instead.
 */
let client: ReturnType<typeof createClient> | undefined;

function createClient() {
  return treaty<App>(window.location.origin, {
    fetch: { credentials: "same-origin" },
  }).api;
}

export function getApi() {
  client ??= createClient();
  return client;
}
