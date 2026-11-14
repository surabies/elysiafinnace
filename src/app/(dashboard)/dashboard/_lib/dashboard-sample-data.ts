import { formatDateKey, parseDateKey } from "./chart-period";

// Satuan data contoh: juta rupiah (integer) agar tidak ada galat pecahan.
const JUTA = 1_000_000;
const MONTHLY_REVENUE = [
  3050, 3310, 3620, 3740, 3900, 4050, 4120, 4310, 4220, 4480, 4600, 4700,
];
const MONTHLY_EXPENSES = [
  2490, 2710, 2840, 2920, 3050, 3120, 3340, 3410, 3380, 3520, 3620, 3700,
];
const PREVIOUS_YEAR_REVENUE = [
  2810, 2980, 3220, 3410, 3550, 3680, 3740, 3900, 3820, 4050, 3420, 3180,
];
const PREVIOUS_YEAR_EXPENSES = [
  2290, 2440, 2600, 2700, 2820, 2920, 3000, 3120, 3040, 3180, 2610, 2580,
];
const REVENUE_WEEKDAY_WEIGHTS = [0.3, 1.2, 1.05, 1.1, 1.15, 0.9, 0.45];
const EXPENSE_WEEKDAY_WEIGHTS = [0.45, 1.12, 1.05, 1.16, 1.08, 0.92, 0.42];
const REVENUE_DETAILS = [
  { category: "Penjualan barang", counterparties: ["PT Nusantara Niaga", "CV Sumber Makmur", "Toko Berkah Jaya"] },
  { category: "Pendapatan jasa", counterparties: ["PT Cakrawala Digital", "Klinik Sejahtera", "CV Mitra Usaha"] },
  { category: "Pelunasan piutang", counterparties: ["PT Aruna Persada", "CV Karya Mandiri", "PT Bumi Pangan"] },
  { category: "Pendapatan proyek", counterparties: ["PT Konstruksi Utama", "CV Pilar Indonesia", "PT Media Cipta"] },
];
const EXPENSE_DETAILS = [
  { category: "Pembelian persediaan", counterparties: ["PT Sumber Persediaan", "CV Pangan Sentosa", "PT Mitra Distribusi"] },
  { category: "Gaji dan tunjangan", counterparties: ["Payroll karyawan", "Tenaga operasional", "Tenaga profesional"] },
  { category: "Logistik dan pengiriman", counterparties: ["PT Lintas Ekspres", "CV Antar Kota", "Kurir operasional"] },
  { category: "Sewa dan utilitas", counterparties: ["Pengelola gedung", "PLN", "Perumda Air Minum"] },
  { category: "Pemasaran dan perangkat lunak", counterparties: ["Platform iklan digital", "Penyedia SaaS", "Agensi pemasaran"] },
];

export type MockFinancialTransaction = {
  id: string;
  occurredAt: string;
  direction: "pendapatan" | "beban";
  category: string;
  description: string;
  amount: number;
};

export function getJakartaDateKey(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Gagal menentukan tanggal dashboard untuk zona Asia/Jakarta.");
  }

  return `${year}-${month}-${day}`;
}

function monthlyTotal(
  year: number,
  month: number,
  currentYear: number,
  stream: "pendapatan" | "beban",
): number {
  const currentProfile =
    stream === "pendapatan" ? MONTHLY_REVENUE : MONTHLY_EXPENSES;
  const previousProfile =
    stream === "pendapatan" ? PREVIOUS_YEAR_REVENUE : PREVIOUS_YEAR_EXPENSES;

  if (year === currentYear) return currentProfile[month] ?? 0;
  if (year === currentYear - 1) return previousProfile[month] ?? 0;
  if (year < currentYear - 1) {
    return (previousProfile[month] ?? 0) * 0.9 ** (currentYear - year - 1);
  }
  return (currentProfile[month] ?? 0) * 1.08 ** (year - currentYear);
}

function dailyWeight(
  year: number,
  month: number,
  day: number,
  stream: "pendapatan" | "beban",
): number {
  const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
  const weekdayWeight =
    (stream === "pendapatan"
      ? REVENUE_WEEKDAY_WEIGHTS
      : EXPENSE_WEEKDAY_WEIGHTS)[weekday] ?? 1;
  const cycleWeight =
    stream === "pendapatan"
      ? day <= 3
        ? 1.25
        : day >= 25
          ? 1.35
          : day >= 12 && day <= 15
            ? 0.82
            : 1
      : day === 1 || day === 15
        ? 1.5
        : day >= 25
          ? 1.12
          : 1;
  const variation =
    0.82 + (((year * 13 + month * 37 + day * 19) % 37) / 100);
  const largeTransaction =
    stream === "pendapatan" && (day + month) % 17 === 0
      ? 1.55
      : stream === "beban" && (day * 3 + month) % 23 === 0
        ? 1.45
        : 1;

  return weekdayWeight * cycleWeight * variation * largeTransaction;
}

