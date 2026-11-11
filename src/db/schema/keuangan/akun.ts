import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu } from "./_helper";
import { currencies } from "./mata-uang";
import {
  PERAN_SISTEM,
  PERAN_SISTEM_BANYAK_AKUN,
  PERAN_SISTEM_KE_TIPE,
  SALDO_NORMAL,
  TIPE_AKUN,
} from "./konstanta";

export const tipeAkunEnum = pgEnum("tipe_akun", TIPE_AKUN);
export const saldoNormalEnum = pgEnum("saldo_normal", SALDO_NORMAL);
export const peranSistemEnum = pgEnum("peran_sistem_akun", PERAN_SISTEM);

// Potongan SQL statis (dibangun dari konstanta, bukan input pengguna).
const kondisiPeranSesuaiTipe = Object.entries(PERAN_SISTEM_KE_TIPE)
  .map(([peran, tipe]) => `(peran_sistem = '${peran}' AND tipe_akun = '${tipe}')`)
  .join(" OR ");
const daftarPeranBanyakAkun = PERAN_SISTEM_BANYAK_AKUN.map((p) => `'${p}'`).join(", ");

/**
 * Bagan Akun (Chart of Accounts) hierarkis: induk -> anak (sub-akun).
 *
 *  - Akun header (bisa_diposting = false) hanya pengelompokan; tidak boleh menerima jurnal.
 *  - normal_balance mengikuti tipe akun (ASET/BEBAN = DEBIT; KEWAJIBAN/EKUITAS/PENDAPATAN = KREDIT)
 *    kecuali akun kontra (mis. Akumulasi Penyusutan, Retur Penjualan).
 *  - peran_sistem memetakan akun ke fungsi otomatis. Contoh penting: penjualan WAJIB
 *    masuk ke akun berperan PENDAPATAN_PENJUALAN (tipe PENDAPATAN), bukan LABA_DITAHAN (tipe EKUITAS);
 *    tipe peran dikunci oleh CHECK constraint di bawah.
 */
export const chartOfAccounts = pgTable(
  "chart_of_accounts",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 20 }).notNull().unique(),
    nama: varchar("nama", { length: 150 }).notNull(),
    tipeAkun: tipeAkunEnum("tipe_akun").notNull(),
    normalBalance: saldoNormalEnum("normal_balance").notNull(),
    indukId: uuid("induk_id").references((): AnyPgColumn => chartOfAccounts.id, {
      onDelete: "restrict",
    }),
    level: smallint("level").notNull().default(1),
    bisaDiposting: boolean("bisa_diposting").notNull().default(true),
    adalahAkunKontra: boolean("adalah_akun_kontra").notNull().default(false),
    peranSistem: peranSistemEnum("peran_sistem"),
    mataUangId: uuid("mata_uang_id").references(() => currencies.id, { onDelete: "restrict" }),
    keterangan: text("keterangan"),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    index("idx_chart_of_accounts_induk").on(t.indukId),
    index("idx_chart_of_accounts_tipe").on(t.tipeAkun),
    // Peran bersifat tunggal (satu akun per peran) kecuali KAS_BANK dan PERSEDIAAN.
    uniqueIndex("uq_chart_of_accounts_peran_tunggal")
      .on(t.peranSistem)
      .where(
        sql.raw(`peran_sistem IS NOT NULL AND peran_sistem NOT IN (${daftarPeranBanyakAkun})`),
      ),
    check(
      "ck_chart_of_accounts_saldo_normal_sesuai_tipe",
      sql.raw(
        `adalah_akun_kontra OR ` +
          `(tipe_akun IN ('ASET', 'BEBAN') AND normal_balance = 'DEBIT') OR ` +
          `(tipe_akun IN ('KEWAJIBAN', 'EKUITAS', 'PENDAPATAN') AND normal_balance = 'KREDIT')`,
      ),
    ),
    check(
      "ck_chart_of_accounts_peran_sesuai_tipe",
      sql.raw(`peran_sistem IS NULL OR ${kondisiPeranSesuaiTipe}`),
    ),
    check(
      "ck_chart_of_accounts_peran_hanya_akun_detail",
      sql.raw(`peran_sistem IS NULL OR bisa_diposting`),
    ),
    check("ck_chart_of_accounts_bukan_induk_sendiri", sql`${t.indukId} IS DISTINCT FROM ${t.id}`),
    check("ck_chart_of_accounts_level_positif", sql`${t.level} >= 1`),
  ],
);

export type Akun = typeof chartOfAccounts.$inferSelect;
export type AkunBaru = typeof chartOfAccounts.$inferInsert;
