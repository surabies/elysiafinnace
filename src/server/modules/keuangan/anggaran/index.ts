import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaQueryAnggaran,
  skemaQueryLabaRugiCabang,
  skemaQueryLabaRugiProyek,
  skemaQueryLaporanRealisasi,
  skemaSimpanAnggaran,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("ID") });

export const rutaAnggaran = new Elysia({ prefix: "/anggaran", name: "keuangan.anggaran" })
  .use(dasarKeuangan)

  // ==========================================
  // 1. LAPORAN-LAPORAN ANGGARAN & DIMENSI
  // (Diletakkan sebelum rute dinamis /:id)
  // ==========================================
  .get(
    "/laporan/realisasi",
    async ({ query }) => ok(await layanan.laporanAnggaranVsRealisasi(query)),
    {
      beforeHandle: wajibIzin("anggaran.baca"),
      query: skemaQueryLaporanRealisasi,
    },
  )
  .get(
    "/laporan/laba-rugi-proyek",
    async ({ query }) => ok(await layanan.laporanLabaRugiProyek(query)),
    {
      beforeHandle: wajibIzin("anggaran.baca"),
      query: skemaQueryLabaRugiProyek,
    },
  )
  .get(
    "/laporan/laba-rugi-cabang",
    async ({ query }) => ok(await layanan.laporanLabaRugiCabang(query)),
    {
      beforeHandle: wajibIzin("anggaran.baca"),
      query: skemaQueryLabaRugiCabang,
    },
  )

  // ==========================================
  // 2. KELOLA DATA ANGGARAN (CRUD & STATUS)
  // ==========================================
  .get(
    "/",
    async ({ query }) => ok(await layanan.daftarAnggaran(query)),
    {
      beforeHandle: wajibIzin("anggaran.baca"),
      query: skemaQueryAnggaran,
    },
  )
  .get(
    "/:id",
    async ({ params }) => ok(await layanan.ambilAnggaran(params.id)),
    {
      beforeHandle: wajibIzin("anggaran.baca"),
      params: parameterId,
    },
  )
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatAnggaran(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("anggaran.kelola"),
      body: skemaSimpanAnggaran,
    },
  )
  .put(
    "/:id",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahAnggaran(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("anggaran.kelola"),
      params: parameterId,
      body: skemaSimpanAnggaran,
    },
  )
  .post(
    "/:id/setujui",
    async ({ params, sesi }) =>
      ok(await layanan.setujuiAnggaran(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("anggaran.kelola"),
      params: parameterId,
    },
  )
  .post(
    "/:id/tutup",
    async ({ params, sesi }) =>
      ok(await layanan.tutupAnggaran(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("anggaran.kelola"),
      params: parameterId,
    },
  );
