import { Elysia } from "elysia";
import { dapatkanSesi } from "../shared/context";
import { skemaOnboarding } from "./model";
import { prosesOnboarding } from "./service";

export const rutaOnboarding = new Elysia({ prefix: "/onboarding", name: "keuangan.onboarding" })
  .post(
    "/",
    async ({ body, request }) => {
      const pengguna = await dapatkanSesi(request.headers);
      return await prosesOnboarding(body, pengguna?.penggunaId);
    },
    {
      body: skemaOnboarding,
    }
  );
