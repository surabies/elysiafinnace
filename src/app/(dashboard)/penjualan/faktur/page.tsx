import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import type { SalesYear } from "./_components/sales-overview";
import {
  FakturPenjualanClientView,
  type ItemFakturPenjualan,
} from "./_components/faktur-penjualan-client-view";

export const metadata: Metadata = {
  title: "Faktur Penjualan (Invoices) | Elysia Finance",
  description: "Daftar faktur komersial penjualan, pemantauan piutang usaha (AR), dan analitik omset.",
};

export default async function FakturPenjualanPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resFaktur, resRingkasan] = await Promise.all([
    apiServer.keuangan.penjualan.faktur.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.penjualan.ringkasan.get({
      fetch: { headers: headersOption },
    }),
  ]);

  const rawInvoices = (
    Array.isArray((resFaktur.data as unknown as { data?: { data?: ItemFakturPenjualan[] } })?.data?.data)
      ? (resFaktur.data as unknown as { data: { data: ItemFakturPenjualan[] } }).data.data
      : Array.isArray((resFaktur.data as unknown as { data?: ItemFakturPenjualan[] })?.data)
        ? (resFaktur.data as unknown as { data: ItemFakturPenjualan[] }).data
        : []
  );

  const rawAnalytics = (resRingkasan.data as unknown as { data?: SalesYear[] })?.data ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <FakturPenjualanClientView
        initialInvoices={rawInvoices}
        analyticsYears={rawAnalytics}
      />
    </div>
  );
}
