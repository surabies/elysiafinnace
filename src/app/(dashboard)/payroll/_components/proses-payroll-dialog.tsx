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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconCalculator, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";

interface ProsesPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: Array<{ id: string; nama: string; kode: string }>;
  onSuccess: () => void;
}

const BULAN_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function ProsesPayrollDialog({
  open,
  onOpenChange,
  bankAccounts,
  onSuccess,
}: ProsesPayrollDialogProps) {
  const router = useRouter();
  const sekarang = new Date();
  const [bulan, setBulan] = React.useState<string>((sekarang.getMonth() + 1).toString());
  const [tahun, setTahun] = React.useState<string>(sekarang.getFullYear().toString());
  const [tanggalBayar, setTanggalBayar] = React.useState<string>(
    sekarang.toISOString().slice(0, 10),
  );
  const [rekeningId, setRekeningId] = React.useState<string>(bankAccounts[0]?.id || "");
  const [catatan, setCatatan] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rekeningId) {
      toast.error("Pilih rekening bank sumber pembayaran.");
      return;
    }

    try {
      setLoading(true);
      const res = await getApi().keuangan.payroll.proses.hitung.post({
        periodeBulan: Number(bulan),
        periodeTahun: Number(tahun),
        tanggalBayar,
        rekeningKasBankId: rekeningId,
        catatan: catatan.trim() || undefined,
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message || "Gagal memproses batch payroll");
        return;
      }

      toast.success("Batch penggajian berhasil dihitung & dibuat sebagai DRAFT.");
      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCalculator className="size-5 text-primary" />
              Proses Penggajian Bulanan
            </DialogTitle>
            <DialogDescription>
              Hitung otomatis gaji seluruh karyawan aktif, potongan BPJS Kesehatan, BPJS TK, dan PPh 21 TER (PMK 168).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bulan">Periode Bulan</Label>
                <Select value={bulan} onValueChange={setBulan}>
                  <SelectTrigger id="bulan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BULAN_NAMES.map((nama, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tahun">Tahun</Label>
                <Input
                  id="tahun"
                  type="number"
                  min="2020"
                  max="2050"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tanggalBayar">Tanggal Jadwal Bayar</Label>
              <Input
                id="tanggalBayar"
                type="date"
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rekening">Rekening Bank Pembayaran</Label>
              <Select value={rekeningId} onValueChange={setRekeningId}>
                <SelectTrigger id="rekening">
                  <SelectValue placeholder="Pilih rekening bank..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.kode} - {b.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catatan">Catatan / Keterangan (Opsional)</Label>
              <Textarea
                id="catatan"
                placeholder="Contoh: Gaji bulan reguler + insentif kuartal..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <IconLoader2 className="size-4 animate-spin" />}
              Hitung Batch Payroll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
