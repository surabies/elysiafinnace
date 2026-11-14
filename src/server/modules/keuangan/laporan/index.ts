import { Elysia } from "elysia";
import { dasarKeuangan, punyaIzin, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import {
  skemaQueryAging,
  skemaQueryBukuBesarPembantu,
  skemaQueryCetakDokumen,
  skemaQueryKomparatif,
  skemaQueryKonsolidasi,
  skemaQueryLaporanDagang,
  skemaQueryLaporanRekonsiliasi,
  skemaQueryMutasiRekening,
  skemaQueryNeraca,
  skemaQueryNeracaSaldo,
  skemaQueryRentang,
  skemaQueryRingkasanDashboard,
  skemaQueryWorksheet,
} from "./model";
import * as layanan from "./service";

export const rutaLaporan = new Elysia({ prefix: "/laporan", name: "keuangan.laporan" })
  .use(dasarKeuangan)

  // 1. Laporan Finansial Standar
  .get("/neraca", async ({ query }) => ok(await layanan.laporanNeraca(query.perTanggal)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryNeraca,
    detail: { summary: "Laporan Neraca Keuangan", tags: ["Laporan"] },
  })
  .get(
    "/dashboard-ringkasan",
    async ({ query, sesi }) => {
      const [ringkasan, aktivitasJurnal] = await Promise.all([
        layanan.ringkasanKpiDashboard(query.perTanggal),
        punyaIzin(sesi, "jurnal.baca") ? layanan.aktivitasJurnalDashboard() : null,
      ]);
      return ok({ ...ringkasan, aktivitasJurnal });
    },
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryRingkasanDashboard,
      detail: { summary: "Ringkasan KPI Dashboard 12 Bulan", tags: ["Laporan"] },
    },
  )
  .get("/laba-rugi", async ({ query }) => ok(await layanan.laporanLabaRugi(query.dari, query.sampai)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryRentang,
    detail: { summary: "Laporan Laba Rugi Operasional", tags: ["Laporan"] },
  })
  .get(
    "/perubahan-modal",
    async ({ query }) => ok(await layanan.laporanPerubahanModal(query.dari, query.sampai)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryRentang,
      detail: { summary: "Laporan Perubahan Ekuitas / Modal", tags: ["Laporan"] },
    },
  )
  .get("/arus-kas", async ({ query }) => ok(await layanan.laporanArusKas(query.dari, query.sampai)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryRentang,
    detail: { summary: "Laporan Arus Kas", tags: ["Laporan"] },
  })
  .get(
    "/neraca-saldo",
    async ({ query }) => ok(await layanan.laporanNeracaSaldo(query.dari, query.sampai)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryNeracaSaldo,
      detail: { summary: "Laporan Neraca Saldo (Trial Balance)", tags: ["Laporan"] },
    },
  )
  .get(
    "/worksheet",
    async ({ query }) => ok(await layanan.laporanWorksheetPenyesuaian(query.dari, query.sampai)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryWorksheet,
      detail: { summary: "Kertas Kerja Penyesuaian 10 Kolom", tags: ["Laporan"] },
    },
  )
  .get(
    "/mutasi-rekening",
    async ({ query }) => ok(await layanan.laporanMutasiRekening(query.rekeningBankId, query.dari, query.sampai)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryMutasiRekening,
      detail: { summary: "Laporan Mutasi Rekening Bank", tags: ["Laporan"] },
    },
  )
  .get(
    "/rekonsiliasi-bank",
    async ({ query }) => ok(await layanan.laporanRekonsiliasiBank(query.rekonsiliasiId)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryLaporanRekonsiliasi,
      detail: { summary: "Laporan Hasil Rekonsiliasi Bank", tags: ["Laporan"] },
    },
  )

  // 2. Buku Besar Pembantu (Subledger)
  .get(
    "/buku-besar-pembantu-piutang",
    async ({ query }) => ok(await layanan.bukuBesarPembantuPiutang(query)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryBukuBesarPembantu,
      detail: { summary: "Buku Besar Pembantu Piutang Usaha per Pelanggan", tags: ["Laporan Enterprise"] },
    },
  )
  .get(
    "/buku-besar-pembantu-hutang",
    async ({ query }) => ok(await layanan.bukuBesarPembantuHutang(query)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryBukuBesarPembantu,
      detail: { summary: "Buku Besar Pembantu Hutang Usaha per Pemasok", tags: ["Laporan Enterprise"] },
    },
  )

  // 3. Umur Piutang & Hutang (Aging Report)
  .get("/aging-piutang", async ({ query }) => ok(await layanan.laporanAgingPiutang(query)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryAging,
    detail: { summary: "Laporan Umur Piutang (AR Aging)", tags: ["Laporan Enterprise"] },
  })
  .get("/aging-hutang", async ({ query }) => ok(await layanan.laporanAgingHutang(query)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryAging,
    detail: { summary: "Laporan Umur Hutang (AP Aging)", tags: ["Laporan Enterprise"] },
  })

  // 4. Laporan Penjualan & Pembelian (Sales & Purchasing)
  .get(
    "/penjualan/pelanggan",
    async ({ query }) => ok(await layanan.laporanPenjualanPelanggan(query)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryLaporanDagang,
      detail: { summary: "Rekapitulasi Penjualan per Pelanggan", tags: ["Laporan Enterprise"] },
    },
  )
  .get("/penjualan/item", async ({ query }) => ok(await layanan.laporanPenjualanItem(query)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryLaporanDagang,
    detail: { summary: "Rekapitulasi Penjualan per Produk / Item", tags: ["Laporan Enterprise"] },
  })
  .get(
    "/pembelian/pemasok",
    async ({ query }) => ok(await layanan.laporanPembelianPemasok(query)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryLaporanDagang,
      detail: { summary: "Rekapitulasi Pembelian per Pemasok", tags: ["Laporan Enterprise"] },
    },
  )
  .get("/pembelian/item", async ({ query }) => ok(await layanan.laporanPembelianItem(query)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryLaporanDagang,
    detail: { summary: "Rekapitulasi Pembelian per Produk / Item", tags: ["Laporan Enterprise"] },
  })

  // 5. Analisis Komparatif & Konsolidasi Holding
  .get(
    "/laba-rugi-komparatif",
    async ({ query }) => ok(await layanan.laporanLabaRugiKomparatif(query)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryKomparatif,
      detail: { summary: "Analisis Laba Rugi Komparatif Antar Periode", tags: ["Laporan Enterprise"] },
    },
  )
  .get("/konsolidasi", async ({ query }) => ok(await layanan.laporanKonsolidasiHolding(query)), {
    beforeHandle: wajibIzin("laporan.baca"),
    query: skemaQueryKonsolidasi,
    detail: { summary: "Laporan Konsolidasi Grup Holding Multi-Perusahaan", tags: ["Laporan Enterprise"] },
  })

  // 6. Cetak Dokumen Transaksi (Printable HTML / PDF)
  .get(
    "/cetak-dokumen",
    async ({ query }) => ok(await layanan.cetakDokumenTransaksi(query.jenisDokumen, query.dokumenId)),
    {
      beforeHandle: wajibIzin("laporan.baca"),
      query: skemaQueryCetakDokumen,
      detail: { summary: "Template Cetak Dokumen Transaksi (Faktur/PO)", tags: ["Laporan Enterprise"] },
    },
  );
