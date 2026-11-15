import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { DealsClientView, type ItemDeal } from "./_components/deals-client-view";

export const metadata: Metadata = {
  title: "Peluang Penjualan (Deals Pipeline) | Elysia Finance",
  description: "Pipeline peluang penjualan, visualisasi tahapan deals, estimasi closing rate, dan konversi ke invoice penjualan.",
};

interface OptionItem {
  id: string;
  nama: string;
}

export default async function DealsPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resDeals, resLeads, resKontak] = await Promise.all([
    apiServer.keuangan.crm.deal.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.crm.lead.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.kontak.get({
      query: { jenis: "PELANGGAN", ukuran: 100 },
      fetch: { headers: headersOption },
    }),
  ]);

  const rawDeals = (resDeals.data as { items?: ItemDeal[] })?.items ?? [];
  const rawLeads = (resLeads.data as { items?: OptionItem[] })?.items ?? [];
  const rawKontak = (resKontak.data as { items?: OptionItem[] })?.items ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <DealsClientView
        initialDeals={rawDeals}
        leadsList={rawLeads}
        kontakList={rawKontak}
      />
    </div>
  );
}
