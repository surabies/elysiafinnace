import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAudit, kolomId, kolomWaktu, kuantitas, persen, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { bankAccounts } from "./bank";
import { items, warehouses } from "./inventori";
import { journalEntries } from "./jurnal";
import { JENIS_MUTASI_STOK, JENIS_PEMBAYARAN, STATUS_PESANAN } from "./konstanta";
import { partners, paymentTerms } from "./kontak";
import { kolomMataUangTransaksi } from "./mata-uang";
import { expenses, kolomDokumen, statusDokumenEnum } from "./transaksi";

export const jenisMutasiStokEnum = pgEnum("jenis_mutasi_stok", JENIS_MUTASI_STOK);
export const statusPesananEnum = pgEnum("status_pesanan", STATUS_PESANAN);
export const jenisPembayaranEnum = pgEnum("jenis_pembayaran", JENIS_PEMBAYARAN);

/* ------------------------------------------------------------------ */
/* Persediaan (metode biaya rata-rata / Average Cost)                   */
/* ------------------------------------------------------------------ */

/** Saldo stok berjalan per item per gudang (dikunci FOR UPDATE saat mutasi). Nilai dalam mata uang dasar. */
export const itemStocks = pgTable(
  "item_stocks",
  {
    id: kolomId(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    gudangId: uuid("gudang_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    kuantitas: kuantitas("kuantitas").notNull().default("0"),
    nilai: uang("nilai").notNull().default("0"),
    biayaRataRata: uang("biaya_rata_rata").notNull().default("0"),
    diubahPada: kolomWaktu.diubahPada,
  },
  (t) => [
    uniqueIndex("uq_item_stocks_item_gudang").on(t.itemId, t.gudangId),
    index("idx_item_stocks_gudang").on(t.gudangId),
    check("ck_item_stocks_tidak_negatif", sql`${t.kuantitas} >= 0 AND ${t.nilai} >= 0`),
  ],
);

/** Kartu stok: setiap mutasi masuk/keluar beserta saldo setelah mutasi. */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: kolomId(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    gudangId: uuid("gudang_id").references(() => warehouses.id, { onDelete: "restrict" }),
    jenis: jenisMutasiStokEnum("jenis").notNull(),
    kuantitas: kuantitas("kuantitas").notNull(),
    biayaSatuan: uang("biaya_satuan").notNull(),
    nilai: uang("nilai").notNull(),
    saldoKuantitas: kuantitas("saldo_kuantitas").notNull(),
    saldoNilai: uang("saldo_nilai").notNull(),
    biayaRataRata: uang("biaya_rata_rata").notNull(),
    /** Jenis dokumen sumber: FAKTUR_PEMBELIAN, FAKTUR_PENJUALAN, PENYESUAIAN_STOK, TRANSFER_GUDANG, ... */
    sumber: varchar("sumber", { length: 30 }).notNull(),
    sumberId: uuid("sumber_id").notNull(),
    keterangan: text("keterangan"),
    jurnalId: uuid("jurnal_id").references(() => journalEntries.id, { onDelete: "restrict" }),
    ...kolomAudit,
    dibuatPada: kolomWaktu.dibuatPada,
  },
  (t) => [
    index("idx_stock_movements_item").on(t.itemId, t.tanggal),
    index("idx_stock_movements_gudang").on(t.gudangId),
    index("idx_stock_movements_sumber").on(t.sumber, t.sumberId),
    check("ck_stock_movements_kuantitas_positif", sql`${t.kuantitas} > 0`),
  ],
);

/** Penyesuaian stok (stock opname / adjustment): selisih fisik vs tercatat per gudang. */
export const stockAdjustments = pgTable(
  "stock_adjustments",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    gudangId: uuid("gudang_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    akunPenyesuaianId: uuid("akun_penyesuaian_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    status: statusDokumenEnum("status").notNull().default("DRAFT"),
    keterangan: text("keterangan").notNull(),
    totalNilai: uang("total_nilai").notNull().default("0"),
    jurnalId: uuid("jurnal_id").references(() => journalEntries.id, { onDelete: "restrict" }),
    dipostingOleh: text("diposting_oleh"),
    dipostingPada: timestamp("diposting_pada", { withTimezone: true }),
    dibatalkanOleh: text("dibatalkan_oleh"),
    dibatalkanPada: timestamp("dibatalkan_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_stock_adjustments_gudang").on(t.gudangId),
    index("idx_stock_adjustments_tanggal").on(t.tanggal),
  ],
);

export const stockAdjustmentItems = pgTable(
  "stock_adjustment_items",
  {
    id: kolomId(),
    penyesuaianId: uuid("penyesuaian_id")
      .notNull()
      .references(() => stockAdjustments.id, { onDelete: "cascade" }),
    urutan: smallint("urutan").notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    kuantitasTercatat: kuantitas("kuantitas_tercatat").notNull().default("0"),
    kuantitasFisik: kuantitas("kuantitas_fisik").notNull().default("0"),
    /** Bertanda: + menambah stok, - mengurangi stok. */
    kuantitasSelisih: kuantitas("kuantitas_selisih").notNull(),
    biayaSatuan: uang("biaya_satuan").notNull().default("0"),
    nilai: uang("nilai").notNull().default("0"),
    keterangan: text("keterangan"),
  },
  (t) => [
    index("idx_stock_adjustment_items_penyesuaian").on(t.penyesuaianId),
    check("ck_stock_adjustment_items_tidak_nol", sql`${t.kuantitasSelisih} <> 0`),
  ],
);

export type PenyesuaianStok = typeof stockAdjustments.$inferSelect;
export type BarisPenyesuaianStok = typeof stockAdjustmentItems.$inferSelect;

/* ------------------------------------------------------------------ */
/* Kolom bersama dokumen dagang                                          */
/* ------------------------------------------------------------------ */

const kolomBarisDagang = () => ({
  id: kolomId(),
  urutan: smallint("urutan").notNull(),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "restrict" }),
  gudangId: uuid("gudang_id").references(() => warehouses.id, { onDelete: "restrict" }),
  /** Akun untuk baris tanpa item persediaan (beban/aset untuk pembelian, pendapatan untuk penjualan). */
  akunId: uuid("akun_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
  deskripsi: text("deskripsi"),
  kuantitas: kuantitas("kuantitas").notNull(),
  hargaSatuan: uang("harga_satuan").notNull(),
  persenDiskon: persen("persen_diskon").notNull().default("0"),
  /** kuantitas x harga - diskon (mata uang dokumen, sebelum pajak). */
  subtotal: uang("subtotal").notNull(),
});

