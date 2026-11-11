import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, persen, uang } from "./_helper";
import { currencies } from "./mata-uang";

/**
 * Termin pembayaran. Contoh: TUNAI (0 hari), NET-30 (30 hari),
 * 2/10 NET-30 (diskon 2% bila dibayar dalam 10 hari, jatuh tempo 30 hari).
 */
export const paymentTerms = pgTable(
  "payment_terms",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 20 }).notNull().unique(),
    nama: varchar("nama", { length: 100 }).notNull(),
    jumlahHari: smallint("jumlah_hari").notNull().default(0),
    persenDiskon: persen("persen_diskon").notNull().default("0"),
    hariDiskon: smallint("hari_diskon").notNull().default(0),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    check("ck_payment_terms_jumlah_hari", sql`${t.jumlahHari} >= 0`),
    check("ck_payment_terms_persen_diskon", sql`${t.persenDiskon} BETWEEN 0 AND 100`),
    check("ck_payment_terms_hari_diskon", sql`${t.hariDiskon} >= 0 AND ${t.hariDiskon} <= ${t.jumlahHari}`),
  ],
);

/**
 * Kontak terpusat: satu tabel untuk Pelanggan dan Pemasok.
 * Satu kontak boleh berperan ganda (pelanggan sekaligus pemasok).
 */
export const partners = pgTable(
  "partners",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 200 }).notNull(),
    adalahPelanggan: boolean("adalah_pelanggan").notNull().default(false),
    adalahPemasok: boolean("adalah_pemasok").notNull().default(false),
    npwp: varchar("npwp", { length: 32 }),
    adalahPkp: boolean("adalah_pkp").notNull().default(false),
    namaKontak: varchar("nama_kontak", { length: 150 }),
    email: varchar("email", { length: 150 }),
    telepon: varchar("telepon", { length: 30 }),
    alamat: text("alamat"),
    kota: varchar("kota", { length: 100 }),
    provinsi: varchar("provinsi", { length: 100 }),
    kodePos: varchar("kode_pos", { length: 10 }),
    negara: varchar("negara", { length: 100 }).notNull().default("Indonesia"),
    terminPembayaranId: uuid("termin_pembayaran_id").references(() => paymentTerms.id, {
      onDelete: "restrict",
    }),
    mataUangId: uuid("mata_uang_id").references(() => currencies.id, { onDelete: "restrict" }),
    batasKredit: uang("batas_kredit").notNull().default("0"),
    catatan: text("catatan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_partners_nama").on(t.nama),
    index("idx_partners_peran").on(t.adalahPelanggan, t.adalahPemasok),
    check("ck_partners_minimal_satu_peran", sql`${t.adalahPelanggan} OR ${t.adalahPemasok}`),
    check("ck_partners_batas_kredit", sql`${t.batasKredit} >= 0`),
  ],
);

export type Kontak = typeof partners.$inferSelect;
export type TerminPembayaran = typeof paymentTerms.$inferSelect;
