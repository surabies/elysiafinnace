import type { Metadata } from "next";
import { Suspense } from "react";
import { Reveal } from "@/app/(dashboard)/dashboard/_components/reveal";
import { requireSession } from "@/lib/session";
import { BankAccountsCard } from "./_components/bank-accounts-card";
import { CashflowRunwayCard } from "./_components/cashflow-runway-card";
import { DashboardHeader } from "./_components/dashboard-header";
import { getDashboardSummary } from "./_components/get-dashboard-summary";
import { RecentJournals } from "./_components/recent-journals";

export const metadata: Metadata = { title: "Dashboard Keuangan & Akuntansi | Elysia Finance" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6 animate-pulse">
      {/* 4 Kartu KPI Finansial Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-38 rounded-2xl bg-muted" />
        ))}
      </div>
      {/* Chart Arus Kas & Target Laba Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-88 rounded-2xl bg-muted lg:col-span-2" />
        <div className="h-88 rounded-2xl bg-muted" />
      </div>
      {/* Middle 2-Column Enterprise Cards Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </div>
      {/* Aktivitas Jurnal Akuntansi Skeleton */}
      <div className="h-72 rounded-2xl bg-muted" />
    </div>
  );
}

async function DashboardContent() {
  await requireSession();
  const summary = await getDashboardSummary();

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* Hero Financial Header: 4 Card KPI Smooth Area Sparklines, 7D/30D/90D Chart & Gauge */}
      <Reveal index={0}>
        <DashboardHeader summary={summary} />
      </Reveal>

      {/* Enterprise Widgets: Likuiditas Kas & Bank + Working Capital Runway */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal index={1} className="h-full">
          <BankAccountsCard accounts={summary.bankAccounts} />
        </Reveal>
        <Reveal index={2} className="h-full">
          <CashflowRunwayCard
            piutang={summary.agingPiutang}
            hutang={summary.agingHutang}
          />
        </Reveal>
      </div>

      {/* Audit Trail: Aktivitas Jurnal Penyesuaian Terakhir */}
      {summary.journalActivity && (
        <Reveal index={3}>
          <RecentJournals activity={summary.journalActivity} />
        </Reveal>
      )}
    </div>
  );
}