const ckBarisDagang = (nama: string, t: { kuantitas: unknown; hargaSatuan: unknown; itemId: unknown; akunId: unknown }) => [
  check(`ck_${nama}_kuantitas_positif`, sql`${t.kuantitas} > 0 AND ${t.hargaSatuan} >= 0`),
  check(`ck_${nama}_item_atau_akun`, sql`${t.itemId} IS NOT NULL OR ${t.akunId} IS NOT NULL`),
];

const kolomTotalDagang = () => ({
  subtotal: uang("subtotal").notNull().default("0"),
  persenPpn: persen("persen_ppn").notNull().default("0"),
  ppn: uang("ppn").notNull().default("0"),
  total: uang("total").notNull().default("0"),
});

/* ------------------------------------------------------------------ */
/* Pembelian (Accounts Payable)                                          */
/* ------------------------------------------------------------------ */

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    pemasokId: uuid("pemasok_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    tanggalDiharapkan: date("tanggal_diharapkan", { mode: "string" }),
    referensi: varchar("referensi", { length: 100 }),
    catatan: text("catatan"),
    ...kolomMataUangTransaksi(),
    ...kolomTotalDagang(),
    diskonNominal: uang("diskon_nominal").notNull().default("0"),
    ongkir: uang("ongkir").notNull().default("0"),
    uangMuka: uang("uang_muka").notNull().default("0"),
    akunUangMukaId: uuid("akun_uang_muka_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    akunOngkirId: uuid("akun_ongkir_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    status: statusPesananEnum("status").notNull().default("DRAFT"),
    disetujuiOleh: text("disetujui_oleh"),
    disetujuiPada: timestamp("disetujui_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_purchase_orders_pemasok").on(t.pemasokId), index("idx_purchase_orders_tanggal").on(t.tanggal)],
);

export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    ...kolomBarisDagang(),
    pesananId: uuid("pesanan_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    kuantitasDitagih: kuantitas("kuantitas_ditagih").notNull().default("0"),
  },
  (t) => [
    index("idx_purchase_order_items_pesanan").on(t.pesananId),
    ...ckBarisDagang("purchase_order_items", t),
    check("ck_purchase_order_items_ditagih", sql`${t.kuantitasDitagih} >= 0 AND ${t.kuantitasDitagih} <= ${t.kuantitas}`),
  ],
);

