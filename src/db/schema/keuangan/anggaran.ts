import {
  check,
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
import { sql } from "drizzle-orm";
import { kolomAudit, kolomId, kolomWaktu, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { STATUS_ANGGARAN } from "./konstanta";
import { branches, departments, projects } from "./dimensi";

export const statusAnggaranEnum = pgEnum("status_anggaran", STATUS_ANGGARAN);

/**
 * Header Anggaran Keuangan (Budgeting).
 * Menetapkan target pendapatan dan batas beban untuk suatu tahun fiskal,
 * dapat dispesifikasikan per cabang, departemen, atau proyek.
 */
export const budgets = pgTable(
  "budgets",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    tahun: smallint("tahun").notNull(),
    cabangId: uuid("cabang_id").references(() => branches.id, { onDelete: "set null" }),
    departemenId: uuid("departemen_id").references(() => departments.id, { onDelete: "set null" }),
    proyekId: uuid("proyek_id").references(() => projects.id, { onDelete: "set null" }),
    status: statusAnggaranEnum("status").notNull().default("DRAFT"),
    totalAnggaran: uang("total_anggaran").notNull().default("0"),
    keterangan: text("keterangan"),
    disetujuiOleh: text("disetujui_oleh"),
    disetujuiPada: timestamp("disetujui_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_budgets_tahun").on(t.tahun),
    index("idx_budgets_status").on(t.status),
    index("idx_budgets_cabang").on(t.cabangId),
    index("idx_budgets_departemen").on(t.departemenId),
    index("idx_budgets_proyek").on(t.proyekId),
    check("ck_budgets_total_positif", sql`${t.totalAnggaran} >= 0`),
  ],
);

/**
 * Rincian Baris Anggaran per Akun COA dan Periode Bulanan (YYYY-MM).
 */
export const budgetLines = pgTable(
  "budget_lines",
  {
    id: kolomId(),
    anggaranId: uuid("anggaran_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    akunId: uuid("akun_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    periode: varchar("periode", { length: 7 }).notNull(), // Format: YYYY-MM
    jumlah: uang("jumlah").notNull().default("0"),
    keterangan: text("keterangan"),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_budget_lines_anggaran_akun_periode").on(t.anggaranId, t.akunId, t.periode),
    index("idx_budget_lines_anggaran").on(t.anggaranId),
    index("idx_budget_lines_akun").on(t.akunId),
    index("idx_budget_lines_periode").on(t.periode),
    check("ck_budget_lines_jumlah_positif", sql`${t.jumlah} >= 0`),
  ],
);

export type Anggaran = typeof budgets.$inferSelect;
export type BarisAnggaran = typeof budgetLines.$inferSelect;
