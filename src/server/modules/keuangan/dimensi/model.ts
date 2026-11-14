import { t } from "elysia";
import { STATUS_PROYEK } from "@/db/schema/keuangan/konstanta";
import { skema } from "../shared/schema";

export const skemaStatusProyek = skema.pilihan("Status Proyek", STATUS_PROYEK);

// --- CABANG (BRANCHES) ---
export const skemaSimpanCabang = t.Object({
  kode: skema.kode("Kode Cabang", 30),
  nama: skema.teks("Nama Cabang", 150),
  alamat: t.Optional(t.String()),
  telepon: t.Optional(t.String({ maxLength: 50 })),
  penanggungJawab: t.Optional(t.String({ maxLength: 150 })),
  pusat: t.Optional(t.Boolean()),
  aktif: t.Optional(t.Boolean()),
});

export const skemaQueryCabang = t.Object({
  q: t.Optional(t.String()),
  aktif: t.Optional(t.BooleanString()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- DEPARTEMEN (DEPARTMENTS) ---
export const skemaSimpanDepartemen = t.Object({
  kode: skema.kode("Kode Departemen", 30),
  nama: skema.teks("Nama Departemen", 150),
  indukId: t.Optional(skema.uuidOpsional("Induk Departemen")),
  manajer: t.Optional(t.String({ maxLength: 150 })),
  aktif: t.Optional(t.Boolean()),
});

export const skemaQueryDepartemen = t.Object({
  q: t.Optional(t.String()),
  aktif: t.Optional(t.BooleanString()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- PROYEK (PROJECTS) ---
export const skemaSimpanProyek = t.Object({
  kode: t.Optional(skema.teks("Kode Proyek", 30)),
  nama: skema.teks("Nama Proyek", 200),
  pelangganId: t.Optional(skema.uuidOpsional("Pelanggan / Klien Proyek")),
  tanggalMulai: t.Optional(skema.tanggal("Tanggal Mulai")),
  tanggalSelesai: t.Optional(skema.tanggal("Tanggal Selesai")),
  nilaiKontrak: t.Optional(skema.uang("Nilai Kontrak")),
  status: t.Optional(skemaStatusProyek),
  penanggungJawab: t.Optional(t.String({ maxLength: 150 })),
  keterangan: t.Optional(t.String()),
  aktif: t.Optional(t.Boolean()),
});

export const skemaQueryProyek = t.Object({
  q: t.Optional(t.String()),
  status: t.Optional(skemaStatusProyek),
  pelangganId: t.Optional(skema.uuidOpsional("Pelanggan")),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- TAG TRANSAKSI ---
export const skemaSimpanTag = t.Object({
  nama: skema.teks("Nama Tag", 50),
  warna: t.Optional(t.String({ maxLength: 20 })),
  keterangan: t.Optional(t.String()),
  aktif: t.Optional(t.Boolean()),
});

export const skemaQueryTag = t.Object({
  q: t.Optional(t.String()),
  aktif: t.Optional(t.BooleanString()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// Static types for services and controllers
export type SimpanCabangInput = typeof skemaSimpanCabang.static;
export type QueryCabangInput = typeof skemaQueryCabang.static;
export type SimpanDepartemenInput = typeof skemaSimpanDepartemen.static;
export type QueryDepartemenInput = typeof skemaQueryDepartemen.static;
export type SimpanProyekInput = typeof skemaSimpanProyek.static;
export type QueryProyekInput = typeof skemaQueryProyek.static;
export type SimpanTagInput = typeof skemaSimpanTag.static;
export type QueryTagInput = typeof skemaQueryTag.static;
