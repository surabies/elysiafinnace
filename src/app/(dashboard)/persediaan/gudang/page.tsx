import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { GudangClientView } from "./_components/gudang-client-view";
import type { GudangItem, GudangStats } from "./_lib/types";

export const metadata: Metadata = {
  title: "Manajemen Gudang | Elysia Finance",
  description: "Kelola lokasi fisik penyimpanan persediaan, gudang utama, dan penanggung jawab.",
};

export default async function GudangPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const resGudang = await apiServer.keuangan.gudang.get({
    fetch: { headers: headersOption },
  });
  const rawGudang = (resGudang.data?.data as unknown as Record<string, unknown>[]) ?? [];

  const listGudang: GudangItem[] = rawGudang.map((g) => ({
    id: String(g.id),
    kode: String(g.kode),
    nama: String(g.nama),
    alamat: g.alamat ? String(g.alamat) : null,
    penanggungJawab: g.penanggungJawab ? String(g.penanggungJawab) : null,
    adalahGudangUtama: Boolean(g.adalahGudangUtama),
    aktif: Boolean(g.aktif),
    keterangan: g.keterangan ? String(g.keterangan) : null,
    createdAt: g.createdAt as string,
  }));

  const gudangUtama = listGudang.find((g) => g.adalahGudangUtama);

  const stats: GudangStats = {
    totalGudang: listGudang.length,
    gudangAktif: listGudang.filter((g) => g.aktif).length,
    gudangUtamaNama: gudangUtama ? `${gudangUtama.kode} - ${gudangUtama.nama}` : "",
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <GudangClientView initialData={listGudang} stats={stats} />
    </div>
  );
}
