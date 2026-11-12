import { Elysia } from "elysia";
import { translateDbError } from "../core/db-errors";
import { ApiError, errorBody } from "../core/errors";

/** Pesan validasi: utamakan opsi `error` (Bahasa Indonesia) dari skema, lalu ringkasan TypeBox. */
function issueMessage(issue: { schema?: unknown; summary?: string; message: string }): string {
  const custom = (issue.schema as { error?: unknown } | undefined)?.error;
  return typeof custom === "string" ? custom : (issue.summary ?? issue.message);
}

/**
 * SATU tempat yang mengubah setiap kegagalan menjadi bentuk JSON yang sama:
 *   { "success": false, "error": { "code", "message", "details"? } }
 * Stack trace & pesan internal hanya ditulis ke log server.
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
        // Hanya path + pesan: nilai yang salah tidak pernah dikembalikan.
        const details = error.all.map((issue) => ({
          path: (issue.path ?? "").replace(/^\//, "") || "(root)",
          message: issueMessage(issue),
        }));
        return errorBody("VALIDATION_ERROR", "Data yang dikirim tidak valid.", details);
      }
      case "NOT_FOUND":
        set.status = 404;
        return errorBody("NOT_FOUND", "Endpoint tidak ditemukan.");
      case "PARSE":
        set.status = 400;
        return errorBody("BAD_REQUEST", "Format body request tidak valid.");
      case "INVALID_COOKIE_SIGNATURE":
        set.status = 400;
        return errorBody("BAD_REQUEST", "Cookie tidak valid.");
    }

    const db = translateDbError(error);
    if (db) {
      set.status = db.status;
      return errorBody(db.code, db.message, db.details);
    }

    console.error("[api] galat tak tertangani:", error);
    set.status = 500;
    return errorBody("INTERNAL_ERROR", "Terjadi kesalahan pada server. Silakan coba lagi.");
  },
);
