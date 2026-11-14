export type Kpi = {
  id: "pendapatan" | "beban" | "laba" | "kas";
  label: string;
  value: string;
  /** Perubahan (%) dibanding periode pembanding. */
  deltaPct: number;
  /** Naik = baik? (false untuk beban) */
  positiveIsGood: boolean;
  trend: { period: string; value: string }[];
};

export type FinancialTrendPoint = {
  date: string;
  pendapatan: number;
  beban: number;
  transactionCount: number;
};

export type FinancialHourlyTrendPoint = {
  hour: number;
  pendapatan: number;
  beban: number;
  transactionCount: number;
};

export type DashboardJournalActivity = {
  entries: {
    id: string;
    nomor: string;
    tanggal: string;
    deskripsi: string;
    total: string;
  }[];
  draftCount: number;
};

export type DashboardSummary = {
  /** Sumber data grafik utama. */
  source: "sample" | "live";
  asOfDate: string;
  comparisonLabel: string;
  kpis: Kpi[];
  trend: FinancialTrendPoint[];
  hourlyTrend: FinancialHourlyTrendPoint[];
  journalActivity: DashboardJournalActivity | null;
};
