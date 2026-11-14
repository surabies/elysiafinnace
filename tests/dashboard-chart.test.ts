import { describe, expect, test } from "bun:test";
import {
  aggregateTrend,
  getChartGranularity,
  getPeriodRange,
  shiftDateKey,
} from "../src/app/(dashboard)/dashboard/_lib/chart-period";
import {
  createMockTransactions,
  summarizeTransactions,
} from "../src/app/(dashboard)/dashboard/_lib/dashboard-sample-data";
import { formatRupiah, formatRupiahCompact } from "../src/lib/format";
import { susunLaporanArusKas } from "../src/server/modules/keuangan/laporan/arus-kas";
import { susunRingkasanKpiDashboard } from "../src/server/modules/keuangan/laporan/dashboard-summary";

describe("dashboard chart periods", () => {
  const firstAvailableDate = "2025-11-15";
  const asOfDate = "2026-11-14";

  test("selects the correct date range for each supported period", () => {
    expect(getPeriodRange("day", asOfDate, firstAvailableDate)).toEqual({
      startDate: asOfDate,
      endDate: asOfDate,
    });
    expect(getPeriodRange("week", asOfDate, firstAvailableDate)).toEqual({
      startDate: "2026-11-09",
      endDate: asOfDate,
    });
    expect(getPeriodRange("month", asOfDate, firstAvailableDate)).toEqual({
      startDate: "2026-11-01",
      endDate: asOfDate,
    });
    expect(getPeriodRange("quarter", asOfDate, firstAvailableDate)).toEqual({
      startDate: "2026-10-01",
      endDate: asOfDate,
    });
    expect(getPeriodRange("year", asOfDate, firstAvailableDate)).toEqual({
      startDate: "2026-01-01",
      endDate: asOfDate,
    });
  });

  test("clips ranges to available sample data", () => {
    expect(
      getPeriodRange("year", "2025-12-01", firstAvailableDate),
    ).toEqual({ startDate: firstAvailableDate, endDate: "2025-12-01" });
    expect(
      getPeriodRange("day", "2025-11-14", firstAvailableDate),
    ).toBeNull();
  });

  test("maps periods to chart granularity", () => {
    expect(getChartGranularity("day")).toBe("hour");
    expect(getChartGranularity("week")).toBe("day");
    expect(getChartGranularity("month")).toBe("day");
    expect(getChartGranularity("quarter")).toBe("month");
    expect(getChartGranularity("year")).toBe("month");
  });

  test("aggregates values and transaction counts without loss", () => {
    const points = [
      {
        date: "2026-11-09",
        pendapatan: 10,
        beban: 4,
        transactionCount: 12,
      },
      {
        date: "2026-11-10",
        pendapatan: 20,
        beban: 8,
        transactionCount: 13,
      },
      {
        date: "2026-11-16",
        pendapatan: 30,
        beban: 12,
        transactionCount: 11,
      },
    ];

    expect(aggregateTrend(points, "week")).toEqual([
      {
        startDate: "2026-11-09",
        endDate: "2026-11-10",
        pendapatan: 30,
        beban: 12,
        transactionCount: 25,
      },
      {
        startDate: "2026-11-16",
        endDate: "2026-11-16",
        pendapatan: 30,
        beban: 12,
        transactionCount: 11,
      },
    ]);
  });

  test("creates 10 to 15 realistic transactions through the end of the month", () => {
    const transactions = createMockTransactions(asOfDate);
    const countsByDate = new Map<string, number>();
    const dates = new Set<string>();
    const ids = new Set<string>();

    for (const transaction of transactions) {
      const date = transaction.occurredAt.slice(0, 10);
      countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
      dates.add(date);
      ids.add(transaction.id);
      expect(transaction.amount).toBeGreaterThan(0);
    }

    expect(dates.size).toBe(381);
    expect(
      [...dates].filter((date) => date.startsWith("2026-11-")),
    ).toHaveLength(30);
    expect(transactions.length).toBeGreaterThanOrEqual(dates.size * 10);
    expect(transactions.length).toBeLessThanOrEqual(dates.size * 15);
    expect(ids.size).toBe(transactions.length);
    expect(
      [...countsByDate.values()].every((count) => count >= 10 && count <= 15),
    ).toBe(true);
    expect(new Set(transactions.map((transaction) => transaction.category)).size)
      .toBeGreaterThan(1);
  });

  test("builds daily totals through month-end and a matching intraday summary", () => {
    const summary = summarizeTransactions(
      createMockTransactions(asOfDate),
      asOfDate,
    );
    const firstDate = summary.trend[0]?.date;
    const lastDate = summary.trend.at(-1)?.date;
    const today = summary.trend.find((point) => point.date === asOfDate);
    const hourlyTransactionCount = summary.hourlyTrend.reduce(
      (total, point) => total + point.transactionCount,
      0,
    );
    if (!today) throw new Error("Expected a daily summary for today.");

    expect(summary.trend).toHaveLength(381);
    expect(firstDate).toBe(shiftDateKey(asOfDate, -364));
    expect(lastDate).toBe("2026-11-30");
    expect(
      summary.trend.every(
        (point) => point.transactionCount >= 10 && point.transactionCount <= 15,
      ),
    ).toBe(true);
    expect(hourlyTransactionCount).toBe(today.transactionCount);
    expect(
      summary.hourlyTrend.reduce((total, point) => total + point.pendapatan, 0),
    ).toBe(today.pendapatan);
    expect(
      summary.hourlyTrend.reduce((total, point) => total + point.beban, 0),
    ).toBe(today.beban);
  });
});

