import { connection } from "next/server";
import { app } from "@/server/app";

/**
 * Elysia mounted as a catch-all Route Handler under /api.
 * `connection()` opts GET handlers out of build-time prerendering (Cache Components),
 * so every request, including GET /api/health and GET /api/places, runs at request time.
 * /api/auth/* is served by the more specific app/api/auth/[...all]/route.ts.
 */
async function handler(request: Request): Promise<Response> {
  await connection();
  return app.fetch(request);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
