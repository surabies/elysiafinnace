import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { kolomAudit, kolomId, kolomWaktu } from "./_helper";
import { STATUS_PERIODE } from "./konstanta";

export const statusPeriodeEnum = pgEnum("status_periode", STATUS_PERIODE);

/**
 * Periode akuntansi bulanan. Jurnal hanya boleh diposting ke periode TERBUKA.
 * Periode dibuat otomatis saat pertama kali ada posting pada bulan tsb.
 */
export const fiscalPeriods = pgTable(
  "fiscal_periods",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 7 }).notNull().unique(), // "2026-11"
    tahun: smallint("tahun").notNull(),
    bulan: smallint("bulan").notNull(),
    tanggalMulai: date("tanggal_mulai", { mode: "string" }).notNull(),
    tanggalSelesai: date("tanggal_selesai", { mode: "string" }).notNull(),
    status: statusPeriodeEnum("status").notNull().default("TERBUKA"),
    ditutupOleh: text("ditutup_oleh"),
    ditutupPada: timestamp("ditutup_pada", { withTimezone: true }),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_fiscal_periods_tahun_bulan").on(t.tahun, t.bulan),
    check("ck_fiscal_periods_bulan", sql`${t.bulan} BETWEEN 1 AND 12`),
    check("ck_fiscal_periods_rentang", sql`${t.tanggalMulai} <= ${t.tanggalSelesai}`),
  ],
);

/**
 * Penomoran dokumen berurutan per prefiks & tahun (JU/2026/00001, dst.).
 * Dinaikkan dengan INSERT ... ON CONFLICT DO UPDATE sehingga aman dari race condition.
 */
export const documentSequences = pgTable(
  "document_sequences",
  {
    prefiks: varchar("prefiks", { length: 10 }).notNull(),
    tahun: smallint("tahun").notNull(),
    nilaiTerakhir: integer("nilai_terakhir").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.prefiks, t.tahun], name: "pk_document_sequences" })],
);

export type Periode = typeof fiscalPeriods.$inferSelect;
