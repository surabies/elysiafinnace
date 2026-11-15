import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { MataUangClientView } from "./_components/mata-uang-client-view";
import type { ItemKurs, ItemMataUang, MataUangStats } from "./_lib/types";

export const metadata: Metadata = {
  title: "Mata Uang & Kurs Valas | Elysia Finance",
  description: "Kelola mata uang transaksi, multi-currency, dan nilai kurs historis.",
};

export default async function MataUangPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resMataUang, resKurs] = await Promise.all([
    apiServer.keuangan["mata-uang"].get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.kurs.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
  ]);

  const rawCurrencies = (resMataUang.data?.data as unknown as ItemMataUang[]) ?? [];
  const rawRates = (resKurs.data?.data as unknown as ItemKurs[]) ?? [];

  const dasar = rawCurrencies.find((c) => c.adalahMataUangDasar);
  const stats: MataUangStats = {
    total: rawCurrencies.length,
    dasarKode: dasar ? `${dasar.kode} (${dasar.simbol})` : "IDR (Rp)",
    valasAktif: rawCurrencies.filter((c) => !c.adalahMataUangDasar && c.aktif).length,
    totalKurs: (resKurs.data as { meta?: { total?: number } })?.meta?.total ?? rawRates.length,
  };

  return <MataUangClientView initialCurrencies={rawCurrencies} initialRates={rawRates} stats={stats} />;
}
