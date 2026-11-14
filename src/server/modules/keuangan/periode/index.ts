import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaParamTahun,
  skemaQueryPeriode,
  skemaSiapkanPeriode,
  skemaTutupBukuTahunan,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaPeriode = new Elysia({ prefix: "/periode", name: "keuangan.periode" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarPeriode(query)), {
    beforeHandle: wajibIzin("periode.baca"),
    query: skemaQueryPeriode,
  })
  .post(
    "/siapkan",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.siapkanPeriodeTahun(Number(body.tahun), sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("periode.kelola"), body: skemaSiapkanPeriode },
  )
  .post("/:id/tutup", async ({ params, sesi }) => ok(await layanan.tutupPeriode(params.id, sesi.penggunaId)), {
    beforeHandle: wajibIzin("periode.kelola"),
    params: parameterId,
  })
  .post(
    "/:id/buka",
    async ({ params, sesi }) =>
      ok(await layanan.bukaPeriode(params.id, sesi.penggunaId, layanan.tahunSudahTutupBuku)),
    {
      beforeHandle: wajibIzin("periode.kelola"),
      params: parameterId,
    },
  )
  // Tutup Buku Akhir Tahun (Year-End Closing)
  .get(
    "/tutup-buku-tahunan",
    async () => ok(await layanan.daftarTutupBukuTahunan()),
    { beforeHandle: wajibIzin("periode.baca") },
  )
  .post(
    "/tutup-buku-tahunan",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.tutupBukuTahunan(Number(body.tahun), body.keterangan, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("tutup_buku.kelola"),
      body: skemaTutupBukuTahunan,
    },
  )
  .post(
    "/tutup-buku-tahunan/:tahun/batalkan",
    async ({ params, sesi }) => ok(await layanan.batalkanTutupBukuTahunan(Number(params.tahun), sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("tutup_buku.kelola"),
      params: skemaParamTahun,
    },
  );
