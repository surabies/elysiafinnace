import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, persen, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import {
  GOLONGAN_FISKAL_ASET,
  METODE_PENYUSUTAN,
  STATUS_ASET,
  STATUS_PENYUSUTAN_ASET,
} from "./konstanta";
import { journalEntries } from "./jurnal";

export const metodePenyusutanEnum = pgEnum("metode_penyusutan", METODE_PENYUSUTAN);
export const golonganFiskalAsetEnum = pgEnum("golongan_fiskal_aset", GOLONGAN_FISKAL_ASET);
export const statusAsetEnum = pgEnum("status_aset", STATUS_ASET);
export const statusPenyusutanAsetEnum = pgEnum("status_penyusutan_aset", STATUS_PENYUSUTAN_ASET);

/**
 * Kategori Aset Tetap (Peralatan, Kendaraan, Bangunan, Mesin, dll).
 * Mengikat akun aset, akumulasi penyusutan, beban penyusutan, dan masa manfaat fiskal.
 */
export const assetCategories = pgTable(
  "asset_categories",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    metodePenyusutan: metodePenyusutanEnum("metode_penyusutan").notNull().default("GARIS_LURUS"),
    golonganFiskal: golonganFiskalAsetEnum("golongan_fiskal").notNull().default("NON_FISKAL"),
    masaManfaatBulan: smallint("masa_manfaat_bulan").notNull().default(48),
    tarifTahunanPersen: persen("tarif_tahunan_persen").notNull().default("25"),
    akunAsetId: uuid("akun_aset_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    akunAkumulasiPenyusutanId: uuid("akun_akumulasi_penyusutan_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    akunBebanPenyusutanId: uuid("akun_beban_penyusutan_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_asset_categories_kode").on(t.kode),
    check("ck_asset_categories_masa_manfaat_positif", sql`${t.masaManfaatBulan} >= 0`),
    check("ck_asset_categories_tarif_positif", sql`${t.tarifTahunanPersen} >= 0`),
  ],
);

/**
 * Buku Registrasi Aset Tetap (Fixed Asset Register).
 */
export const fixedAssets = pgTable(
  "fixed_assets",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 200 }).notNull(),
    kategoriId: uuid("kategori_id")
      .notNull()
      .references(() => assetCategories.id, { onDelete: "restrict" }),
    tanggalPerolehan: date("tanggal_perolehan", { mode: "string" }).notNull(),
    tanggalMulaiPenyusutan: date("tanggal_mulai_penyusutan", { mode: "string" }).notNull(),
    nilaiPerolehan: uang("nilai_perolehan").notNull(),
    nilaiResidu: uang("nilai_residu").notNull().default("0"),
    masaManfaatBulan: smallint("masa_manfaat_bulan").notNull(),
    metodePenyusutan: metodePenyusutanEnum("metode_penyusutan").notNull(),
    lokasi: varchar("lokasi", { length: 150 }),
    penanggungJawab: varchar("penanggung_jawab", { length: 150 }),
    nomorSeri: varchar("nomor_seri", { length: 100 }),
    status: statusAsetEnum("status").notNull().default("AKTIF"),
    akumulasiPenyusutan: uang("akumulasi_penyusutan").notNull().default("0"),
    nilaiBuku: uang("nilai_buku").notNull(),
    sisaManfaatBulan: smallint("sisa_manfaat_bulan").notNull(),
    tanggalPelepasan: date("tanggal_pelepasan", { mode: "string" }),
    nilaiPelepasan: uang("nilai_pelepasan"),
    alasanPelepasan: text("alasan_pelepasan"),
    akunKasPelepasanId: uuid("akun_kas_pelepasan_id").references(() => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    jurnalPelepasanId: uuid("jurnal_pelepasan_id").references(() => journalEntries.id, {
      onDelete: "set null",
    }),
    keterangan: text("keterangan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_fixed_assets_kategori").on(t.kategoriId),
    index("idx_fixed_assets_status").on(t.status),
    check("ck_fixed_assets_nilai_positif", sql`${t.nilaiPerolehan} >= 0 AND ${t.nilaiResidu} >= 0`),
    check("ck_fixed_assets_residu_valid", sql`${t.nilaiResidu} <= ${t.nilaiPerolehan}`),
    check("ck_fixed_assets_masa_valid", sql`${t.masaManfaatBulan} >= 0 AND ${t.sisaManfaatBulan} >= 0`),
  ],
);

/**
 * Riwayat & Jadwal Penyusutan Bulanan Aset Tetap.
 */
export const assetDepreciations = pgTable(
  "asset_depreciations",
  {
    id: kolomId(),
    asetId: uuid("aset_id")
      .notNull()
      .references(() => fixedAssets.id, { onDelete: "cascade" }),
    periode: varchar("periode", { length: 7 }).notNull(), // Format: YYYY-MM
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    nilaiPenyusutan: uang("nilai_penyusutan").notNull(),
    nilaiBukuAwal: uang("nilai_buku_awal").notNull(),
    nilaiBukuAkhir: uang("nilai_buku_akhir").notNull(),
    jurnalId: uuid("jurnal_id").references(() => journalEntries.id, { onDelete: "set null" }),
    status: statusPenyusutanAsetEnum("status").notNull().default("POSTED"),
    keterangan: text("keterangan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_asset_depreciations_aset_periode")
      .on(t.asetId, t.periode)
      .where(sql`${t.status} = 'POSTED'`),
    index("idx_asset_depreciations_periode").on(t.periode),
    check("ck_asset_depreciations_nilai_positif", sql`${t.nilaiPenyusutan} >= 0`),
  ],
);

export type KategoriAset = typeof assetCategories.$inferSelect;
export type AsetTetap = typeof fixedAssets.$inferSelect;
export type PenyusutanAset = typeof assetDepreciations.$inferSelect;
