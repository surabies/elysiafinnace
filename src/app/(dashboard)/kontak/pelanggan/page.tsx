import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { KontakClientView } from "../_components/kontak-client-view";
import type { KontakItem, KontakStats, TerminOption } from "../_lib/types";

export const metadata: Metadata = {
  title: "Pelanggan (Customers) — Elysia Finance",
};

export default function PelangganPage() {
  return (
    <Suspense fallback={<KontakSkeleton />}>
      <PelangganContent />
    </Suspense>
  );
}

function KontakSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>

      <div className="h-14 animate-pulse rounded-lg bg-muted" />
      <div className="h-96 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

async function PelangganContent() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  // Ambil daftar pelanggan & daftar termin pembayaran paralel
  const [kontakRes, terminRes] = await Promise.all([
    apiServer.keuangan.kontak.get({
      query: { jenis: "PELANGGAN", ukuran: 1000 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan["termin-pembayaran"].get({
      query: { aktif: true },
      fetch: { headers: headersOption },
    }),
  ]);

  const rawList = (kontakRes.data?.data as unknown as KontakItem[]) ?? [];
  const terminList = (terminRes.data?.data as unknown as TerminOption[]) ?? [];

  const stats: KontakStats = {
    total: rawList.length,
    aktif: rawList.filter((k) => k.aktif).length,
    nonaktif: rawList.filter((k) => !k.aktif).length,
    totalBatasKredit: rawList.reduce((acc, curr) => acc + Number(curr.batasKredit || 0), 0),
    pkpCount: rawList.filter((k) => k.adalahPkp).length,
  };

  return (
    <KontakClientView
      initialData={rawList}
      stats={stats}
      entityTitle="Pelanggan"
      jenis="PELANGGAN"
      terminOptions={terminList}
    />
  );
}
