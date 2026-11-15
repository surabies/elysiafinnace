"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconBuildingStore,
  IconClock,
  IconEdit,
  IconLink,
  IconLoader2,
  IconPackages,
  IconPlus,
  IconRefresh,
  IconShoppingCart,
  IconTrash,
} from "@tabler/icons-react";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import { ChannelDialog } from "./channel-dialog";
import { MappingDialog } from "./mapping-dialog";

export type PlatformMarketplace = "TOKOPEDIA" | "SHOPEE" | "TIKTOK" | "LAZADA" | "BLIBLI";

export interface ItemChannel {
  id: string;
  kode: string;
  nama: string;
  channel: PlatformMarketplace;
  shopId?: string | null;
  apiKey?: string | null;
  gudangId: string;
  gudangNama: string;
  status: "AKTIF" | "NONAKTIF" | "ERROR";
  terakhirSinkron?: Date | string | null;
}

export interface ItemMapping {
  id: string;
  channelId: string;
  channelNama: string;
  channelTipe: PlatformMarketplace;
  itemId: string;
  itemSku: string;
  itemNama: string;
  marketplaceSku: string;
  marketplaceItemId?: string | null;
  marketplaceItemName?: string | null;
  hargaSinkron: string;
  aktif: boolean;
  terakhirSinkron?: Date | string | null;
}

export interface ItemOrderMarketplace {
  id: string;
  channelId: string;
  channelNama: string;
  channelTipe: PlatformMarketplace;
  externalOrderId: string;
  nomorPesanan: string;
  namaPembeli?: string | null;
  tanggalPesanan: Date | string;
  totalNilai: string;
  biayaAdmin: string;
  totalBersih: string;
  statusExternal: string;
  statusSync: string;
  dibuatPada: Date | string;
}

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

interface MarketplaceClientViewProps {
  initialChannels: ItemChannel[];
  initialMappings: ItemMapping[];
  initialOrders: ItemOrderMarketplace[];
  gudangList: OptionGudang[];
  itemsList: OptionItemProduct[];
}

