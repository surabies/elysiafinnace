"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApi } from "@/lib/api-client";
import type { SatuanItem } from "../_lib/types";

interface SatuanDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SatuanItem | null;
  onSuccess: () => void;
}

export function SatuanDeleteDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: SatuanDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const api = getApi();

    try {
      const res = await api.keuangan.satuan({ id: item.id }).delete();

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message ?? "Gagal menghapus satuan.");
        return;
      }

      toast.success(`Satuan "${item.kode}" berhasil dihapus.`);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus satuan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <IconAlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Hapus Satuan: {item.kode}?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pastikan satuan ini tidak sedang digunakan oleh produk apa pun.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="text-xs text-muted-foreground leading-relaxed py-2">
          Apakah Anda yakin ingin menghapus satuan <strong className="text-foreground">{item.kode} - {item.nama}</strong>? Tindakan ini bersifat permanen.
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            className="min-w-20"
          >
            {isDeleting ? (
              <>
                <IconLoader2 className="mr-1.5 size-3.5 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus Permanen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
