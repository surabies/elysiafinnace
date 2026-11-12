import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import { skemaBatal, skemaQueryBiaya, skemaSimpanBiaya } from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaBiaya = new Elysia({ prefix: "/biaya", name: "keuangan.biaya" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarBiaya(query)), {
    beforeHandle: wajibIzin("biaya.baca"),
    query: skemaQueryBiaya,
  })
  .get("/:id", async ({ params }) => ok(await layanan.ambilBiaya(params.id)), {
    beforeHandle: wajibIzin("biaya.baca"),
    params: parameterId,
  })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatBiaya(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("biaya.kelola"), body: skemaSimpanBiaya },
  )
  .patch("/:id", async ({ params, body, sesi }) => ok(await layanan.ubahBiaya(params.id, body, sesi.penggunaId)), {
    beforeHandle: wajibIzin("biaya.kelola"),
    params: parameterId,
    body: skemaSimpanBiaya,
  })
  .delete("/:id", async ({ params }) => ok(await layanan.hapusBiaya(params.id)), {
    beforeHandle: wajibIzin("biaya.kelola"),
    params: parameterId,
  })
  .post("/:id/posting", async ({ params, sesi }) => ok(await layanan.postingBiaya(params.id, sesi.penggunaId)), {
    beforeHandle: wajibIzin("biaya.posting"),
    params: parameterId,
  })
  .post(
    "/:id/batal",
    async ({ params, body, sesi }) => ok(await layanan.batalBiaya(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("biaya.posting"),
      params: parameterId,
      body: skemaBatal,
    },
  );