export function MarketplaceClientView({
  initialChannels,
  initialMappings,
  initialOrders,
  gudangList,
  itemsList,
}: MarketplaceClientViewProps) {
  const router = useRouter();
  const [channels, setChannels] = React.useState<ItemChannel[]>(initialChannels);
  const [mappings, setMappings] = React.useState<ItemMapping[]>(initialMappings);
  const [orders] = React.useState<ItemOrderMarketplace[]>(initialOrders);
  const [activeTab, setActiveTab] = React.useState("channels");

  // Dialogs
  const [channelDialogOpen, setChannelDialogOpen] = React.useState(false);
  const [selectedChannel, setSelectedChannel] = React.useState<ItemChannel | null>(null);
  const [mappingDialogOpen, setMappingDialogOpen] = React.useState(false);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  const handleSyncChannel = async (id: string, nama: string) => {
    try {
      setSyncingId(id);
      const res = await getApi().keuangan.marketplace.channel({ id }).sync.post();
      if (res.data) {
        toast.success(`Sinkronisasi saluran ${nama} berhasil!`);
        router.refresh();
      }
    } catch {
      toast.error("Gagal sinkronisasi marketplace.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm("Hapus pemetaan SKU ini?")) return;
    try {
      await getApi().keuangan.marketplace.mapping({ id }).delete();
      toast.success("Pemetaan SKU dihapus.");
      setMappings(mappings.filter((m) => m.id !== id));
      router.refresh();
    } catch {
      toast.error("Gagal menghapus mapping.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconBuildingStore className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Toko Online Terhubung</p>
            <h3 className="text-2xl font-bold tracking-tight">{channels.length} Saluran</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <IconPackages className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">SKU Terpetakan</p>
            <h3 className="text-2xl font-bold tracking-tight">{mappings.length} Produk</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <IconShoppingCart className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Pesanan Masuk</p>
            <h3 className="text-2xl font-bold tracking-tight">{orders.length} Transaksi</h3>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="channels" className="gap-2">
              <IconBuildingStore className="size-4" />
              Saluran Toko ({channels.length})
            </TabsTrigger>
            <TabsTrigger value="mappings" className="gap-2">
              <IconLink className="size-4" />
              Pemetaan SKU ({mappings.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <IconShoppingCart className="size-4" />
              Riwayat Pesanan ({orders.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === "channels" && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedChannel(null);
                  setChannelDialogOpen(true);
                }}
                className="gap-1.5"
              >
                <IconPlus className="size-4" />
                Hubungkan Toko
              </Button>
            )}
            {activeTab === "mappings" && (
              <Button
                size="sm"
                onClick={() => setMappingDialogOpen(true)}
                className="gap-1.5"
              >
                <IconPlus className="size-4" />
                Petakan SKU
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Channels */}
        <TabsContent value="channels">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground border rounded-xl bg-card">
                Belum ada toko marketplace terhubung. Klik &quot;Hubungkan Toko&quot; untuk mengintegrasikan Tokopedia / Shopee / TikTok Shop.
              </div>
            ) : (
              channels.map((ch) => (
                <div
                  key={ch.id}
                  className="p-5 rounded-xl border bg-card shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-semibold text-xs">
                        {ch.channel}
                      </Badge>
                      <Badge variant={ch.status === "AKTIF" ? "success" : "secondary"}>
                        {ch.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-base">{ch.nama}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">Kode: {ch.kode}</p>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                      <p>Gudang Stok: <span className="font-medium text-foreground">{ch.gudangNama}</span></p>
                      <p className="flex items-center gap-1">
                        <IconClock className="size-3 text-muted-foreground" />
                        Terakhir Sync: {ch.terakhirSinkron ? new Date(ch.terakhirSinkron).toLocaleString("id-ID") : "Belum pernah"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={syncingId === ch.id}
                      onClick={() => handleSyncChannel(ch.id, ch.nama)}
                    >
                      {syncingId === ch.id ? (
                        <IconLoader2 className="size-3.5 animate-spin" />
                      ) : (
                        <IconRefresh className="size-3.5" />
                      )}
                      Sinkron Sekarang
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() => {
                        setSelectedChannel(ch);
                        setChannelDialogOpen(true);
                      }}
                    >
                      <IconEdit className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 2: SKU Mapping */}
        <TabsContent value="mappings">
          <Frame>
            <FrameHeader>
              <div>
                <FrameTitle>Daftar Pemetaan SKU Produk (Omnichannel Mapping)</FrameTitle>
                <p className="text-xs text-muted-foreground">
                  Hubungan antara SKU produk marketplace dengan item inventori di sistem ERP.
                </p>
              </div>
            </FrameHeader>

            <FramePanel>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Platform & Toko</th>
                      <th className="p-3">Marketplace SKU</th>
                      <th className="p-3">Nama Produk Marketplace</th>
                      <th className="p-3">Item Produk ERP</th>
                      <th className="p-3 text-right">Harga Sinkron</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mappings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          Belum ada pemetaan SKU. Klik &quot;Petakan SKU&quot; untuk menghubungkan produk.
                        </td>
                      </tr>
                    ) : (
                      mappings.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/40">
                          <td className="p-3">
                            <p className="font-semibold">{m.channelNama}</p>
                            <Badge variant="outline" className="text-[10px] py-0">{m.channelTipe}</Badge>
                          </td>
                          <td className="p-3 font-mono font-bold text-primary">{m.marketplaceSku}</td>
                          <td className="p-3">{m.marketplaceItemName || "-"}</td>
                          <td className="p-3">
                            <p className="font-medium">{m.itemNama}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{m.itemSku}</p>
                          </td>
                          <td className="p-3 text-right font-medium">
                            Rp {Number(m.hargaSinkron || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0 text-rose-500 hover:text-rose-600"
                              onClick={() => handleDeleteMapping(m.id)}
                            >
                              <IconTrash className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </FramePanel>
          </Frame>
        </TabsContent>

        {/* Tab 3: Orders History */}
        <TabsContent value="orders">
          <Frame>
            <FrameHeader>
              <div>
                <FrameTitle>Riwayat Pesanan Masuk Marketplace</FrameTitle>
                <p className="text-xs text-muted-foreground">
                  Seluruh pesanan otomatis memotong inventori gudang saluran dan mencatat kartu stok.
                </p>
              </div>
            </FrameHeader>

            <FramePanel>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-3">Nomor Pesanan</th>
                      <th className="p-3">Saluran</th>
                      <th className="p-3">Pembeli</th>
                      <th className="p-3">Waktu Pesanan</th>
                      <th className="p-3 text-right">Nilai Total</th>
                      <th className="p-3 text-right">Biaya Admin</th>
                      <th className="p-3 text-right font-semibold">Total Bersih</th>
                      <th className="p-3 text-center">Status Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          Belum ada transaksi pesanan yang ditarik dari marketplace.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="hover:bg-muted/40">
                          <td className="p-3 font-semibold font-mono text-primary">{o.nomorPesanan}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">{o.channelTipe}</Badge>
                          </td>
                          <td className="p-3">{o.namaPembeli}</td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(o.tanggalPesanan).toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-right font-medium">
                            Rp {Number(o.totalNilai || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-right text-rose-500">
                            - Rp {Number(o.biayaAdmin || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            Rp {Number(o.totalBersih || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="success">Tersinkron</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </FramePanel>
          </Frame>
        </TabsContent>
      </Tabs>

      <ChannelDialog
        open={channelDialogOpen}
        onOpenChange={setChannelDialogOpen}
        gudangList={gudangList}
        channel={selectedChannel}
        onSuccess={() => {
          setChannels(channels);
          router.refresh();
        }}
      />

      <MappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        channelList={channels}
        itemsList={itemsList}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
