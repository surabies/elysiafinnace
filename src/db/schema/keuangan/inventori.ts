import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, kuantitas, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { TIPE_BARANG } from "./konstanta";
import { currencies } from "./mata-uang";

export const tipeBarangEnum = pgEnum("tipe_barang", TIPE_BARANG);

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
