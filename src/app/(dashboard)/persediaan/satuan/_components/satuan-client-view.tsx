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
  IconSearch,
  IconEdit,
  IconTrash,
  IconScale,
  IconPlus,
  IconX,
  IconCheck,
  IconDots,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import type { SatuanItem, SatuanStats } from "../_lib/types";
import { SatuanFormDialog } from "./satuan-form-dialog";
import { SatuanDeleteDialog } from "./satuan-delete-dialog";

interface SatuanClientViewProps {
  initialData: SatuanItem[];
  stats: SatuanStats;
}

export function SatuanClientView({ initialData, stats }: SatuanClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterAktif, setFilterAktif] = React.useState<string>("SEMUA");
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedSatuan, setSelectedSatuan] = React.useState<SatuanItem | null>(null);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "kode", desc: false },
  ]);

  const filteredData = React.useMemo(() => {
    return initialData.filter((sat) => {
      const matchSearch =
        !searchQuery ||
        sat.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sat.nama.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAktif =
        filterAktif === "SEMUA" ||
        (filterAktif === "AKTIF" && sat.aktif) ||
        (filterAktif === "NONAKTIF" && !sat.aktif);

      return matchSearch && matchAktif;
    });
  }, [initialData, searchQuery, filterAktif]);

  const columns = React.useMemo<ColumnDef<DataGridFeatures, SatuanItem>[]>(
    () => [
      {
        accessorKey: "kode",
        id: "kode",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kode Satuan" visibility={true} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-border/80 bg-muted/60 text-foreground">
            {row.original.kode}
          </span>
        ),
        size: 140,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nama Lengkap Satuan" visibility={true} />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground tracking-tight">
            {row.original.nama}
          </span>
        ),
        size: 320,
        enableSorting: true,
      },
      {
        accessorKey: "aktif",
        id: "aktif",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" visibility={true} />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.aktif ? "success-light" : "outline"}
            size="sm"
            className="font-normal text-[11px]"
          >
            {row.original.aktif ? "Aktif" : "Nonaktif"}
          </Badge>
        ),
        size: 110,
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <IconDots className="size-4" />
                  <span className="sr-only">Menu Aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSatuan(row.original);
                    setFormDialogOpen(true);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <IconEdit className="size-3.5" />
                  Ubah Satuan
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSatuan(row.original);
                    setDeleteDialogOpen(true);
                  }}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <IconTrash className="size-3.5" />
                  Hapus Satuan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 60,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* KPI Stats Strip Satuan */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconScale className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Total Satuan Pengukuran</span>
            <span className="text-lg font-bold text-foreground">{stats.totalSatuan} Satuan</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconCheck className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Satuan Aktif Digunakan</span>
            <span className="text-lg font-bold text-foreground">{stats.satuanAktif} Satuan</span>
          </div>
        </div>
      </div>

      {/* Tabel DataGrid Modern Pola COA/Kontak/Katalog */}
      <DataGrid
        table={table}
        recordCount={filteredData.length}
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
            <div>
              <FrameTitle className="text-base font-semibold tracking-tight text-foreground">
                Daftar Satuan Pengukuran (UOM)
              </FrameTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* InputGroup Search */}
              <InputGroup className="bg-background w-44 sm:w-56 h-8">
                <InputGroupAddon align="inline-start">
                  <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Cari kode atau nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs"
                />
                {searchQuery.length > 0 && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="Hapus pencarian"
                      title="Hapus pencarian"
                      size="icon-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      <IconX className="size-3" aria-hidden="true" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              {/* Filter Status Aktif */}
              <Select value={filterAktif} onValueChange={setFilterAktif}>
                <SelectTrigger size="sm" className="h-8 w-28 sm:w-32 text-xs bg-background">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                </SelectContent>
              </Select>

              {/* ToggleGroup Shadcn UI: Tambah Satuan (Icon Only) */}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value=""
                className="h-8 shadow-xs"
              >
                <ToggleGroupItem
                  value="add"
                  aria-label="Tambah Satuan Baru"
                  title="Tambah Satuan Baru"
                  onClick={() => {
                    setSelectedSatuan(null);
                    setFormDialogOpen(true);
                  }}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <IconPlus className="size-4" aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </FrameHeader>

          {/* FramePanel: Kontainer DataGridTable konsisten */}
          <FramePanel className="p-0 shadow-none">
            <DataGridScrollArea className="w-full">
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>

          {/* FrameFooter: Paginasi seragam */}
          <FrameFooter className="py-1.5 pr-2 pl-2.5">
            <DataGridPagination sizes={[10, 20, 50, 100]} />
          </FrameFooter>
        </Frame>
      </DataGrid>

      {/* Modal Form Tambah / Edit */}
      <SatuanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        itemToEdit={selectedSatuan}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Modal Hapus */}
      <SatuanDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={selectedSatuan}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
