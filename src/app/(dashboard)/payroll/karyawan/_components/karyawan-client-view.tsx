"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconBuilding,
  IconEdit,
  IconMail,
  IconPhone,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import { KaryawanFormDialog } from "./karyawan-form-dialog";
import Link from "next/link";
import { ROUTES } from "@/components/layout/sidebar/routes";

export type StatusKaryawanType = "TETAP" | "KONTRAK" | "MAGANG" | "FREELANCE";

export interface ItemKaryawan {
  id: string;
  nik: string;
  nama: string;
  email?: string | null;
  telepon?: string | null;
  departemenId?: string | null;
  jabatan: string;
  statusKaryawan: StatusKaryawanType;
  statusPtkp: string;
  npwp?: string | null;
  tanggalMasuk: string;
  tanggalKeluar?: string | null;
  gajiPokok: string;
  tunjanganTetap: string;
  bankNama?: string | null;
  bankRekening?: string | null;
  bankAtasNama?: string | null;
  aktif: boolean;
}

interface KaryawanClientViewProps {
  initialKaryawan: ItemKaryawan[];
}

export function KaryawanClientView({ initialKaryawan }: KaryawanClientViewProps) {
  const router = useRouter();
  const [karyawanList, setKaryawanList] = React.useState<ItemKaryawan[]>(initialKaryawan);
  const [search, setSearch] = React.useState<string>("");
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [selectedKaryawan, setSelectedKaryawan] = React.useState<ItemKaryawan | null>(null);

  const filtered = React.useMemo(() => {
    if (!search) return karyawanList;
    const q = search.toLowerCase();
    return karyawanList.filter(
      (k) =>
        k.nama?.toLowerCase().includes(q) ||
        k.nik?.toLowerCase().includes(q) ||
        k.jabatan?.toLowerCase().includes(q) ||
        k.email?.toLowerCase().includes(q),
    );
  }, [karyawanList, search]);

  const handleEdit = (k: ItemKaryawan) => {
    setSelectedKaryawan(k);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedKaryawan(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menonaktifkan atau menghapus karyawan ${nama}?`)) return;

    try {
      const res = await getApi().keuangan.payroll.karyawan({ id }).delete();
      if (res.error) {
        toast.error("Gagal menghapus data karyawan.");
        return;
      }
      toast.success(`Karyawan ${nama} berhasil dinonaktifkan.`);
      setKaryawanList(karyawanList.filter((k) => k.id !== id));
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconUsers className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total SDM Terdaftar</p>
            <h3 className="text-2xl font-bold tracking-tight">{karyawanList.length} Orang</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <IconUserCheck className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Karyawan Aktif</p>
            <h3 className="text-2xl font-bold tracking-tight">
              {karyawanList.filter((k) => k.aktif).length} Orang
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <IconBuilding className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Status Tetap / PKWTT</p>
            <h3 className="text-2xl font-bold tracking-tight">
              {karyawanList.filter((k) => k.statusKaryawan === "TETAP").length} Orang
            </h3>
          </div>
        </div>
      </div>

      {/* Main Frame */}
      <Frame>
        <FrameHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <FrameTitle>Direktori Karyawan & Payroll SDM</FrameTitle>
            <p className="text-xs text-muted-foreground">
              Master profil karyawan, struktur gaji pokok, tunjangan rutin, dan status PTKP perpajakan PMK 168.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={ROUTES.payroll.dashboard}>
              <Button variant="outline" size="sm">
                Kembali ke Payroll
              </Button>
            </Link>
            <Button size="sm" onClick={handleCreate} className="gap-1.5">
              <IconPlus className="size-4" />
              Tambah Karyawan
            </Button>
          </div>
        </FrameHeader>

        <FramePanel className="space-y-4">
          <div className="flex items-center gap-3">
            <InputGroup className="max-w-sm">
              <InputGroupAddon>
                <IconSearch className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Cari NIK, nama, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b font-medium">
                <tr>
                  <th className="p-3">NIK & Nama</th>
                  <th className="p-3">Jabatan & Status</th>
                  <th className="p-3">PTKP Pajak</th>
                  <th className="p-3">Kontak</th>
                  <th className="p-3 text-right">Gaji Pokok</th>
                  <th className="p-3 text-right">Tunjangan</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada data karyawan. Klik &quot;Tambah Karyawan&quot; untuk mendaftarkan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold">{item.nama}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.nik}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{item.jabatan}</p>
                        <Badge variant="outline" className="text-[10px] py-0 mt-0.5">
                          {item.statusKaryawan}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-medium">
                        {item.statusPtkp?.replace(/_/g, "/")}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <IconMail className="size-3" />
                            {item.email}
                          </div>
                        )}
                        {item.telepon && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <IconPhone className="size-3" />
                            {item.telepon}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">
                        Rp {Number(item.gajiPokok || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        Rp {Number(item.tunjanganTetap || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={item.aktif ? "success" : "secondary"}>
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0"
                            onClick={() => handleEdit(item)}
                          >
                            <IconEdit className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-rose-500 hover:text-rose-600"
                            onClick={() => handleDelete(item.id, item.nama)}
                          >
                            <IconTrash className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </FramePanel>

        <FrameFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Menampilkan {filtered.length} dari {karyawanList.length} karyawan</span>
        </FrameFooter>
      </Frame>

      <KaryawanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        karyawan={selectedKaryawan}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
