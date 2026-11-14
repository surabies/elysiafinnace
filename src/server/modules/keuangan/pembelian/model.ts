import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { STATUS_DOKUMEN, STATUS_PESANAN } from "@/db/schema/keuangan/konstanta";

/* ----------------------------- Pesanan Pembelian (PO) ----------------------------- */

export const skemaBarisPesananPembelian = t.Object({
  itemId: t.Optional(skema.uuidOpsional("Item")),
  gudangId: t.Optional(skema.uuidOpsional("Gudang")),
  akunId: t.Optional(skema.uuidOpsional("Akun")),
  deskripsi: skema.teksOpsional("Deskripsi", 500),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga satuan"),
  persenDiskon: t.Optional(skema.persen("Diskon persen")),
});
export type InputBarisPesananPembelian = Static<typeof skemaBarisPesananPembelian>;

export const skemaSimpanPesananPembelian = t.Object({
  pemasokId: skema.uuid("Pemasok"),
  tanggal: skema.tanggal("Tanggal"),
  tanggalDiharapkan: t.Optional(t.Union([skema.tanggal("Tanggal diharapkan"), t.Null()])),
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
  baris: t.Array(skemaBarisPesananPembelian, { minItems: 1, error: "Pesanan minimal harus memiliki 1 baris." }),
});
export type InputSimpanPesananPembelian = Static<typeof skemaSimpanPesananPembelian>;

export const skemaQueryPesananPembelian = t.Object({
  status: t.Optional(skema.pilihan("Status", STATUS_PESANAN)),
  pemasokId: t.Optional(skema.uuid("Pemasok")),
  dari: t.Optional(skema.tanggal("Dari tanggal")),
  sampai: t.Optional(skema.tanggal("Sampai tanggal")),
  q: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});
export type QueryPesananPembelian = Static<typeof skemaQueryPesananPembelian>;

/* ----------------------------- Faktur Pembelian (Bill) ----------------------------- */

export const skemaBarisFakturPembelian = t.Object({
  itemId: t.Optional(skema.uuidOpsional("Item")),
  gudangId: t.Optional(skema.uuidOpsional("Gudang")),
  akunId: t.Optional(skema.uuidOpsional("Akun")),
  deskripsi: skema.teksOpsional("Deskripsi", 500),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga satuan"),
  persenDiskon: t.Optional(skema.persen("Diskon persen")),
  barisPesananId: t.Optional(skema.uuidOpsional("Baris pesanan")),
});
export type InputBarisFakturPembelian = Static<typeof skemaBarisFakturPembelian>;

export const skemaSimpanFakturPembelian = t.Object({
  pemasokId: skema.uuid("Pemasok"),
  pesananId: t.Optional(skema.uuidOpsional("Pesanan")),
  nomorFakturPemasok: skema.teksOpsional("Nomor faktur pemasok", 100),
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
  baris: t.Array(skemaBarisFakturPembelian, { minItems: 1, error: "Faktur minimal harus memiliki 1 baris." }),
});
export type InputSimpanFakturPembelian = Static<typeof skemaSimpanFakturPembelian>;

export const skemaQueryFakturPembelian = t.Object({
  status: t.Optional(skema.pilihan("Status", STATUS_DOKUMEN)),
  statusPembayaran: t.Optional(skema.pilihan("Status pembayaran", ["SEMUA", "BELUM_LUNAS", "LUNAS"] as const)),
  pemasokId: t.Optional(skema.uuid("Pemasok")),
  pesananId: t.Optional(skema.uuid("Pesanan")),
  dari: t.Optional(skema.tanggal("Dari tanggal")),
  sampai: t.Optional(skema.tanggal("Sampai tanggal")),
  q: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});
export type QueryFakturPembelian = Static<typeof skemaQueryFakturPembelian>;

/* ----------------------------- Retur Pembelian (Debit Note) ----------------------------- */

export const skemaBarisReturPembelian = t.Object({
  itemId: t.Optional(skema.uuidOpsional("Item")),
  gudangId: t.Optional(skema.uuidOpsional("Gudang")),
  akunId: t.Optional(skema.uuidOpsional("Akun")),
  deskripsi: skema.teksOpsional("Deskripsi", 500),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga satuan"),
  persenDiskon: t.Optional(skema.persen("Diskon persen")),
  barisFakturId: t.Optional(skema.uuidOpsional("Baris faktur")),
});
export type InputBarisReturPembelian = Static<typeof skemaBarisReturPembelian>;

export const skemaSimpanReturPembelian = t.Object({
  fakturId: skema.uuid("Faktur"),
  tanggal: skema.tanggal("Tanggal"),
  catatan: skema.teksOpsional("Catatan", 1000),
  diskonNominal: t.Optional(skema.uang("Diskon nominal")),
  persenPpn: t.Optional(skema.persen("Persen PPN")),
  baris: t.Array(skemaBarisReturPembelian, { minItems: 1, error: "Retur minimal harus memiliki 1 baris." }),
});
export type InputSimpanReturPembelian = Static<typeof skemaSimpanReturPembelian>;

export const skemaQueryReturPembelian = t.Object({
  status: t.Optional(skema.pilihan("Status", STATUS_DOKUMEN)),
  pemasokId: t.Optional(skema.uuid("Pemasok")),
  fakturId: t.Optional(skema.uuid("Faktur")),
  dari: t.Optional(skema.tanggal("Dari tanggal")),
  sampai: t.Optional(skema.tanggal("Sampai tanggal")),
  q: t.Optional(t.String()),
  halaman: t.Optional(t.Numeric()),
  ukuran: t.Optional(t.Numeric()),
});
export type QueryReturPembelian = Static<typeof skemaQueryReturPembelian>;

/* ----------------------------- Pembatalan Dokumen ----------------------------- */

export const skemaBatal = t.Object({
  tanggal: skema.tanggal("Tanggal pembatalan"),
  deskripsi: skema.teksOpsional("Alasan pembatalan", 500),
});
export type InputBatal = Static<typeof skemaBatal>;
