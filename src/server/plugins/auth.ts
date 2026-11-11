import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { ApiError } from "../errors";

/**
 * Adds the `auth: true` route option. Routes that set it receive `user` and
 * `session` in their context, and unauthenticated requests get a 401.
 *
 * The session is resolved from the request cookies by Better Auth on every call
 * (no in-memory state, safe for serverless).
 */
export const authPlugin = new Elysia({ name: "auth-session" }).macro({
  auth: {
    async resolve({ request }) {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
      }
      return { user: session.user, session: session.session };
    },
  },
});
