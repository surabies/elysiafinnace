import { Elysia, t } from "elysia";
import { LIMITS } from "@/lib/validation";

export const echoModule = new Elysia().post(
  "/echo",
  ({ body }) => ({ success: true as const, data: { message: body.message } }),
  {
    body: t.Object({
      // pattern: at least one non-whitespace character, so "   " is rejected.
      message: t.String({ minLength: 1, maxLength: LIMITS.echoMessageMax, pattern: "\\S" }),
    }),
  },
);
