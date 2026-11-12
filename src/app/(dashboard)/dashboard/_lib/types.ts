export type FinancialPosition = {
  aset: number;
  kewajiban: number;
  ekuitas: number;
};

export type Kpi = {
  id: "pendapatan" | "beban" | "laba" | "kas";
  label: string;
  value: number;
  /** Perubahan (%) dibanding periode pembanding. */
  deltaPct: number;
  /** Naik = baik? (false untuk beban) */
  positiveIsGood: boolean;
  trend: number[];
};

export type MonthlyPoint = {
  month: string;
  pendapatan: number;
  beban: number;
};

export type PendingTask = {
  id: string;
  title: string;
  count: number;
  href: string;
  tone: "warning" | "neutral";
};

export type DashboardSummary = {
  /** "sample" = data contoh (belum tersambung API). */
  source: "sample" | "live";
  updatedAt: string; // ISO
  periodLabel: string;
  comparisonLabel: string;
  position: FinancialPosition;
  kpis: Kpi[];
  monthly: MonthlyPoint[];
  tasks: PendingTask[];
};
