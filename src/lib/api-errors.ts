/** Extracts the message from the API's `{ success: false, error: { message } }` shape. */
export function apiErrorMessage(value: unknown, fallback = "Something went wrong. Try again."): string {
  if (value && typeof value === "object" && "error" in value) {
    const error = (value as { error?: unknown }).error;
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message) return message;
    }
  }
  return fallback;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

export const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";
