import { boolean, date, index, pgTable, smallint, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, persen, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { journalEntries } from "./jurnal";
import { currencies } from "./mata-uang";

/**
 * Template Jurnal Umum (reusable journal preset).
 */
export const journalTemplates = pgTable(
  "journal_templates",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    deskripsi: text("deskripsi"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_journal_templates_nama").on(t.nama)],
);

/**
 * Baris rincian template jurnal.
 */
export const journalTemplateItems = pgTable(
  "journal_template_items",
  {
    id: kolomId(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => journalTemplates.id, { onDelete: "cascade" }),
    urutan: smallint("urutan").notNull().default(1),
    akunId: uuid("akun_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    posisi: varchar("posisi", { length: 10 }).notNull(), // 'DEBIT' | 'KREDIT'
    nominalDefault: uang("nominal_default").notNull().default("0"),
    persentase: persen("persentase").notNull().default("0"),
    deskripsi: text("deskripsi"),
    ...kolomWaktu,
  },
  (t) => [index("idx_journal_template_items_template").on(t.templateId)],
);

/**
 * Jadwal Jurnal Berulang (Recurring Journal).
 */
export const recurringJournals = pgTable(
  "recurring_journals",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    deskripsi: text("deskripsi").notNull(),
    frekuensi: varchar("frekuensi", { length: 20 }).notNull(), // 'HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN'
    tanggalMulai: date("tanggal_mulai", { mode: "string" }).notNull(),
    tanggalSelesai: date("tanggal_selesai", { mode: "string" }),
    tanggalBerikutnya: date("tanggal_berikutnya", { mode: "string" }).notNull(),
    templateId: uuid("template_id").references(() => journalTemplates.id, { onDelete: "restrict" }),
    mataUangId: uuid("mata_uang_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    totalDebit: uang("total_debit").notNull().default("0"),
    totalKredit: uang("total_kredit").notNull().default("0"),
    aktif: boolean("aktif").notNull().default(true),
    terakhirDipostingPada: timestamp("terakhir_diposting_pada", { withTimezone: true }),
    jurnalTerakhirId: uuid("jurnal_terakhir_id").references(() => journalEntries.id, { onDelete: "set null" }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_recurring_journals_jadwal").on(t.aktif, t.tanggalBerikutnya)],
);

export type TemplateJurnal = typeof journalTemplates.$inferSelect;
export type BarisTemplateJurnal = typeof journalTemplateItems.$inferSelect;
export type JurnalBerulang = typeof recurringJournals.$inferSelect;
