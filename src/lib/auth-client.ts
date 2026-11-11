import { createAuthClient } from "better-auth/react";

// Same origin as the app, so no baseURL is needed (default path: /api/auth).
export const authClient = createAuthClient();