function dailyAmount(
  totalInMillions: number,
  year: number,
  month: number,
  day: number,
  stream: "pendapatan" | "beban",
) {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let totalWeight = 0;

  for (let currentDay = 1; currentDay <= daysInMonth; currentDay += 1) {
    totalWeight += dailyWeight(year, month, currentDay, stream);
  }

  return Math.round(
    (totalInMillions *
      JUTA *
      dailyWeight(year, month, day, stream)) /
      totalWeight,
  );
}

function splitAmount(total: number, count: number, seed: number): number[] {
  const weights = Array.from(
    { length: count },
    (_, index) => 70 + ((seed + index * 29) % 81),
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let allocated = 0;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) return total - allocated;
    const amount = Math.floor((total * weight) / totalWeight);
    allocated += amount;
    return amount;
  });
}

function getTransactionCount(year: number, month: number, day: number): number {
  return 10 + ((year * 13 + month * 7 + day * 19) % 6);
}

function getTransactionTime(index: number, count: number): string {
  const minutesAfterOpening = Math.floor(((index + 1) * 600) / (count + 1));
  const minutesOfDay = 8 * 60 + minutesAfterOpening;
  const hour = String(Math.floor(minutesOfDay / 60)).padStart(2, "0");
  const minute = String(minutesOfDay % 60).padStart(2, "0");
  return `${hour}:${minute}:00+07:00`;
}

function createTransaction(
  date: string,
  index: number,
  occurredAt: string,
  direction: MockFinancialTransaction["direction"],
  amount: number,
  seed: number,
): MockFinancialTransaction {
  const details = direction === "pendapatan" ? REVENUE_DETAILS : EXPENSE_DETAILS;
  const detail = details[(seed + index * 3) % details.length]!;
  const counterparty =
    detail.counterparties[(seed + index * 5) % detail.counterparties.length]!;
  const reference = date.replaceAll("-", "");

  return {
    id: `SAMPLE-${reference}-${String(index + 1).padStart(2, "0")}`,
    occurredAt: `${date}T${occurredAt}`,
    direction,
    category: detail.category,
    description: `${detail.category} — ${counterparty}`,
    amount,
  };
}

export function createMockTransactions(
  asOfDate: string,
): MockFinancialTransaction[] {
  const asOf = parseDateKey(asOfDate);
  const currentYear = asOf.getUTCFullYear();
  const endDate = new Date(
    Date.UTC(currentYear, asOf.getUTCMonth() + 1, 0),
  );
  const startDate = new Date(asOf);
  startDate.setUTCDate(startDate.getUTCDate() - 364);
  const transactions: MockFinancialTransaction[] = [];

  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const dateKey = formatDateKey(date);
    const seed = year * 372 + month * 31 + day;
    const transactionCount = getTransactionCount(year, month, day);
    const revenueCount = Math.round(transactionCount * 0.6);
    const expenseCount = transactionCount - revenueCount;
    const revenueAmounts = splitAmount(
      dailyAmount(
        monthlyTotal(year, month, currentYear, "pendapatan"),
        year,
        month,
        day,
        "pendapatan",
      ),
      revenueCount,
      seed,
    );
    const expenseAmounts = splitAmount(
      dailyAmount(
        monthlyTotal(year, month, currentYear, "beban"),
        year,
        month,
        day,
        "beban",
      ),
      expenseCount,
      seed + 17,
    );
    let revenueIndex = 0;
    let expenseIndex = 0;

    for (let index = 0; index < transactionCount; index += 1) {
      const direction =
        (index * revenueCount) % transactionCount < revenueCount
          ? "pendapatan"
          : "beban";
      const amount =
        direction === "pendapatan"
          ? revenueAmounts[revenueIndex++]!
          : expenseAmounts[expenseIndex++]!;

      transactions.push(
        createTransaction(
          dateKey,
          index,
          getTransactionTime(index, transactionCount),
          direction,
          amount,
          seed,
        ),
      );
    }
  }

  return transactions;
}

export function summarizeTransactions(
  transactions: MockFinancialTransaction[],
  asOfDate: string,
) {
  const daily = new Map<
    string,
    { date: string; pendapatan: number; beban: number; transactionCount: number }
  >();
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    pendapatan: 0,
    beban: 0,
    transactionCount: 0,
  }));

  for (const transaction of transactions) {
    const date = transaction.occurredAt.slice(0, 10);
    const point = daily.get(date) ?? {
      date,
      pendapatan: 0,
      beban: 0,
      transactionCount: 0,
    };
    point[transaction.direction] += transaction.amount;
    point.transactionCount += 1;
    daily.set(date, point);

    if (date === asOfDate) {
      const hour = Number(transaction.occurredAt.slice(11, 13));
      const hourPoint = hourly[hour];
      if (hourPoint) {
        hourPoint[transaction.direction] += transaction.amount;
        hourPoint.transactionCount += 1;
      }
    }
  }

  return {
    trend: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
    hourlyTrend: hourly.filter((point) => point.transactionCount > 0),
  };
}

