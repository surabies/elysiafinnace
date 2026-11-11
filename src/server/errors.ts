export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

/** Throw this from handlers/macros; the central error handler turns it into JSON. */
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
