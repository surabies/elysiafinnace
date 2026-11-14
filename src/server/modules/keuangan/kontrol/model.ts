import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";
import {
  AKSI_PERSETUJUAN,
  JENIS_DOKUMEN_PERSETUJUAN,
  STATUS_PERSETUJUAN,
} from "@/db/schema/keuangan";

// ==========================================
// 1. SKEMA PERUSAHAAN (COMPANIES)
// ==========================================

export const skemaQueryPerusahaan = t.Object({
  ...skemaHalaman,
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true/false." })),
});
export type QueryPerusahaanInput = Static<typeof skemaQueryPerusahaan>;

export const skemaSimpanPerusahaan = t.Object({
  kode: skema.kode("Kode Perusahaan", 50),
  nama: skema.teks("Nama Perusahaan", 200),
  npwp: skema.teksOpsional("NPWP", 32),
  alamat: skema.teksOpsional("Alamat", 1000),
  telepon: skema.teksOpsional("Telepon", 30),
  email: skema.emailOpsional("Email"),
  mataUangDasarId: t.Optional(skema.uuid("Mata Uang Dasar")),
  adalahHolding: t.Optional(skema.boolean("Adalah Holding")),
  indukId: t.Optional(skema.uuid("Induk Perusahaan")),
  logo: skema.teksOpsional("URL Logo", 500),
});
export type SimpanPerusahaanInput = Static<typeof skemaSimpanPerusahaan>;

export const skemaUbahPerusahaan = t.Composite([
  t.Partial(skemaSimpanPerusahaan),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type UbahPerusahaanInput = Static<typeof skemaUbahPerusahaan>;

// ==========================================
// 2. SKEMA UNDANGAN PENGGUNA (INVITATIONS)
// ==========================================

export const skemaUndangPengguna = t.Object({
  perusahaanId: skema.uuid("ID Perusahaan"),
  email: t.String({ format: "email", maxLength: 150, error: "Email harus valid." }),
  peranId: skema.uuid("ID Peran"),
});
export type UndangPenggunaInput = Static<typeof skemaUndangPengguna>;

export const skemaTerimaUndangan = t.Object({
  token: skema.teks("Token Undangan", 100),
});
export type TerimaUndanganInput = Static<typeof skemaTerimaUndangan>;

// ==========================================
// 3. SKEMA PEMBATASAN AKSES CABANG & GUDANG
// ==========================================

export const skemaAturAksesCabang = t.Object({
  penggunaId: skema.teks("ID Pengguna", 100),
  cabangIds: t.Array(skema.uuid("ID Cabang")),
});
export type AturAksesCabangInput = Static<typeof skemaAturAksesCabang>;

export const skemaAturAksesGudang = t.Object({
  penggunaId: skema.teks("ID Pengguna", 100),
  gudangIds: t.Array(skema.uuid("ID Gudang")),
});
export type AturAksesGudangInput = Static<typeof skemaAturAksesGudang>;

// ==========================================
// 4. SKEMA AUDIT LOG
// ==========================================

export const skemaQueryAuditLog = t.Object({
  ...skemaHalaman,
  aksi: t.Optional(t.String()),
  entitas: t.Optional(t.String()),
  penggunaId: t.Optional(t.String()),
  dariTanggal: t.Optional(skema.tanggal("Dari Tanggal")),
  sampaiTanggal: t.Optional(skema.tanggal("Sampai Tanggal")),
});
export type QueryAuditLogInput = Static<typeof skemaQueryAuditLog>;

// ==========================================
// 5. SKEMA ALUR PERSETUJUAN (APPROVAL WORKFLOW)
// ==========================================

export const skemaQueryAturanPersetujuan = t.Object({
  jenisDokumen: t.Optional(skema.pilihan("Jenis Dokumen", JENIS_DOKUMEN_PERSETUJUAN)),
  aktif: t.Optional(t.BooleanString()),
});
export type QueryAturanPersetujuanInput = Static<typeof skemaQueryAturanPersetujuan>;

export const skemaSimpanAturanPersetujuan = t.Object({
  perusahaanId: t.Optional(skema.uuid("ID Perusahaan")),
  jenisDokumen: skema.pilihan("Jenis Dokumen", JENIS_DOKUMEN_PERSETUJUAN),
  nominalMin: t.Optional(skema.uang("Nominal Minimal")),
  nominalMax: t.Optional(skema.uang("Nominal Maksimal")),
  tingkat: t.Optional(t.Integer({ minimum: 1, maximum: 10 })),
  peranId: t.Optional(skema.uuid("ID Peran")),
  penggunaId: skema.teksOpsional("ID Pengguna Khusus", 100),
  keterangan: skema.teksOpsional("Keterangan", 500),
});
export type SimpanAturanPersetujuanInput = Static<typeof skemaSimpanAturanPersetujuan>;

export const skemaUbahAturanPersetujuan = t.Composite([
  t.Partial(skemaSimpanAturanPersetujuan),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type UbahAturanPersetujuanInput = Static<typeof skemaUbahAturanPersetujuan>;

export const skemaQueryPersetujuan = t.Object({
  ...skemaHalaman,
  jenisDokumen: t.Optional(skema.pilihan("Jenis Dokumen", JENIS_DOKUMEN_PERSETUJUAN)),
  status: t.Optional(skema.pilihan("Status Persetujuan", STATUS_PERSETUJUAN)),
  diajukanOleh: t.Optional(t.String()),
});
export type QueryPersetujuanInput = Static<typeof skemaQueryPersetujuan>;

export const skemaAksiPersetujuan = t.Object({
  persetujuanId: skema.uuid("ID Dokumen Persetujuan"),
  aksi: skema.pilihan("Aksi Persetujuan", AKSI_PERSETUJUAN),
  catatan: skema.teksOpsional("Catatan Persetujuan", 1000),
});
export type AksiPersetujuanInput = Static<typeof skemaAksiPersetujuan>;

// ==========================================
// 6. SKEMA KUNCI TANGGAL TRANSAKSI (LOCK DATE)
// ==========================================

export const skemaSimpanKunciTransaksi = t.Object({
  perusahaanId: t.Optional(skema.uuid("ID Perusahaan")),
  kunciSemuaSebelum: t.Optional(skema.tanggal("Kunci Semua Sebelum")),
  kunciNonAdminSebelum: t.Optional(skema.tanggal("Kunci Non-Admin Sebelum")),
  catatan: skema.teksOpsional("Catatan Penguncian", 500),
});
export type SimpanKunciTransaksiInput = Static<typeof skemaSimpanKunciTransaksi>;
