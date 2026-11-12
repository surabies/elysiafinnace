/**
 * Sistem error TUNGGAL untuk seluruh API.
 * Lempar `ApiError` (atau helper `galat.*`) dari mana saja; `plugins/error-handler.ts`
 * mengubahnya menjadi:  { success: false, error: { code, message, details? } }
 */
export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "IN_USE"
  | "BUSINESS_RULE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

export class ApiError extends Error {
  constructor(
    public readonly status: ApiErrorStatus,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ErrorBody = {
  success: false;
  error: { code: ErrorCode; message: string; details?: unknown };
};

export function errorBody(code: ErrorCode, message: string, details?: unknown): ErrorBody {
  return {
    success: false,
    error: { code, message, ...(details === undefined ? {} : { details }) },
  };
}

/** Pembuat error domain dengan pesan Bahasa Indonesia. */
export const galat = {
  belumLogin: () => new ApiError(401, "UNAUTHORIZED", "Anda belum login. Silakan login terlebih dahulu."),
  tidakBerwenang: (pesan: string, detail?: unknown) => new ApiError(403, "FORBIDDEN", pesan, detail),
  tidakDitemukan: (objek: string) => new ApiError(404, "NOT_FOUND", `${objek} tidak ditemukan.`),
  aturanBisnis: (pesan: string, detail?: unknown) => new ApiError(422, "BUSINESS_RULE", pesan, detail),
  sudahAda: (pesan: string) => new ApiError(409, "CONFLICT", pesan),
  masihDipakai: (pesan: string, detail?: unknown) => new ApiError(409, "IN_USE", pesan, detail),
};
