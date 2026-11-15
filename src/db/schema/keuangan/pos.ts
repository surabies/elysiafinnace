import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, kuantitas, uang } from "./_helper";
import { bankAccounts } from "./bank";
import { salesInvoices } from "./dagang";
import { items, unitsOfMeasurement, warehouses } from "./inventori";
import { journalEntries } from "./jurnal";
import { partners } from "./kontak";
import {
  METODE_BAYAR_POS,
  STATUS_ORDER_POS,
  STATUS_SHIFT_POS,
} from "./konstanta";

export const statusShiftPosEnum = pgEnum("status_shift_pos", STATUS_SHIFT_POS);
export const metodeBayarPosEnum = pgEnum("metode_bayar_pos", METODE_BAYAR_POS);
export const statusOrderPosEnum = pgEnum("status_order_pos", STATUS_ORDER_POS);

/**
 * Mesin kasir / Terminal POS
 */
export const posRegisters = pgTable(
  "pos_registers",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 100 }).notNull(),
    gudangId: uuid("gudang_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    akunKasId: uuid("akun_kas_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "restrict" }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_pos_registers_gudang").on(t.gudangId)],
);

/**
 * Sesi shift kasir (Buka - Tutup Shift)
 */
export const posShifts = pgTable(
  "pos_shifts",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    registerId: uuid("register_id")
      .notNull()
      .references(() => posRegisters.id, { onDelete: "restrict" }),
    kasirId: text("kasir_id").notNull(),
    kasirNama: text("kasir_nama").notNull(),
    waktuBuka: timestamp("waktu_buka", { withTimezone: true }).notNull().defaultNow(),
    waktuTutup: timestamp("waktu_tutup", { withTimezone: true }),
    kasAwal: uang("kas_awal").notNull().default("0.0000"),
    kasAkhirFisik: uang("kas_akhir_fisik"),
    totalPenjualanTunai: uang("total_penjualan_tunai").notNull().default("0.0000"),
    totalPenjualanNonTunai: uang("total_penjualan_non_tunai").notNull().default("0.0000"),
    totalTransaksi: integer("total_transaksi").notNull().default(0),
    selisihKas: uang("selisih_kas"),
    status: statusShiftPosEnum("status").notNull().default("BUKA"),
    catatan: text("catatan"),
    ...kolomWaktu,
  },
  (t) => [
    index("idx_pos_shifts_register").on(t.registerId, t.status),
    index("idx_pos_shifts_kasir").on(t.kasirId),
  ],
);

/**
 * Transaksi Struk Penjualan Kasir POS
 */
export const posOrders = pgTable(
  "pos_orders",
  {
    id: kolomId(),
    nomorStruk: varchar("nomor_struk", { length: 50 }).notNull().unique(),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => posShifts.id, { onDelete: "restrict" }),
    registerId: uuid("register_id")
      .notNull()
      .references(() => posRegisters.id, { onDelete: "restrict" }),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "set null" }),
    namaPelanggan: varchar("nama_pelanggan", { length: 150 }).notNull().default("Pelanggan Umum"),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    waktuTransaksi: timestamp("waktu_transaksi", { withTimezone: true }).notNull().defaultNow(),
    subtotal: uang("subtotal").notNull(),
    diskon: uang("diskon").notNull().default("0.0000"),
    pajak: uang("pajak").notNull().default("0.0000"),
    total: uang("total").notNull(),
    metodeBayar: metodeBayarPosEnum("metode_bayar").notNull().default("TUNAI"),
    jumlahBayar: uang("jumlah_bayar").notNull(),
    kembalian: uang("kembalian").notNull().default("0.0000"),
    referensiPembayaran: varchar("referensi_pembayaran", { length: 100 }),
    status: statusOrderPosEnum("status").notNull().default("SELESAI"),
    salesInvoiceId: uuid("sales_invoice_id").references(() => salesInvoices.id, {
      onDelete: "set null",
    }),
    jurnalId: uuid("jurnal_id").references(() => journalEntries.id, {
      onDelete: "set null",
    }),
    catatan: text("catatan"),
    ...kolomWaktu,
  },
  (t) => [
    index("idx_pos_orders_shift").on(t.shiftId),
    index("idx_pos_orders_tanggal").on(t.tanggal),
  ],
);

/**
 * Rincian barang per struk POS
 */
export const posOrderItems = pgTable(
  "pos_order_items",
  {
    id: kolomId(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => posOrders.id, { onDelete: "cascade" }),
    urutan: smallint("urutan").notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    namaItem: varchar("nama_item", { length: 200 }).notNull(),
    satuanId: uuid("satuan_id")
      .notNull()
      .references(() => unitsOfMeasurement.id, { onDelete: "restrict" }),
    kuantitas: kuantitas("kuantitas").notNull(),
    hargaSatuan: uang("harga_satuan").notNull(),
    diskon: uang("diskon").notNull().default("0.0000"),
    subtotal: uang("subtotal").notNull(),
    biayaHpp: uang("biaya_hpp").notNull().default("0.0000"),
  },
  (t) => [index("idx_pos_order_items_order").on(t.orderId)],
);

export type MesinKasirPos = typeof posRegisters.$inferSelect;
export type ShiftPos = typeof posShifts.$inferSelect;
export type OrderPos = typeof posOrders.$inferSelect;
export type BarisOrderPos = typeof posOrderItems.$inferSelect;
