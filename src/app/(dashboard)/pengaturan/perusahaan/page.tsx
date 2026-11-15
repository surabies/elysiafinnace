import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { PerusahaanClientView } from "./_components/perusahaan-client-view";
import type { ItemPerusahaan, MataUangOption, PerusahaanStats } from "./_lib/types";

export const metadata: Metadata = {
  title: "Profil Perusahaan & Multi-Entitas | Elysia Finance",
  description: "Kelola badan hukum, NPWP, domisili legal bisnis, dan struktur grup holding.",
};

export default async function PerusahaanPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resCompanies, resMataUang] = await Promise.all([
    apiServer.keuangan.kontrol.perusahaan.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan["mata-uang"].get({
      fetch: { headers: headersOption },
    }),
  ]);

  const rawCompanies = (resCompanies.data as unknown as { items?: ItemPerusahaan[] })?.items ?? [];
  const rawCurrencies = (resMataUang.data as unknown as { data?: MataUangOption[] })?.data ?? (resMataUang.data as unknown as MataUangOption[]) ?? [];

  const dasar = rawCurrencies.find((c: MataUangOption & { adalahMataUangDasar?: boolean }) => (c as { adalahMataUangDasar?: boolean }).adalahMataUangDasar);

  const stats: PerusahaanStats = {
    totalEntitas: rawCompanies.length,
    entitasHolding: rawCompanies.filter((c) => c.adalahHolding).length,
    entitasAktif: rawCompanies.filter((c) => c.aktif).length,
    mataUangUtama: dasar ? `${dasar.kode} (${dasar.simbol})` : "IDR (Rp)",
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PerusahaanClientView
        initialCompanies={rawCompanies}
        currencies={rawCurrencies}
        stats={stats}
      />
    </div>
  );
}
