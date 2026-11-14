import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaBuatRekonsiliasi,
  skemaCocokkanBaris,
  skemaImportMutasiBank,
  skemaQueryRekonsiliasi,
  skemaUbahRekonsiliasi,
} from "./rekonsiliasi.model";
import * as layanan from "./rekonsiliasi.service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaRekonsiliasiBank = new Elysia({
  prefix: "/rekonsiliasi-bank",
  name: "keuangan.rekonsiliasi-bank",
})
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarRekonsiliasi(query)), {
    beforeHandle: wajibIzin("kas_bank.baca"),
    query: skemaQueryRekonsiliasi,
  })
  .get("/:id", async ({ params }) => ok(await layanan.ambilRekonsiliasi(params.id)), {
    beforeHandle: wajibIzin("kas_bank.baca"),
    params: parameterId,
  })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatRekonsiliasi(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("kas_bank.rekonsiliasi"), body: skemaBuatRekonsiliasi },
  )
  .patch(
    "/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahRekonsiliasi(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.rekonsiliasi"),
      params: parameterId,
      body: skemaUbahRekonsiliasi,
    },
  )
  .delete("/:id", async ({ params }) => ok(await layanan.hapusRekonsiliasi(params.id)), {
    beforeHandle: wajibIzin("kas_bank.rekonsiliasi"),
    params: parameterId,
  })
  .post(
    "/:id/cocokkan",
    async ({ params, body, sesi }) => ok(await layanan.cocokkanBaris(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.rekonsiliasi"),
      params: parameterId,
      body: skemaCocokkanBaris,
    },
  )
  .post(
    "/:id/lepas",
    async ({ params, body, sesi }) => ok(await layanan.lepasBaris(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.rekonsiliasi"),
      params: parameterId,
      body: skemaCocokkanBaris,
    },
  )
  .post(
    "/:id/selesaikan",
    async ({ params, sesi }) => ok(await layanan.selesaikanRekonsiliasi(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.rekonsiliasi"),
      params: parameterId,
    },
  )
  .post(
    "/:id/buka-kembali",
    async ({ params, sesi }) => ok(await layanan.bukaKembaliRekonsiliasi(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.rekonsiliasi"),
      params: parameterId,
    },
  )
  .post(
    "/:id/import-mutasi",
    async ({ params, body, sesi }) => ok(await layanan.importDanCocokkanMutasi(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.rekonsiliasi"),
      params: parameterId,
      body: skemaImportMutasiBank,
    },
  );
