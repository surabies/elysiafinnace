import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { budgetLines, budgets, chartOfAccounts, departments } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export async function seedDemoBudgets(db: Db) {
  console.log("  [demo] Menyiapkan target Anggaran Keuangan Tahunan 2026 per Departemen...");

  const [deptKeu] = await db.select({ id: departments.id }).from(departments).where(eq(departments.kode, "KEU"));

  const getAkunId = async (kode: string) => {
    const res = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(eq(chartOfAccounts.kode, kode));
    return res[0]?.id;
  };

  const idPenjualan = await getAkunId("4100");
  const idHpp = await getAkunId("5100");
  const idGaji = await getAkunId("6100");
  const idSewa = await getAkunId("6200");
  const idUtilitas = await getAkunId("6300");
  const idPemasaran = await getAkunId("6400");

  if (!idPenjualan || !idHpp || !idGaji || !idSewa || !idUtilitas || !idPemasaran) {
    return;
  }

  // 1. Header Anggaran Induk 2026
  const KODE_ANGGARAN = "BG-2026-ENN";
  await db
    .insert(budgets)
    .values({
      nomor: KODE_ANGGARAN,
      nama: "Rencana Kerja & Anggaran Perusahaan (RKAP) Tahun 2026",
      tahun: 2026,
      departemenId: deptKeu?.id,
      status: "DISETUJUI",
      totalAnggaran: "5650000000.0000",
      keterangan: "Target operasional dan laba rugi disetujui RUPS Tahunan 2026",
      disetujuiOleh: "Direktur Utama",
      disetujuiPada: new Date("2025-12-28T09:00:00Z"),
    })
    .onConflictDoNothing({ target: budgets.nomor });

  const [anggaran] = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(eq(budgets.nomor, KODE_ANGGARAN));

  if (!anggaran) return;

  // 2. Baris Rincian Anggaran Bulanan (12 Bulan 2026-01 s/d 2026-12)
  const BULAN_2026 = [
    "2026-01", "2026-02", "2026-03", "2026-04",
    "2026-05", "2026-06", "2026-07", "2026-08",
    "2026-09", "2026-10", "2026-11", "2026-12",
  ];

  for (let i = 0; i < BULAN_2026.length; i++) {
    const periode = BULAN_2026[i]!;
    // Target penjualan naik bertahap dari 280jt ke 420jt
    const targetJual = (280000000 + i * 12000000).toFixed(4);
    const targetHpp = (170000000 + i * 7000000).toFixed(4);

    await db
      .insert(budgetLines)
      .values([
        {
          anggaranId: anggaran.id,
          akunId: idPenjualan,
          periode,
          jumlah: targetJual,
          keterangan: `Target Pendapatan Penjualan ${periode}`,
        },
        {
          anggaranId: anggaran.id,
          akunId: idHpp,
          periode,
          jumlah: targetHpp,
          keterangan: `Pagu Beban HPP ${periode}`,
        },
        {
          anggaranId: anggaran.id,
          akunId: idGaji,
          periode,
          jumlah: "48000000.0000",
          keterangan: `Pagu Payroll & Gaji Staf ${periode}`,
        },
        {
          anggaranId: anggaran.id,
          akunId: idSewa,
          periode,
          jumlah: "20000000.0000",
          keterangan: `Sewa Kantor SCBD & Gudang ${periode}`,
        },
        {
          anggaranId: anggaran.id,
          akunId: idUtilitas,
          periode,
          jumlah: "5500000.0000",
          keterangan: `Utilitas Listrik, Air & Internet ${periode}`,
        },
        {
          anggaranId: anggaran.id,
          akunId: idPemasaran,
          periode,
          jumlah: "15000000.0000",
          keterangan: `Alokasi Digital Ads & Promosi ${periode}`,
        },
      ])
      .onConflictDoNothing();
  }
}
