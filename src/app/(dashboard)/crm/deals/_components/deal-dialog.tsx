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
import { IconLoader2, IconTargetArrow } from "@tabler/icons-react";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import type { ItemDeal, StageDealType } from "./deals-client-view";

interface OptionItem {
  id: string;
  nama: string;
}

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadsList: OptionItem[];
  kontakList: OptionItem[];
  deal?: ItemDeal | null;
  onSuccess: () => void;
}

function DealForm({
  deal,
  leadsList,
  kontakList,
  onClose,
  onSuccess,
}: {
  deal?: ItemDeal | null;
  leadsList: OptionItem[];
  kontakList: OptionItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [judul, setJudul] = React.useState(deal?.judul || "");
  const [leadId, setLeadId] = React.useState<string>(deal?.leadId || "none");
  const [kontakId, setKontakId] = React.useState<string>(deal?.kontakId || "none");
  const [stage, setStage] = React.useState<StageDealType>(deal?.stage || "PROSPEK");
  const [nilaiPeluang, setNilaiPeluang] = React.useState(deal?.nilaiPeluang || "10000000");
  const [probabilitas, setProbabilitas] = React.useState<number>(deal?.probabilitas ?? 50);
  const [targetClosing, setTargetClosing] = React.useState(deal?.targetClosing || "");
  const [assignedTo, setAssignedTo] = React.useState(deal?.assignedTo || "");
  const [keterangan, setKeterangan] = React.useState(deal?.keterangan || "");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        judul: judul.trim(),
        leadId: leadId !== "none" ? leadId : undefined,
        kontakId: kontakId !== "none" ? kontakId : undefined,
        stage,
        nilaiPeluang: Number(nilaiPeluang || 0).toFixed(4),
        probabilitas: Number(probabilitas),
        targetClosing: targetClosing || undefined,
        assignedTo: assignedTo.trim() || undefined,
        keterangan: keterangan.trim() || undefined,
      };

      if (deal?.id) {
        const res = await getApi().keuangan.crm.deal({ id: deal.id }).put(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal memperbarui deal");
          return;
        }
        toast.success("Peluang penjualan berhasil diperbarui.");
      } else {
        const res = await getApi().keuangan.crm.deal.post(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal membuat deal");
          return;
        }
        toast.success("Peluang deal baru berhasil ditambahkan!");
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
          <IconTargetArrow className="size-5 text-primary" />
          {deal ? "Ubah Peluang (Deal)" : "Tambah Peluang (Deal) Baru"}
        </DialogTitle>
        <DialogDescription>
          Catat deal peluang transaksi dan target perkiraan closing bisnis.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="judulDeal">Judul Peluang / Project</Label>
          <Input
            id="judulDeal"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Pengadaan Sistem ERP 5 Cabang"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead">Dari Prospek (Lead)</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger id="lead">
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Tanpa Lead --</SelectItem>
                {leadsList.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kontak">Atau Kontak Klien</Label>
            <Select value={kontakId} onValueChange={setKontakId}>
              <SelectTrigger id="kontak">
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Tanpa Kontak --</SelectItem>
                {kontakList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stageDeal">Tahapan Pipeline</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as StageDealType)}>
              <SelectTrigger id="stageDeal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROSPEK">1. Prospek Awal</SelectItem>
                <SelectItem value="KUALIFIKASI">2. Kualifikasi Kebutuhan</SelectItem>
                <SelectItem value="PENAWARAN">3. Penawaran Harga</SelectItem>
                <SelectItem value="NEGOSIASI">4. Negosiasi Kontrak</SelectItem>
                <SelectItem value="MENANG">5. Closing (Menang)</SelectItem>
                <SelectItem value="KALAH">6. Batal (Kalah)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prob">Probabilitas (%)</Label>
            <Input
              id="prob"
              type="number"
              min="0"
              max="100"
              value={probabilitas}
              onChange={(e) => setProbabilitas(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nilai">Nilai Peluang (Rp)</Label>
            <Input
              id="nilai"
              type="number"
              value={nilaiPeluang}
              onChange={(e) => setNilaiPeluang(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetClosing">Estimasi Closing</Label>
            <Input
              id="targetClosing"
              type="date"
              value={targetClosing}
              onChange={(e) => setTargetClosing(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="assigned">Sales Executive (In-charge)</Label>
          <Input
            id="assigned"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Nama Account Executive / Sales..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ket">Catatan Tambahan</Label>
          <Textarea
            id="ket"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Rangkuman negosiasi, syarat pembayaran..."
            rows={2}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="gap-1.5">
          {loading && <IconLoader2 className="size-4 animate-spin" />}
          {deal ? "Simpan Perubahan" : "Simpan Peluang Deal"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DealDialog({
  open,
  onOpenChange,
  leadsList,
  kontakList,
  deal,
  onSuccess,
}: DealDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <DealForm
            key={deal?.id || "new-deal"}
            deal={deal}
            leadsList={leadsList}
            kontakList={kontakList}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