describe("dashboard KPI summary", () => {
  test("aggregates posted-ledger totals and carries forward cash balances", () => {
    const summary = susunRingkasanKpiDashboard({
      perTanggal: "2025-02-14",
      akunBulanan: [
        {
          bulan: "2025-01",
          kode: "4000",
          tipeAkun: "PENDAPATAN",
          normalBalance: "KREDIT",
          peranSistem: null,
          debit: "0",
          kredit: "1000",
        },
        {
          bulan: "2025-01",
          kode: "6000",
          tipeAkun: "BEBAN",
          normalBalance: "DEBIT",
          peranSistem: null,
          debit: "200",
          kredit: "0",
        },
        {
          bulan: "2025-01",
          kode: "5000",
          tipeAkun: "BEBAN",
          normalBalance: "DEBIT",
          peranSistem: "HARGA_POKOK_PENJUALAN",
          debit: "100",
          kredit: "0",
        },
        {
          bulan: "2025-01",
          kode: "7000",
          tipeAkun: "PENDAPATAN",
          normalBalance: "KREDIT",
          peranSistem: "LABA_SELISIH_KURS",
          debit: "0",
          kredit: "50",
        },
        {
          bulan: "2025-02",
          kode: "4000",
          tipeAkun: "PENDAPATAN",
          normalBalance: "KREDIT",
          peranSistem: null,
          debit: "0",
          kredit: "1200",
        },
        {
          bulan: "2025-02",
          kode: "6000",
          tipeAkun: "BEBAN",
          normalBalance: "DEBIT",
          peranSistem: null,
          debit: "300",
          kredit: "0",
        },
        {
          bulan: "2025-02",
          kode: "5000",
          tipeAkun: "BEBAN",
          normalBalance: "DEBIT",
          peranSistem: "HARGA_POKOK_PENJUALAN",
          debit: "100",
          kredit: "0",
        },
        {
          bulan: "2025-02",
          kode: "7001",
          tipeAkun: "BEBAN",
          normalBalance: "DEBIT",
          peranSistem: "RUGI_SELISIH_KURS",
          debit: "20",
          kredit: "0",
        },
      ],
      saldoKasAwal: [
        { normalBalance: "DEBIT", debit: "5000", kredit: "0" },
      ],
      mutasiKasBulanan: [
        {
          bulan: "2025-01",
          normalBalance: "DEBIT",
          debit: "1000",
          kredit: "0",
        },
        {
          bulan: "2025-02",
          normalBalance: "DEBIT",
          debit: "0",
          kredit: "250",
        },
      ],
    });

    const pendapatan = summary.kpis.find((kpi) => kpi.id === "pendapatan")!;
    const beban = summary.kpis.find((kpi) => kpi.id === "beban")!;
    const laba = summary.kpis.find((kpi) => kpi.id === "laba")!;
    const kas = summary.kpis.find((kpi) => kpi.id === "kas")!;

    expect(summary.kpis).toHaveLength(4);
    expect(pendapatan.value).toBe("1200.0000");
    expect(pendapatan.deltaPct).toBe(20);
    expect(beban.value).toBe("300.0000");
    expect(laba.value).toBe("780.0000");
    expect(kas.value).toBe("5750.0000");
    expect(kas.trend.at(-2)?.value).toBe("6000.0000");
    expect(kas.trend).toHaveLength(12);
  });

  test("formats database amount strings without converting them to floating point", () => {
    expect(formatRupiah("9007199254740993.0000")).toBe(
      "Rp 9.007.199.254.740.993",
    );
    expect(formatRupiahCompact("1234567890.0000")).toBe("Rp 1,2 M");
    expect(formatRupiahCompact("1250000")).toBe("Rp 1,3 jt");
    expect(formatRupiah("-1234.5000")).toBe("-Rp 1.235");
  });
});

describe("cash flow report summary", () => {
  test("classifies counterpart cash movements and carries forward cash balances", () => {
    const report = susunLaporanArusKas({
      dari: "2026-01-01",
      sampai: "2026-01-31",
      saldoKasAwal: [
        { normalBalance: "DEBIT", debit: "5000", kredit: "0" },
        { normalBalance: "KREDIT", debit: "0", kredit: "100" },
      ],
      akunLawan: [
        {
          kode: "4000",
          nama: "Pendapatan",
          tipeAkun: "PENDAPATAN",
          kategoriArusKas: null,
          debit: "0",
          kredit: "1000",
        },
        {
          kode: "6000",
          nama: "Beban",
          tipeAkun: "BEBAN",
          kategoriArusKas: null,
          debit: "300",
          kredit: "0",
        },
        {
          kode: "1500",
          nama: "Aset tetap",
          tipeAkun: "ASET",
          kategoriArusKas: "INVESTASI",
          debit: "500",
          kredit: "0",
        },
        {
          kode: "3000",
          nama: "Modal",
          tipeAkun: "EKUITAS",
          kategoriArusKas: null,
          debit: "0",
          kredit: "200",
        },
      ],
    });

    expect(report.saldoKasAwal).toBe("5100.0000");
    expect(report.arusKasOperasi.total).toBe("700.0000");
    expect(report.arusKasOperasi.rincian).toHaveLength(2);
    expect(report.arusKasInvestasi.total).toBe("-500.0000");
    expect(report.arusKasPendanaan.total).toBe("200.0000");
    expect(report.kenaikanPenurunanKasBersih).toBe("400.0000");
    expect(report.saldoKasAkhir).toBe("5500.0000");
  });
});
