import { t, type Static } from "elysia";
import { METODE_BAYAR_BIAYA, STATUS_DOKUMEN } from "@/db/schema/keuangan";
import { skema, skemaHalaman } from "../_umum";

const baris = t.Object({
  akunBebanId: skema.uuid("akunBebanId"),
  deskripsi: skema.teksOpsional("deskripsi", 500),
  jumlah: skema.uang("jumlah"),
});

export const skemaSimpanBiaya = t.Object({
  tanggal: skema.tanggal("tanggal"),
  kontakId: skema.uuidOpsional("kontakId"),
  metodeBayar: t.Optional(skema.pilihan("metodeBayar", METODE_BAYAR_BIAYA)),
  rekeningBankId: skema.uuidOpsional("rekeningBankId"),
  tanggalJatuhTempo: t.Optional(skema.tanggal("tanggalJatuhTempo")),
  referensi: skema.teksOpsional("referensi", 100),
  deskripsi: skema.teks("deskripsi", 1000),
  mataUangId: skema.uuidOpsional("mataUangId"),
  kurs: t.Optional(skema.kurs("kurs")),
  ppn: t.Optional(skema.uang("ppn")),
  baris: t.Array(baris, { minItems: 1, error: "Biaya wajib memiliki minimal satu baris." }),
});
export type InputSimpanBiaya = Static<typeof skemaSimpanBiaya>;

export const skemaQueryBiaya = t.Object({
  status: t.Optional(skema.pilihan("status", STATUS_DOKUMEN)),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});

export const skemaBatal = t.Object({
  tanggal: skema.tanggal("tanggal"),
  deskripsi: skema.teksOpsional("deskripsi", 500),
});
