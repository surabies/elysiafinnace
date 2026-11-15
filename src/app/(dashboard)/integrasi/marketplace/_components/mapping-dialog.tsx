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
import type { ItemChannel } from "./marketplace-client-view";

interface OptionItemProduct {
  id: string;
  sku: string;
  nama: string;
  hargaJualStandar?: string | null;
}

interface MappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelList: ItemChannel[];
  itemsList: OptionItemProduct[];
  onSuccess: () => void;
}

function MappingForm({
  channelList,
  itemsList,
  onClose,
  onSuccess,
}: {
  channelList: ItemChannel[];
  itemsList: OptionItemProduct[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const firstItem = itemsList[0];
  const [channelId, setChannelId] = React.useState(channelList[0]?.id || "");
  const [itemId, setItemId] = React.useState(firstItem?.id || "");
  const [marketplaceSku, setMarketplaceSku] = React.useState(firstItem?.sku || "");
  const [marketplaceItemName, setMarketplaceItemName] = React.useState(firstItem?.nama || "");
  const [hargaSinkron, setHargaSinkron] = React.useState(firstItem?.hargaJualStandar || "0");
  const [loading, setLoading] = React.useState(false);

  const handleItemSelect = (id: string) => {
    setItemId(id);
    const it = itemsList.find((i) => i.id === id);
    if (it) {
      setMarketplaceSku(it.sku);
      setMarketplaceItemName(it.nama);
      setHargaSinkron(it.hargaJualStandar || "0");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !itemId || !marketplaceSku) {
      toast.error("Lengkapi data pemetaan SKU.");
      return;
    }

    try {
      setLoading(true);
      const res = await getApi().keuangan.marketplace.mapping.post({
        channelId,
        itemId,
        marketplaceSku: marketplaceSku.trim(),
        marketplaceItemName: marketplaceItemName.trim() || undefined,
        hargaSinkron: Number(hargaSinkron || 0).toFixed(4),
        aktif: true,
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message || "Gagal menyimpan pemetaan SKU");
        return;
      }

      toast.success("Pemetaan SKU produk marketplace berhasil disimpan!");
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
          Petakan SKU Marketplace
        </DialogTitle>
        <DialogDescription>
          Hubungkan kode SKU toko online (Tokopedia/Shopee) ke master item produk ERP.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="channel">Saluran Marketplace</Label>
          <Select value={channelId} onValueChange={setChannelId}>
            <SelectTrigger id="channel">
              <SelectValue placeholder="Pilih Channel..." />
            </SelectTrigger>
            <SelectContent>
              {channelList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nama} ({c.channel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="item">Item Produk ERP</Label>
          <Select value={itemId} onValueChange={handleItemSelect}>
            <SelectTrigger id="item">
              <SelectValue placeholder="Pilih Produk..." />
            </SelectTrigger>
            <SelectContent>
              {itemsList.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.sku} - {i.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU di Marketplace</Label>
          <Input
            id="sku"
            value={marketplaceSku}
            onChange={(e) => setMarketplaceSku(e.target.value)}
            placeholder="SKU-TOKO-01"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="namaItem">Nama Produk di Toko Online</Label>
          <Input
            id="namaItem"
            value={marketplaceItemName}
            onChange={(e) => setMarketplaceItemName(e.target.value)}
            placeholder="Nama produk online..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="harga">Harga Sinkronisasi (Rp)</Label>
          <Input
            id="harga"
            type="number"
            value={hargaSinkron}
            onChange={(e) => setHargaSinkron(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="gap-1.5">
          {loading && <IconLoader2 className="size-4 animate-spin" />}
          Simpan Pemetaan SKU
        </Button>
      </DialogFooter>
    </form>
  );
}

export function MappingDialog({
  open,
  onOpenChange,
  channelList,
  itemsList,
  onSuccess,
}: MappingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <MappingForm
            channelList={channelList}
            itemsList={itemsList}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
