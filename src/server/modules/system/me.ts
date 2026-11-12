import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth";

export const meModule = new Elysia().use(authPlugin).get(
  "/me",
  ({ user }) => ({
    success: true as const,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  }),
  { auth: true },
);
