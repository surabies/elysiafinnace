"use client";

import * as React from "react";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBuildingBank,
  IconReceipt,
  IconScale,
  IconTargetArrow,
  IconTrendingUp,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/app/(dashboard)/dashboard/_lib/types";

// ============================================================================
// HOOK SAFE REDUCED MOTION (Mencegah mismatch hidrasi SSR & cascading render)
// ============================================================================

const noopSubscribe = () => () => {};

function useSafeReducedMotion() {
  const prefers = useReducedMotion();
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return mounted && !!prefers;
}

// ============================================================================
// TIPE DATA FINANSIAL
// ============================================================================

export interface FinancialDashboardDay {
  label: string;
  weekday: string;
  pendapatan: number;
  beban: number;
  laba: number;
  kas: number;
  transactionCount: number;
}

export type DashboardRange = 7 | 30 | 90;

export interface DashboardHeaderProps {
  days?: FinancialDashboardDay[];
  summary?: DashboardSummary;
  title?: string;
  dailyGoal?: number;
  defaultRange?: DashboardRange;
  className?: string;
}

export type MetricKey = "kas" | "pendapatan" | "beban" | "laba";

export const METRICS: {
  key: MetricKey;
  label: string;
  tone: string;
  icon: typeof IconBuildingBank;
  mode: "sum" | "latest";
  positiveIsGood: boolean;
}[] = [
  {
    key: "kas",
    label: "Kas & Setara Kas",
    tone: "text-sky-600 dark:text-sky-400",
    icon: IconBuildingBank,
    mode: "latest",
    positiveIsGood: true,
  },
  {
    key: "pendapatan",
    label: "Pendapatan Usaha",
    tone: "text-emerald-600 dark:text-emerald-400",
    icon: IconTrendingUp,
    mode: "sum",
    positiveIsGood: true,
  },
  {
    key: "beban",
    label: "Total Beban",
    tone: "text-rose-600 dark:text-rose-400",
    icon: IconReceipt,
    mode: "sum",
    positiveIsGood: false,
  },
  {
    key: "laba",
    label: "Laba Bersih",
    tone: "text-indigo-600 dark:text-indigo-400",
    icon: IconScale,
    mode: "sum",
    positiveIsGood: true,
  },
];

const revenueTone = METRICS[1]!.tone;
const settle = { type: "spring", stiffness: 300, damping: 34 } as const;

const ranges: { value: DashboardRange; label: string }[] = [
  { value: 7, label: "7 Hari" },
  { value: 30, label: "30 Hari" },
  { value: 90, label: "90 Hari" },
];

// ============================================================================
// GENERATOR DATA SAMPEL FINANSIAL INDONESIA (Rupiah Riil)
// ============================================================================

export function sampleFinancialDays(count = 180): FinancialDashboardDay[] {
  let seed = 20261115;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const end = Date.UTC(2026, 10, 15);
  let cumulativeKas = 38_500_000_000; // Rp 38,5 Miliar baseline
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(end - (count - 1 - i) * 86_400_000);
    const dow = date.getUTCDay();
    const trend = 1 + (i / count) * 0.35;
    const weekend = dow === 0 || dow === 6 ? 0.65 : 1;
    const wave = 1 + 0.12 * Math.sin(i / 8 + 1);

    const pendapatan = Math.round(
      28_000_000 * trend * weekend * wave * (0.92 + rand() * 0.16),
    );
    const beban = Math.round(pendapatan * (0.55 + rand() * 0.15));
    const laba = pendapatan - beban;
    cumulativeKas += laba * 0.3;

    return {
      label: date.toLocaleDateString("id-ID", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      weekday: date.toLocaleDateString("id-ID", {
        weekday: "short",
        timeZone: "UTC",
      }),
      pendapatan,
      beban,
      laba,
      kas: Math.round(cumulativeKas),
      transactionCount: Math.round(pendapatan / (1_500_000 + rand() * 500_000)),
    };
  });
}

const fallbackDays = sampleFinancialDays();

// ============================================================================
// FORMATTER RUPIAH CEPAT & KOMPAK
// ============================================================================

