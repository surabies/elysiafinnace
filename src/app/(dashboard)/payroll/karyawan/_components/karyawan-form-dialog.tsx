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
import { IconLoader2, IconUserPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import type { ItemKaryawan, StatusKaryawanType } from "./karyawan-client-view";

interface KaryawanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  karyawan?: ItemKaryawan | null;
  onSuccess: () => void;
}

export type StatusPtkpType = "TK/0" | "TK/1" | "TK/2" | "TK/3" | "K/0" | "K/1" | "K/2" | "K/3";

const STATUS_PTKP_LIST: StatusPtkpType[] = [
  "TK/0", "TK/1", "TK/2", "TK/3",
  "K/0", "K/1", "K/2", "K/3",
];

function KaryawanForm({
  karyawan,
  onClose,
  onSuccess,
}: {
  karyawan?: ItemKaryawan | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [nik, setNik] = React.useState(karyawan?.nik || "");
  const [nama, setNama] = React.useState(karyawan?.nama || "");
  const [email, setEmail] = React.useState(karyawan?.email || "");
  const [telepon, setTelepon] = React.useState(karyawan?.telepon || "");
  const [jabatan, setJabatan] = React.useState(karyawan?.jabatan || "");
  const [statusKaryawan, setStatusKaryawan] = React.useState<StatusKaryawanType>(
    karyawan?.statusKaryawan || "TETAP",
  );
  const [statusPtkp, setStatusPtkp] = React.useState<StatusPtkpType>(
    (karyawan?.statusPtkp as StatusPtkpType) || "TK/0",
  );
  const [tanggalMasuk, setTanggalMasuk] = React.useState(
    karyawan?.tanggalMasuk || new Date().toISOString().slice(0, 10),
  );
  const [gajiPokok, setGajiPokok] = React.useState(karyawan?.gajiPokok || "5000000");
  const [tunjanganTetap, setTunjanganTetap] = React.useState(karyawan?.tunjanganTetap || "1000000");
  const [bankNama, setBankNama] = React.useState(karyawan?.bankNama || "BCA");
  const [bankRekening, setBankRekening] = React.useState(karyawan?.bankRekening || "");
  const [bankAtasNama, setBankAtasNama] = React.useState(karyawan?.bankAtasNama || "");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        nik: nik.trim(),
        nama: nama.trim(),
        email: email.trim() || undefined,
        telepon: telepon.trim() || undefined,
        jabatan: jabatan.trim(),
        statusKaryawan,
        statusPtkp,
        tanggalMasuk,
        gajiPokok: Number(gajiPokok).toFixed(4),
        tunjanganTetap: Number(tunjanganTetap || 0).toFixed(4),
        bankNama: bankNama.trim() || undefined,
        bankRekening: bankRekening.trim() || undefined,
        bankAtasNama: bankAtasNama.trim() || undefined,
      };

      if (karyawan?.id) {
        const res = await getApi().keuangan.payroll.karyawan({ id: karyawan.id }).put(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal memperbarui karyawan");
          return;
        }
        toast.success("Profil karyawan berhasil diperbarui.");
      } else {
        const res = await getApi().keuangan.payroll.karyawan.post(payload);
        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message || "Gagal mendaftarkan karyawan");
          return;
        }
        toast.success("Karyawan baru berhasil didaftarkan.");
      }

      onClose();
      onSuccess();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <IconUserPlus className="size-5 text-primary" />
          {karyawan ? "Ubah Profil Karyawan" : "Tambah Karyawan Baru"}
        </DialogTitle>
        <DialogDescription>
          Isi data lengkap karyawan untuk kalkulasi penggajian dan PPh 21 TER.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nik">NIK Karyawan</Label>
            <Input
              id="nik"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="EMP-001"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama karyawan..."
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="karyawan@perusahaan.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telepon">Nomor WhatsApp/HP</Label>
            <Input
              id="telepon"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="0812xxxx"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Senior Developer"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="statusKaryawan">Status Ikatan Kerja</Label>
            <Select value={statusKaryawan} onValueChange={(val) => setStatusKaryawan(val as StatusKaryawanType)}>
              <SelectTrigger id="statusKaryawan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TETAP">Karyawan Tetap</SelectItem>
                <SelectItem value="KONTRAK">PKWT (Kontrak)</SelectItem>
                <SelectItem value="MAGANG">Magang / Internship</SelectItem>
                <SelectItem value="FREELANCE">Pekerja Lepas / Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="statusPtkp">Status PTKP Pajak</Label>
            <Select value={statusPtkp} onValueChange={(v) => setStatusPtkp(v as StatusPtkpType)}>
              <SelectTrigger id="statusPtkp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_PTKP_LIST.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tanggalMasuk">Tanggal Mulai Bekerja</Label>
            <Input
              id="tanggalMasuk"
              type="date"
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="gajiPokok">Gaji Pokok (Rp)</Label>
            <Input
              id="gajiPokok"
              type="number"
              value={gajiPokok}
              onChange={(e) => setGajiPokok(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tunjanganTetap">Tunjangan Tetap (Rp)</Label>
            <Input
              id="tunjanganTetap"
              type="number"
              value={tunjanganTetap}
              onChange={(e) => setTunjanganTetap(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Informasi Rekening Bank Payroll</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bankNama">Nama Bank</Label>
              <Input
                id="bankNama"
                value={bankNama}
                onChange={(e) => setBankNama(e.target.value)}
                placeholder="BCA / Mandiri"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bankRekening">Nomor Rekening</Label>
              <Input
                id="bankRekening"
                value={bankRekening}
                onChange={(e) => setBankRekening(e.target.value)}
                placeholder="1234567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bankAtasNama">Atas Nama</Label>
              <Input
                id="bankAtasNama"
                value={bankAtasNama}
                onChange={(e) => setBankAtasNama(e.target.value)}
                placeholder="Sesuai buku tabungan"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="gap-1.5">
          {loading && <IconLoader2 className="size-4 animate-spin" />}
          {karyawan ? "Simpan Perubahan" : "Daftarkan Karyawan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function KaryawanFormDialog({
  open,
  onOpenChange,
  karyawan,
  onSuccess,
}: KaryawanFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        {open && (
          <KaryawanForm
            key={karyawan?.id || "new-karyawan"}
            karyawan={karyawan}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
