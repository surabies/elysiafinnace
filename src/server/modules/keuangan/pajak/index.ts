import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaGenerateFakturPenjualan,
  skemaQueryBuktiPotong,
  skemaQueryEksporCoretax,
  skemaQueryEksporEfaktur,
  skemaQueryFakturPajak,
  skemaQueryLaporanSptPpn,
  skemaQueryNsfp,
  skemaQueryPajak,
  skemaSimpanAlokasiNsfp,
  skemaSimpanBuktiPotong,
  skemaSimpanFakturPajak,
  skemaSimpanPajak,
  skemaUpdateStatusBupot,
  skemaUpdateStatusFaktur,
} from "./model";
import * as layanan from "./service";

const parameterId = t.Object({ id: skema.uuid("ID") });

export const rutaPajak = new Elysia({ prefix: "/pajak", name: "keuangan.pajak" })
  .use(dasarKeuangan)

  // ==========================================
  // MASTER PAJAK
  // ==========================================
  .get("/", async ({ query }) => ok(await layanan.daftarPajak(query)), {
    beforeHandle: wajibIzin("pajak.baca"),
    query: skemaQueryPajak,
  })
  .get("/:id", async ({ params }) => ok(await layanan.ambilPajak(params.id)), {
    beforeHandle: wajibIzin("pajak.baca"),
    params: parameterId,
  })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatPajak(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      body: skemaSimpanPajak,
    },
  )
  .put(
    "/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahPajak(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      params: parameterId,
      body: skemaSimpanPajak,
    },
  )

  // ==========================================
  // ALOKASI NSFP
  // ==========================================
  .get("/nsfp/daftar", async ({ query }) => ok(await layanan.daftarAlokasiNsfp(query)), {
    beforeHandle: wajibIzin("pajak.baca"),
    query: skemaQueryNsfp,
  })
  .post(
    "/nsfp/alokasi",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatAlokasiNsfp(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      body: skemaSimpanAlokasiNsfp,
    },
  )
  .post(
    "/nsfp/ambil-berikutnya",
    async ({ body, sesi }) => {
      const nomor = await layanan.ambilNomorNsfpBerikutnya(body.tahun, sesi.penggunaId);
      return ok({ nomorFakturPajak: nomor });
    },
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      body: t.Object({ tahun: t.Numeric() }),
    },
  )

  // ==========================================
  // FAKTUR PAJAK ELEKTRONIK
  // ==========================================
  .get("/faktur/daftar", async ({ query }) => ok(await layanan.daftarFakturPajak(query)), {
    beforeHandle: wajibIzin("pajak.baca"),
    query: skemaQueryFakturPajak,
  })
  .get("/faktur/:id", async ({ params }) => ok(await layanan.ambilFakturPajak(params.id)), {
    beforeHandle: wajibIzin("pajak.baca"),
    params: parameterId,
  })
  .post(
    "/faktur/manual",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatFakturPajakManual(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      body: skemaSimpanFakturPajak,
    },
  )
  .post(
    "/faktur/generate-dari-penjualan",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.generateFakturDariPenjualan(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      body: skemaGenerateFakturPenjualan,
    },
  )
  .patch(
    "/faktur/:id/status",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahStatusFakturPajak(params.id, body.status, sesi.penggunaId, body.keterangan)),
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      params: parameterId,
      body: skemaUpdateStatusFaktur,
    },
  )

  // ==========================================
  // BUKTI POTONG PPH (e-Bupot)
  // ==========================================
  .get("/bukti-potong/daftar", async ({ query }) => ok(await layanan.daftarBuktiPotong(query)), {
    beforeHandle: wajibIzin("pajak.baca"),
    query: skemaQueryBuktiPotong,
  })
  .get("/bukti-potong/:id", async ({ params }) => ok(await layanan.ambilBuktiPotong(params.id)), {
    beforeHandle: wajibIzin("pajak.baca"),
    params: parameterId,
  })
  .post(
    "/bukti-potong",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatBuktiPotong(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      body: skemaSimpanBuktiPotong,
    },
  )
  .patch(
    "/bukti-potong/:id/status",
    async ({ params, body, sesi }) =>
      ok(await layanan.ubahStatusBuktiPotong(params.id, body.status, sesi.penggunaId, body.keterangan)),
    {
      beforeHandle: wajibIzin("pajak.kelola"),
      params: parameterId,
      body: skemaUpdateStatusBupot,
    },
  )

  // ==========================================
  // EKSPOR & LAPORAN
  // ==========================================
  .get(
    "/ekspor/efaktur-csv",
    async ({ query, set }) => {
      const csv = await layanan.eksporEfakturCsv(query);
      set.headers["content-type"] = "text/csv; charset=utf-8";
      set.headers["content-disposition"] = `attachment; filename=efaktur_${query.jenis ?? "KELUARAN"}_${query.tahunPajak}_${query.masaPajak}.csv`;
      return csv;
    },
    {
      beforeHandle: wajibIzin("pajak.ekspor"),
      query: skemaQueryEksporEfaktur,
    },
  )
  .get(
    "/ekspor/coretax",
    async ({ query }) => ok(await layanan.eksporCoretax(query)),
    {
      beforeHandle: wajibIzin("pajak.ekspor"),
      query: skemaQueryEksporCoretax,
    },
  )
  .get(
    "/laporan/spt-masa-ppn",
    async ({ query }) => ok(await layanan.rekapSptMasaPpn(query)),
    {
      beforeHandle: wajibIzin("pajak.baca"),
      query: skemaQueryLaporanSptPpn,
    },
  );
