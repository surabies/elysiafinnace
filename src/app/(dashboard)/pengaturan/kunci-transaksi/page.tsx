import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { KunciTransaksiClientView } from "./_components/kunci-transaksi-client-view";
import type { DataKunciTransaksi, KunciTransaksiStats } from "./_lib/types";
import type { ItemPerusahaan } from "../perusahaan/_lib/types";

export const metadata: Metadata = {
  title: "Kunci Transaksi (Lock Date) | Elysia Finance",
  description: "Cegah perubahan tidak sah dan backdating pada periode pembukuan yang telah ditutup atau diaudit.",
};

export default async function KunciTransaksiPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resKunci, resCompanies] = await Promise.all([
    apiServer.keuangan.kontrol["kunci-transaksi"].get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.kontrol.perusahaan.get({
      query: { ukuran: 10 },
      fetch: { headers: headersOption },
    }),
  ]);

  const rawKunci = (resKunci.data as unknown as { data?: DataKunciTransaksi })?.data ?? (resKunci.data as unknown as DataKunciTransaksi) ?? {
    id: null,
    perusahaanId: null,
    kunciSemuaSebelum: null,
    kunciNonAdminSebelum: null,
    catatan: null,
  };

  const rawCompanies = (resCompanies.data as unknown as { items?: ItemPerusahaan[] })?.items ?? [];
  const primaryCompany = rawCompanies[0] ?? null;

  const statusKunci = rawKunci.kunciSemuaSebelum
    ? "TERKUNCI"
    : rawKunci.kunciNonAdminSebelum
      ? "PARSIAL"
      : "TERBUKA";

  const stats: KunciTransaksiStats = {
    statusKunci,
    kunciSemua: rawKunci.kunciSemuaSebelum,
    kunciNonAdmin: rawKunci.kunciNonAdminSebelum,
    perusahaanNama: primaryCompany?.nama ?? "Entitas Utama",
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <KunciTransaksiClientView
        initialData={rawKunci}
        stats={stats}
        companyId={primaryCompany?.id ?? null}
      />
    </div>
  );
}
