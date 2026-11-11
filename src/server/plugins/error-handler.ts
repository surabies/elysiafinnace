import { Elysia } from "elysia";
import { ApiError, errorBody } from "../errors";

/** PostgreSQL error code, whether raw or wrapped by Drizzle (`cause`). */
function pgErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current && typeof current === "object"; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/**
 * One place that turns every failure into the same JSON shape:
 *   { "success": false, "error": { "code", "message", "details"? } }
 * Stack traces and internal messages are only ever written to the server log.
 */
export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  { as: "global" },
  ({ code, error, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status;
      return errorBody(error.code, error.message, error.details);
    }

    switch (code) {
      case "VALIDATION": {
        set.status = 422;
        // Only path + message: never echo the offending value back.
        const details = error.all.map((issue) => ({
          path: issue.path || "(root)",
          message: issue.summary ?? issue.message,
        }));
        return errorBody("VALIDATION_ERROR", "Request validation failed", details);
      }
      case "NOT_FOUND":
        set.status = 404;
        return errorBody("NOT_FOUND", "Resource not found");
      case "PARSE":
        set.status = 400;
        return errorBody("BAD_REQUEST", "Malformed request body");
      case "INVALID_COOKIE_SIGNATURE":
        set.status = 400;
        return errorBody("BAD_REQUEST", "Invalid cookie");
    }

    const pg = pgErrorCode(error);
    if (pg === "23505") {
      set.status = 409;
      return errorBody("CONFLICT", "The resource already exists");
    }
    if (pg === "23503") {
      set.status = 409;
      return errorBody("CONFLICT", "The request conflicts with related data");
    }

    console.error("[api] unhandled error:", error);
    set.status = 500;
    return errorBody("INTERNAL_ERROR", "Internal server error");
  },
);
