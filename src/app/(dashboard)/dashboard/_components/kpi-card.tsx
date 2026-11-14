"use client";

import { useMemo } from "react";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBuildingBank,
  IconMinus,
  IconReceipt,
  IconScale,
  IconTrendingUp,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import {
  AreaSparkline,
  BarSparkline,
  LineSparkline,
  useSparklineHover,
} from "@/components/charts/sparkline";
import { formatPercent, formatRupiah, formatRupiahCompact } from "@/lib/format";
import type { Kpi } from "../_lib/types";

type ChartStyle = "bar" | "line" | "area";

type MetricConfig = {
  title: string;
  icon: TablerIcon;
  helperText: string;
  color: string;
  chartStyle: ChartStyle;
};

const metricConfig: Record<Kpi["id"], MetricConfig> = {
  pendapatan: {
    title: "Pendapatan",
    icon: IconTrendingUp,
    helperText: "Pendapatan terposting",
    color: "#10b981", // Emerald-500
    chartStyle: "bar", // Volume bulanan diskrit
  },
  beban: {
    title: "Total Beban",
    icon: IconReceipt,
    helperText: "Beban & HPP terposting",
    color: "#f43f5e", // Rose-500
    chartStyle: "bar", // Volume bulanan diskrit
  },
  laba: {
    title: "Laba Bersih",
    icon: IconScale,
    helperText: "Selisih pendapatan & beban",
    color: "#6366f1", // Indigo-500
    chartStyle: "line", // Garis tren margin profitabilitas
  },
  kas: {
    title: "Kas & Setara Kas",
    icon: IconBuildingBank,
    helperText: "Total saldo kas & bank",
    color: "#0ea5e9", // Sky-500
    chartStyle: "area", // Level likuiditas kumulatif
  },
};

type TrendPoint = {
  period: string;
  value: number;
  formatted: string;
  fullFormatted: string;
};

export function KpiCard({
  kpi,
  comparisonLabel,
}: {
  kpi: Kpi;
  comparisonLabel: string;
}) {
  const config = metricConfig[kpi.id];
  const Icon = config.icon;

  const chartData: TrendPoint[] = useMemo(() => {
    return kpi.trend.map((t) => {
      const num = Number(t.value) || 0;
      return {
        period: t.period,
        value: num,
        formatted: formatRupiahCompact(t.value),
        fullFormatted: formatRupiah(t.value),
      };
    });
  }, [kpi.trend]);

  const hover = useSparklineHover<TrendPoint>();
  const activeDatum = hover.datum;
  const isHovered = hover.isHovering && activeDatum !== null;

  // Nilai reaktif saat di-hover vs idle
  const displayedValue = isHovered
    ? activeDatum.formatted
    : formatRupiahCompact(kpi.value);

  const displayedPeriod = isHovered ? activeDatum.period : "Periode ini";

  const improved =
    kpi.deltaPct === 0
      ? "neutral"
      : kpi.deltaPct > 0 === kpi.positiveIsGood
        ? "positive"
        : "negative";

  const DeltaIcon =
    kpi.deltaPct > 0
      ? IconArrowUpRight
      : kpi.deltaPct < 0
        ? IconArrowDownRight
        : IconMinus;

  const deltaStyle = {
    positive:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    negative:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    neutral: "bg-muted text-muted-foreground border-border",
  }[improved];

  return (
    <article className="group/card flex h-44.5 w-full flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card/85 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-foreground/20 hover:shadow-md">
      {/* Baris Atas: Judul, Ikon & Label Status Periode */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex size-6.5 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 transition-colors group-hover/card:bg-muted/80"
              style={{ color: config.color }}
            >
              <Icon className="size-3.5" aria-hidden />
            </div>
            <h3 className="truncate text-xs font-semibold tracking-tight text-foreground/90">
              {config.title}
            </h3>
          </div>

          <span
            className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-all ${
              isHovered
                ? "border border-primary/25 bg-primary/10 text-primary"
                : "bg-muted/50 text-muted-foreground"
            }`}
          >
            {displayedPeriod}
          </span>
        </div>

        {/* Angka Metrik Utama & Badge Delta Persentase */}
        <div className="mt-2 flex min-w-0 items-baseline justify-between gap-2">
          <div className="min-w-0">
            <span className="truncate font-display text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
              {displayedValue}
            </span>
          </div>

          <div
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${deltaStyle}`}
            title={`Perubahan dibanding ${comparisonLabel}`}
          >
            <DeltaIcon className="size-3" aria-hidden />
            <span>{formatPercent(kpi.deltaPct, { signed: true })}</span>
          </div>
        </div>

        {/* Subtitle Ringkas */}
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {isHovered ? (
            <span>
              Saldo {activeDatum.period}: {activeDatum.fullFormatted}
            </span>
          ) : (
            <span>
              {config.helperText} · {comparisonLabel}
            </span>
          )}
        </p>
      </div>

      {/* Sparkline bklit (Variatif: Bar, Line, atau Area sesuai jenis metrik) */}
      <div className="mt-auto pt-1.5">
        <div className="h-10 w-full">
          {config.chartStyle === "bar" && (
            <BarSparkline
              data={chartData}
              dataKey="value"
              height={40}
              color={config.color}
              barRadius={2}
              barGap={2}
              crosshair="dashed"
              dot={true}
              inactiveOpacity={0.35}
              animate={true}
              hoverTransition={true}
              {...hover.sparklineProps}
            />
          )}

          {config.chartStyle === "line" && (
            <LineSparkline
              data={chartData}
              dataKey="value"
              height={40}
              color={config.color}
              strokeWidth={2}
              curve="monotone"
              crosshair="dashed"
              dot={true}
              endDot={true}
              showHighlight={true}
              inactiveOpacity={0.4}
              animate={true}
              hoverTransition={true}
              springConfig={{ stiffness: 350, damping: 28 }}
              {...hover.sparklineProps}
            />
          )}

          {config.chartStyle === "area" && (
            <AreaSparkline
              data={chartData}
              dataKey="value"
              height={40}
              color={config.color}
              strokeWidth={2}
              curve="monotone"
              fill="gradient"
              fillOpacity={0.25}
              crosshair="dashed"
              dot={true}
              showHighlight={true}
              animate={true}
              hoverTransition={true}
              springConfig={{ stiffness: 350, damping: 28 }}
              {...hover.sparklineProps}
            />
          )}
        </div>
      </div>
    </article>
  );
}
