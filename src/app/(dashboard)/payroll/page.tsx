import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { PayrollClientView, type ItemPayroll } from "./_components/payroll-client-view";

export const metadata: Metadata = {
  title: "Payroll & Penggajian Karyawan | Elysia Finance",
  description: "Kelola batch penggajian bulanan, perhitungan PPh 21 TER (PMK 168), BPJS, dan posting jurnal otomatis.",
};

interface OptionKaryawan {
  id: string;
  nama: string;
  aktif: boolean;
}

interface OptionBankAccount {
  id: string;
  kode: string;
  nama: string;
}

export default async function PayrollPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resPayroll, resKaryawan, resBank] = await Promise.all([
    apiServer.keuangan.payroll.proses.get({
      query: { ukuran: 50 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.payroll.karyawan.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan["rekening-bank"].get({
      fetch: { headers: headersOption },
    }),
  ]);

  const rawPayroll = (resPayroll.data as { items?: ItemPayroll[] })?.items ?? [];
  const rawKaryawan = (resKaryawan.data as { items?: OptionKaryawan[] })?.items ?? [];
  const rawBank = (resBank.data?.data as OptionBankAccount[]) ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PayrollClientView
        initialPayrolls={rawPayroll}
        karyawanList={rawKaryawan}
        bankAccounts={rawBank}
      />
    </div>
  );
}
