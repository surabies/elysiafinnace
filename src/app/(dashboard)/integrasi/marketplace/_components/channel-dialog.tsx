"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconBuildingStore, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import type { ItemChannel, PlatformMarketplace } from "./marketplace-client-view";

interface OptionGudang {
  id: string;
  nama: string;
}

interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gudangList: OptionGudang[];
  channel?: ItemChannel | null;
  onSuccess: () => void;
}

function ChannelForm({
  channel,
  gudangList,
  onClose,
  onSuccess,
}: {
  channel?: ItemChannel | null;
  gudangList: OptionGudang[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [kode, setKode] = React.useState(channel?.kode || "");
  const [nama, setNama] = React.useState(channel?.nama || "");
  const [saluran, setSaluran] = React.useState<PlatformMarketplace>(
    channel?.channel || "TOKOPEDIA",
  );
  const [shopId, setShopId] = React.useState(channel?.shopId || "");
  const [apiKey, setApiKey] = React.useState(channel?.apiKey || "");
  const [gudangId, setGudangId] = React.useState(
    channel?.gudangId || (gudangList[0]?.id || ""),
  );
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gudangId) {
      toast.error("Pilih gudang persediaan yang terhubung.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        channel: saluran,
        shopId: shopId.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        gudangId,
        autoSyncStock: true,
        autoSyncOrders: true,
      };

      if (channel?.id) {
        const res = await getApi().keuangan.marketplace.channel({ id: channel.id }).put(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal memperbarui channel");
          return;
        }
        toast.success("Konfigurasi channel marketplace berhasil diperbarui.");
      } else {
        const res = await getApi().keuangan.marketplace.channel.post(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal menghubungkan channel");
          return;
        }
        toast.success("Channel toko marketplace berhasil dihubungkan!");
      }

      onClose();
      onSuccess();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <IconBuildingStore className="size-5 text-primary" />
          {channel ? "Edit Saluran Marketplace" : "Hubungkan Akun Marketplace"}
        </DialogTitle>
        <DialogDescription>
          Koneksikan toko online Tokopedia, Shopee, TikTok Shop ke inventori gudang ERP.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="platform">Platform Marketplace</Label>
            <Select value={saluran} onValueChange={(v) => setSaluran(v as PlatformMarketplace)}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOKOPEDIA">Tokopedia</SelectItem>
                <SelectItem value="SHOPEE">Shopee</SelectItem>
                <SelectItem value="TIKTOK">TikTok Shop</SelectItem>
                <SelectItem value="LAZADA">Lazada</SelectItem>
                <SelectItem value="BLIBLI">Blibli</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kode">Kode Toko</Label>
            <Input
              id="kode"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="TKP-OFFICIAL"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="namaToko">Nama Toko di Marketplace</Label>
          <Input
            id="namaToko"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="SurabieDev Official Store"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="shopId">Shop ID / Merchant ID</Label>
            <Input
              id="shopId"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              placeholder="12345678"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gudang">Gudang Penyimpanan</Label>
            <Select value={gudangId} onValueChange={setGudangId}>
              <SelectTrigger id="gudang">
                <SelectValue placeholder="Pilih Gudang..." />
              </SelectTrigger>
              <SelectContent>
                {gudangList.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apiKey">API Key / Access Token</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Token integrasi API..."
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="gap-1.5">
          {loading && <IconLoader2 className="size-4 animate-spin" />}
          {channel ? "Simpan Perubahan" : "Hubungkan Toko"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ChannelDialog({
  open,
  onOpenChange,
  gudangList,
  channel,
  onSuccess,
}: ChannelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <ChannelForm
            key={channel?.id || "new-channel"}
            channel={channel}
            gudangList={gudangList}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
