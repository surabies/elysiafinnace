"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VercelBarChart } from "@/components/chart/vercel-bar-chart";
import { formatDate, formatRupiah } from "@/lib/format";
import { Panel } from "./panel";
import {
  aggregateTrend,
  filterTrendByRange,
  formatDateKey,
  getChartGranularity,
  getPeriodRange,
  parseDateKey,
  type ChartPeriod,
} from "../_lib/chart-period";
import type {
  FinancialHourlyTrendPoint,
  FinancialTrendPoint,
} from "../_lib/types";

const periodOptions: Array<{ value: ChartPeriod; label: string }> = [
  { value: "day", label: "Harian" },
  { value: "week", label: "Mingguan" },
  { value: "month", label: "Bulanan" },
  { value: "quarter", label: "Kuartalan" },
  { value: "year", label: "Tahunan" },
];

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const fullMonthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  timeZone: "UTC",
});
const shortMonthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  timeZone: "UTC",
});

function isChartPeriod(value: string): value is ChartPeriod {
  return periodOptions.some((option) => option.value === value);
}

function getBucketLabel(
  startDate: string,
  endDate: string,
  granularity: "day" | "week" | "month",
) {
  const start = parseDateKey(startDate);
  if (granularity === "month") return monthFormatter.format(start);
  if (granularity === "day") return formatDate(startDate);
  return `${shortDateFormatter.format(start)} – ${shortDateFormatter.format(parseDateKey(endDate))}`;
}

function getShortLabel(
  startDate: string,
  granularity: "day" | "week" | "month",
  period: ChartPeriod,
) {
  const start = parseDateKey(startDate);
  return granularity === "month"
    ? period === "year"
      ? shortMonthFormatter.format(start)
      : fullMonthFormatter.format(start)
    : period === "month" && granularity === "day"
      ? String(start.getUTCDate())
      : shortDateFormatter.format(start);
}

function Legend() {
  return (
    <ul className="flex items-center gap-4 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-sm bg-chart-3" />
        Pendapatan
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-sm bg-chart-5" />
        Beban
      </li>
    </ul>
  );
}

export function CashflowChart({
  data,
  hourlyData,
  asOfDate,
  isSample,
}: {
  data: FinancialTrendPoint[];
  hourlyData: FinancialHourlyTrendPoint[];
  asOfDate: string;
  isSample: boolean;
}) {
  const earliestDate = data[0]?.date ?? asOfDate;
  const [period, setPeriod] = useState<ChartPeriod>("month");
  const range = useMemo(() => {
    const selectedRange = getPeriodRange(period, asOfDate, earliestDate);
    if (!selectedRange || !isSample || period !== "month") return selectedRange;

    const monthStart = parseDateKey(selectedRange.startDate);
    return {
      ...selectedRange,
      endDate: formatDateKey(
        new Date(
          Date.UTC(
            monthStart.getUTCFullYear(),
            monthStart.getUTCMonth() + 1,
            0,
          ),
        ),
      ),
    };
  }, [period, asOfDate, earliestDate, isSample]);
  const selectedData = useMemo(
    () => (range ? filterTrendByRange(data, range) : []),
    [data, range],
  );
  const granularity = getChartGranularity(period);
  const chartData = useMemo(() => {
    if (granularity === "hour") {
      return hourlyData.map((point) => {
        const label = `${String(point.hour).padStart(2, "0")}.00`;
        return {
          key: `${asOfDate}-${point.hour}`,
          label,
          shortLabel: String(point.hour).padStart(2, "0"),
          value: point.pendapatan,
          formattedValue: formatRupiah(point.pendapatan),
          secondaryValue: point.beban,
          secondaryFormattedValue: formatRupiah(point.beban),
          transactionCount: point.transactionCount,
        };
      });
    }

    return aggregateTrend(selectedData, granularity).map((bucket) => ({
      key: bucket.startDate,
      label: getBucketLabel(bucket.startDate, bucket.endDate, granularity),
      shortLabel: getShortLabel(bucket.startDate, granularity, period),
      value: bucket.pendapatan,
      formattedValue: formatRupiah(bucket.pendapatan),
      secondaryValue: bucket.beban,
      secondaryFormattedValue: formatRupiah(bucket.beban),
      transactionCount: bucket.transactionCount,
    }));
  }, [asOfDate, granularity, hourlyData, period, selectedData]);
  const description = range
    ? `${formatDate(range.startDate)} – ${formatDate(range.endDate)}${isSample ? " · Data contoh" : ""}`
    : `Tidak ada data tersedia${isSample ? " · Data contoh" : ""}`;

  return (
    <Panel
      title="Pendapatan dan beban"
      description={description}
      action={
        <Select
          value={period}
          onValueChange={(value) => {
            if (isChartPeriod(value)) setPeriod(value);
          }}
        >
          <SelectTrigger aria-label="Periode grafik" className="w-37">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" position="popper">
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      className="h-full"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Legend />
        </div>

        {chartData.length > 0 ? (
          <VercelBarChart
            key={`${period}:${range?.startDate}:${range?.endDate}`}
            data={chartData}
            yAxisFormat="idr-full"
            showYAxis={false}
            barColor="var(--chart-3)"
            seriesName="Pendapatan"
            secondaryBarColor="var(--chart-5)"
            secondarySeriesName="Beban"
          />
        ) : (
          <div className="flex h-56.75 items-center justify-center text-sm text-muted-foreground">
            Tidak ada data pada periode ini.
          </div>
        )}
      </div>
    </Panel>
  );
}
