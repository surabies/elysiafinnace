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
import { IconLoader2, IconUserPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import type { ItemLead, StatusLeadType } from "./leads-client-view";

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: ItemLead | null;
  onSuccess: () => void;
}

function LeadForm({
  lead,
  onClose,
  onSuccess,
}: {
  lead?: ItemLead | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [nama, setNama] = React.useState(lead?.nama || "");
  const [perusahaan, setPerusahaan] = React.useState(lead?.perusahaan || "");
  const [email, setEmail] = React.useState(lead?.email || "");
  const [telepon, setTelepon] = React.useState(lead?.telepon || "");
  const [sumber, setSumber] = React.useState(lead?.sumber || "WEBSITE");
  const [status, setStatus] = React.useState<StatusLeadType>(lead?.status || "BARU");
  const [nilaiEstimasi, setNilaiEstimasi] = React.useState(lead?.nilaiEstimasi || "0");
  const [catatan, setCatatan] = React.useState(lead?.catatan || "");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        nama: nama.trim(),
        perusahaan: perusahaan.trim() || undefined,
        email: email.trim() || undefined,
        telepon: telepon.trim() || undefined,
        sumber: sumber.trim() || undefined,
        status,
        nilaiEstimasi: Number(nilaiEstimasi || 0).toFixed(4),
        catatan: catatan.trim() || undefined,
      };

      if (lead?.id) {
        const res = await getApi().keuangan.crm.lead({ id: lead.id }).put(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal memperbarui lead");
          return;
        }
        toast.success("Data prospek berhasil diperbarui.");
      } else {
        const res = await getApi().keuangan.crm.lead.post(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal menambah lead");
          return;
        }
        toast.success("Prospek lead baru berhasil ditambahkan!");
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
          <IconUserPlus className="size-5 text-primary" />
          {lead ? "Ubah Data Prospek" : "Tambah Prospek (Lead) Baru"}
        </DialogTitle>
        <DialogDescription>
          Catat calon klien potensial sebelum dikonversi menjadi pelanggan resmi.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="namaLead">Nama Lengkap PIC</Label>
          <Input
            id="namaLead"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Bpk. Hendra Wijaya"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="perusahaanLead">Nama Perusahaan / Bisnis</Label>
          <Input
            id="perusahaanLead"
            value={perusahaan}
            onChange={(e) => setPerusahaan(e.target.value)}
            placeholder="PT Nusantara Sejahtera"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emailLead">Email</Label>
            <Input
              id="emailLead"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hendra@nusantara.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="teleponLead">Nomor WhatsApp</Label>
            <Input
              id="teleponLead"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="0812xxxx"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sumberLead">Sumber Prospek</Label>
            <Select value={sumber} onValueChange={setSumber}>
              <SelectTrigger id="sumberLead">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEBSITE">Website / Landing Page</SelectItem>
                <SelectItem value="REFERRAL">Rekomendasi Klien</SelectItem>
                <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                <SelectItem value="EXHIBITION">Pameran / Expo</SelectItem>
                <SelectItem value="COLD_CALL">Outbound / Telemarketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="statusLead">Status Prospek</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusLeadType)}>
              <SelectTrigger id="statusLead">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BARU">Baru Masuk</SelectItem>
                <SelectItem value="DIHUBUNGI">Sudah Dihubungi</SelectItem>
                <SelectItem value="KUALIFIKASI">Terkualifikasi</SelectItem>
                <SelectItem value="PROPOSAL">Pengajuan Proposal</SelectItem>
                <SelectItem value="NEGOSIASI">Negosiasi</SelectItem>
                <SelectItem value="MENANG">Closing (Menang)</SelectItem>
                <SelectItem value="KALAH">Batal (Kalah)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimasi">Nilai Estimasi Potensi (Rp)</Label>
          <Input
            id="estimasi"
            type="number"
            value={nilaiEstimasi}
            onChange={(e) => setNilaiEstimasi(e.target.value)}
            placeholder="25000000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="catatanLead">Catatan Kebutuhan Klien</Label>
          <Textarea
            id="catatanLead"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tertarik paket enterprise untuk 5 cabang..."
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
          {lead ? "Simpan Perubahan" : "Simpan Prospek"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function LeadDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: LeadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <LeadForm
            key={lead?.id || "new-lead"}
            lead={lead}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
