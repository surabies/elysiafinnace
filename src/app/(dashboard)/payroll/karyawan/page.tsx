import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { KaryawanClientView, type ItemKaryawan } from "./_components/karyawan-client-view";

export const metadata: Metadata = {
  title: "Direktori Karyawan & SDM | Elysia Finance",
  description: "Daftar induk karyawan, jabatan, gaji pokok, status PTKP pajak, dan rekening bank penggajian.",
};

export default async function KaryawanPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const resKaryawan = await apiServer.keuangan.payroll.karyawan.get({
    query: { ukuran: 100 },
    fetch: { headers: headersOption },
  });

  const rawKaryawan = (resKaryawan.data as { items?: ItemKaryawan[] })?.items ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <KaryawanClientView initialKaryawan={rawKaryawan} />
    </div>
  );
}
