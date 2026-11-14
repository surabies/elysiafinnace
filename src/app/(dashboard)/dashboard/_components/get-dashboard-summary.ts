import "server-only";
import { headers } from "next/headers";
import { apiServer } from "@/lib/api-server";
import type { DashboardSummary } from "../_lib/types";
import {
  createMockTransactions,
  getJakartaDateKey,
  summarizeTransactions,
} from "../_lib/dashboard-sample-data";

/** Menggabungkan KPI dari jurnal terposting dengan grafik utama yang masih berupa data contoh. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const asOfDate = getJakartaDateKey();
  const cookie = (await headers()).get("cookie");
  const response = await apiServer.keuangan.laporan["dashboard-ringkasan"].get({
    query: { perTanggal: asOfDate },
    fetch: { headers: cookie ? { cookie } : {} },
  });

  if (response.error) {
    throw new Error(
      `Gagal memuat KPI dashboard dari API keuangan (HTTP ${response.status}).`,
    );
  }
  if (!response.data.success) {
    throw new Error("API keuangan mengembalikan ringkasan dashboard yang tidak valid.");
  }

  const { trend, hourlyTrend } = summarizeTransactions(
    createMockTransactions(asOfDate),
    asOfDate,
  );
  const { comparisonLabel, kpis, aktivitasJurnal } = response.data.data;

  return {
    source: "sample",
    asOfDate,
    comparisonLabel,
    kpis,
    trend,
    hourlyTrend,
    journalActivity: aktivitasJurnal
      ? {
          entries: aktivitasJurnal.jurnalTerbaru,
          draftCount: aktivitasJurnal.jumlahDraft,
        }
      : null,
  };
}
