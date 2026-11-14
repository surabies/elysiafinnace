import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaBatal,
  skemaQueryPembayaran,
  skemaSimpanPembayaran,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("ID") });

export const rutaPembayaran = new Elysia({ prefix: "/pembayaran", name: "keuangan.pembayaran" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarPembayaran(query)), {
    beforeHandle: wajibIzin("pembayaran.baca"),
    query: skemaQueryPembayaran,
  })
  .get("/:id", async ({ params }) => ok(await layanan.ambilPembayaran(params.id)), {
    beforeHandle: wajibIzin("pembayaran.baca"),
    params: parameterId,
  })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatPembayaran(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("pembayaran.kelola"), body: skemaSimpanPembayaran },
  )
  .patch(
    "/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahPembayaran(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembayaran.kelola"),
      params: parameterId,
      body: skemaSimpanPembayaran,
    },
  )
  .post(
    "/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingPembayaran(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembayaran.posting"),
      params: parameterId,
    },
  )
  .post(
    "/:id/batal",
    async ({ params, body, sesi }) => ok(await layanan.batalkanPembayaran(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pembayaran.posting"),
      params: parameterId,
      body: skemaBatal,
    },
  );
