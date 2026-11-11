import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  smallint,
  uniqueIndex,
  uuid,
  varchar,
  boolean,
  pgTable,
} from "drizzle-orm/pg-core";
import { kolomAktif, kolomAudit, kolomId, kolomWaktu, kurs } from "./_helper";

/**
 * Master mata uang.
 * Tepat SATU baris boleh menjadi mata uang dasar (base currency), dijaga oleh
 * unique index parsial di bawah. Seed menetapkan IDR sebagai mata uang dasar.
 */
export const currencies = pgTable(
  "currencies",
  {
    id: kolomId(),
    kode: varchar("kode", { length: 3 }).notNull().unique(), // ISO 4217: IDR, USD, ...
    nama: varchar("nama", { length: 100 }).notNull(),
    simbol: varchar("simbol", { length: 10 }).notNull(),
    jumlahDesimal: smallint("jumlah_desimal").notNull().default(2),
    adalahMataUangDasar: boolean("adalah_mata_uang_dasar").notNull().default(false),
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_currencies_satu_mata_uang_dasar")
      .on(t.adalahMataUangDasar)
      .where(sql`${t.adalahMataUangDasar} = true`),
    check("ck_currencies_kode_iso", sql`${t.kode} ~ '^[A-Z]{3}$'`),
    check("ck_currencies_jumlah_desimal", sql`${t.jumlahDesimal} BETWEEN 0 AND 8`),
  ],
);

/**
 * Kurs historis terhadap mata uang dasar.
 * 1 satuan mata uang asing = `kurs` satuan mata uang dasar.
 * Kurs yang berlaku pada tanggal T = baris aktif terbaru dengan tanggal_berlaku <= T.
 * Mata uang dasar tidak punya baris kurs (selalu 1).
 */
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: kolomId(),
    mataUangId: uuid("mata_uang_id")
      .notNull()
      .references(() => currencies.id, { onDelete: "restrict" }),
    tanggalBerlaku: date("tanggal_berlaku", { mode: "string" }).notNull(),
    kurs: kurs("kurs").notNull(),
    sumber: varchar("sumber", { length: 100 }), // mis. "Bank Indonesia (JISDOR)", "Manual"
    aktif: kolomAktif(),
    ...kolomAudit,
    ...kolomWaktu,
  },
  (t) => [
    uniqueIndex("uq_exchange_rates_mata_uang_tanggal").on(t.mataUangId, t.tanggalBerlaku),
    index("idx_exchange_rates_pencarian").on(t.mataUangId, t.tanggalBerlaku.desc()),
    check("ck_exchange_rates_kurs_positif", sql`${t.kurs} > 0`),
  ],
);

/**
 * Kolom wajib untuk SETIAP tabel transaksi (jurnal, faktur, pembayaran, dst.)
 * agar mendukung multi-currency:
 *  - mataUangId : mata uang dokumen transaksi
 *  - kurs       : kurs ke mata uang dasar saat transaksi (snapshot, 1 jika sama dengan dasar)
 *
 * Pemakaian di Phase 2 dst.:  pgTable("journal_entries", { ...kolomMataUangTransaksi(), ... })
 */
export const kolomMataUangTransaksi = () => ({
  mataUangId: uuid("mata_uang_id")
    .notNull()
    .references(() => currencies.id, { onDelete: "restrict" }),
  kurs: kurs("kurs").notNull().default("1"),
});
