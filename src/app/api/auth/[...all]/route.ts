import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth owns /api/auth/* (sign-up, sign-in, sign-out, get-session, ...).
export const { GET, POST } = toNextJsHandler(auth);
