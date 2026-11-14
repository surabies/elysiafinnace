import { sql } from "drizzle-orm";
import {
  boolean,
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
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, kuantitas, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { METODE_PENILAIAN_STOK, STATUS_TRANSFER_GUDANG, TIPE_BARANG } from "./konstanta";
import { currencies } from "./mata-uang";
import { journalEntries } from "./jurnal";

export const tipeBarangEnum = pgEnum("tipe_barang", TIPE_BARANG);
export const metodePenilaianStokEnum = pgEnum("metode_penilaian_stok", METODE_PENILAIAN_STOK);
export const statusTransferGudangEnum = pgEnum("status_transfer_gudang", STATUS_TRANSFER_GUDANG);

/** Kategori produk (boleh bertingkat). */
export const productCategories = pgTable(
  "product_categories",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    indukId: uuid("induk_id").references((): AnyPgColumn => productCategories.id, {
      onDelete: "restrict",
    }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_product_categories_induk").on(t.indukId),
    check("ck_product_categories_bukan_induk_sendiri", sql`${t.indukId} IS DISTINCT FROM ${t.id}`),
  ],
);

/** Satuan ukur (Unit of Measurement): PCS, KG, M3, LITER, ... */
export const unitsOfMeasurement = pgTable("units_of_measurement", {
  id: kolomId(),
  kode: varchar("kode", { length: 10 }).notNull().unique(),
  nama: varchar("nama", { length: 100 }).notNull(),
  aktif: kolomAktif(),
  ...kolomAudit,
  ...kolomWaktu,
});

/**
 * Master item/produk.
 *  - BARANG_PERSEDIAAN     : dilacak stok & nilainya (wajib akun persediaan).
 *  - BARANG_NON_PERSEDIAAN : dibeli/dijual tanpa pelacakan stok.
 *  - JASA                  : tidak berwujud.
 * Harga standar disimpan dalam mata uang item (default: mata uang dasar).
 */
export const items = pgTable(
  "items",
  {
    id: kolomId(),
    sku: varchar("sku", { length: 50 }).notNull().unique(),
    barcode: varchar("barcode", { length: 50 }).unique(),
    nama: varchar("nama", { length: 200 }).notNull(),
    deskripsi: text("deskripsi"),
    tipeBarang: tipeBarangEnum("tipe_barang").notNull().default("BARANG_PERSEDIAAN"),
    metodePenilaian: metodePenilaianStokEnum("metode_penilaian").notNull().default("RATA_RATA"),
    kategoriId: uuid("kategori_id").references(() => productCategories.id, { onDelete: "restrict" }),
    satuanId: uuid("satuan_id")
      .notNull()
      .references(() => unitsOfMeasurement.id, { onDelete: "restrict" }),
    mataUangId: uuid("mata_uang_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    hargaBeliStandar: uang("harga_beli_standar").notNull().default("0"),
    hargaJualStandar: uang("harga_jual_standar").notNull().default("0"),
    stokMinimum: kuantitas("stok_minimum").notNull().default("0"),
    akunPersediaanId: uuid("akun_persediaan_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    akunHppId: uuid("akun_hpp_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    akunPendapatanId: uuid("akun_pendapatan_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_items_nama").on(t.nama),
    index("idx_items_kategori").on(t.kategoriId),
    check(
      "ck_items_barang_persediaan_wajib_akun_persediaan",
      sql`${t.tipeBarang} <> 'BARANG_PERSEDIAAN' OR ${t.akunPersediaanId} IS NOT NULL`,
    ),
    check("ck_items_harga_tidak_negatif", sql`${t.hargaBeliStandar} >= 0 AND ${t.hargaJualStandar} >= 0`),
    check("ck_items_stok_minimum_tidak_negatif", sql`${t.stokMinimum} >= 0`),
  ],
);

export type ProdukKategori = typeof productCategories.$inferSelect;
export type Satuan = typeof unitsOfMeasurement.$inferSelect;
export type Item = typeof items.$inferSelect;

/**
 * Multi-satuan & konversi per item.
 * Contoh: Satuan dasar = PCS. Satuan kemasan: DUS (konversi = 12), KARTON (konversi = 24).
 * Mendukung barcode per kemasan dan harga jual/beli khusus satuan tersebut.
 */
export const itemUnits = pgTable(
  "item_units",
  {
    id: kolomId(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    satuanId: uuid("satuan_id")
      .notNull()
      .references(() => unitsOfMeasurement.id, { onDelete: "restrict" }),
    konversi: kuantitas("konversi").notNull().default("1"),
    barcode: varchar("barcode", { length: 50 }),
    hargaJual: uang("harga_jual"),
    hargaBeli: uang("harga_beli"),
    urutan: smallint("urutan").notNull().default(1),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_item_units_item").on(t.itemId),
    check("ck_item_units_konversi_positif", sql`${t.konversi} > 0`),
    check(
      "ck_item_units_harga_positif",
      sql`(${t.hargaJual} IS NULL OR ${t.hargaJual} >= 0) AND (${t.hargaBeli} IS NULL OR ${t.hargaBeli} >= 0)`,
    ),
    uniqueIndex("uq_item_units_item_satuan").on(t.itemId, t.satuanId),
  ],
);

/**
 * Daftar harga (Price List): Umum, Grosir, VIP/Distributor, dsb.
 */
export const priceLists = pgTable(
  "price_lists",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    mataUangId: uuid("mata_uang_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_price_lists_nama").on(t.nama)],
);

/**
 * Baris harga bertingkat per item dalam price list (mendukung kuantitas minimum / volume discount).
 */
export const priceListItems = pgTable(
  "price_list_items",
  {
    id: kolomId(),
    priceListId: uuid("price_list_id")
      .notNull()
      .references(() => priceLists.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    satuanId: uuid("satuan_id").references(() => unitsOfMeasurement.id, { onDelete: "restrict" }),
    minKuantitas: kuantitas("min_kuantitas").notNull().default("1"),
    harga: uang("harga").notNull(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_price_list_items_list").on(t.priceListId),
    index("idx_price_list_items_item").on(t.itemId),
    check("ck_price_list_items_min_qty_positif", sql`${t.minKuantitas} > 0`),
    check("ck_price_list_items_harga_positif", sql`${t.harga} >= 0`),
  ],
);

/**
 * Komponen bundel / paket produk untuk item bertipe BUNDEL.
 */
export const itemBundles = pgTable(
  "item_bundles",
  {
    id: kolomId(),
    bundleItemId: uuid("bundle_item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    komponenItemId: uuid("komponen_item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    satuanId: uuid("satuan_id")
      .notNull()
      .references(() => unitsOfMeasurement.id, { onDelete: "restrict" }),
    kuantitas: kuantitas("kuantitas").notNull().default("1"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_item_bundles_parent").on(t.bundleItemId),
    check("ck_item_bundles_bukan_diri_sendiri", sql`${t.bundleItemId} IS DISTINCT FROM ${t.komponenItemId}`),
    check("ck_item_bundles_kuantitas_positif", sql`${t.kuantitas} > 0`),
    uniqueIndex("uq_item_bundles_komponen").on(t.bundleItemId, t.komponenItemId),
  ],
);

export type ItemSatuan = typeof itemUnits.$inferSelect;
export type DaftarHarga = typeof priceLists.$inferSelect;
export type BarisDaftarHarga = typeof priceListItems.$inferSelect;
export type ItemBundel = typeof itemBundles.$inferSelect;

/* ------------------------------------------------------------------ */
/* Multi-Gudang (Warehouses) & Pelacakan Inventori Lanjutan           */
/* ------------------------------------------------------------------ */

/**
 * Master data gudang (lokasi penyimpanan stok).
 */
export const warehouses = pgTable(
  "warehouses",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    alamat: text("alamat"),
    penanggungJawab: varchar("penanggung_jawab", { length: 150 }),
    adalahGudangUtama: boolean("adalah_gudang_utama").notNull().default(false),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_warehouses_nama").on(t.nama)],
);

/**
 * Nomor Batch & Seri untuk item persediaan (mendukung pelacakan kedaluwarsa).
 */
export const itemBatches = pgTable(
  "item_batches",
  {
    id: kolomId(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    gudangId: uuid("gudang_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    nomorBatch: varchar("nomor_batch", { length: 50 }).notNull(),
    tanggalKedaluwarsa: date("tanggal_kedaluwarsa", { mode: "string" }),
    kuantitas: kuantitas("kuantitas").notNull().default("0"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_item_batches_item").on(t.itemId, t.nomorBatch),
    uniqueIndex("uq_item_batches_nomor").on(t.itemId, t.gudangId, t.nomorBatch),
    check("ck_item_batches_kuantitas_tidak_negatif", sql`${t.kuantitas} >= 0`),
  ],
);

/**
 * Transfer Stok Antar Gudang.
 */
export const warehouseTransfers = pgTable(
  "warehouse_transfers",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    gudangAsalId: uuid("gudang_asal_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    gudangTujuanId: uuid("gudang_tujuan_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    status: statusTransferGudangEnum("status").notNull().default("DRAFT"),
    keterangan: text("keterangan"),
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
    index("idx_warehouse_transfers_tanggal").on(t.tanggal),
    check("ck_warehouse_transfers_gudang_berbeda", sql`${t.gudangAsalId} <> ${t.gudangTujuanId}`),
    check("ck_warehouse_transfers_total_tidak_negatif", sql`${t.totalNilai} >= 0`),
  ],
);

/**
 * Baris item transfer stok antar gudang.
 */
export const warehouseTransferItems = pgTable(
  "warehouse_transfer_items",
  {
    id: kolomId(),
    transferId: uuid("transfer_id")
      .notNull()
      .references(() => warehouseTransfers.id, { onDelete: "cascade" }),
    urutan: smallint("urutan").notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }),
    kuantitas: kuantitas("kuantitas").notNull(),
    biayaSatuan: uang("biaya_satuan").notNull().default("0"),
    nilai: uang("nilai").notNull().default("0"),
    keterangan: text("keterangan"),
  },
  (t) => [
    index("idx_warehouse_transfer_items_transfer").on(t.transferId),
    check("ck_warehouse_transfer_items_kuantitas_positif", sql`${t.kuantitas} > 0`),
    check("ck_warehouse_transfer_items_nilai_positif", sql`${t.nilai} >= 0 AND ${t.biayaSatuan} >= 0`),
  ],
);

export type Gudang = typeof warehouses.$inferSelect;
export type ItemBatch = typeof itemBatches.$inferSelect;
export type TransferGudang = typeof warehouseTransfers.$inferSelect;
export type BarisTransferGudang = typeof warehouseTransferItems.$inferSelect;
