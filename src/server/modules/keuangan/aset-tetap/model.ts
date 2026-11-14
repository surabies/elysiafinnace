import { t } from "elysia";
import {
  GOLONGAN_FISKAL_ASET,
  METODE_PENYUSUTAN,
  STATUS_ASET,
  STATUS_PENYUSUTAN_ASET,
} from "@/db/schema/keuangan/konstanta";
import { skema } from "../shared/schema";

export const skemaMetodePenyusutan = skema.pilihan("Metode Penyusutan", METODE_PENYUSUTAN);
export const skemaGolonganFiskalAset = skema.pilihan("Golongan Fiskal Aset", GOLONGAN_FISKAL_ASET);
export const skemaStatusAset = skema.pilihan("Status Aset", STATUS_ASET);
export const skemaStatusPenyusutanAset = skema.pilihan("Status Penyusutan", STATUS_PENYUSUTAN_ASET);

// --- KATEGORI ASET ---
export const skemaSimpanKategoriAset = t.Object({
  kode: skema.kode("Kode Kategori Aset", 30),
  nama: skema.teks("Nama Kategori Aset", 150),
  metodePenyusutan: skemaMetodePenyusutan,
  golonganFiskal: t.Optional(skemaGolonganFiskalAset),
  masaManfaatBulan: t.Numeric({ minimum: 0, maximum: 1200 }),
  tarifTahunanPersen: skema.persen("Tarif Tahunan Persen"),
  akunAsetId: skema.uuid("Akun Aset"),
  akunAkumulasiPenyusutanId: skema.uuid("Akun Akumulasi Penyusutan"),
  akunBebanPenyusutanId: skema.uuid("Akun Beban Penyusutan"),
  keterangan: t.Optional(t.String()),
  aktif: t.Optional(t.Boolean()),
});

export const skemaQueryKategoriAset = t.Object({
  q: t.Optional(t.String()),
  aktif: t.Optional(t.BooleanString()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- REGISTRASI ASET TETAP ---
export const skemaSimpanAsetTetap = t.Object({
  kode: t.Optional(skema.teks("Kode Aset", 30)),
  nama: skema.teks("Nama Aset", 200),
  kategoriId: skema.uuid("Kategori Aset"),
  tanggalPerolehan: skema.tanggal("Tanggal Perolehan"),
  tanggalMulaiPenyusutan: t.Optional(skema.tanggal("Tanggal Mulai Penyusutan")),
  nilaiPerolehan: skema.uang("Nilai Perolehan"),
  nilaiResidu: t.Optional(skema.uang("Nilai Residu")),
  masaManfaatBulan: t.Optional(t.Numeric({ minimum: 0, maximum: 1200 })),
  metodePenyusutan: t.Optional(skemaMetodePenyusutan),
  lokasi: t.Optional(t.String({ maxLength: 150 })),
  penanggungJawab: t.Optional(t.String({ maxLength: 150 })),
  nomorSeri: t.Optional(t.String({ maxLength: 100 })),
  keterangan: t.Optional(t.String()),
});

export const skemaQueryAsetTetap = t.Object({
  kategoriId: t.Optional(skema.uuidOpsional("Kategori Aset")),
  status: t.Optional(skemaStatusAset),
  lokasi: t.Optional(t.String()),
  q: t.Optional(t.String()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- PENYUSUTAN BULANAN ---
export const skemaPostingPenyusutanBatch = t.Object({
  periode: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$", error: "Periode harus format YYYY-MM." }),
  tanggal: t.Optional(skema.tanggal("Tanggal Jurnal")),
  keterangan: t.Optional(t.String()),
});

export const skemaPostingPenyusutanSingle = t.Object({
  periode: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$", error: "Periode harus format YYYY-MM." }),
  tanggal: t.Optional(skema.tanggal("Tanggal Jurnal")),
  keterangan: t.Optional(t.String()),
});

export const skemaBatalPenyusutan = t.Object({
  alasan: t.Optional(t.String()),
});

// --- PELEPASAN / PENJUALAN ASET ---
export const skemaPelepasanAset = t.Object({
  tanggalPelepasan: skema.tanggal("Tanggal Pelepasan"),
  nilaiPelepasan: t.Optional(skema.uang("Nilai Pelepasan / Harga Jual")),
  akunKasPelepasanId: t.Optional(skema.uuidOpsional("Akun Kas/Bank Penampung")),
  akunLabaPelepasanId: t.Optional(skema.uuidOpsional("Akun Laba Pelepasan")),
  akunRugiPelepasanId: t.Optional(skema.uuidOpsional("Akun Rugi Pelepasan")),
  alasanPelepasan: skema.teks("Alasan Pelepasan / Penjualan", 255),
});

// --- LAPORAN ---
export const skemaQueryLaporanAset = t.Object({
  kategoriId: t.Optional(skema.uuidOpsional("Kategori Aset")),
  status: t.Optional(skemaStatusAset),
  perTanggal: t.Optional(skema.tanggal("Per Tanggal")),
});

export const skemaQueryLaporanPenyusutan = t.Object({
  periode: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$", error: "Periode harus format YYYY-MM." }),
  kategoriId: t.Optional(skema.uuidOpsional("Kategori Aset")),
});

export type SimpanKategoriAsetInput = typeof skemaSimpanKategoriAset.static;
export type QueryKategoriAsetInput = typeof skemaQueryKategoriAset.static;
export type SimpanAsetTetapInput = typeof skemaSimpanAsetTetap.static;
export type QueryAsetTetapInput = typeof skemaQueryAsetTetap.static;
export type PostingPenyusutanBatchInput = typeof skemaPostingPenyusutanBatch.static;
export type PostingPenyusutanSingleInput = typeof skemaPostingPenyusutanSingle.static;
export type BatalPenyusutanInput = typeof skemaBatalPenyusutan.static;
export type PelepasanAsetInput = typeof skemaPelepasanAset.static;
export type QueryLaporanAsetInput = typeof skemaQueryLaporanAset.static;
export type QueryLaporanPenyusutanInput = typeof skemaQueryLaporanPenyusutan.static;
