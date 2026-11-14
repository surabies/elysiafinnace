import type { Metadata } from "next";
import { Suspense } from "react";
import { Reveal } from "@/app/(dashboard)/dashboard/_components/reveal";
import { requireSession } from "@/lib/session";
import { CashflowChart } from "./_components/cashflow-chart";
import { CashBalanceChart } from "./_components/cash-balance-chart";
import { KpiStrip } from "./_components/kpi-strip";
import { getDashboardSummary } from "./_components/get-dashboard-summary";
import { RecentJournals } from "./_components/recent-journals";

export const metadata: Metadata = { title: "Dashboard keuangan" };

/**
 * Halaman hanya merakit. Urutan `index` pada <Reveal> = urutan muncul saat load.
 * Ritme spasi: antar-seksi gap-6, antar-kartu gap-4.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-45 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="h-90 animate-pulse rounded-md bg-muted" />
          <div className="h-75 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="hidden h-90 animate-pulse rounded-md bg-muted xl:block" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  await requireSession();
  const summary = await getDashboardSummary();
  const cashKpi = summary.kpis.find((kpi) => kpi.id === "kas");
  if (!cashKpi) {
    throw new Error("Tren saldo kas tidak tersedia di ringkasan dashboard.");
  }

  // <div>, bukan <main>: SidebarInset di layout sudah merender <main>
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <KpiStrip kpis={summary.kpis} comparisonLabel={summary.comparisonLabel} />

      <div
        className={
          summary.journalActivity
            ? "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]"
            : "w-full min-w-0"
        }
      >
        <div className="flex min-w-0 flex-col gap-6">
          <Reveal index={4}>
            <CashflowChart
              data={summary.trend}
              hourlyData={summary.hourlyTrend}
              asOfDate={summary.asOfDate}
              isSample={summary.source === "sample"}
            />
          </Reveal>
          <Reveal index={5}>
            <CashBalanceChart trend={cashKpi.trend} />
          </Reveal>
        </div>
        {summary.journalActivity && (
          <Reveal index={6}>
            <RecentJournals activity={summary.journalActivity} />
          </Reveal>
        )}
      </div>
    </div>
  );
}
