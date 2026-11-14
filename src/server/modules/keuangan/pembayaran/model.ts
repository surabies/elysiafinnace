import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { JENIS_PEMBAYARAN, STATUS_DOKUMEN } from "@/db/schema/keuangan/konstanta";

/* ----------------------------- Alokasi Pembayaran ----------------------------- */

export const skemaItemAlokasiPembayaran = t.Object({
  fakturPenjualanId: t.Optional(skema.uuidOpsional("Faktur penjualan")),
  fakturPembelianId: t.Optional(skema.uuidOpsional("Faktur pembelian")),
  biayaId: t.Optional(skema.uuidOpsional("Biaya")),
  jumlah: skema.uang("Jumlah bayar dialokasikan"),
  potongan: t.Optional(skema.uang("Potongan pelunasan")),
  akunPotonganId: t.Optional(skema.uuidOpsional("Akun potongan pelunasan")),
});
export type InputItemAlokasiPembayaran = Static<typeof skemaItemAlokasiPembayaran>;

/* ----------------------------- Header Pembayaran ----------------------------- */

export const skemaSimpanPembayaran = t.Object({
  tanggal: skema.tanggal("Tanggal pembayaran"),
  jenis: skema.pilihan("Jenis pembayaran", JENIS_PEMBAYARAN),
  kontakId: skema.uuid("Kontak"),
  rekeningBankId: skema.uuid("Rekening kas/bank"),
  referensi: skema.teksOpsional("Nomor referensi / bukti bayar", 100),
  catatan: skema.teksOpsional("Catatan pembayaran", 1000),
  mataUangId: t.Optional(skema.uuidOpsional("Mata uang")),
  kurs: t.Optional(skema.kurs("Kurs")),
  jumlah: skema.uang("Total jumlah pembayaran"),
  alokasi: t.Array(skemaItemAlokasiPembayaran, {
    minItems: 1,
    error: "Pembayaran harus dialokasikan minimal ke 1 dokumen tagihan.",
  }),
});
export type InputSimpanPembayaran = Static<typeof skemaSimpanPembayaran>;

export const skemaQueryPembayaran = t.Object({
  jenis: t.Optional(skema.pilihan("Jenis pembayaran", JENIS_PEMBAYARAN)),
  status: t.Optional(skema.pilihan("Status dokumen", STATUS_DOKUMEN)),
  kontakId: t.Optional(skema.uuid("Kontak")),
  rekeningBankId: t.Optional(skema.uuid("Rekening kas/bank")),
  dari: t.Optional(skema.tanggal("Dari tanggal")),
  sampai: t.Optional(skema.tanggal("Sampai tanggal")),
  q: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});
export type QueryPembayaran = Static<typeof skemaQueryPembayaran>;

export const skemaBatal = t.Object({
  tanggal: skema.tanggal("Tanggal pembatalan"),
  deskripsi: skema.teksOpsional("Alasan pembatalan", 500),
});
export type InputBatal = Static<typeof skemaBatal>;
