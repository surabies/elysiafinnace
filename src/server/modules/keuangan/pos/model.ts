import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";
import { METODE_BAYAR_POS, STATUS_ORDER_POS, STATUS_SHIFT_POS } from "@/db/schema/keuangan";

// ==========================================
// 1. TERMINAL / REGISTER KASIR
// ==========================================

export const skemaSimpanRegister = t.Object({
  kode: skema.kode("Kode Register", 30),
  nama: skema.teks("Nama Register", 100),
  gudangId: skema.uuid("Gudang Toko/Outlet"),
  akunKasId: skema.uuid("Akun Kasir/Kas"),
  keterangan: skema.teksOpsional("Keterangan", 500),
  aktif: t.Optional(skema.boolean("Aktif")),
});
export type SimpanRegisterInput = Static<typeof skemaSimpanRegister>;

// ==========================================
// 2. SHIFT KASIR
// ==========================================

export const skemaBukaShift = t.Object({
  registerId: skema.uuid("ID Register Kasir"),
  kasAwal: skema.uang("Modal Awal Kas"),
  catatan: skema.teksOpsional("Catatan Buka Shift", 500),
});
export type BukaShiftInput = Static<typeof skemaBukaShift>;

export const skemaTutupShift = t.Object({
  shiftId: skema.uuid("ID Shift"),
  kasAkhirFisik: skema.uang("Kas Fisik Terhitung"),
  catatan: skema.teksOpsional("Catatan Rekonsiliasi Tutup Shift", 500),
});
export type TutupShiftInput = Static<typeof skemaTutupShift>;

export const skemaQueryShift = t.Object({
  ...skemaHalaman,
  registerId: t.Optional(t.String()),
  status: t.Optional(skema.pilihan("Status Shift", STATUS_SHIFT_POS)),
});
export type QueryShiftInput = Static<typeof skemaQueryShift>;

// ==========================================
// 3. TRANSAKSI STRUK PENJUALAN KASIR
// ==========================================

export const skemaBarisOrderPos = t.Object({
  itemId: skema.uuid("ID Item"),
  namaItem: skema.teks("Nama Item", 200),
  satuanId: skema.uuid("Satuan Ukur"),
  kuantitas: skema.kuantitas("Kuantitas"),
  hargaSatuan: skema.uang("Harga Satuan"),
  diskon: t.Optional(skema.uang("Diskon Baris")),
});
export type BarisOrderPosInput = Static<typeof skemaBarisOrderPos>;

export const skemaSimpanOrderPos = t.Object({
  shiftId: skema.uuid("ID Shift Kasir"),
  registerId: skema.uuid("ID Register"),
  kontakId: t.Optional(skema.uuid("ID Pelanggan")),
  namaPelanggan: t.Optional(skema.teks("Nama Pelanggan", 150)),
  metodeBayar: skema.pilihan("Metode Pembayaran", METODE_BAYAR_POS),
  jumlahBayar: skema.uang("Nominal Bayar"),
  diskonNota: t.Optional(skema.uang("Diskon Nota")),
  pajak: t.Optional(skema.uang("Pajak")),
  referensiPembayaran: skema.teksOpsional("Nomor Ref QRIS/EDC", 100),
  catatan: skema.teksOpsional("Catatan Pesanan", 500),
  baris: t.Array(skemaBarisOrderPos, { minItems: 1, error: "Minimal 1 barang dalam keranjang belanja." }),
});
export type SimpanOrderPosInput = Static<typeof skemaSimpanOrderPos>;

export const skemaQueryOrderPos = t.Object({
  ...skemaHalaman,
  shiftId: t.Optional(t.String()),
  tanggal: t.Optional(skema.tanggal("Tanggal")),
  status: t.Optional(skema.pilihan("Status Order", STATUS_ORDER_POS)),
});
export type QueryOrderPosInput = Static<typeof skemaQueryOrderPos>;
