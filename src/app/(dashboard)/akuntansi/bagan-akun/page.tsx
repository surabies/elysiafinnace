import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { CoaClientView } from "./_components/coa-client-view";
import type { AkunItem, CoaStats, NodeAkun } from "./_lib/types";

export const metadata: Metadata = {
  title: "Bagan Akun (Chart of Accounts) — Elysia Finance",
};

export default function BaganAkunPage() {
  return (
    <Suspense fallback={<CoaSkeleton />}>
      <BaganAkunContent />
    </Suspense>
  );
}

function CoaSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>

      <div className="h-14 animate-pulse rounded-lg bg-muted" />
      <div className="h-96 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

async function BaganAkunContent() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  // Ambil struktur pohon & daftar datar secara paralel
  const [pohonRes, daftarRes] = await Promise.all([
    apiServer.keuangan.akun.pohon.get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.akun.get({
      fetch: { headers: headersOption },
    }),
  ]);

  const treeData = (pohonRes.data?.data as NodeAkun[]) ?? [];
  const flatData = (daftarRes.data?.data as AkunItem[]) ?? [];

  const stats: CoaStats = {
    totalAkun: flatData.length,
    totalAset: flatData.filter((a) => a.tipeAkun === "ASET").length,
    totalKewajiban: flatData.filter((a) => a.tipeAkun === "KEWAJIBAN").length,
    totalEkuitas: flatData.filter((a) => a.tipeAkun === "EKUITAS").length,
    totalPendapatan: flatData.filter((a) => a.tipeAkun === "PENDAPATAN").length,
    totalBeban: flatData.filter((a) => a.tipeAkun === "BEBAN").length,
  };

  return (
    <CoaClientView
      initialTree={treeData}
      initialList={flatData}
      stats={stats}
    />
  );
}
