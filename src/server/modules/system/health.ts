import { Elysia } from "elysia";

export const healthModule = new Elysia().get("/health", () => ({
  success: true as const,
  status: "healthy" as const,
}));
