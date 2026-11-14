import type { FinancialTrendPoint } from "./types";

export type ChartPeriod = "day" | "week" | "month" | "quarter" | "year";
export type ChartGranularity = "hour" | "day" | "month";
export type TrendGranularity = "day" | "week" | "month";
export type DateRange = { startDate: string; endDate: string };
export type TrendBucket = DateRange & {
  pendapatan: number;
  beban: number;
  transactionCount: number;
};

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));

  if (
    !year ||
    !month ||
    !day ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`Tanggal tidak valid: ${value}`);
  }

  return date;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function shiftDateKey(value: string, days: number): string {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

export function getPeriodRange(
  period: ChartPeriod,
  asOfDate: string,
  firstAvailableDate: string,
): DateRange | null {
  const asOf = parseDateKey(asOfDate);
  const year = asOf.getUTCFullYear();
  const month = asOf.getUTCMonth() + 1;
  let startDate: string;

  switch (period) {
    case "day":
      startDate = asOfDate;
      break;
    case "week": {
      const daysSinceMonday = (asOf.getUTCDay() + 6) % 7;
      startDate = shiftDateKey(asOfDate, -daysSinceMonday);
      break;
    }
    case "month":
      startDate = `${asOfDate.slice(0, 7)}-01`;
      break;
    case "quarter": {
      const firstQuarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
      startDate = `${year}-${String(firstQuarterMonth).padStart(2, "0")}-01`;
      break;
    }
    case "year":
      startDate = `${year}-01-01`;
      break;
  }

  if (startDate > asOfDate || asOfDate < firstAvailableDate) return null;
  if (startDate < firstAvailableDate) startDate = firstAvailableDate;

  return startDate <= asOfDate
    ? { startDate, endDate: asOfDate }
    : null;
}

export function filterTrendByRange(
  data: FinancialTrendPoint[],
  range: DateRange,
): FinancialTrendPoint[] {
  return data.filter(
    (point) => point.date >= range.startDate && point.date <= range.endDate,
  );
}

export function getChartGranularity(period: ChartPeriod): ChartGranularity {
  switch (period) {
    case "day":
      return "hour";
    case "week":
    case "month":
      return "day";
    case "quarter":
    case "year":
      return "month";
  }
}

export function aggregateTrend(
  data: FinancialTrendPoint[],
  granularity: TrendGranularity,
): TrendBucket[] {
  const buckets = new Map<string, TrendBucket>();

  for (const point of data) {
    const date = parseDateKey(point.date);
    let bucketKey = point.date;

    if (granularity === "week") {
      const daysSinceMonday = (date.getUTCDay() + 6) % 7;
      date.setUTCDate(date.getUTCDate() - daysSinceMonday);
      bucketKey = formatDateKey(date);
    } else if (granularity === "month") {
      bucketKey = `${point.date.slice(0, 7)}-01`;
    }

    const bucket = buckets.get(bucketKey);
    if (bucket) {
      bucket.startDate =
        point.date < bucket.startDate ? point.date : bucket.startDate;
      bucket.endDate = point.date > bucket.endDate ? point.date : bucket.endDate;
      bucket.pendapatan += point.pendapatan;
      bucket.beban += point.beban;
      bucket.transactionCount += point.transactionCount;
    } else {
      buckets.set(bucketKey, {
        startDate: point.date,
        endDate: point.date,
        pendapatan: point.pendapatan,
        beban: point.beban,
        transactionCount: point.transactionCount,
      });
    }
  }

  return [...buckets.values()].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
}
