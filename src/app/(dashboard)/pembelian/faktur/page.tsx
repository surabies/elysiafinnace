import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import type { SalesYear } from "./_components/purchases-overview";
import {
  FakturPembelianClientView,
  type ItemFakturPembelian,
} from "./_components/faktur-pembelian-client-view";

export const metadata: Metadata = {
  title: "Tagihan Pembelian (Bills) | Elysia Finance",
  description: "Kelola penerimaan tagihan pemasok, pemantauan hutang usaha (AP), jadwal jatuh tempo pengadaan, dan analitik belanja.",
};

export default async function FakturPembelianPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resFaktur, resRingkasan] = await Promise.all([
    apiServer.keuangan.pembelian.faktur.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.pembelian.ringkasan.get({
      fetch: { headers: headersOption },
    }),
  ]);

  const rawBills = (
    Array.isArray((resFaktur.data as unknown as { data?: { data?: ItemFakturPembelian[] } })?.data?.data)
      ? (resFaktur.data as unknown as { data: { data: ItemFakturPembelian[] } }).data.data
      : Array.isArray((resFaktur.data as unknown as { data?: ItemFakturPembelian[] })?.data)
        ? (resFaktur.data as unknown as { data: ItemFakturPembelian[] }).data
        : []
  );

  const rawAnalytics = (resRingkasan.data as unknown as { data?: SalesYear[] })?.data ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <FakturPembelianClientView
        initialBills={rawBills}
        analyticsYears={rawAnalytics}
      />
    </div>
  );
}
