import type { DashboardSummary, Kpi } from "../_lib/types";

// Satuan data contoh: juta rupiah (integer) agar tidak ada galat pecahan.
const JUTA = 1_000_000;
const MONTHS = [
  "Nov",
  "Des",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
];
const PENDAPATAN = [
  3420, 3180, 3050, 3310, 3620, 3740, 3900, 4050, 4120, 4310, 4220, 4480,
];
const BEBAN = [
  2610, 2580, 2490, 2710, 2840, 2920, 3050, 3120, 3340, 3410, 3380, 3520,
];
const KAS = [
  6100, 6000, 5800, 6300, 6600, 6900, 7100, 7000, 7400, 7800, 8000, 8300,
];

const toRupiah = (series: number[]) => series.map((v) => v * JUTA);
const pctChange = (series: number[]) => {
  const prev = series.at(-2) ?? 0;
  const last = series.at(-1) ?? 0;
  return prev === 0 ? 0 : ((last - prev) / Math.abs(prev)) * 100;
};

function buildKpi(
  id: Kpi["id"],
  label: string,
  series: number[],
  positiveIsGood = true,
): Kpi {
  return {
    id,
    label,
    value: series.at(-1) ?? 0,
    deltaPct: pctChange(series),
    positiveIsGood,
    trend: series,
  };
}

/**
 * Satu-satunya pintu data dashboard.
 * TODO: ganti isi fungsi ini dengan fetch ke API Elysia (/api/keuangan/...),
 * lalu petakan ke `DashboardSummary`. Komponen UI tidak perlu diubah.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const pendapatan = toRupiah(PENDAPATAN);
  const beban = toRupiah(BEBAN);
  const laba = pendapatan.map((v, i) => v - (beban[i] ?? 0));

  return {
    source: "sample",
    updatedAt: new Date().toISOString(),
    periodLabel: "Triwulan IV 2026",
    comparisonLabel: "vs September",
    position: {
      aset: 48_250 * JUTA,
      kewajiban: 17_900 * JUTA,
      ekuitas: 30_350 * JUTA,
    },
    kpis: [
      buildKpi("pendapatan", "Pendapatan Oktober", pendapatan),
      buildKpi("beban", "Beban operasional", beban, false),
      buildKpi("laba", "Laba bersih", laba),
      buildKpi("kas", "Kas dan setara kas", toRupiah(KAS)),
    ],
    monthly: MONTHS.map((month, i) => ({
      month,
      pendapatan: pendapatan[i] ?? 0,
      beban: beban[i] ?? 0,
    })),
    tasks: [
      {
        id: "draf",
        title: "Draf laporan menunggu review",
        count: 3,
        href: "/laporan/draf",
        tone: "warning",
      },
      {
        id: "rekon",
        title: "Transaksi bank belum direkonsiliasi",
        count: 12,
        href: "/rekonsiliasi",
        tone: "warning",
      },
      {
        id: "adj",
        title: "Jurnal penyesuaian belum diposting",
        count: 5,
        href: "/jurnal/penyesuaian",
        tone: "neutral",
      },
    ],
  };
}
