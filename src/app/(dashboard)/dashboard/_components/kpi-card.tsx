import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPercent, formatRupiahCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Kpi } from "../_lib/types";
import { Sparkline } from "./sparkline";

function Delta({
  pct,
  positiveIsGood,
  label,
}: {
  pct: number;
  positiveIsGood: boolean;
  label: string;
}) {
  const up = pct >= 0;
  const good = up === positiveIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <p className="flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium tabular-nums",
          good ? "text-success" : "text-destructive",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {formatPercent(pct, { signed: true })}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </p>
  );
}

export function KpiCard({
  kpi,
  comparisonLabel,
}: {
  kpi: Kpi;
  comparisonLabel: string;
}) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5">
      <p className="text-[13px] text-muted-foreground">{kpi.label}</p>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-display text-2xl font-semibold tabular-nums tracking-tight">
            {formatRupiahCompact(kpi.value)}
          </p>
          <Delta
            pct={kpi.deltaPct}
            positiveIsGood={kpi.positiveIsGood}
            label={comparisonLabel}
          />
        </div>
        <Sparkline
          data={kpi.trend}
          className="h-9 w-24 shrink-0 text-primary"
        />
      </div>
    </article>
  );
}
