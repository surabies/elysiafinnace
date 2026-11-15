import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { SatuanClientView } from "./_components/satuan-client-view";
import type { SatuanItem, SatuanStats } from "./_lib/types";

export const metadata: Metadata = {
  title: "Master Satuan Pengukuran (UOM) | Elysia Finance",
  description: "Kelola unit of measurement (satuan dasar dan konversi kemasan produk).",
};

export default async function SatuanPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const res = await apiServer.keuangan.satuan.get({
    fetch: { headers: headersOption },
  });

  const rawList = (res.data?.data as unknown as Record<string, unknown>[]) ?? [];

  const items: SatuanItem[] = rawList.map((item) => ({
    id: String(item.id),
    kode: String(item.kode),
    nama: String(item.nama),
    aktif: Boolean(item.aktif),
    createdAt: item.createdAt as string,
  }));

  const stats: SatuanStats = {
    totalSatuan: items.length,
    satuanAktif: items.filter((s) => s.aktif).length,
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <SatuanClientView initialData={items} stats={stats} />
    </div>
  );
}
