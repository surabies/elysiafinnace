import { t } from "elysia";
import { STATUS_ANGGARAN } from "@/db/schema/keuangan/konstanta";
import { skema } from "../shared/schema";

export const skemaStatusAnggaran = skema.pilihan("Status Anggaran", STATUS_ANGGARAN);

export const skemaSimpanBarisAnggaran = t.Object({
  akunId: skema.uuid("Akun COA"),
  periode: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$", error: "Periode harus format YYYY-MM." }),
  jumlah: skema.uang("Nominal Anggaran"),
  keterangan: t.Optional(t.String()),
});

export const skemaSimpanAnggaran = t.Object({
  nomor: t.Optional(skema.teks("Nomor Anggaran", 30)),
  nama: skema.teks("Nama Anggaran", 150),
  tahun: t.Numeric({ minimum: 2000, maximum: 2100, error: "Tahun harus antara 2000 dan 2100." }),
  cabangId: t.Optional(skema.uuidOpsional("Cabang")),
  departemenId: t.Optional(skema.uuidOpsional("Departemen")),
  proyekId: t.Optional(skema.uuidOpsional("Proyek")),
  keterangan: t.Optional(t.String()),
  baris: t.Array(skemaSimpanBarisAnggaran, { minItems: 1 }),
});

export const skemaQueryAnggaran = t.Object({
  tahun: t.Optional(t.Numeric()),
  status: t.Optional(skemaStatusAnggaran),
  cabangId: t.Optional(skema.uuidOpsional("Cabang")),
  departemenId: t.Optional(skema.uuidOpsional("Departemen")),
  proyekId: t.Optional(skema.uuidOpsional("Proyek")),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

export const skemaQueryLaporanRealisasi = t.Object({
  anggaranId: t.Optional(skema.uuidOpsional("ID Anggaran")),
  tahun: t.Numeric({ minimum: 2000, maximum: 2100 }),
  periode: t.Optional(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
  cabangId: t.Optional(skema.uuidOpsional("Cabang")),
  departemenId: t.Optional(skema.uuidOpsional("Departemen")),
  proyekId: t.Optional(skema.uuidOpsional("Proyek")),
});

export const skemaQueryLabaRugiProyek = t.Object({
  proyekId: skema.uuid("ID Proyek"),
  dariTanggal: t.Optional(skema.tanggal("Dari Tanggal")),
  sampaiTanggal: t.Optional(skema.tanggal("Sampai Tanggal")),
});

export const skemaQueryLabaRugiCabang = t.Object({
  cabangId: t.Optional(skema.uuidOpsional("ID Cabang")),
  dariTanggal: t.Optional(skema.tanggal("Dari Tanggal")),
  sampaiTanggal: t.Optional(skema.tanggal("Sampai Tanggal")),
});

// Static types for services
export type SimpanAnggaranInput = typeof skemaSimpanAnggaran.static;
export type QueryAnggaranInput = typeof skemaQueryAnggaran.static;
export type QueryLaporanRealisasiInput = typeof skemaQueryLaporanRealisasi.static;
export type QueryLabaRugiProyekInput = typeof skemaQueryLabaRugiProyek.static;
export type QueryLabaRugiCabangInput = typeof skemaQueryLabaRugiCabang.static;
