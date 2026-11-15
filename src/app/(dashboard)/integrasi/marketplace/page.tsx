import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireSession } from "@/lib/session";
import { apiServer } from "@/lib/api-server";
import {
  MarketplaceClientView,
  type ItemChannel,
  type ItemMapping,
  type ItemOrderMarketplace,
} from "./_components/marketplace-client-view";

export const metadata: Metadata = {
  title: "Integrasi Marketplace & Omnichannel | Elysia Finance",
  description: "Sinkronisasi otomatis stok multi-gudang dan pesanan penjualan dari Tokopedia, Shopee, TikTok Shop, Lazada, dan Blibli.",
};

interface OptionGudang {
  id: string;
  nama: string;
}

interface OptionItemProduct {
  id: string;
  sku: string;
  nama: string;
  hargaJualStandar?: string | null;
}

export default async function MarketplacePage() {
  await requireSession();

  const cookie = (await headers()).get("cookie");
  const headersOption: Record<string, string> = cookie ? { cookie } : {};

  const [resChannels, resMappings, resPesanan, resGudang, resItems] = await Promise.all([
    apiServer.keuangan.marketplace.channel.get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.marketplace.mapping.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.marketplace.pesanan.get({
      query: { ukuran: 50 },
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.gudang.get({
      fetch: { headers: headersOption },
    }),
    apiServer.keuangan.item.get({
      query: { ukuran: 100 },
      fetch: { headers: headersOption },
    }),
  ]);

  const rawChannels = (resChannels.data as ItemChannel[]) ?? [];
  const rawMappings = (resMappings.data as { items?: ItemMapping[] })?.items ?? [];
  const rawPesanan = (resPesanan.data as { items?: ItemOrderMarketplace[] })?.items ?? [];
  const rawGudang = (resGudang.data?.data as OptionGudang[]) ?? [];
  const rawItems = (resItems.data as { items?: OptionItemProduct[] })?.items ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <MarketplaceClientView
        initialChannels={rawChannels}
        initialMappings={rawMappings}
        initialOrders={rawPesanan}
        gudangList={rawGudang}
        itemsList={rawItems}
      />
    </div>
  );
}
