import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { ProdukClientView } from "./_components/produk-client-view";
import type {
  ItemProduk,
  ProdukStats,
  KategoriOption,
  SatuanOption,
  AkunOption,
} from "./_lib/types";

export const metadata: Metadata = {
  title: "Katalog Produk & Jasa | Elysia Finance",
  description: "Kelola master produk, harga standar, kategori, dan pemetaan akun buku besar.",
};

export default async function ProdukPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resItem, resKategori, resSatuan, resAkun] = await Promise.all([
    apiServer.keuangan.item.get({
      query: { ukuran: 1000 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan["kategori-produk"].get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.satuan.get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.akun.get({
      fetch: { headers: headersOption },
    }),
  ]);

  const rawItems = (resItem.data?.data as unknown as Record<string, unknown>[]) ?? [];
  const rawKategori = (resKategori.data?.data as unknown as Record<string, unknown>[]) ?? [];
  const rawSatuan = (resSatuan.data?.data as unknown as Record<string, unknown>[]) ?? [];
  const rawAkun = (resAkun.data?.data as unknown as Record<string, unknown>[]) ?? [];

  const kategoriMap = new Map<string, string>();
  const kategoriOptions: KategoriOption[] = rawKategori.map((k) => {
    const id = String(k.id);
    const nama = String(k.nama);
    kategoriMap.set(id, nama);
    return {
      id,
      kode: String(k.kode),
      nama,
    };
  });

  const satuanMap = new Map<string, { kode: string; nama: string }>();
  const satuanOptions: SatuanOption[] = rawSatuan.map((s) => {
    const id = String(s.id);
    const kode = String(s.kode);
    const nama = String(s.nama);
    satuanMap.set(id, { kode, nama });
    return {
      id,
      kode,
      nama,
    };
  });

  const akunOptions: AkunOption[] = rawAkun.map((a) => ({
    id: String(a.id),
    kode: String(a.kode),
    nama: String(a.nama),
    tipeAkun: String(a.tipeAkun),
  }));

  const items: ItemProduk[] = rawItems.map((item) => {
    const katId = item.kategoriId ? String(item.kategoriId) : null;
    const satId = String(item.satuanId);
    const satInfo = satuanMap.get(satId);

    return {
      id: String(item.id),
      sku: String(item.sku),
      barcode: item.barcode ? String(item.barcode) : null,
      nama: String(item.nama),
      deskripsi: item.deskripsi ? String(item.deskripsi) : null,
      tipeBarang: item.tipeBarang as ItemProduk["tipeBarang"],
      kategoriId: katId,
      kategoriNama: katId ? kategoriMap.get(katId) ?? null : null,
      satuanId: satId,
      satuanKode: satInfo?.kode ?? null,
      satuanNama: satInfo?.nama ?? null,
      hargaBeliStandar: String(item.hargaBeliStandar ?? "0"),
      hargaJualStandar: String(item.hargaJualStandar ?? "0"),
      stokMinimum: String(item.stokMinimum ?? "0"),
      akunPersediaanId: item.akunPersediaanId ? String(item.akunPersediaanId) : null,
      akunHppId: item.akunHppId ? String(item.akunHppId) : null,
      akunPendapatanId: item.akunPendapatanId ? String(item.akunPendapatanId) : null,
      tags: (item.tags as Array<{ id: string; nama: string; warna: string }>) ?? [],
      aktif: Boolean(item.aktif),
      createdAt: item.createdAt as string,
    };
  });

  const stats: ProdukStats = {
    totalItem: items.length,
    totalPersediaan: items.filter((i) => i.tipeBarang === "BARANG_PERSEDIAAN").length,
    totalNonPersediaan: items.filter((i) => i.tipeBarang === "BARANG_NON_PERSEDIAAN").length,
    totalJasa: items.filter((i) => i.tipeBarang === "JASA").length,
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <ProdukClientView
        initialData={items}
        stats={stats}
        kategoriOptions={kategoriOptions}
        satuanOptions={satuanOptions}
        akunOptions={akunOptions}
      />
    </div>
  );
}
