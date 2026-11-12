import type { Metadata } from "next";
import { Suspense } from "react";
import { Reveal } from "@/app/(dashboard)/dashboard/_components/reveal";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { ActionList } from "./_components/action-list";
import { CashflowChart } from "./_components/cashflow-chart";
import { EquationCard } from "./_components/equation-card";
import { KpiStrip } from "./_components/kpi-strip";
import { PageHeader } from "./_components/page-header";
import { QuickAccess } from "./_components/quick-access";
import { getDashboardSummary } from "../dashboard/_components/get-dashboard-summary";

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="h-16 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

async function DashboardContent() {
  const { user } = await requireSession();
  const summary = await getDashboardSummary();

  // <div>, bukan <main>: SidebarInset di layout sudah merender <main>
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Reveal index={0}>
        <PageHeader
          name={user.name}
          periodLabel={summary.periodLabel}
          updatedAt={summary.updatedAt}
          isSample={summary.source === "sample"}
        />
      </Reveal>

      <Reveal index={1}>
        <EquationCard
          position={summary.position}
          asOfLabel={formatDate(summary.updatedAt)}
        />
      </Reveal>

      <KpiStrip
        kpis={summary.kpis}
        comparisonLabel={summary.comparisonLabel}
        startIndex={2}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Reveal index={6} className="xl:col-span-2">
          <CashflowChart data={summary.monthly} />
        </Reveal>
        <Reveal index={7}>
          <ActionList tasks={summary.tasks} />
        </Reveal>
      </div>

      <Reveal index={8}>
        <QuickAccess />
      </Reveal>
    </div>
  );
}
