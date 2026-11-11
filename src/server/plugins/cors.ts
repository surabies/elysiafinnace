import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { getEnv } from "@/lib/env";

/**
 * Same-origin by default: the UI and the API share one origin, so no CORS headers
 * are sent. Set ALLOWED_ORIGINS (comma-separated, explicit origins only) to allow
 * specific other origins. Wildcards are intentionally not supported.
 */
function buildCorsPlugin(): Elysia {
  const origins = getEnv().ALLOWED_ORIGINS;
  if (origins.length === 0) return new Elysia({ name: "cors-disabled" });
  return new Elysia({ name: "cors-allowlist" }).use(
    cors({
      origin: origins,
      credentials: true,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      maxAge: 600,
    }),
  );
}

export const corsPlugin = buildCorsPlugin();
