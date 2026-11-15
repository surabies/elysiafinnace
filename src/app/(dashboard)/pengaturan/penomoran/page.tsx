import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { PenomoranClientView } from "./_components/penomoran-client-view";
import type { ItemPenomoran } from "./_lib/types";

export const metadata: Metadata = {
  title: "Penomoran Dokumen Otomatis | Elysia Finance",
  description: "Kelola pola prefiks dan nomor urut transaksi bisnis otomatis.",
};

export default async function PenomoranPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const res = await apiServer.keuangan.penomoran.get({
    fetch: { headers: headersOption },
  });

  const rawList = (res.data?.data as unknown as ItemPenomoran[]) ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PenomoranClientView initialData={rawList} />
    </div>
  );
}
