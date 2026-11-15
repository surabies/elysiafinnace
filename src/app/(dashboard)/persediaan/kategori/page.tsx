import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { KategoriClientView } from "./_components/kategori-client-view";
import type { KategoriItem, KategoriStats } from "./_lib/types";

export const metadata: Metadata = {
  title: "Master Kategori Produk | Elysia Finance",
  description: "Kelola hierarki klasifikasi produk, persediaan, dan layanan bisnis.",
};

export default async function KategoriPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const res = await apiServer.keuangan["kategori-produk"].get({
    fetch: { headers: headersOption },
  });

  const rawList = (res.data?.data as unknown as Record<string, unknown>[]) ?? [];

  const petaNama = new Map<string, string>();
  for (const item of rawList) {
    petaNama.set(String(item.id), String(item.nama));
  }

  const items: KategoriItem[] = rawList.map((item) => {
    const id = String(item.id);
    const indukId = item.indukId ? String(item.indukId) : null;
    return {
      id,
      kode: String(item.kode),
      nama: String(item.nama),
      indukId,
      indukNama: indukId ? petaNama.get(indukId) ?? null : null,
      keterangan: item.keterangan ? String(item.keterangan) : null,
      tags: (item.tags as Array<{ id: string; nama: string; warna: string }>) ?? [],
      aktif: Boolean(item.aktif),
      createdAt: item.createdAt as string,
    };
  });

  const stats: KategoriStats = {
    totalKategori: items.length,
    kategoriAktif: items.filter((k) => k.aktif).length,
    kategoriInduk: items.filter((k) => !k.indukId).length,
    subKategori: items.filter((k) => Boolean(k.indukId)).length,
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <KategoriClientView initialData={items} stats={stats} />
    </div>
  );
}
