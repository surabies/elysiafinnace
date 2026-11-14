import { t, type Static } from "elysia";
import { STATUS_REKONSILIASI } from "@/db/schema/keuangan";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";

export const skemaBuatRekonsiliasi = t.Object({
  rekeningBankId: skema.uuid("rekeningBankId"),
  tanggalLaporan: skema.tanggal("tanggalLaporan"),
  saldoLaporanBank: skema.uang("saldoLaporanBank"),
  catatan: skema.teksOpsional("catatan", 500),
});
export type InputBuatRekonsiliasi = Static<typeof skemaBuatRekonsiliasi>;

export const skemaUbahRekonsiliasi = t.Object({
  tanggalLaporan: t.Optional(skema.tanggal("tanggalLaporan")),
  saldoLaporanBank: t.Optional(skema.uang("saldoLaporanBank")),
  catatan: skema.teksOpsional("catatan", 500),
});
export type InputUbahRekonsiliasi = Static<typeof skemaUbahRekonsiliasi>;

export const skemaCocokkanBaris = t.Object({
  itemIds: t.Array(skema.uuid("itemId"), { minItems: 1, error: "Pilih minimal satu baris transaksi." }),
});
export type InputCocokkanBaris = Static<typeof skemaCocokkanBaris>;

export const skemaBarisCsvMutasi = t.Object({
  tanggal: skema.tanggal("tanggal"),
  deskripsi: skema.teks("deskripsi", 500),
  jumlah: skema.uang("jumlah"),
  jenis: t.Union([
    t.Literal("CR"),
    t.Literal("DB"),
    t.Literal("MASUK"),
    t.Literal("KELUAR"),
  ]),
});

export const skemaImportMutasiBank = t.Object({
  baris: t.Array(skemaBarisCsvMutasi, { minItems: 1, error: "Data mutasi bank tidak boleh kosong." }),
  autoCocokkan: t.Optional(t.Boolean()),
});
export type InputImportMutasiBank = Static<typeof skemaImportMutasiBank>;

export const skemaQueryRekonsiliasi = t.Object({
  rekeningBankId: skema.uuidOpsional("rekeningBankId"),
  status: t.Optional(skema.pilihan("status", STATUS_REKONSILIASI)),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});
