import "server-only";
import { headers } from "next/headers";
import { apiServer } from "@/lib/api-server";
import type { AgingBucketSummary, BankAccountSummary, DashboardSummary } from "../_lib/types";
import {
  createMockTransactions,
  getJakartaDateKey,
  summarizeTransactions,
} from "../_lib/dashboard-sample-data";

/** Menggabungkan KPI dashboard dengan analitika penagihan, kewajiban, kas bank, dan tren finansial. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const asOfDate = getJakartaDateKey();
  const cookie = (await headers()).get("cookie");
  const authHeaders: Record<string, string> = cookie ? { cookie } : {};

  // Panggil endpoint utama dan pendukung secara paralel
  const [
    kpiResponse,
    agingPiutangResponse,
    agingHutangResponse,
    rekeningResponse,
    neracaResponse,
  ] = await Promise.all([
    apiServer.keuangan.laporan["dashboard-ringkasan"].get({
      query: { perTanggal: asOfDate },
      fetch: { headers: authHeaders },
    }),
    apiServer.keuangan.laporan["aging-piutang"].get({
      query: { perTanggal: asOfDate },
      fetch: { headers: authHeaders },
    }).catch(() => null),
    apiServer.keuangan.laporan["aging-hutang"].get({
      query: { perTanggal: asOfDate },
      fetch: { headers: authHeaders },
    }).catch(() => null),
    apiServer.keuangan["rekening-bank"].get({
      query: { aktif: true },
      fetch: { headers: authHeaders },
    }).catch(() => null),
    apiServer.keuangan.laporan.neraca.get({
      query: { perTanggal: asOfDate },
      fetch: { headers: authHeaders },
    }).catch(() => null),
  ]);

  if (kpiResponse.error) {
    throw new Error(
      `Gagal memuat KPI dashboard dari API keuangan (HTTP ${kpiResponse.status}).`,
    );
  }
  if (!kpiResponse.data.success) {
    throw new Error("API keuangan mengembalikan ringkasan dashboard yang tidak valid.");
  }

  const { trend, hourlyTrend } = summarizeTransactions(
    createMockTransactions(asOfDate),
    asOfDate,
  );
  const { comparisonLabel, kpis, aktivitasJurnal } = kpiResponse.data.data;

  // Peta saldo akun neraca berdasarkan kode akun CoA
  const saldoPerAkun = new Map<string, string>();
  if (neracaResponse && !neracaResponse.error && neracaResponse.data.success) {
    for (const item of neracaResponse.data.data.aset.rincian) {
      saldoPerAkun.set(item.kode, item.saldo);
    }
  }

  // Petakan rekening bank & kas aktif dengan saldo riil buku besar
  let bankAccounts: BankAccountSummary[] = [];
  if (rekeningResponse && !rekeningResponse.error && rekeningResponse.data.success) {
    const list = rekeningResponse.data.data as Array<{
      id: string;
      kode: string;
      nama: string;
      jenis: string;
      namaBank?: string | null;
      nomorRekening?: string | null;
      kodeMataUang: string;
      kodeAkunCoa?: string;
      namaAkunCoa?: string;
    }>;
    bankAccounts = list.map((rek) => ({
      id: rek.id,
      kode: rek.kode,
      nama: rek.nama,
      jenis: (rek.jenis === "KAS" ? "KAS" : "BANK") as "KAS" | "BANK",
      namaBank: rek.namaBank,
      nomorRekening: rek.nomorRekening,
      kodeMataUang: rek.kodeMataUang,
      saldo: (rek.kodeAkunCoa ? saldoPerAkun.get(rek.kodeAkunCoa) : undefined) ?? "0",
      kodeAkunCoa: rek.kodeAkunCoa,
      namaAkunCoa: rek.namaAkunCoa,
    }));
  }

  // Petakan ringkasan AR Aging (Piutang Usaha)
  let agingPiutang: AgingBucketSummary | null = null;
  if (agingPiutangResponse && !agingPiutangResponse.error && agingPiutangResponse.data.success) {
    const r = agingPiutangResponse.data.data.ringkasan;
    agingPiutang = {
      current: r.current,
      hari1_30: r.hari1_30,
      hari31_60: r.hari31_60,
      hari61_90: r.hari61_90,
      hari90Plus: r.hari90Plus,
      total: r.total,
    };
  }

  // Petakan ringkasan AP Aging (Hutang Usaha)
  let agingHutang: AgingBucketSummary | null = null;
  if (agingHutangResponse && !agingHutangResponse.error && agingHutangResponse.data.success) {
    const r = agingHutangResponse.data.data.ringkasan;
    agingHutang = {
      current: r.current,
      hari1_30: r.hari1_30,
      hari31_60: r.hari31_60,
      hari61_90: r.hari61_90,
      hari90Plus: r.hari90Plus,
      total: r.total,
    };
  }

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
    bankAccounts,
    agingPiutang,
    agingHutang,
  };
}
