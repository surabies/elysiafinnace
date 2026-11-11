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
import { kolomAudit, kolomId, kolomWaktu, kurs, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { bankAccounts } from "./bank";
import { STATUS_JURNAL, STATUS_REKONSILIASI, SUMBER_JURNAL } from "./konstanta";
import { partners } from "./kontak";
import { currencies, kolomMataUangTransaksi } from "./mata-uang";
import { fiscalPeriods } from "./periode";

export const statusJurnalEnum = pgEnum("status_jurnal", STATUS_JURNAL);
export const sumberJurnalEnum = pgEnum("sumber_jurnal", SUMBER_JURNAL);
export const statusRekonsiliasiEnum = pgEnum("status_rekonsiliasi", STATUS_REKONSILIASI);

/**
 * Header Jurnal Umum (mesin double-entry).
 *
 *  - Hanya jurnal POSTED yang masuk Buku Besar & laporan.
 *  - total_debit = total_kredit (dalam mata uang dasar) dijaga oleh service
 *    DAN oleh CHECK constraint di bawah sebagai pertahanan terakhir.
 *  - Jurnal POSTED tidak boleh diubah/dihapus; koreksi dengan jurnal pembalik.
 */
export const journalEntries = pgTable(
  "journal_entries",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    periodeId: uuid("periode_id").references(() => fiscalPeriods.id, { onDelete: "restrict" }),
    referensi: varchar("referensi", { length: 100 }),
    deskripsi: text("deskripsi").notNull(),
    status: statusJurnalEnum("status").notNull().default("DRAFT"),
    sumber: sumberJurnalEnum("sumber").notNull().default("MANUAL"),
    /** ID dokumen asal (faktur, biaya, pembayaran, dst.) untuk jurnal otomatis. */
    sumberId: uuid("sumber_id"),
    ...kolomMataUangTransaksi(),
    /** Total dalam mata uang dasar. */
    totalDebit: uang("total_debit").notNull().default("0"),
    totalKredit: uang("total_kredit").notNull().default("0"),
    /** Jurnal pembalik yang menetralkan jurnal ini (jika sudah dibalik). */
    dibalikOlehId: uuid("dibalik_oleh_id").references((): AnyPgColumn => journalEntries.id, {
      onDelete: "restrict",
    }),
    /** Untuk jurnal PEMBALIK: jurnal asli yang dibalik. */
    membalikJurnalId: uuid("membalik_jurnal_id").references((): AnyPgColumn => journalEntries.id, {
      onDelete: "restrict",
    }),
    dipostingOleh: text("diposting_oleh"),
    dipostingPada: timestamp("diposting_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_journal_entries_tanggal").on(t.tanggal),
    index("idx_journal_entries_status_tanggal").on(t.status, t.tanggal),
    index("idx_journal_entries_sumber").on(t.sumber, t.sumberId),
    check("ck_journal_entries_seimbang", sql`${t.status} <> 'POSTED' OR ${t.totalDebit} = ${t.totalKredit}`),
    check("ck_journal_entries_total_tidak_negatif", sql`${t.totalDebit} >= 0 AND ${t.totalKredit} >= 0`),
  ],
);

/**
 * Rekonsiliasi bank: mencocokkan baris jurnal akun kas/bank dengan rekening koran.
 */
export const bankReconciliations = pgTable(
  "bank_reconciliations",
  {
    id: kolomId(),
    rekeningBankId: uuid("rekening_bank_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "restrict" }),
    tanggalLaporan: date("tanggal_laporan", { mode: "string" }).notNull(),
    /** Saldo akhir menurut rekening koran (mata uang rekening). */
    saldoLaporanBank: uang("saldo_laporan_bank").notNull(),
    /** Saldo buku dari baris yang sudah dicocokkan (mata uang rekening). */
    saldoBukuTercocok: uang("saldo_buku_tercocok").notNull().default("0"),
    selisih: uang("selisih").notNull().default("0"),
    status: statusRekonsiliasiEnum("status").notNull().default("DRAFT"),
    catatan: text("catatan"),
    diselesaikanOleh: text("diselesaikan_oleh"),
    diselesaikanPada: timestamp("diselesaikan_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_bank_reconciliations_rekening").on(t.rekeningBankId, t.tanggalLaporan),
    check("ck_bank_reconciliations_selesai_seimbang", sql`${t.status} <> 'SELESAI' OR ${t.selisih} = 0`),
  ],
);

/**
 * Baris Jurnal. Setiap baris hanya bersisi DEBIT atau KREDIT (tidak keduanya).
 *  - debit/kredit       : dalam mata uang baris (mata_uang_id) dengan kurs snapshot
 *  - debit_dasar/kredit_dasar : hasil konversi ke mata uang dasar (dipakai Buku Besar & laporan)
 */
export const journalItems = pgTable(
  "journal_items",
  {
    id: kolomId(),
    jurnalId: uuid("jurnal_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    urutan: smallint("urutan").notNull(),
    akunId: uuid("akun_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    kontakId: uuid("kontak_id").references(() => partners.id, { onDelete: "restrict" }),
    deskripsi: text("deskripsi"),
    debit: uang("debit").notNull().default("0"),
    kredit: uang("kredit").notNull().default("0"),
    mataUangId: uuid("mata_uang_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    kurs: kurs("kurs").notNull().default("1"),
    debitDasar: uang("debit_dasar").notNull().default("0"),
    kreditDasar: uang("kredit_dasar").notNull().default("0"),
    /** Diisi saat baris kas/bank dicocokkan pada rekonsiliasi bank. */
    rekonsiliasiId: uuid("rekonsiliasi_id").references(() => bankReconciliations.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("idx_journal_items_jurnal").on(t.jurnalId),
    index("idx_journal_items_akun").on(t.akunId),
    index("idx_journal_items_rekonsiliasi").on(t.rekonsiliasiId),
    check("ck_journal_items_tidak_negatif", sql`${t.debit} >= 0 AND ${t.kredit} >= 0 AND ${t.debitDasar} >= 0 AND ${t.kreditDasar} >= 0`),
    check("ck_journal_items_satu_sisi", sql`(${t.debit} = 0) <> (${t.kredit} = 0)`),
    check("ck_journal_items_kurs_positif", sql`${t.kurs} > 0`),
  ],
);

/** Riwayat tutup buku tahunan (jurnal penutup: Pendapatan & Beban -> Laba Ditahan). */
export const yearEndClosings = pgTable(
  "year_end_closings",
  {
    id: kolomId(),
    tahun: smallint("tahun").notNull(),
    jurnalId: uuid("jurnal_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "restrict" }),
    labaBersih: uang("laba_bersih").notNull(),
    aktif: boolean("aktif").notNull().default(true),
    dibatalkanOleh: text("dibatalkan_oleh"),
    dibatalkanPada: timestamp("dibatalkan_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [uniqueIndex("uq_year_end_closings_tahun_aktif").on(t.tahun).where(sql`${t.aktif} = true`)],
);

export type JurnalUmum = typeof journalEntries.$inferSelect;
export type BarisJurnal = typeof journalItems.$inferSelect;
