import * as React from "react";
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

export default async function FakturPenjualanBaruPage() {
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
