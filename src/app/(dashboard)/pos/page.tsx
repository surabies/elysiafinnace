import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import {
  PosClientView,
  type ProductPosItem,
  type RegisterItem,
} from "./_components/pos-client-view";

export const metadata: Metadata = {
  title: "Point of Sale (Kasir) | Elysia Finance",
  description: "Terminal kasir POS cepat, barcode scan, manajemen shift kas, pembayaran QRIS/Tunai/EDC, cetak struk thermal, dan integrasi stok otomatis.",
};

interface OptionPelanggan {
  id: string;
  nama: string;
}

export default async function PosPage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resRegisters, resItems, resKontak] = await Promise.all([
    apiServer.keuangan.pos.register.get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.item.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.kontak.get({
      query: { jenis: "PELANGGAN", ukuran: 100 },
      fetch: { headers: headersOption },
    }),
  ]);

  const rawRegisters = (resRegisters.data as RegisterItem[]) ?? [];
  const rawItems = (resItems.data as { items?: ProductPosItem[] })?.items ?? [];
  const rawKontak = (resKontak.data as { items?: OptionPelanggan[] })?.items ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PosClientView
        initialRegisters={rawRegisters}
        initialProducts={rawItems}
        pelangganList={rawKontak}
      />
    </div>
  );
}
