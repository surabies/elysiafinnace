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

export type BankAccountSummary = {
  id: string;
  kode: string;
  nama: string;
  jenis: "KAS" | "BANK";
  namaBank?: string | null;
  nomorRekening?: string | null;
  kodeMataUang: string;
  saldo?: string;
  kodeAkunCoa?: string;
  namaAkunCoa?: string;
};

export type AgingBucketSummary = {
  current: string;
  hari1_30: string;
  hari31_60: string;
  hari61_90: string;
  hari90Plus: string;
  total: string;
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
  bankAccounts: BankAccountSummary[];
  agingPiutang: AgingBucketSummary | null;
  agingHutang: AgingBucketSummary | null;
};
