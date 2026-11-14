import { t, type Static } from "elysia";
import { JENIS_MUTASI_BANK, STATUS_DOKUMEN } from "@/db/schema/keuangan";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";

export const skemaSimpanTransaksiBank = t.Object({
  tanggal: skema.tanggal("tanggal"),
  jenis: skema.pilihan("jenis", JENIS_MUTASI_BANK),
  rekeningBankId: skema.uuid("rekeningBankId"),
  rekeningTujuanId: skema.uuidOpsional("rekeningTujuanId"),
  jumlahTujuan: t.Optional(skema.uang("jumlahTujuan")),
  kursTujuan: t.Optional(skema.kurs("kursTujuan")),
  biayaAdmin: t.Optional(skema.uang("biayaAdmin")),
  akunBiayaAdminId: skema.uuidOpsional("akunBiayaAdminId"),
  akunLawanId: skema.uuidOpsional("akunLawanId"),
  kontakId: skema.uuidOpsional("kontakId"),
  referensi: skema.teksOpsional("referensi", 100),
  deskripsi: skema.teks("deskripsi", 1000),
  mataUangId: skema.uuidOpsional("mataUangId"),
  kurs: t.Optional(skema.kurs("kurs")),
  jumlah: skema.uang("jumlah"),
});
export type InputSimpanTransaksiBank = Static<typeof skemaSimpanTransaksiBank>;

export const skemaQueryTransaksiBank = t.Object({
  rekeningBankId: skema.uuidOpsional("rekeningBankId"),
  jenis: t.Optional(skema.pilihan("jenis", JENIS_MUTASI_BANK)),
  status: t.Optional(skema.pilihan("status", STATUS_DOKUMEN)),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});

export const skemaBatalTransaksiBank = t.Object({
  tanggal: skema.tanggal("tanggal"),
  deskripsi: skema.teksOpsional("deskripsi", 500),
});
export type InputBatalTransaksiBank = Static<typeof skemaBatalTransaksiBank>;
