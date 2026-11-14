import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaBatalPenyusutan,
  skemaPelepasanAset,
  skemaPostingPenyusutanBatch,
  skemaPostingPenyusutanSingle,
  skemaQueryAsetTetap,
  skemaQueryKategoriAset,
  skemaQueryLaporanAset,
  skemaQueryLaporanPenyusutan,
  skemaSimpanAsetTetap,
  skemaSimpanKategoriAset,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("ID") });

export const rutaAsetTetap = new Elysia({ prefix: "/aset-tetap", name: "keuangan.aset-tetap" })
  .use(dasarKeuangan)

  // ==========================================
  // 1. KATEGORI ASET TETAP
  // ==========================================
  .get(
    "/kategori",
    async ({ query }) => ok(await layanan.daftarKategoriAset(query)),
    {
      beforeHandle: wajibIzin("aset_tetap.baca"),
      query: skemaQueryKategoriAset,
    },
  )
  .get(
    "/kategori/:id",
    async ({ params }) => ok(await layanan.ambilKategoriAset(params.id)),
    {
      beforeHandle: wajibIzin("aset_tetap.baca"),
      params: parameterId,
    },
  )
  .post(
    "/kategori",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatKategoriAset(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("aset_tetap.kelola"),
      body: skemaSimpanKategoriAset,
    },
  )
  .put(
    "/kategori/:id",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahKategoriAset(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("aset_tetap.kelola"),
      params: parameterId,
      body: t.Partial(skemaSimpanKategoriAset),
    },
  )

  // ==========================================
  // 2. LAPORAN ASET TETAP & PENYUSUTAN
  // (Diletakkan sebelum rute dinamis /:id)
  // ==========================================
  .get(
    "/laporan/daftar",
    async ({ query }) => ok(await layanan.laporanDaftarAset(query)),
    {
      beforeHandle: wajibIzin("aset_tetap.baca"),
      query: skemaQueryLaporanAset,
    },
  )
  .get(
    "/laporan/penyusutan",
    async ({ query }) => ok(await layanan.laporanRekapPenyusutan(query)),
    {
      beforeHandle: wajibIzin("aset_tetap.baca"),
      query: skemaQueryLaporanPenyusutan,
    },
  )

  // ==========================================
  // 3. PENYUSUTAN BATCH & PEMBATALAN
  // ==========================================
  .post(
    "/penyusutan/batch",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.postingPenyusutanBatch(body, sesi.penggunaId);
      set.status = 200;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("aset_tetap.penyusutan"),
      body: skemaPostingPenyusutanBatch,
    },
  )
  .post(
    "/penyusutan/:id/batal",
    async ({ params, body, sesi }) =>
      ok(await layanan.batalkanPenyusutan(params.id, body.alasan, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("aset_tetap.penyusutan"),
      params: parameterId,
      body: skemaBatalPenyusutan,
    },
  )

  // ==========================================
  // 4. REGISTRASI & PENGELOLAAN ASET TETAP
  // ==========================================
  .get(
    "/",
    async ({ query }) => ok(await layanan.daftarAsetTetap(query)),
    {
      beforeHandle: wajibIzin("aset_tetap.baca"),
      query: skemaQueryAsetTetap,
    },
  )
  .get(
    "/:id",
    async ({ params }) => ok(await layanan.ambilAsetTetap(params.id)),
    {
      beforeHandle: wajibIzin("aset_tetap.baca"),
      params: parameterId,
    },
  )
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatAsetTetap(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("aset_tetap.kelola"),
      body: skemaSimpanAsetTetap,
    },
  )
  .put(
    "/:id",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahAsetTetap(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("aset_tetap.kelola"),
      params: parameterId,
      body: t.Partial(skemaSimpanAsetTetap),
    },
  )

  // ==========================================
  // 5. TRANSAKSI ASET SPESIFIK (SUSUTKAN & LEPAS)
  // ==========================================
  .post(
    "/:id/susutkan",
    async ({ params, body, sesi, set }) => {
      const hasil = await layanan.postingPenyusutanTunggal(params.id, body, sesi.penggunaId);
      set.status = 200;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("aset_tetap.penyusutan"),
      params: parameterId,
      body: skemaPostingPenyusutanSingle,
    },
  )
  .post(
    "/:id/lepas",
    async ({ params, body, sesi }) =>
      ok(await layanan.lepasAsetTetap(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("aset_tetap.pelepasan"),
      params: parameterId,
      body: skemaPelepasanAset,
    },
  );
