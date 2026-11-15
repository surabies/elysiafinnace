import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import { LeadsClientView, type ItemLead } from "./_components/leads-client-view";

export const metadata: Metadata = {
  title: "Prospek & Leads CRM | Elysia Finance",
  description: "Manajemen calon pelanggan, kualifikasi prospek bisnis, dan konversi otomatis menjadi Master Kontak Pelanggan.",
};

export default async function LeadsPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const resLeads = await apiServer.keuangan.crm.lead.get({
    query: { ukuran: 100 },
    fetch: { headers: headersOption },
  });

  const rawLeads = (resLeads.data as { items?: ItemLead[] })?.items ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <LeadsClientView initialLeads={rawLeads} />
    </div>
  );
}
