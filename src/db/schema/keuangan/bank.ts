import { sql } from "drizzle-orm";
import { check, pgEnum, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu } from "./_helper";
import { chartOfAccounts } from "./akun";
import { JENIS_REKENING } from "./konstanta";
import { currencies } from "./mata-uang";

export const jenisRekeningEnum = pgEnum("jenis_rekening", JENIS_REKENING);

/**
 * Rekening kas/bank perusahaan. Setiap rekening terhubung ke TEPAT SATU akun COA
 * (tipe ASET, peran KAS_BANK) yang menjadi sisi buku besar dari mutasi rekening ini.
 */
export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 20 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    jenis: jenisRekeningEnum("jenis").notNull().default("BANK"),
    namaBank: varchar("nama_bank", { length: 100 }),
    nomorRekening: varchar("nomor_rekening", { length: 50 }),
    atasNama: varchar("atas_nama", { length: 150 }),
    cabang: varchar("cabang", { length: 100 }),
    akunCoaId: uuid("akun_coa_id")
      .notNull()
      .unique()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    mataUangId: uuid("mata_uang_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_bank_accounts_bank_nomor")
      .on(t.namaBank, t.nomorRekening)
      .where(sql`${t.namaBank} IS NOT NULL AND ${t.nomorRekening} IS NOT NULL`),
    check(
      "ck_bank_accounts_rekening_bank_lengkap",
      sql`${t.jenis} <> 'BANK' OR (${t.namaBank} IS NOT NULL AND ${t.nomorRekening} IS NOT NULL)`,
    ),
  ],
);

export type RekeningBank = typeof bankAccounts.$inferSelect;
