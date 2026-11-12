import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { corsPlugin } from "./plugins/cors";
import { errorHandler } from "./plugins/error-handler";
import { rateLimitPlugin } from "./plugins/rate-limit";
import { echoModule } from "./modules/system/echo";
import { healthModule } from "./modules/system/health";
import { meModule } from "./modules/system/me";
import { modulKeuangan } from "./modules/keuangan";

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
  // Dokumentasi API: /api/openapi (UI) dan /api/openapi/json. Nonaktif di produksi kecuali OPENAPI_ENABLED=true.
  .use(
    openapi({
      enabled:
        process.env.NODE_ENV !== "production" ||
        process.env.OPENAPI_ENABLED === "true",
      documentation: {
        info: {
          title: "Elysia Finance API",
          version: API_VERSION,
          description: "ERP akuntansi double-entry",
        },
      },
    }),
  )
  .get("/", () => ({
    success: true as const,
    name: "Elysia Backend API",
    version: API_VERSION,
  }))
  .use(healthModule)
  .use(echoModule)
  .use(meModule)
  .use(modulKeuangan);

/** Export for Eden Treaty (end-to-end types). Import with `import type`. */
export type App = typeof app;