/**
 * Faktur/Tagihan Pemasok (Bill). Posting menjurnal:
 *   (Dr) Persediaan (item persediaan) / Akun baris (beban/aset)  + (Dr) PPN Masukan
 *   (Cr) Hutang Usaha
 * dan mencatat stok masuk (Average Cost).
 */
export const purchaseInvoices = pgTable(
  "purchase_invoices",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    nomorFakturPemasok: varchar("nomor_faktur_pemasok", { length: 100 }),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    tanggalJatuhTempo: date("tanggal_jatuh_tempo", { mode: "string" }).notNull(),
    pemasokId: uuid("pemasok_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    pesananId: uuid("pesanan_id").references(() => purchaseOrders.id, { onDelete: "restrict" }),
    terminPembayaranId: uuid("termin_pembayaran_id").references(() => paymentTerms.id, { onDelete: "restrict" }),
    catatan: text("catatan"),
    ...kolomMataUangTransaksi(),
    ...kolomTotalDagang(),
    diskonNominal: uang("diskon_nominal").notNull().default("0"),
    ongkir: uang("ongkir").notNull().default("0"),
    uangMuka: uang("uang_muka").notNull().default("0"),
    akunUangMukaId: uuid("akun_uang_muka_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    akunOngkirId: uuid("akun_ongkir_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    sisaTagihan: uang("sisa_tagihan").notNull().default("0"),
    ...kolomDokumen(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_purchase_invoices_pemasok").on(t.pemasokId),
    index("idx_purchase_invoices_status").on(t.status, t.tanggalJatuhTempo),
    check("ck_purchase_invoices_sisa", sql`${t.sisaTagihan} >= 0 AND ${t.sisaTagihan} <= ${t.total}`),
  ],
);

export const purchaseInvoiceItems = pgTable(
  "purchase_invoice_items",
  {
    ...kolomBarisDagang(),
    fakturId: uuid("faktur_id")
      .notNull()
      .references(() => purchaseInvoices.id, { onDelete: "cascade" }),
    barisPesananId: uuid("baris_pesanan_id").references(() => purchaseOrderItems.id, { onDelete: "restrict" }),
  },
  (t) => [index("idx_purchase_invoice_items_faktur").on(t.fakturId), ...ckBarisDagang("purchase_invoice_items", t)],
);

/**
 * Retur Pembelian (Debit Note). Posting menjurnal:
 *   (Dr) Hutang Usaha
 *   (Cr) Persediaan / Beban  + (Cr) PPN Masukan
 * dan mencatat stok keluar (Average Cost).
 */
export const purchaseReturns = pgTable(
  "purchase_returns",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    pemasokId: uuid("pemasok_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    fakturId: uuid("faktur_id")
      .notNull()
      .references(() => purchaseInvoices.id, { onDelete: "restrict" }),
    catatan: text("catatan"),
    ...kolomMataUangTransaksi(),
    ...kolomTotalDagang(),
    diskonNominal: uang("diskon_nominal").notNull().default("0"),
    ...kolomDokumen(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_purchase_returns_pemasok").on(t.pemasokId),
    index("idx_purchase_returns_faktur").on(t.fakturId),
  ],
);

export const purchaseReturnItems = pgTable(
  "purchase_return_items",
  {
    ...kolomBarisDagang(),
    returId: uuid("retur_id")
      .notNull()
      .references(() => purchaseReturns.id, { onDelete: "cascade" }),
    barisFakturId: uuid("baris_faktur_id").references(() => purchaseInvoiceItems.id, { onDelete: "restrict" }),
  },
  (t) => [index("idx_purchase_return_items_retur").on(t.returId), ...ckBarisDagang("purchase_return_items", t)],
);

/* ------------------------------------------------------------------ */
/* Penjualan (Accounts Receivable)                                       */
/* ------------------------------------------------------------------ */

export const salesOrders = pgTable(
  "sales_orders",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    pelangganId: uuid("pelanggan_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    tanggalKirim: date("tanggal_kirim", { mode: "string" }),
    referensi: varchar("referensi", { length: 100 }),
    catatan: text("catatan"),
    ...kolomMataUangTransaksi(),
    ...kolomTotalDagang(),
    diskonNominal: uang("diskon_nominal").notNull().default("0"),
    ongkir: uang("ongkir").notNull().default("0"),
    uangMuka: uang("uang_muka").notNull().default("0"),
    akunUangMukaId: uuid("akun_uang_muka_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    akunOngkirId: uuid("akun_ongkir_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    status: statusPesananEnum("status").notNull().default("DRAFT"),
    disetujuiOleh: text("disetujui_oleh"),
    disetujuiPada: timestamp("disetujui_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_sales_orders_pelanggan").on(t.pelangganId), index("idx_sales_orders_tanggal").on(t.tanggal)],
);

export const salesOrderItems = pgTable(
  "sales_order_items",
  {
    ...kolomBarisDagang(),
    pesananId: uuid("pesanan_id")
      .notNull()
      .references(() => salesOrders.id, { onDelete: "cascade" }),
    kuantitasDitagih: kuantitas("kuantitas_ditagih").notNull().default("0"),
  },
  (t) => [
    index("idx_sales_order_items_pesanan").on(t.pesananId),
    ...ckBarisDagang("sales_order_items", t),
    check("ck_sales_order_items_ditagih", sql`${t.kuantitasDitagih} >= 0 AND ${t.kuantitasDitagih} <= ${t.kuantitas}`),
  ],
);

/**
 * Faktur Penjualan (Invoice). Posting menjurnal:
 *   (Dr) Piutang Usaha                (Cr) Pendapatan Penjualan  + (Cr) PPN Keluaran
 *   (Dr) Harga Pokok Penjualan        (Cr) Persediaan            (untuk item persediaan, Average Cost)
 */
export const salesInvoices = pgTable(
  "sales_invoices",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    tanggalJatuhTempo: date("tanggal_jatuh_tempo", { mode: "string" }).notNull(),
    pelangganId: uuid("pelanggan_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    pesananId: uuid("pesanan_id").references(() => salesOrders.id, { onDelete: "restrict" }),
    terminPembayaranId: uuid("termin_pembayaran_id").references(() => paymentTerms.id, { onDelete: "restrict" }),
    catatan: text("catatan"),
    ...kolomMataUangTransaksi(),
    ...kolomTotalDagang(),
    diskonNominal: uang("diskon_nominal").notNull().default("0"),
    ongkir: uang("ongkir").notNull().default("0"),
    uangMuka: uang("uang_muka").notNull().default("0"),
    akunUangMukaId: uuid("akun_uang_muka_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    akunOngkirId: uuid("akun_ongkir_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    /** Total HPP (mata uang dasar) saat diposting. */
    totalHpp: uang("total_hpp").notNull().default("0"),
    sisaTagihan: uang("sisa_tagihan").notNull().default("0"),
    ...kolomDokumen(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_sales_invoices_pelanggan").on(t.pelangganId),
    index("idx_sales_invoices_status").on(t.status, t.tanggalJatuhTempo),
    check("ck_sales_invoices_sisa", sql`${t.sisaTagihan} >= 0 AND ${t.sisaTagihan} <= ${t.total}`),
  ],
);

export const salesInvoiceItems = pgTable(
  "sales_invoice_items",
  {
    ...kolomBarisDagang(),
    fakturId: uuid("faktur_id")
      .notNull()
      .references(() => salesInvoices.id, { onDelete: "cascade" }),
    barisPesananId: uuid("baris_pesanan_id").references(() => salesOrderItems.id, { onDelete: "restrict" }),
    /** HPP baris (mata uang dasar), diisi saat posting. */
    hpp: uang("hpp").notNull().default("0"),
  },
  (t) => [index("idx_sales_invoice_items_faktur").on(t.fakturId), ...ckBarisDagang("sales_invoice_items", t)],
);

/**
 * Retur Penjualan (Credit Note). Posting menjurnal:
 *   (Dr) Pendapatan Penjualan + (Dr) PPN Keluaran
 *   (Cr) Piutang Usaha
 * dan
 *   (Dr) Persediaan
 *   (Cr) Harga Pokok Penjualan
 * serta mencatat stok masuk (Average Cost).
 */
export const salesReturns = pgTable(
  "sales_returns",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    pelangganId: uuid("pelanggan_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    fakturId: uuid("faktur_id")
      .notNull()
      .references(() => salesInvoices.id, { onDelete: "restrict" }),
    catatan: text("catatan"),
    ...kolomMataUangTransaksi(),
    ...kolomTotalDagang(),
    diskonNominal: uang("diskon_nominal").notNull().default("0"),
    totalHpp: uang("total_hpp").notNull().default("0"),
    ...kolomDokumen(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_sales_returns_pelanggan").on(t.pelangganId),
    index("idx_sales_returns_faktur").on(t.fakturId),
  ],
);

export const salesReturnItems = pgTable(
  "sales_return_items",
  {
    ...kolomBarisDagang(),
    returId: uuid("retur_id")
      .notNull()
      .references(() => salesReturns.id, { onDelete: "cascade" }),
    barisFakturId: uuid("baris_faktur_id").references(() => salesInvoiceItems.id, { onDelete: "restrict" }),
    hpp: uang("hpp").notNull().default("0"),
  },
  (t) => [index("idx_sales_return_items_retur").on(t.returId), ...ckBarisDagang("sales_return_items", t)],
);

/* ------------------------------------------------------------------ */
/* Pembayaran & alokasi                                                  */
/* ------------------------------------------------------------------ */

/**
 * Pembayaran:
 *   PENERIMAAN  (pelunasan piutang) : (Dr) Kas/Bank   (Cr) Piutang Usaha
 *   PENGELUARAN (pelunasan hutang)  : (Dr) Hutang Usaha (Cr) Kas/Bank
 * Selisih kurs antara kurs faktur dan kurs pembayaran dicatat ke akun Laba/Rugi Selisih Kurs.
 */
export const payments = pgTable(
  "payments",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    jenis: jenisPembayaranEnum("jenis").notNull(),
    kontakId: uuid("kontak_id")
      .notNull()
      .references(() => partners.id, { onDelete: "restrict" }),
    rekeningBankId: uuid("rekening_bank_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "restrict" }),
    referensi: varchar("referensi", { length: 100 }),
    catatan: text("catatan"),
    ...kolomMataUangTransaksi(),
    jumlah: uang("jumlah").notNull(),
    ...kolomDokumen(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_payments_kontak").on(t.kontakId),
    index("idx_payments_tanggal").on(t.tanggal),
    check("ck_payments_jumlah", sql`${t.jumlah} > 0`),
  ],
);

export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: kolomId(),
    pembayaranId: uuid("pembayaran_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    fakturPenjualanId: uuid("faktur_penjualan_id").references(() => salesInvoices.id, { onDelete: "restrict" }),
    fakturPembelianId: uuid("faktur_pembelian_id").references(() => purchaseInvoices.id, { onDelete: "restrict" }),
    biayaId: uuid("biaya_id").references(() => expenses.id, { onDelete: "restrict" }),
    jumlah: uang("jumlah").notNull(),
    potongan: uang("potongan").notNull().default("0"),
    akunPotonganId: uuid("akun_potongan_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    selisihKurs: uang("selisih_kurs").notNull().default("0"),
  },
  (t) => [
    index("idx_payment_allocations_pembayaran").on(t.pembayaranId),
    index("idx_payment_allocations_faktur_penjualan").on(t.fakturPenjualanId),
    index("idx_payment_allocations_faktur_pembelian").on(t.fakturPembelianId),
    check("ck_payment_allocations_jumlah", sql`${t.jumlah} > 0`),
    check(
      "ck_payment_allocations_satu_dokumen",
      sql`num_nonnulls(${t.fakturPenjualanId}, ${t.fakturPembelianId}, ${t.biayaId}) = 1`,
    ),
  ],
);

export type PesananPembelian = typeof purchaseOrders.$inferSelect;
export type BarisPesananPembelian = typeof purchaseOrderItems.$inferSelect;
export type FakturPembelian = typeof purchaseInvoices.$inferSelect;
export type BarisFakturPembelian = typeof purchaseInvoiceItems.$inferSelect;
export type ReturPembelian = typeof purchaseReturns.$inferSelect;
export type BarisReturPembelian = typeof purchaseReturnItems.$inferSelect;

export type PesananPenjualan = typeof salesOrders.$inferSelect;
export type BarisPesananPenjualan = typeof salesOrderItems.$inferSelect;
export type FakturPenjualan = typeof salesInvoices.$inferSelect;
export type BarisFakturPenjualan = typeof salesInvoiceItems.$inferSelect;
export type ReturPenjualan = typeof salesReturns.$inferSelect;
export type BarisReturPenjualan = typeof salesReturnItems.$inferSelect;

export type Pembayaran = typeof payments.$inferSelect;
export type AlokasiPembayaran = typeof paymentAllocations.$inferSelect;
