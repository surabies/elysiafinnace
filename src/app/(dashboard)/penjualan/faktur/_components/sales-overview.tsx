"use client";

import * as React from "react";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconChartBar,
  IconChartLine,
  IconPackage,
  IconCoffee,
  IconHeadphones,
  IconShirt,
  IconBuildingStore,
  type IconProps,
} from "@tabler/icons-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type CommerceMetric = "revenue" | "orders" | "aov" | "customers";
export type SalesMetric = CommerceMetric;

export type CommerceIconType = React.ComponentType<{ className?: string } | IconProps>;

export interface SalesMonth {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface SalesProduct {
  name: string;
  category: string;
  icon?: CommerceIconType;
  revenue: number;
  units: number;
}

export interface SalesChannel {
  name: string;
  revenueShare: number;
  orderShare: number;
}

export interface SalesYear {
  label: string;
  months: SalesMonth[];
  products: SalesProduct[];
  channels: SalesChannel[];
}

export interface SalesOverviewProps {
  /** Mode tampilan: "penjualan" (default) atau "pembelian" */
  modeType?: "penjualan" | "pembelian";
  years?: SalesYear[];
  title?: string;
  subtitle?: string;
  currency?: string;
  className?: string;
}

const monthNamesId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

export function sampleSalesYear(label: string, scale: number, seed: number): SalesYear {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const months = monthNamesId.map((month, i) => {
    const season = 1 + 0.18 * Math.sin((i - 2) / 1.9) + (i >= 10 ? 0.35 : 0);
    const orders = Math.round(480 * scale * season * (0.88 + rand() * 0.24));
    return {
      month,
      orders,
      revenue: Math.round(orders * (350_000 + rand() * 85_000)),
      customers: Math.round(orders * (0.42 + rand() * 0.08)),
    };
  });
  return {
    label,
    months,
    products: [
      { name: "Kopi Arabika Gayo 1kg", category: "Minuman", icon: IconCoffee, revenue: Math.round(284_000_000 * scale), units: Math.round(1420 * scale) },
      { name: "Beras Premium Cianjur 5kg", category: "Bahan Pokok", icon: IconPackage, revenue: Math.round(195_500_000 * scale), units: Math.round(2600 * scale) },
      { name: "Minyak Goreng Sawit 2L", category: "Bahan Pokok", icon: IconPackage, revenue: Math.round(162_300_000 * scale), units: Math.round(3800 * scale) },
      { name: "Kaos Polos Katun Combed", category: "Apparel", icon: IconShirt, revenue: Math.round(118_400_000 * scale), units: Math.round(1100 * scale) },
      { name: "Headphone Bluetooth Pro", category: "Elektronik", icon: IconHeadphones, revenue: Math.round(85_200_000 * scale), units: Math.round(420 * scale) },
    ],
    channels: [
      { name: "Toko Langsung / POS", revenueShare: 0.38, orderShare: 0.35 },
      { name: "Tokopedia", revenueShare: 0.26, orderShare: 0.28 },
      { name: "Shopee", revenueShare: 0.20, orderShare: 0.22 },
      { name: "B2B / Grosir", revenueShare: 0.12, orderShare: 0.09 },
      { name: "WhatsApp & Telepon", revenueShare: 0.04, orderShare: 0.06 },
    ],
  };
}

export function samplePurchaseYear(label: string, scale: number, seed: number): SalesYear {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const months = monthNamesId.map((month, i) => {
    const season = 1 + 0.15 * Math.sin((i - 2) / 1.9) + (i >= 9 ? 0.3 : 0);
    const orders = Math.round(120 * scale * season * (0.85 + rand() * 0.3));
    return {
      month,
      orders,
      revenue: Math.round(orders * (1_200_000 + rand() * 450_000)),
      customers: Math.round(orders * (0.25 + rand() * 0.08)),
    };
  });
  return {
    label,
    months,
    products: [
      { name: "Biji Kopi Mentah / Green Bean", category: "Bahan Mentah", icon: IconCoffee, revenue: Math.round(310_000_000 * scale), units: Math.round(3200 * scale) },
      { name: "Karton Box & Kardus Packing", category: "Packaging", icon: IconPackage, revenue: Math.round(86_500_000 * scale), units: Math.round(12500 * scale) },
      { name: "Kain Katun Rol 100m", category: "Bahan Baku", icon: IconShirt, revenue: Math.round(145_300_000 * scale), units: Math.round(850 * scale) },
      { name: "Sparepart Mesin Produksi", category: "Maintenance", icon: IconPackage, revenue: Math.round(72_400_000 * scale), units: Math.round(160 * scale) },
      { name: "Bahan Pembersih & Sanitasi", category: "Operasional", icon: IconBuildingStore, revenue: Math.round(38_200_000 * scale), units: Math.round(620 * scale) },
    ],
    channels: [
      { name: "Pemasok Lokal Utama", revenueShare: 0.44, orderShare: 0.40 },
      { name: "Distributor Pabrikan", revenueShare: 0.30, orderShare: 0.32 },
      { name: "Vendor Bahan Baku", revenueShare: 0.15, orderShare: 0.16 },
      { name: "Marketplace B2B", revenueShare: 0.08, orderShare: 0.09 },
      { name: "Pengadaan Langsung", revenueShare: 0.03, orderShare: 0.03 },
    ],
  };
}

export const sampleYear = sampleSalesYear;

const defaultSalesYears = [sampleSalesYear("2026", 1.18, 4242), sampleSalesYear("2025", 1, 1717)];
const defaultPurchaseYears = [samplePurchaseYear("2026", 1.15, 8888), samplePurchaseYear("2025", 1, 3333)];

const salesMetricInfo: Record<CommerceMetric, { label: string; hint: string }> = {
  revenue: { label: "Total Penjualan", hint: "Penjualan kotor & piutang faktur" },
  orders: { label: "Jumlah Pesanan", hint: "Faktur penjualan selesai" },
  aov: { label: "Rata-rata Order", hint: "Nilai rata-rata per transaksi" },
  customers: { label: "Pelanggan Aktif", hint: "Pelanggan bertransaksi aktif" },
};

const purchaseMetricInfo: Record<CommerceMetric, { label: string; hint: string }> = {
  revenue: { label: "Total Pembelian", hint: "Nilai belanja & tagihan pemasok" },
  orders: { label: "Pesanan Beli (PO)", hint: "PO & faktur pembelian selesai" },
  aov: { label: "Rata-rata Tagihan", hint: "Nilai rata-rata per transaksi beli" },
  customers: { label: "Pemasok Aktif", hint: "Vendor pengadaan bertransaksi" },
};

const channelTones = [
  "bg-blue-500 dark:bg-blue-400",
  "bg-emerald-500 dark:bg-emerald-400",
  "bg-amber-500 dark:bg-amber-400",
  "bg-violet-500 dark:bg-violet-400",
  "bg-rose-500 dark:bg-rose-400",
];

const accent = "text-blue-600 dark:text-blue-400";
const settle = { type: "spring", stiffness: 300, damping: 34 } as const;

function Roll({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const chars = text.split("");
  return (
    <span className={cn("inline-flex align-top tabular-nums leading-[1.15em]", className)}>
      <span className="sr-only">{text}</span>
      {chars.map((char, i) => {
        const key = chars.length - i;
        if (!/\d/.test(char)) {
          return (
            <span aria-hidden key={`s${key}`}>
              {char}
            </span>
          );
        }
        return (
          <span aria-hidden className="relative inline-block h-[1.15em] w-[1ch] overflow-hidden" key={`d${key}`}>
            <motion.span
              animate={{ y: `${-Number(char) * 1.15}em` }}
              className="absolute inset-x-0 top-0 flex flex-col"
              initial={false}
              transition={reduce ? { duration: 0 } : settle}
            >
              {Array.from({ length: 10 }, (_, n) => (
                <span className="block h-[1.15em]" key={n}>
                  {n}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

function niceStep(value: number) {
  const exp = 10 ** Math.floor(Math.log10(Math.max(1, value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function compactIdr(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}Rb`;
  return `${Math.round(n)}`;
}

export function SalesOverview({
  modeType = "penjualan",
  years,
  title,
  subtitle,
  currency = "Rp ",
  className,
}: SalesOverviewProps) {
  const isPembelian = modeType === "pembelian";
  const metricDictionary = isPembelian ? purchaseMetricInfo : salesMetricInfo;

  const fallbackList = React.useMemo(
    () => (isPembelian ? defaultPurchaseYears : defaultSalesYears),
    [isPembelian],
  );

  const availableYears = years && years.length > 0 ? years : fallbackList;
  const [yearIndex, setYearIndex] = React.useState(0);
  const [metric, setMetric] = React.useState<CommerceMetric>("revenue");
  const [mode, setMode] = React.useState<"line" | "bars">("line");
  const [hover, setHover] = React.useState<number | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 640, height: 260 });
  const width = size.width;

  React.useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: entry.contentRect.width,
        height: Math.max(220, entry.contentRect.height),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const safeYearIndex = Math.min(Math.max(0, yearIndex), availableYears.length - 1);
  const activeYear: SalesYear = availableYears[safeYearIndex] ?? fallbackList[0]!;
  const priorYear: SalesYear | undefined = availableYears[safeYearIndex + 1];

  const uid = React.useId().replace(/:/g, "");
  const reduce = useReducedMotion();

  const monthValue = (m: SalesMonth, key: CommerceMetric) =>
    key === "aov" ? m.revenue / Math.max(1, m.orders) : m[key];

  const totalOf = (y: SalesYear | undefined, key: CommerceMetric) => {
    if (!y) return 0;
    const rev = y.months.reduce((a, m) => a + m.revenue, 0);
    const ord = y.months.reduce((a, m) => a + m.orders, 0);
    if (key === "aov") return rev / Math.max(1, ord);
    if (key === "revenue") return rev;
    if (key === "orders") return ord;
    return y.months.reduce((a, m) => a + m.customers, 0);
  };

  const format = (key: CommerceMetric, n: number) => {
    if (key === "revenue" || key === "aov") {
      return `${currency}${Math.round(n).toLocaleString("id-ID")}`;
    }
    return Math.round(n).toLocaleString("id-ID");
  };

  const H = size.height;
  const padL = 44;
  const padB = 26;
  const padT = 12;
  const plotW = Math.max(120, width - padL);
  const plotH = H - padB - padT;
  const values = activeYear.months.map((m) => monthValue(m, metric));
  const maxVal = Math.max(1, ...values);
  const tickStep = niceStep((maxVal * 1.08) / 5);
  const top = Math.ceil((maxVal * 1.08) / tickStep) * tickStep;
  const slot = plotW / Math.max(1, values.length);
  const xAt = (i: number) => padL + slot * i + slot / 2;
  const yAt = (v: number) => padT + plotH - (v / Math.max(1, top)) * plotH;
  const linePath = values.map((v, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
  const ticks = Array.from({ length: Math.round(top / tickStep) + 1 }, (_, i) => i * tickStep);
  const lastX = xAt(Math.max(0, values.length - 1)).toFixed(1);
  const firstX = xAt(0).toFixed(1);
  const areaPath = values.length > 0 ? `${linePath} L${lastX},${yAt(0)} L${firstX},${yAt(0)} Z` : "";
  const barW = Math.min(36, slot * 0.56);

  const productValue = (p: SalesProduct) => (metric === "orders" || metric === "customers" ? p.units : p.revenue);
  const products = [...activeYear.products].sort((a, b) => productValue(b) - productValue(a));
  const firstProduct = products[0];
  const topProduct = firstProduct ? Math.max(1, productValue(firstProduct)) : 1;
  const channelMetricTotal = totalOf(activeYear, metric === "aov" ? "revenue" : metric);
  const shareOf = (c: SalesChannel) => (metric === "orders" || metric === "customers" ? c.orderShare : c.revenueShare);

  const spring = reduce ? { duration: 0 } : ({ type: "spring", stiffness: 380, damping: 38 } as const);
  const morph = spring;

  const resolvedTitle = title ?? (isPembelian ? "Ikhtisar Pengadaan & Pembelian" : "Ikhtisar Penjualan & Pendapatan");
  const resolvedSubtitle = subtitle ?? `Januari – Desember ${activeYear.label}${priorYear ? ` · dibandingkan dengan ${priorYear.label}` : ""}`;
  const productsTitle = isPembelian ? "Barang Pengadaan Terbanyak" : "Produk Terlaris";
  const channelsTitle = isPembelian ? "Saluran Pemasok & Vendor" : "Saluran Penjualan";

  const hoveredMonth = hover !== null && hover < activeYear.months.length ? activeYear.months[hover] : undefined;
  const hoveredValue = hover !== null && hover < values.length ? values[hover] : undefined;
  const priorMonth = priorYear && hover !== null && hover < priorYear.months.length ? priorYear.months[hover] : undefined;
  const peakIndex = values.indexOf(Math.max(...values));
  const peakMonthName = peakIndex >= 0 && peakIndex < activeYear.months.length ? activeYear.months[peakIndex]?.month : "-";

  return (
    <LayoutGroup id={uid}>
      <section className={cn("mx-auto w-full space-y-4", className)}>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-xl tracking-tight">{resolvedTitle}</h2>
            <p className="text-muted-foreground text-sm">{resolvedSubtitle}</p>
          </div>
          {availableYears.length > 1 && (
            <div aria-label="Tahun Pembukuan" className="inline-flex rounded-full border bg-muted p-1" role="radiogroup">
              {availableYears.map((y, i) => (
                <button
                  aria-checked={i === safeYearIndex}
                  className={cn(
                    "relative h-7 cursor-pointer rounded-full px-3.5 font-medium text-xs tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                    i === safeYearIndex ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  key={y.label}
                  onClick={() => setYearIndex(i)}
                  role="radio"
                  type="button"
                >
                  {i === safeYearIndex && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-background shadow-xs/5 dark:bg-accent"
                      layoutId="year-pill"
                      transition={spring}
                    />
                  )}
                  <span className="relative">{y.label}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        <div aria-label="Metrik Utama" className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="radiogroup">
          {(Object.keys(metricDictionary) as CommerceMetric[]).map((key) => {
            const value = totalOf(activeYear, key);
            const before = totalOf(priorYear, key);
            const change = before ? (value - before) / before : 0;
            const up = change >= 0;
            const active = metric === key;
            return (
              <button
                aria-checked={active}
                className={cn(
                  "group relative flex cursor-pointer flex-col justify-start rounded-2xl border bg-card p-4 text-start shadow-xs/5 outline-none transition-[border-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:active:scale-100",
                  active ? "border-transparent" : "hover:border-foreground/16",
                )}
                key={key}
                onClick={() => {
                  setMetric(key);
                  setHover(null);
                }}
                role="radio"
                type="button"
              >
                {active && (
                  <motion.span
                    aria-hidden
                    className="absolute -inset-px rounded-2xl border border-blue-500/80 bg-blue-500/[0.04] ring-4 ring-blue-500/10 dark:border-blue-400/80 dark:bg-blue-400/[0.06] dark:ring-blue-400/10"
                    layoutId="metric-outline"
                    transition={spring}
                  />
                )}
                <span className="relative block">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-sm">{metricDictionary[key].label}</span>
                    {priorYear && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 font-medium text-xs tabular-nums",
                          up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {up ? <IconArrowUpRight className="size-3.5" /> : <IconArrowDownRight className="size-3.5" />}
                        {Math.abs(change * 100).toFixed(1)}%
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block font-semibold text-xl tracking-tight sm:text-2xl">
                    <Roll text={format(key, value)} />
                  </span>
                  <span className="mt-0.5 block text-muted-foreground text-xs">{metricDictionary[key].hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs/5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium text-sm">{metricDictionary[metric].label} per Bulan</h3>
                <p className="text-muted-foreground text-xs">
                  {hover !== null && hoveredMonth && hoveredValue !== undefined
                    ? `${hoveredMonth.month} ${activeYear.label}: ${format(metric, hoveredValue)}`
                    : `Puncak tertinggi pada bulan ${peakMonthName}`}
                </p>
              </div>
              <div aria-label="Gaya Grafik" className="inline-flex rounded-lg border bg-muted p-0.5" role="radiogroup">
                {(
                  [
                    { value: "line", label: "Garis", icon: IconChartLine },
                    { value: "bars", label: "Batang", icon: IconChartBar },
                  ] as const
                ).map((opt) => (
                  <button
                    aria-checked={mode === opt.value}
                    aria-label={opt.label}
                    className={cn(
                      "relative inline-flex size-7 cursor-pointer items-center justify-center rounded-md outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                      mode === opt.value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    role="radio"
                    type="button"
                  >
                    {mode === opt.value && (
                      <motion.span
                        className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-accent"
                        layoutId="mode-pill"
                        transition={spring}
                      />
                    )}
                    <opt.icon className="relative size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-4 h-[260px] lg:h-auto lg:min-h-[260px] lg:flex-1" ref={chartRef}>
              <svg aria-hidden className={cn("absolute inset-0 overflow-visible", accent)} height={H} width={width}>
                {ticks.map((t) => (
                  <g key={t}>
                    <line
                      className={t === 0 ? "stroke-border" : "stroke-border/70"}
                      strokeDasharray={t === 0 ? undefined : "2 4"}
                      x1={padL}
                      x2={width}
                      y1={yAt(t)}
                      y2={yAt(t)}
                    />
                    <text className="fill-muted-foreground text-[0.6875rem] tabular-nums" dominantBaseline="middle" x={0} y={yAt(t)}>
                      {compactIdr(t)}
                    </text>
                  </g>
                ))}
                {activeYear.months.map((m, i) => (
                  <text
                    className={cn(
                      "text-[0.6875rem] transition-colors",
                      hover === i ? "fill-foreground font-medium" : "fill-muted-foreground",
                    )}
                    key={m.month}
                    textAnchor="middle"
                    x={xAt(i)}
                    y={H - 6}
                  >
                    {slot < 34 ? m.month[0] : m.month}
                  </text>
                ))}

                {hover !== null && (
                  <rect
                    className="fill-muted/70"
                    height={plotH}
                    rx={8}
                    width={Math.max(10, slot - 4)}
                    x={padL + slot * hover + 2}
                    y={padT}
                  />
                )}

                <AnimatePresence initial={false}>
                  {mode === "bars" ? (
                    <motion.g animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 1 }} key="bars">
                      {values.map((v, i) => (
                        <motion.rect
                          animate={{ y: yAt(v), height: Math.max(2, yAt(0) - yAt(v)) }}
                          className={cn(
                            "fill-current transition-opacity duration-150",
                            hover !== null && hover !== i && "opacity-40",
                          )}
                          initial={{ y: yAt(0), height: 0 }}
                          key={activeYear.months[i]?.month || i}
                          rx={Math.min(6, barW / 3)}
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34, delay: i * 0.02 }}
                          width={barW}
                          x={xAt(i) - barW / 2}
                        />
                      ))}
                    </motion.g>
                  ) : (
                    <motion.g animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="line">
                      <defs>
                        <linearGradient id={`${uid}-area`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity={0.16} />
                          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <motion.path
                        animate={{ d: areaPath }}
                        fill={`url(#${uid}-area)`}
                        initial={{ d: areaPath }}
                        transition={morph}
                      />
                      <motion.path
                        animate={{ d: linePath }}
                        className="stroke-current"
                        fill="none"
                        initial={{ d: linePath }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.25}
                        transition={morph}
                      />
                      {values.map((v, i) => (
                        <motion.circle
                          animate={{ cy: yAt(v), r: hover === i ? 5.5 : 3.5 }}
                          className="fill-card stroke-current"
                          cx={xAt(i)}
                          initial={{ cy: yAt(0), r: 3.5 }}
                          key={activeYear.months[i]?.month || i}
                          strokeWidth={2}
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34, delay: i * 0.02 }}
                        />
                      ))}
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>

              <div className="absolute inset-y-0 right-0 flex" style={{ left: padL }}>
                {activeYear.months.map((m, i) => {
                  const val = values[i] ?? 0;
                  return (
                    <button
                      aria-label={`${m.month}: ${format(metric, val)}`}
                      className="h-full flex-1 cursor-default outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                      key={m.month}
                      onBlur={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onPointerEnter={() => setHover(i)}
                      onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                      type="button"
                    />
                  );
                })}
              </div>

              <AnimatePresence>
                {hover !== null && hoveredMonth && hoveredValue !== undefined && (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className={cn(
                      "pointer-events-none absolute z-10 w-44 rounded-xl border bg-popover p-2.5 text-xs shadow-md",
                      hover > 6 ? "-translate-x-[calc(100%+14px)]" : "translate-x-3.5",
                    )}
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    style={{ left: xAt(hover), top: Math.max(0, Math.min(yAt(hoveredValue) - 30, H - 110)) }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    <p className="font-semibold text-foreground">
                      {hoveredMonth.month} {activeYear.label}
                    </p>
                    <p className="mt-1 font-bold text-sm text-primary tabular-nums">{format(metric, hoveredValue)}</p>
                    {priorYear && priorMonth && (
                      <p className="mt-0.5 text-muted-foreground tabular-nums">
                        {priorYear.label}: {format(metric, monthValue(priorMonth, metric))}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <article className="rounded-2xl border bg-card p-4 shadow-xs/5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{productsTitle}</h3>
                <span className="text-muted-foreground text-xs">
                  berdasarkan {metric === "orders" || metric === "customers" ? "unit" : "nilai"}
                </span>
              </div>
              <ol className="mt-3 space-y-2.5">
                {products.map((p, i) => {
                  const value = productValue(p);
                  const IconComponent = p.icon ?? (modeType === "penjualan" ? IconPackage : IconBuildingStore);
                  return (
                    <motion.li className="flex items-center gap-3" key={p.name} layout="position" transition={spring}>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80">
                        <IconComponent className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{p.name}</span>
                          <span className="flex shrink-0 tabular-nums">
                            {metric === "orders" || metric === "customers" ? (
                              <Roll text={value.toLocaleString("id-ID")} />
                            ) : (
                              <Roll text={`${currency}${compactIdr(value)}`} />
                            )}
                          </span>
                        </span>
                        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                          <motion.span
                            animate={{ scaleX: value / topProduct }}
                            className={cn(
                              "block h-full origin-left rounded-full",
                              i === 0 ? "bg-blue-500 dark:bg-blue-400" : "bg-foreground/24",
                            )}
                            initial={false}
                            transition={spring}
                          />
                        </span>
                      </span>
                    </motion.li>
                  );
                })}
              </ol>
            </article>

            <article className="rounded-2xl border bg-card p-4 shadow-xs/5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{channelsTitle}</h3>
                <span className="text-muted-foreground text-xs">
                  porsi {metricDictionary[metric === "aov" ? "revenue" : metric].label.toLowerCase()}
                </span>
              </div>
              <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                {activeYear.channels.map((c, i) => (
                  <motion.span
                    animate={{ flexGrow: shareOf(c) }}
                    className={cn("h-full basis-0 first:rounded-s-full last:rounded-e-full", channelTones[i % channelTones.length])}
                    initial={false}
                    key={c.name}
                    transition={spring}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {activeYear.channels.map((c, i) => (
                  <li className="flex items-center gap-2" key={c.name}>
                    <span className={cn("size-2 rounded-full", channelTones[i % channelTones.length])} />
                    <span className="flex-1 truncate text-xs font-medium">{c.name}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {metric === "revenue" || metric === "aov" ? currency : ""}
                      {compactIdr(shareOf(c) * channelMetricTotal)}
                    </span>
                    <span className="flex w-10 justify-end font-medium text-xs tabular-nums">
                      <Roll text={`${Math.round(shareOf(c) * 100)}%`} />
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </LayoutGroup>
  );
}

/**
 * Komponen khusus Ikhtisar Pembelian (Purchases Overview)
 */
export function PurchasesOverview(props: Omit<SalesOverviewProps, "modeType">) {
  return <SalesOverview modeType="pembelian" {...props} />;
}