export function formatMoneyCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "")} T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`;
  }
  return `${sign}Rp ${Math.round(abs).toLocaleString("id-ID")}`;
}

export function formatMoneyFull(n: number): string {
  return `${n < 0 ? "-" : ""}Rp ${Math.round(Math.abs(n)).toLocaleString("id-ID")}`;
}

// ============================================================================
// KOMPONEN ANIMASI ANGKA BERGULIR (ROLL)
// ============================================================================

function Roll({
  text,
  className,
  instant,
}: {
  text: string;
  className?: string;
  instant?: boolean;
}) {
  const reduce = useSafeReducedMotion();
  const chars = text.split("");
  return (
    <span className={cn("inline-flex tabular-nums leading-[1.15em]", className)}>
      <span className="sr-only">{text}</span>
      {chars.map((char, i) => {
        const key = `${chars.length - i}-${char}`;
        if (!/\d/.test(char)) {
          return (
            <span aria-hidden key={`s${key}`}>
              {char}
            </span>
          );
        }
        return (
          <span
            aria-hidden
            className="relative inline-block h-[1.15em] w-[1ch] overflow-hidden"
            key={`d${key}`}
          >
            <motion.span
              animate={{ y: `${-Number(char) * 1.15}em` }}
              className="absolute inset-x-0 top-0 flex flex-col"
              initial={false}
              transition={reduce || instant ? { duration: 0 } : settle}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <span className="h-[1.15em] text-center" key={digit}>
                  {digit}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

// ============================================================================
// PATH GENERATOR KURVA HALUS (BEZIER)
// ============================================================================

function smoothPath(points: [number, number][]) {
  if (points.length < 2) return "";
  const first = points[0]!;
  let d = `M${first[0]},${first[1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function toPoints(
  values: number[],
  lo: number,
  hi: number,
  w: number,
  h: number,
  pad = 6,
): [number, number][] {
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const span = hi - lo || 1;
  return values.map((v, i) => [
    i * step,
    h - pad - ((v - lo) / span) * (h - pad * 2),
  ]);
}

// ============================================================================
// SPARKLINE SMOOTH AREA (Seragam di ke-4 kartu KPI)
// ============================================================================

function Sparkline({
  values,
  tone,
  hover,
}: {
  values: number[];
  tone: string;
  hover: number | null;
}) {
  const gradientId = `spark-${React.useId().replace(/:/g, "")}`;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pts = toPoints(
    values,
    minVal === maxVal ? minVal * 0.9 : minVal * 0.95,
    minVal === maxVal ? maxVal * 1.1 : maxVal * 1.05 || 1,
    100,
    36,
    3,
  );
  const line = smoothPath(pts);
  const at = hover !== null && pts[hover] ? pts[hover]! : null;

  return (
    <div className={cn("relative h-9 w-full", tone)}>
      <svg
        aria-hidden
        className="absolute inset-0 size-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 36"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={`${line} L100,36 L0,36 Z`} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {at && (
        <span
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-current shadow-xs"
          style={{ left: `${at[0]}%`, top: `${(at[1] / 36) * 100}%` }}
        />
      )}
    </div>
  );
}

// ============================================================================
// KOMPONEN UTAMA DASHBOARD HEADER ENTERPRISE
// ============================================================================

export function DashboardHeader({
  days = fallbackDays,
  summary,
  title = "Ikhtisar Finansial & Arus Kas",
  dailyGoal = 25_000_000,
  defaultRange = 30,
  className,
}: DashboardHeaderProps) {
  const reduce = useSafeReducedMotion();
  const uid = React.useId().replace(/:/g, "");
  const [range, setRange] = React.useState<DashboardRange>(defaultRange);
  const [hover, setHover] = React.useState<number | null>(null);
  const plotRef = React.useRef<HTMLDivElement>(null);

  const span = Math.min(range, Math.floor(days.length / 2));
  const current = days.slice(-span);
  const previous = days.slice(-span * 2, -span);

  const total = (
    list: FinancialDashboardDay[],
    key: MetricKey,
    mode: "sum" | "latest",
  ) => {
    if (mode === "latest") {
      const last = list[list.length - 1];
      return last ? last[key] : 0;
    }
    return list.reduce((acc, d) => acc + d[key], 0);
  };

  const W = 600;
  const H = 240;
  const cur = current.map((d) => d.pendapatan);
  const prev = previous.map((d) => d.pendapatan);
  const rawMax = Math.max(...cur, ...prev);
  const rawMin = Math.min(...cur, ...prev);
  const rawTick = Math.max(1, rawMax - rawMin) / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawTick));
  const tick =
    [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rawTick) ??
    rawTick;
  const lo = Math.max(0, Math.floor((rawMin - tick * 0.5) / tick) * tick);
  const max = Math.ceil((rawMax + tick * 0.15) / tick) * tick;
  const yOf = (v: number) => H - 8 - ((v - lo) / (max - lo || 1)) * (H - 16);
  const curPts = toPoints(cur, lo, max, W, H, 8);
  const prevPts = toPoints(prev, lo, max, W, H, 8);
  const curLine = smoothPath(curPts);
  const prevLine = smoothPath(prevPts);
  const gridValues: number[] = [];
  for (let v = lo + tick; v <= max + 1; v += tick) gridValues.push(v);

  const hovered = hover !== null ? current[hover] : null;
  const hoveredPrev = hover !== null ? previous[hover] : null;

  const pick = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    setHover(Math.round(ratio * (current.length - 1)));
  };

  const onPlotKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      setHover((h) =>
        Math.min(
          current.length - 1,
          Math.max(0, (h ?? (delta > 0 ? -1 : current.length)) + delta),
        ),
      );
    } else if (event.key === "Escape") {
      setHover(null);
    }
  };

  const revenueTotal = total(current, "pendapatan", "sum");
  const goal = dailyGoal * current.length;
  const progress = Math.min(1, revenueTotal / goal);
  const best = current.reduce(
    (a, b) => (b.pendapatan > a.pendapatan ? b : a),
    current[0]!,
  );
  const avg = revenueTotal / current.length;
  const lastWeek =
    current.slice(-7).reduce((a, d) => a + d.pendapatan, 0) /
    Math.min(7, current.length);

  const xLabels = [0, 0.25, 0.5, 0.75, 1].map(
    (f) => current[Math.round(f * (current.length - 1))]?.label ?? "",
  );

  return (
    <section className={cn("w-full space-y-6", className)}>
      {/* Header & Rentang Waktu (7D / 30D / 90D) */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {current[0]?.label} – {current[current.length - 1]?.label} dibanding{" "}
            {span} hari sebelumnya
          </p>
        </div>
        <div
          aria-label="Rentang Waktu"
          className="inline-flex rounded-full border border-border/80 bg-muted/50 p-1"
          role="radiogroup"
        >
          {ranges.map((r) => {
            const active = r.value === range;
            return (
              <button
                aria-checked={active}
                className={cn(
                  "relative h-7 cursor-pointer rounded-full px-3.5 font-medium text-xs outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                key={r.value}
                onClick={() => {
                  setRange(r.value);
                  setHover(null);
                }}
                role="radio"
                type="button"
              >
                {active && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-background shadow-xs border border-border/60"
                    layoutId={`${uid}-range`}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 500, damping: 44 }
                    }
                  />
                )}
                <span className="relative tabular-nums">{r.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 4 Kartu KPI Finansial Utama (Smooth Area Sparkline Seragam) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => {
          const IconComp = m.icon;
          const kpiData = summary?.kpis.find((k) => k.id === m.key);
          const value = total(current, m.key, m.mode);
          const before = total(previous, m.key, m.mode);
          const change = kpiData
            ? kpiData.deltaPct / 100
            : before
              ? (value - before) / before
              : 0;
          const up = change >= 0;
          const isGood = m.positiveIsGood ? up : !up;
          const shown = hovered ? hovered[m.key] : value;
          const displayFormatted = formatMoneyCompact(shown);

          return (
            <article
              className="group rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-border hover:shadow-md"
              key={m.key}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60 transition-colors group-hover:bg-muted",
                      m.tone,
                    )}
                  >
                    <IconComp size={15} stroke={1.8} />
                  </div>
                  <span>{m.label}</span>
                </h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums border",
                    isGood
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                  )}
                >
                  {up ? (
                    <IconArrowUpRight size={12} stroke={2.5} />
                  ) : (
                    <IconArrowDownRight size={12} stroke={2.5} />
                  )}
                  {Math.abs(change * 100).toFixed(1)}%
                </span>
              </div>

              <div className="mt-3 font-semibold text-2xl tracking-tight text-foreground">
                <Roll instant={hover !== null} text={displayFormatted} />
              </div>

              <p className="mt-0.5 h-4 text-xs text-muted-foreground truncate">
                {hovered
                  ? `${hovered.weekday}, ${hovered.label}`
                  : `Dibanding ${span} hari sebelumnya`}
              </p>

              <div className="mt-3">
                <Sparkline
                  hover={hover}
                  tone={m.tone}
                  values={current.map((d) => d[m.key])}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* Bagian Bawah: Chart Interaktif & Target Laba Gauge */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart Arus Kas & Pendapatan Finansial */}
        <article className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Arus Pendapatan Finansial
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Performa pendapatan harian vs periode pembanding
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className={cn("h-1 w-3.5 rounded-full bg-current", revenueTone)}
                />
                Periode Berjalan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 border-t-2 border-dashed border-muted-foreground/60" />
                Periode Lalu
              </span>
            </div>
          </div>

          <div className="relative mt-5 ps-10">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10">
              {gridValues.map((v) => (
                <span
                  className="absolute left-0 -translate-y-1/2 text-[10px] text-muted-foreground/80 tabular-nums font-mono"
                  key={v}
                  style={{ top: `${(yOf(v) / H) * 100}%` }}
                >
                  {formatMoneyCompact(v).replace("Rp ", "")}
                </span>
              ))}
            </div>
            <div
              aria-label="Grafik arus pendapatan. Gunakan tombol panah untuk memeriksa hari."
              className="relative h-56 cursor-crosshair touch-pan-y rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onBlur={() => setHover(null)}
              onKeyDown={onPlotKey}
              onPointerDown={pick}
              onPointerLeave={() => setHover(null)}
              onPointerMove={pick}
              ref={plotRef}
              role="img"
              tabIndex={0}
            >
              <svg
                aria-hidden
                className={cn(
                  "absolute inset-0 size-full overflow-visible",
                  revenueTone,
                )}
                preserveAspectRatio="none"
                viewBox={`0 0 ${W} ${H}`}
              >
                <defs>
                  <clipPath id={`${uid}-reveal`}>
                    <motion.rect
                      animate={{ width: W + 4 }}
                      height={H + 8}
                      initial={{ width: reduce ? W + 4 : 0 }}
                      transition={{
                        duration: reduce ? 0 : 0.7,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                      x={-2}
                      y={-4}
                    />
                  </clipPath>
                  <linearGradient
                    id={`${uid}-area`}
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                {gridValues.map((v) => {
                  const y = yOf(v);
                  return (
                    <line
                      className="stroke-border/70"
                      key={v}
                      strokeDasharray="2 4"
                      vectorEffect="non-scaling-stroke"
                      x1={0}
                      x2={W}
                      y1={y}
                      y2={y}
                    />
                  );
                })}
                <motion.path
                  animate={{ opacity: 1 }}
                  className="stroke-muted-foreground/45"
                  d={prevLine}
                  fill="none"
                  initial={{ opacity: 0 }}
                  key={`prev-${span}`}
                  strokeDasharray="4 5"
                  strokeWidth="1.5"
                  transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
                  vectorEffect="non-scaling-stroke"
                />
                <g clipPath={`url(#${uid}-reveal)`}>
                  <motion.g
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    key={`cur-${span}`}
                    transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
                  >
                    <path
                      d={`${curLine} L${W},${H} L0,${H} Z`}
                      fill={`url(#${uid}-area)`}
                    />
                    <path
                      d={curLine}
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.25"
                      vectorEffect="non-scaling-stroke"
                    />
                  </motion.g>
                </g>
              </svg>

              {hover !== null && hovered && curPts[hover] && (
                <>
                  <span
                    className="pointer-events-none absolute inset-y-0 w-px bg-foreground/20"
                    style={{ left: `${(curPts[hover]![0] / W) * 100}%` }}
                  />
                  {hoveredPrev && prevPts[hover] && (
                    <span
                      className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-muted-foreground"
                      style={{
                        left: `${(prevPts[hover]![0] / W) * 100}%`,
                        top: `${(prevPts[hover]![1] / H) * 100}%`,
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      "pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2",
                      revenueTone,
                    )}
                    style={{
                      left: `${(curPts[hover]![0] / W) * 100}%`,
                      top: `${(curPts[hover]![1] / H) * 100}%`,
                    }}
                  >
                    <motion.span
                      animate={{ scale: 1, opacity: 1 }}
                      className="block size-full rounded-full border-2 border-card bg-current shadow-xs"
                      initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    />
                  </span>
                  <div
                    className={cn(
                      "pointer-events-none absolute top-2 z-10 w-48 rounded-xl border border-border/80 bg-popover/98 p-3 text-xs shadow-xl backdrop-blur-md",
                      hover > current.length / 2
                        ? "-translate-x-[calc(100%+12px)]"
                        : "translate-x-3",
                    )}
                    style={{ left: `${(curPts[hover]![0] / W) * 100}%` }}
                  >
                    <p className="font-semibold text-foreground">
                      {hovered.weekday}, {hovered.label}
                    </p>
                    <dl className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className={cn(
                              "size-1.5 rounded-full bg-current",
                              revenueTone,
                            )}
                          />
                          Periode ini
                        </dt>
                        <dd className="font-semibold text-foreground tabular-nums">
                          {formatMoneyFull(hovered.pendapatan)}
                        </dd>
                      </div>
                      {hoveredPrev && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-muted-foreground" />
                            {hoveredPrev.label}
                          </dt>
                          <dd className="tabular-nums text-muted-foreground">
                            {formatMoneyFull(hoveredPrev.pendapatan)}
                          </dd>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5 text-muted-foreground">
                        <dt>Laba Bersih</dt>
                        <dd className="font-medium text-foreground tabular-nums">
                          {formatMoneyFull(hovered.laba)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-muted-foreground">
                        <dt>Transaksi</dt>
                        <dd className="tabular-nums font-medium text-foreground">
                          {hovered.transactionCount} faktur
                        </dd>
                      </div>
                    </dl>
                  </div>
                </>
              )}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-muted-foreground tabular-nums">
              {xLabels.map((label, i) => (
                <span key={`${label}-${i}`}>{label}</span>
              ))}
            </div>
          </div>
        </article>

        {/* Target Laba Bersih Bulanan (Gauge Ring) */}
        <article className="flex flex-col rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/12 text-indigo-600 dark:text-indigo-400">
              <IconTargetArrow size={18} stroke={1.8} />
            </span>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Target Laba Finansial
              </h3>
              <p className="text-xs text-muted-foreground">
                Sasaran profitabilitas {span} hari
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <div className="relative size-28 shrink-0">
              <svg
                aria-hidden
                className={cn(
                  "size-full -rotate-90",
                  "text-indigo-600 dark:text-indigo-400",
                )}
                viewBox="0 0 100 100"
              >
                <circle
                  className="stroke-muted/50"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="42"
                  strokeWidth="9"
                />
                <motion.circle
                  animate={{ pathLength: progress }}
                  cx="50"
                  cy="50"
                  fill="none"
                  initial={false}
                  r="42"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="9"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 120, damping: 22 }
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-xl tracking-tight text-foreground">
                  <Roll text={`${Math.round(progress * 100)}%`} />
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Target
                </span>
              </div>
            </div>

            <div className="min-w-0 text-sm space-y-1.5">
              <div>
                <p className="text-xs text-muted-foreground">Tercapai</p>
                <p className="font-bold text-foreground text-sm">
                  <Roll text={formatMoneyCompact(revenueTotal)} />
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target Anggaran</p>
                <p className="font-medium text-muted-foreground text-sm">
                  <Roll text={formatMoneyCompact(goal)} />
                </p>
              </div>
            </div>
          </div>

          <dl className="mt-auto space-y-2.5 border-t border-border/80 pt-4 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Hari Terbaik</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {best?.label} · {formatMoneyCompact(best?.pendapatan ?? 0)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Rata-rata / Hari</dt>
              <dd className="font-medium text-foreground">
                {formatMoneyCompact(avg)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Tren 7 Hari Terakhir</dt>
              <dd
                className={cn(
                  "font-semibold",
                  lastWeek >= dailyGoal
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {formatMoneyCompact(lastWeek)}
                <span className="text-muted-foreground text-[10px] font-normal">
                  {" "}
                  /hari
                </span>
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
