import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { TagClientView } from "./_components/tag-client-view";
import type { ItemTag } from "./_lib/types";

export const metadata: Metadata = {
  title: "Tag Transaksi | Elysia Finance",
  description: "Kelola label warna dimensi transaksi untuk analisis dan filter laporan laba rugi.",
};

export default async function TagPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const res = await apiServer.keuangan.dimensi.tag.get({
    fetch: { headers: headersOption },
  });

  const payload = res.data?.data;
  const rawItems = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === "object" &&
        "items" in payload &&
        Array.isArray((payload as { items: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  const rawList: ItemTag[] = (rawItems as Record<string, unknown>[]).map((item) => ({
    id: String(item.id),
    nama: String(item.nama),
    warna: item.warna ? String(item.warna) : null,
    keterangan: item.keterangan ? String(item.keterangan) : null,
    aktif: Boolean(item.aktif),
    dibuatPada: String(item.dibuatPada),
    diubahPada: String(item.diubahPada),
  }));

  const stats = {
    total: rawList.length,
    aktif: rawList.filter((t) => t.aktif).length,
    nonaktif: rawList.filter((t) => !t.aktif).length,
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <TagClientView initialData={rawList} stats={stats} />
    </div>
  );
}
