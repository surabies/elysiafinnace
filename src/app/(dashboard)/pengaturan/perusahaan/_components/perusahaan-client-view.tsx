"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import {
  IconBuilding,
  IconBuildingSkyscraper,
  IconCheck,
  IconCoin,
  IconDots,
  IconEdit,
  IconLoader2,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPlus,
  IconReceiptTax,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
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
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import type { ItemPerusahaan, MataUangOption, PerusahaanStats } from "../_lib/types";
import { PerusahaanFormDialog } from "./perusahaan-form-dialog";

interface PerusahaanClientViewProps {
  initialCompanies: ItemPerusahaan[];
  currencies: MataUangOption[];
  stats: PerusahaanStats;
}

export function PerusahaanClientView({
  initialCompanies,
  currencies,
  stats,
}: PerusahaanClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<string>("profil");

  // Entitas Utama yang sedang diedit di form profil langsung
  const primaryCompany = initialCompanies[0] ?? null;

  // State Dialog Form Perusahaan (Tambah / Ubah)
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [companyToEdit, setCompanyToEdit] = React.useState<ItemPerusahaan | null>(null);

  // State Form Profil Utama (Tab 1)
  const [isSavingPrimary, setIsSavingPrimary] = React.useState(false);
  const [primaryForm, setPrimaryForm] = React.useState({
    nama: primaryCompany?.nama ?? "",
    npwp: primaryCompany?.npwp ?? "",
    alamat: primaryCompany?.alamat ?? "",
    telepon: primaryCompany?.telepon ?? "",
    email: primaryCompany?.email ?? "",
    mataUangDasarId: primaryCompany?.mataUangDasarId ?? currencies[0]?.id ?? "",
    logo: primaryCompany?.logo ?? "",
  });

  // State Search & Filter Tab 2 (Daftar Multi-Perusahaan)
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("SEMUA");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "adalahHolding", desc: true },
  ]);

  // Handle Simpan Form Profil Utama
  const handleSavePrimary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryCompany) return;

    setIsSavingPrimary(true);
    const api = getApi();

    try {
      const res = await api.keuangan.kontrol.perusahaan({ id: primaryCompany.id }).put({
        nama: primaryForm.nama.trim(),
        npwp: primaryForm.npwp.trim() || undefined,
        alamat: primaryForm.alamat.trim() || undefined,
        telepon: primaryForm.telepon.trim() || undefined,
        email: primaryForm.email.trim() || undefined,
        mataUangDasarId: primaryForm.mataUangDasarId || undefined,
        logo: primaryForm.logo.trim() || undefined,
      });

      if (res.error) {
        const msg =
          (res.error.value as { message?: string })?.message ||
          "Gagal memperbarui profil perusahaan.";
        toast.error(msg);
        return;
      }

      toast.success("Profil perusahaan berhasil diperbarui.");
      router.refresh();
    } catch {
      toast.error("Terjadi galat sistem saat menyimpan profil perusahaan.");
    } finally {
      setIsSavingPrimary(false);
    }
  };

  // Filtered Companies untuk Tab 2
  const filteredCompanies = React.useMemo(() => {
    return initialCompanies.filter((comp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        comp.kode.toLowerCase().includes(q) ||
        comp.nama.toLowerCase().includes(q) ||
        (comp.npwp && comp.npwp.toLowerCase().includes(q));

      const matchStatus =
        filterStatus === "SEMUA" ||
        (filterStatus === "AKTIF" && comp.aktif) ||
        (filterStatus === "NONAKTIF" && !comp.aktif);

      return matchSearch && matchStatus;
    });
  }, [initialCompanies, searchQuery, filterStatus]);

  // Kolom DataGrid Tabel Multi-Perusahaan
  const columns = React.useMemo<ColumnDef<DataGridFeatures, ItemPerusahaan>[]>(() => {
    return [
      {
        accessorKey: "kode",
        id: "kode",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Kode Entitas" visibility={true} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-foreground tracking-wider">
              {row.original.kode}
            </span>
            {row.original.adalahHolding && (
              <Badge variant="outline" className="text-[10px] h-4 font-semibold px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                Holding Group
              </Badge>
            )}
          </div>
        ),
        size: 160,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nama Legal Perusahaan" visibility={true} />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-foreground">{row.original.nama}</span>
            {row.original.alamat && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                {row.original.alamat}
              </span>
            )}
          </div>
        ),
        size: 260,
        enableSorting: true,
      },
      {
        accessorKey: "npwp",
        id: "npwp",
        header: ({ column }) => <DataGridColumnHeader column={column} title="NPWP" visibility={true} />,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.npwp || "—"}
          </span>
        ),
        size: 160,
      },
      {
        accessorKey: "mataUangKode",
        id: "mataUangKode",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Mata Uang" visibility={true} />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-[11px] font-semibold">
            {row.original.mataUangKode || "IDR"}
          </Badge>
        ),
        size: 110,
      },
      {
        accessorKey: "aktif",
        id: "aktif",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" visibility={true} className="justify-center" />
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.aktif ? (
              <Badge variant="success-light" size="sm">
                Aktif
              </Badge>
            ) : (
              <Badge variant="destructive-light" size="sm">
                Nonaktif
              </Badge>
            )}
          </div>
        ),
        size: 100,
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <IconDots className="size-4" />
                  <span className="sr-only">Menu aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => {
                    setCompanyToEdit(row.original);
                    setDialogOpen(true);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <IconEdit className="size-3.5" />
                  Ubah Profil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 60,
      },
    ];
  }, []);

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredCompanies,
    pageCount: Math.ceil((filteredCompanies?.length || 0) / pagination.pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* KPI Stats Strip Seragam Standard ERP */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconBuildingSkyscraper className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Holding / Utama</span>
            <span className="text-lg font-bold text-foreground truncate block">
              {stats.entitasHolding > 0 ? "Holding Group" : "Entitas Tunggal"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconBuilding className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Total Entitas</span>
            <span className="text-lg font-bold text-foreground truncate block">
              {stats.totalEntitas} <span className="text-xs font-normal text-muted-foreground">Perusahaan</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconCheck className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Entitas Aktif</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate block">
              {stats.entitasAktif} <span className="text-xs font-normal text-muted-foreground">Siap Transaksi</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <IconCoin className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Mata Uang Dasar</span>
            <span className="text-lg font-bold font-mono text-foreground truncate block">
              {stats.mataUangUtama}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Layout: Profil Entitas Utama vs Struktur Multi-Perusahaan */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full max-w-[380px] grid-cols-2 h-9 p-1 bg-muted/60">
          <TabsTrigger value="profil" className="text-xs flex items-center gap-1.5 cursor-pointer">
            <IconBuilding className="size-3.5" />
            Profil Perusahaan
          </TabsTrigger>
          <TabsTrigger value="holding" className="text-xs flex items-center gap-1.5 cursor-pointer">
            <IconBuildingSkyscraper className="size-3.5" />
            Multi-Entitas & Holding
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FORM PROFIL PERUSAHAAN UTAMA */}
        <TabsContent value="profil" className="mt-0 focus-visible:outline-none">
          <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border/70 bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <IconBuilding className="size-4 text-primary" />
                  Identitas & Domisili Legal Bisnis
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Informasi ini dicetak secara resmi pada header faktur penjualan, kuitansi, dan SPT pajak.
                </p>
              </div>

              {primaryCompany && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                    KODE: {primaryCompany.kode}
                  </Badge>
                  {primaryCompany.adalahHolding && (
                    <Badge variant="secondary" className="text-xs">
                      Holding
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSavePrimary} className="p-6 space-y-6">
              {/* Seksi 1: Data Badan Usaha & Pajak */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Nama Legal Perusahaan / Badan Usaha <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={primaryForm.nama}
                    onChange={(e) => setPrimaryForm((prev) => ({ ...prev, nama: e.target.value }))}
                    placeholder="mis. PT Surabie Solusi Digital"
                    maxLength={200}
                    className="text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama resmi entitas sesuai akta pendirian perusahaan.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IconReceiptTax className="size-3.5 text-muted-foreground" />
                    Nomor Pokok Wajib Pajak (NPWP 16 Digit)
                  </label>
                  <Input
                    value={primaryForm.npwp}
                    onChange={(e) => setPrimaryForm((prev) => ({ ...prev, npwp: e.target.value }))}
                    placeholder="01.234.567.8-012.000"
                    maxLength={32}
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Digunakan untuk pembuatan faktur pajak (e-Faktur Coretax).
                  </p>
                </div>
              </div>

              {/* Seksi 2: Kontak & Mata Uang */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IconPhone className="size-3.5 text-muted-foreground" />
                    Telepon Kantor
                  </label>
                  <Input
                    value={primaryForm.telepon}
                    onChange={(e) => setPrimaryForm((prev) => ({ ...prev, telepon: e.target.value }))}
                    placeholder="021-5550192"
                    maxLength={30}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IconMail className="size-3.5 text-muted-foreground" />
                    Email Faktur / Finance
                  </label>
                  <Input
                    type="email"
                    value={primaryForm.email}
                    onChange={(e) => setPrimaryForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="finance@surabiedev.com"
                    maxLength={100}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IconCoin className="size-3.5 text-muted-foreground" />
                    Mata Uang Pembukuan
                  </label>
                  <Select
                    value={primaryForm.mataUangDasarId}
                    onValueChange={(val) => setPrimaryForm((prev) => ({ ...prev, mataUangDasarId: val }))}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Pilih Mata Uang Dasar" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.kode} ({c.simbol}) — {c.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seksi 3: Alamat Domisili */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <IconMapPin className="size-3.5 text-muted-foreground" />
                  Alamat Domisili Legal / Kantor Operasional
                </label>
                <Textarea
                  value={primaryForm.alamat}
                  onChange={(e) => setPrimaryForm((prev) => ({ ...prev, alamat: e.target.value }))}
                  placeholder="Jl. Jend. Sudirman Kav. 52-53, Kawasan SCBD, Senayan, Jakarta Selatan 12190"
                  rows={2}
                  maxLength={1000}
                  className="text-xs resize-none"
                />
              </div>

              {/* Seksi 4: Logo Dokumen */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  URL Logo Dokumen (Faktur & Kuitansi)
                </label>
                <div className="flex gap-3 items-center">
                  <Input
                    value={primaryForm.logo}
                    onChange={(e) => setPrimaryForm((prev) => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://example.com/logo-perusahaan.png"
                    maxLength={500}
                    className="text-xs font-mono"
                  />
                  {primaryForm.logo && (
                    <div className="size-9 shrink-0 rounded-md border border-border/80 overflow-hidden flex items-center justify-center bg-muted/40 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={primaryForm.logo}
                        alt="Logo Dokumen"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingPrimary}
                  className="h-8.5 text-xs gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSavingPrimary && <IconLoader2 className="size-3.5 animate-spin" />}
                  Simpan Profil Perusahaan
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* TAB 2: MULTI-ENTITAS & STRUKTUR HOLDING */}
        <TabsContent value="holding" className="mt-0 focus-visible:outline-none">
          <DataGrid
            table={table}
            recordCount={filteredCompanies.length}
            tableLayout={{
              width: "auto",
              columnsPinnable: true,
              columnsResizable: false,
              columnsMovable: true,
              columnsVisibility: true,
            }}
          >
            <Frame className="w-full" stacked dense>
              <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FrameTitle className="text-base font-semibold tracking-tight text-foreground">
                    Daftar Entitas Bisnis & Holding
                  </FrameTitle>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                    {filteredCompanies.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <InputGroup className="bg-background w-44 sm:w-56 h-8">
                    <InputGroupAddon align="inline-start">
                      <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Cari kode/nama/NPWP..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs"
                    />
                    {searchQuery.length > 0 && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          aria-label="Hapus pencarian"
                          size="icon-xs"
                          onClick={() => setSearchQuery("")}
                        >
                          <IconX className="size-3" aria-hidden="true" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </InputGroup>

                  {/* Filter Status */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger size="sm" className="h-8 w-28 sm:w-32 text-xs bg-background">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMUA">Semua Status</SelectItem>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Tambah Entitas Baru Button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      setCompanyToEdit(null);
                      setDialogOpen(true);
                    }}
                    className="h-8 gap-1.5 text-xs shadow-xs cursor-pointer"
                  >
                    <IconPlus className="size-3.5" />
                    Tambah Entitas Baru
                  </Button>
                </div>
              </FrameHeader>

              <FramePanel className="p-0 shadow-none">
                <DataGridScrollArea className="w-full">
                  <DataGridTable />
                </DataGridScrollArea>
              </FramePanel>

              <FrameFooter className="py-1.5 pr-2 pl-2.5">
                <DataGridPagination sizes={[10, 20, 50]} />
              </FrameFooter>
            </Frame>
          </DataGrid>
        </TabsContent>
      </Tabs>

      {/* Dialog Modal Tambah / Ubah Perusahaan */}
      <PerusahaanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currencies={currencies}
        companiesList={initialCompanies}
        itemToEdit={companyToEdit}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
