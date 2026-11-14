import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, uang } from "./_helper";
import { STATUS_PROYEK } from "./konstanta";
import { partners } from "./kontak";

export const statusProyekEnum = pgEnum("status_proyek", STATUS_PROYEK);

/**
 * Master Cabang Perusahaan (Multi-Branch / Multi-Location Unit).
 * Dipakai untuk segmentasi laporan keuangan dan pembatasan operasional.
 */
export const branches = pgTable(
  "branches",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    alamat: text("alamat"),
    telepon: varchar("telepon", { length: 50 }),
    penanggungJawab: varchar("penanggung_jawab", { length: 150 }),
    /** Menandai apakah ini kantor pusat / head office */
    pusat: boolean("pusat").notNull().default(false),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_branches_kode").on(t.kode),
    index("idx_branches_aktif").on(t.aktif),
  ],
);

/**
 * Master Departemen / Divisi Organisasi (Cost Center / Profit Center).
 * Mendukung hierarki bertingkat (induk departemen).
 */
export const departments = pgTable(
  "departments",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    indukId: uuid("induk_id").references((): AnyPgColumn => departments.id, {
      onDelete: "set null",
    }),
    manajer: varchar("manajer", { length: 150 }),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_departments_kode").on(t.kode),
    index("idx_departments_induk").on(t.indukId),
  ],
);

/**
 * Master Proyek (Job Order / Project Costing).
 * Mengaitkan pendapatan dan biaya ke kontrak/proyek tertentu untuk laporan profitabilitas proyek.
 */
export const projects = pgTable(
  "projects",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 200 }).notNull(),
    pelangganId: uuid("pelanggan_id").references(() => partners.id, {
      onDelete: "set null",
    }),
    tanggalMulai: date("tanggal_mulai", { mode: "string" }),
    tanggalSelesai: date("tanggal_selesai", { mode: "string" }),
    nilaiKontrak: uang("nilai_kontrak").notNull().default("0"),
    status: statusProyekEnum("status").notNull().default("PERENCANAAN"),
    penanggungJawab: varchar("penanggung_jawab", { length: 150 }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_projects_kode").on(t.kode),
    index("idx_projects_status").on(t.status),
    index("idx_projects_pelanggan").on(t.pelangganId),
    check("ck_projects_nilai_positif", sql`${t.nilaiKontrak} >= 0`),
  ],
);

/**
 * Master Tag Transaksi (Dimensi Tambahan Fleksibel).
 * Label bebas untuk pengelompokan kustom (misal #promo-q1, #capex, #audited).
 */
export const tags = pgTable(
  "tags",
  {
    id: kolomId(),
    nama: varchar("nama", { length: 50 }).notNull().unique(),
    warna: varchar("warna", { length: 20 }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_tags_nama").on(t.nama),
  ],
);

export type Cabang = typeof branches.$inferSelect;
export type Departemen = typeof departments.$inferSelect;
export type Proyek = typeof projects.$inferSelect;
export type Tag = typeof tags.$inferSelect;
