import "server-only";
import { treaty } from "@elysiajs/eden";
import { app } from "@/server/app";

/**
 * Eden Treaty client for Server Components: calls the Elysia app in-process
 * (no network hop). Pass cookies explicitly if you call a protected endpoint.
 */
export const apiServer = treaty(app).api;
