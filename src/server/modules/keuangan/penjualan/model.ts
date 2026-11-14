import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { STATUS_DOKUMEN, STATUS_PESANAN } from "@/db/schema/keuangan/konstanta";

/* ----------------------------- Pesanan Penjualan (SO) ----------------------------- */

export const skemaBarisPesananPenjualan = t.Object({
  itemId: t.Optional(skema.uuidOpsional("Item")),
  akunId: t.Optional(skema.uuidOpsional("Akun")),
  deskripsi: skema.teksOpsional("Deskripsi", 500),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga satuan"),
  persenDiskon: t.Optional(skema.persen("Diskon persen")),
});
export type InputBarisPesananPenjualan = Static<typeof skemaBarisPesananPenjualan>;

export const skemaSimpanPesananPenjualan = t.Object({
  pelangganId: skema.uuid("Pelanggan"),
  tanggal: skema.tanggal("Tanggal"),
  tanggalKirim: t.Optional(t.Union([skema.tanggal("Tanggal kirim"), t.Null()])),
  referensi: skema.teksOpsional("Referensi", 100),
  catatan: skema.teksOpsional("Catatan", 1000),
  mataUangId: t.Optional(skema.uuidOpsional("Mata uang")),
  kurs: t.Optional(skema.kurs("Kurs")),
  diskonNominal: t.Optional(skema.uang("Diskon nominal")),
  persenPpn: t.Optional(skema.persen("Persen PPN")),
  ongkir: t.Optional(skema.uang("Ongkos kirim")),
  uangMuka: t.Optional(skema.uang("Uang muka")),
  akunUangMukaId: t.Optional(skema.uuidOpsional("Akun uang muka")),
  akunOngkirId: t.Optional(skema.uuidOpsional("Akun ongkir")),
  baris: t.Array(skemaBarisPesananPenjualan, { minItems: 1, error: "Pesanan minimal harus memiliki 1 baris." }),
});
export type InputSimpanPesananPenjualan = Static<typeof skemaSimpanPesananPenjualan>;

export const skemaQueryPesananPenjualan = t.Object({
  status: t.Optional(skema.pilihan("Status", STATUS_PESANAN)),
  pelangganId: t.Optional(skema.uuid("Pelanggan")),
  dari: t.Optional(skema.tanggal("Dari tanggal")),
  sampai: t.Optional(skema.tanggal("Sampai tanggal")),
  q: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});
export type QueryPesananPenjualan = Static<typeof skemaQueryPesananPenjualan>;

/* ----------------------------- Faktur Penjualan (Invoice) ----------------------------- */

export const skemaBarisFakturPenjualan = t.Object({
  itemId: t.Optional(skema.uuidOpsional("Item")),
  akunId: t.Optional(skema.uuidOpsional("Akun")),
  deskripsi: skema.teksOpsional("Deskripsi", 500),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga satuan"),
  persenDiskon: t.Optional(skema.persen("Diskon persen")),
  barisPesananId: t.Optional(skema.uuidOpsional("Baris pesanan")),
});
export type InputBarisFakturPenjualan = Static<typeof skemaBarisFakturPenjualan>;

export const skemaSimpanFakturPenjualan = t.Object({
  pelangganId: skema.uuid("Pelanggan"),
  pesananId: t.Optional(skema.uuidOpsional("Pesanan")),
  tanggal: skema.tanggal("Tanggal"),
  tanggalJatuhTempo: t.Optional(t.Union([skema.tanggal("Tanggal jatuh tempo"), t.Null()])),
  terminPembayaranId: t.Optional(skema.uuidOpsional("Termin pembayaran")),
  catatan: skema.teksOpsional("Catatan", 1000),
  mataUangId: t.Optional(skema.uuidOpsional("Mata uang")),
  kurs: t.Optional(skema.kurs("Kurs")),
  diskonNominal: t.Optional(skema.uang("Diskon nominal")),
  persenPpn: t.Optional(skema.persen("Persen PPN")),
  ongkir: t.Optional(skema.uang("Ongkos kirim")),
  uangMuka: t.Optional(skema.uang("Uang muka")),
  akunUangMukaId: t.Optional(skema.uuidOpsional("Akun uang muka")),
  akunOngkirId: t.Optional(skema.uuidOpsional("Akun ongkir")),
  baris: t.Array(skemaBarisFakturPenjualan, { minItems: 1, error: "Faktur minimal harus memiliki 1 baris." }),
});
export type InputSimpanFakturPenjualan = Static<typeof skemaSimpanFakturPenjualan>;

export const skemaQueryFakturPenjualan = t.Object({
  status: t.Optional(skema.pilihan("Status", STATUS_DOKUMEN)),
  statusPembayaran: t.Optional(skema.pilihan("Status pembayaran", ["SEMUA", "BELUM_LUNAS", "LUNAS"] as const)),
  pelangganId: t.Optional(skema.uuid("Pelanggan")),
  pesananId: t.Optional(skema.uuid("Pesanan")),
  dari: t.Optional(skema.tanggal("Dari tanggal")),
  sampai: t.Optional(skema.tanggal("Sampai tanggal")),
  q: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});
export type QueryFakturPenjualan = Static<typeof skemaQueryFakturPenjualan>;

/* ----------------------------- Retur Penjualan (Credit Note) ----------------------------- */

export const skemaBarisReturPenjualan = t.Object({
  itemId: t.Optional(skema.uuidOpsional("Item")),
  akunId: t.Optional(skema.uuidOpsional("Akun")),
  deskripsi: skema.teksOpsional("Deskripsi", 500),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga satuan"),
  persenDiskon: t.Optional(skema.persen("Diskon persen")),
  barisFakturId: t.Optional(skema.uuidOpsional("Baris faktur")),
});
export type InputBarisReturPenjualan = Static<typeof skemaBarisReturPenjualan>;

export const skemaSimpanReturPenjualan = t.Object({
  fakturId: skema.uuid("Faktur"),
  tanggal: skema.tanggal("Tanggal"),
  catatan: skema.teksOpsional("Catatan", 1000),
  diskonNominal: t.Optional(skema.uang("Diskon nominal")),
  persenPpn: t.Optional(skema.persen("Persen PPN")),
  baris: t.Array(skemaBarisReturPenjualan, { minItems: 1, error: "Retur minimal harus memiliki 1 baris." }),
});
export type InputSimpanReturPenjualan = Static<typeof skemaSimpanReturPenjualan>;

export const skemaQueryReturPenjualan = t.Object({
  status: t.Optional(skema.pilihan("Status", STATUS_DOKUMEN)),
  pelangganId: t.Optional(skema.uuid("Pelanggan")),
  fakturId: t.Optional(skema.uuid("Faktur")),
  dari: t.Optional(skema.tanggal("Dari tanggal")),
  sampai: t.Optional(skema.tanggal("Sampai tanggal")),
  q: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});
export type QueryReturPenjualan = Static<typeof skemaQueryReturPenjualan>;

/* ----------------------------- Pembatalan Dokumen ----------------------------- */

export const skemaBatal = t.Object({
  tanggal: skema.tanggal("Tanggal pembatalan"),
  deskripsi: skema.teksOpsional("Alasan pembatalan", 500),
});
export type InputBatal = Static<typeof skemaBatal>;
