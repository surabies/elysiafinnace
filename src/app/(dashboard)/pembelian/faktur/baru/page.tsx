import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import {
  FakturPembelianFormPage,
  type AkunOption,
  type GudangOption,
  type ItemOption,
  type PemasokOption,
  type TerminOption,
} from "./_components/faktur-pembelian-form-page";

export const metadata: Metadata = {
  title: "Catat Tagihan Pembelian Baru | Elysia Finance",
  description: "Formulir pencatatan tagihan masuk pemasok, pengadaan barang masuk, dan pengakuan hutang usaha (AP).",
};

export default async function FakturPembelianBaruPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resKontak, resItem, resTermin, resGudang, resAkun] = await Promise.all([
    apiServer.keuangan.kontak.get({
      query: { jenis: "PEMASOK", ukuran: 1000 },
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
    Array.isArray((resKontak.data as unknown as { data?: PemasokOption[] })?.data)
      ? (resKontak.data as unknown as { data: PemasokOption[] }).data
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
    <FakturPembelianFormPage
      pemasokOptions={rawKontak}
      itemOptions={rawItems}
      terminOptions={rawTermin}
      gudangOptions={rawGudang}
      akunOptions={rawAkun}
    />
  );
}
