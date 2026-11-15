"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconCalculator,
  IconCheck,
  IconEye,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconUsers,
  IconWallet,
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
import { ProsesPayrollDialog } from "./proses-payroll-dialog";
import { SlipGajiModal } from "./slip-gaji-modal";
import Link from "next/link";
import { ROUTES } from "@/components/layout/sidebar/routes";

export interface ItemPayroll {
  id: string;
  kode: string;
  periodeBulan: number;
  periodeTahun: number;
  tanggalBayar: string;
  totalGajiKotor: string;
  totalPotongan: string;
  totalPph21: string;
  totalBpjs: string;
  totalGajiBersih: string;
  status: "DRAFT" | "DISETUJUI" | "DIBAYAR" | "DIBATALKAN";
  catatan?: string | null;
  items?: Array<{
    id: string;
    employeeId: string;
    employeeNama?: string;
    employeeNik?: string;
    gajiPokok: string;
    totalTunjangan: string;
    bpjsKesehatan: string;
    bpjsKetenagakerjaan: string;
    pph21: string;
    gajiBersih: string;
  }>;
}

interface OptionKaryawan {
  id: string;
  nama: string;
  aktif: boolean;
}

interface OptionBankAccount {
  id: string;
  kode: string;
  nama: string;
}

interface PayrollClientViewProps {
  initialPayrolls: ItemPayroll[];
  karyawanList: OptionKaryawan[];
  bankAccounts: OptionBankAccount[];
}

export function PayrollClientView({
  initialPayrolls,
  karyawanList,
  bankAccounts,
}: PayrollClientViewProps) {
  const router = useRouter();
  const [payrolls, setPayrolls] = React.useState<ItemPayroll[]>(initialPayrolls);
  const [search, setSearch] = React.useState<string>("" );
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [selectedPayroll, setSelectedPayroll] = React.useState<ItemPayroll | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState<boolean>(false);
  const [payingId, setPayingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (!search) return payrolls;
    const q = search.toLowerCase();
    return payrolls.filter(
      (p) =>
        p.kode?.toLowerCase().includes(q) ||
        p.catatan?.toLowerCase().includes(q) ||
        p.periodeTahun?.toString().includes(q),
    );
  }, [payrolls, search]);

  const totalKaryawanAktif = karyawanList.filter((k) => k.aktif).length;
  const totalPayrollSelesai = payrolls.filter((p) => p.status === "DIBAYAR").length;
  const totalUangPayroll = payrolls
    .filter((p) => p.status === "DIBAYAR")
    .reduce((sum, p) => sum + Number(p.totalGajiBersih || 0), 0);

  const handleLihatDetail = async (id: string) => {
    try {
      const res = await getApi().keuangan.payroll.proses({ id }).get();
      if (res.data) {
        setSelectedPayroll(res.data as unknown as ItemPayroll);
        setDetailModalOpen(true);
      }
    } catch {
      toast.error("Gagal mengambil rincian slip payroll.");
    }
  };

  const handleBayar = async (payrollId: string) => {
    if (!confirm("Konfirmasi eksekusi pencairan gaji dan posting otomatis ke Jurnal Akuntansi?")) {
      return;
    }

    try {
      setPayingId(payrollId);
      const res = await getApi().keuangan.payroll.proses.bayar.post({
        payrollId,
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message || "Gagal membayarkan payroll");
        return;
      }

      toast.success("Payroll berhasil dicairkan dan jurnal Beban Gaji telah diposting!");
      router.refresh();
      const updated = payrolls.map((p) =>
        p.id === payrollId ? { ...p, status: "DIBAYAR" as const } : p,
      );
      setPayrolls(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconUsers className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Karyawan Aktif</p>
            <h3 className="text-2xl font-bold tracking-tight">{totalKaryawanAktif} Orang</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <IconWallet className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Pencairan Gaji</p>
            <h3 className="text-2xl font-bold tracking-tight">
              Rp {totalUangPayroll.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <IconCalculator className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Batch Terselesaikan</p>
            <h3 className="text-2xl font-bold tracking-tight">{totalPayrollSelesai} Periode</h3>
          </div>
        </div>
      </div>

      {/* Main Table Frame */}
      <Frame>
        <FrameHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <FrameTitle>Daftar Penggajian Karyawan</FrameTitle>
            <p className="text-xs text-muted-foreground">
              Riwayat batch payroll berkala dengan integrasi perhitungan PPh 21 TER, BPJS, dan Auto-Posting GL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={ROUTES.payroll.employees}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <IconUsers className="size-4" />
                Direktori Karyawan
              </Button>
            </Link>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <IconPlus className="size-4" />
              Proses Payroll Baru
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
                placeholder="Cari nomor kode atau periode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground border-b font-medium">
                <tr>
                  <th className="p-3">Kode Batch</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Jadwal Bayar</th>
                  <th className="p-3 text-right">Total Gaji Kotor</th>
                  <th className="p-3 text-right">PPh 21 TER</th>
                  <th className="p-3 text-right">Total Bersih</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada riwayat batch payroll. Klik &quot;Proses Payroll Baru&quot; untuk memulai.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-semibold">{item.kode}</td>
                      <td className="p-3">Bulan {item.periodeBulan} / {item.periodeTahun}</td>
                      <td className="p-3">{item.tanggalBayar}</td>
                      <td className="p-3 text-right">
                        Rp {Number(item.totalGajiKotor || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-right text-rose-500">
                        Rp {Number(item.totalPph21 || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        Rp {Number(item.totalGajiBersih || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={item.status === "DIBAYAR" ? "success" : "warning"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 gap-1"
                            onClick={() => handleLihatDetail(item.id)}
                          >
                            <IconEye className="size-3.5" />
                            Detail
                          </Button>
                          {item.status !== "DIBAYAR" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 px-2 gap-1 text-xs"
                              disabled={payingId === item.id}
                              onClick={() => handleBayar(item.id)}
                            >
                              {payingId === item.id ? (
                                <IconLoader2 className="size-3.5 animate-spin" />
                              ) : (
                                <IconCheck className="size-3.5" />
                              )}
                              Cairkan & Post GL
                            </Button>
                          )}
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
          <span>Menampilkan {filtered.length} batch payroll</span>
        </FrameFooter>
      </Frame>

      <ProsesPayrollDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bankAccounts={bankAccounts}
        onSuccess={() => router.refresh()}
      />

      <SlipGajiModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        payroll={selectedPayroll}
      />
    </div>
  );
}
