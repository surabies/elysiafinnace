import * as React from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import {
  FakturPenjualanFormPage,
  type AkunOption,
  type GudangOption,
  type ItemOption,
  type PelangganOption,
  type TerminOption,
} from "./_components/faktur-penjualan-form-page";

export const metadata: Metadata = {
  title: "Buat Faktur Penjualan Baru | Elysia Finance",
  description: "Formulir penerbitan faktur penjualan komersial, pemilihan barang persediaan, dan kalkulasi piutang usaha.",
};

function FakturPenjualanSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-lg bg-muted" />
          <div className="h-4 w-96 rounded-md bg-muted/60" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border border-border/80 bg-card p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-14 rounded-lg bg-muted/50" />
          <div className="h-14 rounded-lg bg-muted/50" />
          <div className="h-14 rounded-lg bg-muted/50" />
        </div>
        <div className="h-44 rounded-lg bg-muted/40" />
        <div className="h-28 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}

async function FakturPenjualanDataLoader() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resKontak, resItem, resTermin, resGudang, resAkun] = await Promise.all([
    apiServer.keuangan.kontak.get({
      query: { jenis: "PELANGGAN", ukuran: 1000 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.item.get({
      query: { ukuran: 1000 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan["termin-pembayaran"].get({
      query: { aktif: true },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.gudang.get({
      query: { aktif: true },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.akun.get({
      query: { aktif: true, bisaDiposting: true },
      fetch: { headers: headersOption },
    }),
  ]);

  const rawKontak = (
    Array.isArray((resKontak.data as unknown as { data?: PelangganOption[] })?.data)
      ? (resKontak.data as unknown as { data: PelangganOption[] }).data
      : []
  );

  const rawItems = (
    Array.isArray((resItem.data as unknown as { data?: ItemOption[] })?.data)
      ? (resItem.data as unknown as { data: ItemOption[] }).data
      : []
  );

  const rawTermin = (
    Array.isArray((resTermin.data as unknown as { data?: TerminOption[] })?.data)
      ? (resTermin.data as unknown as { data: TerminOption[] }).data
      : []
  );

  const rawGudang = (
    Array.isArray((resGudang.data as unknown as { data?: GudangOption[] })?.data)
      ? (resGudang.data as unknown as { data: GudangOption[] }).data
      : []
  );

  const rawAkun = (
    Array.isArray((resAkun.data as unknown as { data?: AkunOption[] })?.data)
      ? (resAkun.data as unknown as { data: AkunOption[] }).data
      : []
  );

  return (
    <FakturPenjualanFormPage
      pelangganOptions={rawKontak}
      itemOptions={rawItems}
      terminOptions={rawTermin}
      gudangOptions={rawGudang}
      akunOptions={rawAkun}
    />
  );
}

export default function FakturPenjualanBaruPage() {
  return (
    <Suspense fallback={<FakturPenjualanSkeleton />}>
      <FakturPenjualanDataLoader />
    </Suspense>
  );
}
