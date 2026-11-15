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
import type { KategoriItem } from "../_lib/types";

interface KategoriDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: KategoriItem | null;
  onSuccess: () => void;
}

export function KategoriDeleteDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: KategoriDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const api = getApi();

    try {
      const res = await api.keuangan["kategori-produk"]({ id: item.id }).delete();

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message ?? "Gagal menghapus kategori.");
        return;
      }

      toast.success(`Kategori "${item.nama}" berhasil dihapus.`);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus kategori.");
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
                Hapus Kategori: {item.nama}?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pastikan kategori ini tidak memiliki sub-kategori atau produk terikat.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="text-xs text-muted-foreground leading-relaxed py-2">
          Apakah Anda yakin ingin menghapus kategori <strong className="text-foreground">{item.kode} - {item.nama}</strong>? Tindakan ini bersifat permanen.
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
