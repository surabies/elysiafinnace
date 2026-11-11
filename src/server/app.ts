import { Elysia } from "elysia";
import { corsPlugin } from "./plugins/cors";
import { errorHandler } from "./plugins/error-handler";
import { rateLimitPlugin } from "./plugins/rate-limit";
import { echoModule } from "./modules/echo";
import { healthModule } from "./modules/health";
import { meModule } from "./modules/me";
import { placesModule } from "./modules/places";
import { modulKeuangan } from "./keuangan";

export const API_VERSION = "1.0.0";

/**
 * The Elysia application, mounted by app/api/[[...slugs]]/route.ts under /api.
 * Better Auth (/api/auth/*) is served by its own, more specific Next.js route.
 * Never call app.listen() here: Next.js / Vercel own the server.
 */
export const app = new Elysia({ prefix: "/api" })
  .use(errorHandler)
  .use(rateLimitPlugin)
  .use(corsPlugin)
  .get("/", () => ({
    success: true as const,
    name: "Elysia Backend API",
    version: API_VERSION,
  }))
  .use(healthModule)
  .use(echoModule)
  .use(meModule)
  .use(placesModule)
  .use(modulKeuangan);

/** Export for Eden Treaty (end-to-end types). Import with `import type`. */
export type App = typeof app;
