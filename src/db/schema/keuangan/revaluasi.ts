import { boolean, date, index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { kolomAudit, kolomId, kolomWaktu, kurs, uang } from "./_helper";
import { chartOfAccounts } from "./akun";
import { currencies } from "./mata-uang";
import { journalEntries } from "./jurnal";

/**
 * Dokumen revaluasi valas akhir periode (PSAK 10 / IAS 21).
 * Menyesuaikan nilai buku akun-akun moneter berdenominasi valuta asing
 * (kas/bank valas, piutang valas, hutang valas) ke kurs penutupan akhir periode.
 */
export const currencyRevaluations = pgTable(
  "currency_revaluations",
  {
    id: kolomId(),
    nomor: varchar("nomor", { length: 30 }).notNull().unique(),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    keterangan: text("keterangan"),
    jurnalId: uuid("jurnal_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "restrict" }),
    jurnalBalikId: uuid("jurnal_balik_id").references(() => journalEntries.id, { onDelete: "restrict" }),
    totalLaba: uang("total_laba").notNull().default("0"),
    totalRugi: uang("total_rugi").notNull().default("0"),
    balikOtomatis: boolean("balik_otomatis").notNull().default(false),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [index("idx_currency_revaluations_tanggal").on(t.tanggal)],
);

/**
 * Rincian akun-akun valas yang direvaluasi pada suatu dokumen revaluasi kurs.
 */
export const currencyRevaluationLines = pgTable(
  "currency_revaluation_lines",
  {
    id: kolomId(),
    revaluasiId: uuid("revaluasi_id")
      .notNull()
      .references(() => currencyRevaluations.id, { onDelete: "cascade" }),
    akunId: uuid("akun_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    mataUangId: uuid("mata_uang_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    saldoValas: uang("saldo_valas").notNull(),
    kursBuku: kurs("kurs_buku").notNull(),
    saldoBukuIdr: uang("saldo_buku_idr").notNull(),
    kursBaru: kurs("kurs_baru").notNull(),
    saldoWajarIdr: uang("saldo_wajar_idr").notNull(),
    selisih: uang("selisih").notNull(),
    jenisSelisih: varchar("jenis_selisih", { length: 10 }).notNull(), // 'LABA' | 'RUGI'
    ...kolomWaktu,
  },
  (t) => [
    index("idx_currency_revaluation_lines_revaluasi").on(t.revaluasiId),
    index("idx_currency_revaluation_lines_akun").on(t.akunId),
  ],
);

export type RevaluasiKurs = typeof currencyRevaluations.$inferSelect;
export type BarisRevaluasiKurs = typeof currencyRevaluationLines.$inferSelect;
