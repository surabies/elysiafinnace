import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { fiscalPeriods } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/**
 * Menyiapkan periode fiskal bulanan 1 tahun penuh berjalan (Desember 2025 s/d Desember 2026).
 * Seluruh periode ditandai TERBUKA agar jurnal dan transaksi historis dapat diposting.
 */
export async function seedDemoPeriods(db: Db) {
  console.log("  [demo] Menyiapkan kalender periode fiskal 14 bulan (2025-11 s/d 2026-12)...");

  const DAFTAR_PERIODE = [
    { kode: "2025-11", tahun: 2025, bulan: 11, tanggalMulai: "2025-11-01", tanggalSelesai: "2025-11-30", status: "TERBUKA" as const },
    { kode: "2025-12", tahun: 2025, bulan: 12, tanggalMulai: "2025-12-01", tanggalSelesai: "2025-12-31", status: "TERBUKA" as const },
    { kode: "2026-01", tahun: 2026, bulan: 1, tanggalMulai: "2026-01-01", tanggalSelesai: "2026-01-31", status: "TERBUKA" as const },
    { kode: "2026-02", tahun: 2026, bulan: 2, tanggalMulai: "2026-02-01", tanggalSelesai: "2026-02-28", status: "TERBUKA" as const },
    { kode: "2026-03", tahun: 2026, bulan: 3, tanggalMulai: "2026-03-01", tanggalSelesai: "2026-03-31", status: "TERBUKA" as const },
    { kode: "2026-04", tahun: 2026, bulan: 4, tanggalMulai: "2026-04-01", tanggalSelesai: "2026-04-30", status: "TERBUKA" as const },
    { kode: "2026-05", tahun: 2026, bulan: 5, tanggalMulai: "2026-05-01", tanggalSelesai: "2026-05-31", status: "TERBUKA" as const },
    { kode: "2026-06", tahun: 2026, bulan: 6, tanggalMulai: "2026-06-01", tanggalSelesai: "2026-06-30", status: "TERBUKA" as const },
    { kode: "2026-07", tahun: 2026, bulan: 7, tanggalMulai: "2026-07-01", tanggalSelesai: "2026-07-31", status: "TERBUKA" as const },
    { kode: "2026-08", tahun: 2026, bulan: 8, tanggalMulai: "2026-08-01", tanggalSelesai: "2026-08-31", status: "TERBUKA" as const },
    { kode: "2026-09", tahun: 2026, bulan: 9, tanggalMulai: "2026-09-01", tanggalSelesai: "2026-09-30", status: "TERBUKA" as const },
    { kode: "2026-10", tahun: 2026, bulan: 10, tanggalMulai: "2026-10-01", tanggalSelesai: "2026-10-31", status: "TERBUKA" as const },
    { kode: "2026-11", tahun: 2026, bulan: 11, tanggalMulai: "2026-11-01", tanggalSelesai: "2026-11-30", status: "TERBUKA" as const },
    { kode: "2026-12", tahun: 2026, bulan: 12, tanggalMulai: "2026-12-01", tanggalSelesai: "2026-12-31", status: "TERBUKA" as const },
  ];

  for (const p of DAFTAR_PERIODE) {
    await db.insert(fiscalPeriods).values(p).onConflictDoNothing({ target: fiscalPeriods.kode });
  }
}
