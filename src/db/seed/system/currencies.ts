import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { currencies, exchangeRates } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export const DAFTAR_MATA_UANG = [
  { kode: "IDR", nama: "Rupiah Indonesia", simbol: "Rp", jumlahDesimal: 2, adalahMataUangDasar: true },
  { kode: "USD", nama: "Dolar Amerika Serikat", simbol: "$", jumlahDesimal: 2, adalahMataUangDasar: false },
  { kode: "EUR", nama: "Euro", simbol: "€", jumlahDesimal: 2, adalahMataUangDasar: false },
  { kode: "SGD", nama: "Dolar Singapura", simbol: "S$", jumlahDesimal: 2, adalahMataUangDasar: false },
  { kode: "JPY", nama: "Yen Jepang", simbol: "¥", jumlahDesimal: 0, adalahMataUangDasar: false },
  { kode: "CNY", nama: "Yuan Tiongkok", simbol: "¥", jumlahDesimal: 2, adalahMataUangDasar: false },
  { kode: "MYR", nama: "Ringgit Malaysia", simbol: "RM", jumlahDesimal: 2, adalahMataUangDasar: false },
  { kode: "AUD", nama: "Dolar Australia", simbol: "A$", jumlahDesimal: 2, adalahMataUangDasar: false },
];

export const KURS_BENCHMARK_AWAL: Record<string, string> = {
  USD: "16000.00000000",
  EUR: "17200.00000000",
  SGD: "12000.00000000",
  JPY: "105.00000000",
  CNY: "2200.00000000",
  MYR: "3600.00000000",
  AUD: "10500.00000000",
};

export async function seedCurrencies(db: Db) {
  console.log("  [system] Menanamkan mata uang global (IDR dasar, USD, EUR, SGD, dll)...");
  await db.insert(currencies).values(DAFTAR_MATA_UANG).onConflictDoNothing();

  const semuaMu = await db.select().from(currencies);
  const barisKurs: (typeof exchangeRates.$inferInsert)[] = [];

  for (const mu of semuaMu) {
    if (mu.adalahMataUangDasar) continue;
    const nilaiKurs = KURS_BENCHMARK_AWAL[mu.kode];
    if (nilaiKurs) {
      barisKurs.push({
        mataUangId: mu.id,
        tanggalBerlaku: "2026-01-01",
        kurs: nilaiKurs,
        sumber: "Benchmark Bank Indonesia",
        aktif: true,
      });
    }
  }

  if (barisKurs.length > 0) {
    await db
      .insert(exchangeRates)
      .values(barisKurs)
      .onConflictDoNothing({
        target: [exchangeRates.mataUangId, exchangeRates.tanggalBerlaku],
      });
  }
}
