import { sql } from "drizzle-orm";
import { check, date, index, pgEnum, pgTable, smallint, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { kolomAudit, kolomId, kolomWaktu, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { bankAccounts } from "./bank";
import { JENIS_MUTASI_BANK, METODE_BAYAR_BIAYA, STATUS_DOKUMEN } from "./konstanta";
import { partners } from "./kontak";
import { journalEntries } from "./jurnal";
import { kolomMataUangTransaksi } from "./mata-uang";

export const statusDokumenEnum = pgEnum("status_dokumen", STATUS_DOKUMEN);
export const metodeBayarBiayaEnum = pgEnum("metode_bayar_biaya", METODE_BAYAR_BIAYA);
export const jenisMutasiBankEnum = pgEnum("jenis_mutasi_bank", JENIS_MUTASI_BANK);

/** Kolom dokumen transaksi bersama (status + jurnal hasil posting). */
export const kolomDokumen = () => ({
  status: statusDokumenEnum("status").notNull().default("DRAFT"),
  jurnalId: uuid("jurnal_id").references(() => journalEntries.id, { onDelete: "restrict" }),
  dipostingOleh: text("diposting_oleh"),
  dipostingPada: timestamp("diposting_pada", { withTimezone: true }),
});

/**
 * Biaya operasional. Saat diposting otomatis menjurnal:
 *   (Dr) Akun Beban per baris  [+ (Dr) PPN Masukan]
 *   (Cr) Kas/Bank (metode TUNAI)  atau  (Cr) Hutang Usaha (metode HUTANG, menjadi tagihan pemasok)
 */
export const expenses = pgTable(
  "expenses",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "restrict" }),
    metodeBayar: metodeBayarBiayaEnum("metode_bayar").notNull().default("TUNAI"),
    rekeningBankId: uuid("rekening_bank_id").references(() => bankAccounts.id, { onDelete: "restrict" }),
    tanggalJatuhTempo: date("tanggal_jatuh_tempo", { mode: "string" }),
    referensi: varchar("referensi", { length: 100 }),
    deskripsi: text("deskripsi").notNull(),
    ...kolomMataUangTransaksi(),
    subtotal: uang("subtotal").notNull().default("0"),
    ppn: uang("ppn").notNull().default("0"),
    total: uang("total").notNull().default("0"),
    /** Sisa hutang yang belum dibayar (hanya metode HUTANG). */
    sisaTagihan: uang("sisa_tagihan").notNull().default("0"),
    ...kolomDokumen(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_expenses_tanggal").on(t.tanggal),
    check(
      "ck_expenses_metode_lengkap",
      sql`(${t.metodeBayar} = 'TUNAI' AND ${t.rekeningBankId} IS NOT NULL) OR (${t.metodeBayar} = 'HUTANG' AND ${t.kontakId} IS NOT NULL)`,
    ),
    check("ck_expenses_nilai", sql`${t.subtotal} >= 0 AND ${t.ppn} >= 0 AND ${t.sisaTagihan} >= 0 AND ${t.sisaTagihan} <= ${t.total}`),
  ],
);

export const expenseItems = pgTable(
  "expense_items",
  {
    id: kolomId(),
    biayaId: uuid("biaya_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    urutan: smallint("urutan").notNull(),
    akunBebanId: uuid("akun_beban_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    deskripsi: text("deskripsi"),
    jumlah: uang("jumlah").notNull(),
  },
  (t) => [index("idx_expense_items_biaya").on(t.biayaId), check("ck_expense_items_jumlah", sql`${t.jumlah} > 0`)],
);

/**
 * Mutasi kas/bank langsung (di luar faktur & biaya):
 *   MASUK    : (Dr) Kas/Bank      (Cr) akun lawan
 *   KELUAR   : (Dr) akun lawan    (Cr) Kas/Bank
 *   TRANSFER : (Dr) Kas/Bank tujuan (Cr) Kas/Bank asal  (mata uang kedua rekening harus sama)
 */
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    jenis: jenisMutasiBankEnum("jenis").notNull(),
    rekeningBankId: uuid("rekening_bank_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "restrict" }),
    rekeningTujuanId: uuid("rekening_tujuan_id").references(() => bankAccounts.id, { onDelete: "restrict" }),
    akunLawanId: uuid("akun_lawan_id").references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "restrict" }),
    referensi: varchar("referensi", { length: 100 }),
    deskripsi: text("deskripsi").notNull(),
    ...kolomMataUangTransaksi(),
    jumlah: uang("jumlah").notNull(),
    ...kolomDokumen(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_bank_transactions_rekening_tanggal").on(t.rekeningBankId, t.tanggal),
    check("ck_bank_transactions_jumlah", sql`${t.jumlah} > 0`),
    check(
      "ck_bank_transactions_lawan",
      sql`(${t.jenis} = 'TRANSFER' AND ${t.rekeningTujuanId} IS NOT NULL AND ${t.rekeningTujuanId} <> ${t.rekeningBankId}) OR (${t.jenis} <> 'TRANSFER' AND ${t.akunLawanId} IS NOT NULL)`,
    ),
  ],
);

export type Biaya = typeof expenses.$inferSelect;
export type MutasiBank = typeof bankTransactions.$inferSelect;
