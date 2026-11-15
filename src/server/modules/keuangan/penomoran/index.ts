import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skemaQueryNomorBerikutnya, skemaQueryPenomoran, skemaUbahPenomoran } from "./model";
import * as layanan from "./service";

export const rutaPenomoran = new Elysia({ prefix: "/penomoran", name: "keuangan.penomoran" })
  .use(dasarKeuangan)
  .get(
    "/berikutnya",
    async ({ query }) => {
      const tahun = query.tahun ? Number(query.tahun) : undefined;
      const data = await layanan.ambilNomorBerikutnyaPreview(query.prefiks, tahun);
      return ok(data);
    },
    {
      beforeHandle: wajibIzin("perusahaan.baca"),
      query: skemaQueryNomorBerikutnya,
    },
  )
  .get(
    "/",
    async ({ query }) => {
      const tahun = query.tahun ? Number(query.tahun) : undefined;
      const data = await layanan.daftarPenomoran(tahun);
      return ok(data);
    },
    {
      beforeHandle: wajibIzin("perusahaan.baca"),
      query: skemaQueryPenomoran,
    },
  )
  .put(
    "/:prefiks",
    async ({ params, body }) => {
      const tahun = body.tahun ? Number(body.tahun) : undefined;
      const hasil = await layanan.perbaruiSequence(params.prefiks, Number(body.nilaiTerakhir), tahun);
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("perusahaan.kelola"),
      params: t.Object({ prefiks: t.String() }),
      body: skemaUbahPenomoran,
    },
  );
