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
  IconNumbers,
  IconSparkles,
  IconX,
  IconReceipt,
  IconBuildingBank,
  IconUsers,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemPenomoran } from "../_lib/types";
import { PenomoranEditDialog } from "./penomoran-edit-dialog";

interface PenomoranClientViewProps {
  initialData: ItemPenomoran[];
}

export function PenomoranClientView({ initialData }: PenomoranClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [modulFilter, setModulFilter] = React.useState<string>("SEMUA");
  const [selectedItem, setSelectedItem] = React.useState<ItemPenomoran | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Metrik KPI Strip
  const stats = React.useMemo(() => {
    return {
      total: initialData.length,
      transaksi: initialData.filter((d) => ["PENJUALAN", "PEMBELIAN", "BIAYA"].includes(d.modul.toUpperCase())).length,
      keuangan: initialData.filter((d) => ["KAS & BANK", "AKUNTANSI", "ANGGARAN"].includes(d.modul.toUpperCase())).length,
      masterData: initialData.filter((d) => ["MASTER DATA", "PERSEDIAAN", "ASET TETAP", "DIMENSI"].includes(d.modul.toUpperCase())).length,
    };
  }, [initialData]);

  const filteredData = React.useMemo(() => {
    return initialData.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.prefiks.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.modul.toLowerCase().includes(searchQuery.toLowerCase());

      const matchModul =
        modulFilter === "SEMUA" ||
        item.modul.toUpperCase() === modulFilter;

      return matchSearch && matchModul;
    });
  }, [initialData, searchQuery, modulFilter]);

  const columns = React.useMemo<ColumnDef<DataGridFeatures, ItemPenomoran>[]>(
    () => [
      {
        accessorKey: "prefiks",
        id: "prefiks",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Prefiks" visibility={true} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-border/80 bg-muted/60 text-foreground">
            {row.original.prefiks}
          </span>
        ),
        size: 90,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Jenis Dokumen / Entitas" visibility={true} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-0.5">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {row.original.nama}
            </span>
            <span className="text-[11px] text-muted-foreground line-clamp-1">
              {row.original.deskripsi}
            </span>
          </div>
        ),
        size: 270,
        enableSorting: true,
      },
      {
        accessorKey: "modul",
        id: "modul",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Klasifikasi Modul" visibility={true} />
        ),
        cell: ({ row }) => {
          const mod = row.original.modul.toUpperCase();
          const isMaster = mod === "MASTER DATA";
          return (
            <Badge
              variant={isMaster ? "info-light" : "outline"}
              size="sm"
              className="text-[11px] font-normal"
            >
              {row.original.modul}
            </Badge>
          );
        },
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "formatPola",
        id: "formatPola",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Rumus Penomoran Seri" visibility={true} />
        ),
        cell: ({ row }) => (
          <code className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
            {row.original.formatPola}
          </code>
        ),
        size: 220,
      },
      {
        accessorKey: "nilaiTerakhir",
        id: "nilaiTerakhir",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Counter Urut" visibility={true} />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-xs text-foreground font-semibold">
            {row.original.nilaiTerakhir}
          </div>
        ),
        size: 110,
        enableSorting: true,
      },
      {
        accessorKey: "contohBerikutnya",
        id: "contohBerikutnya",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomor Seri Berikutnya" visibility={true} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-mono text-xs text-primary font-medium">
            <IconSparkles className="size-3.5 opacity-80 shrink-0" />
            <span>{row.original.contohBerikutnya}</span>
          </div>
        ),
        size: 190,
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => {
                setSelectedItem(row.original);
                setDialogOpen(true);
              }}
            >
              <IconEdit className="size-3.5" />
              Sesuaikan
            </Button>
          </div>
        ),
        size: 100,
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
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconNumbers className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Total Konfigurasi</span>
            <span className="text-lg font-bold text-foreground">{stats.total} Seri</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconReceipt className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Siklus Dagang & Biaya</span>
            <span className="text-lg font-bold text-foreground">{stats.transaksi} Dokumen</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconBuildingBank className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Kas, Bank & Akuntansi</span>
            <span className="text-lg font-bold text-foreground">{stats.keuangan} Dokumen</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <IconUsers className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Master & Inventori</span>
            <span className="text-lg font-bold text-foreground">{stats.masterData} Entitas</span>
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
                Penomoran Dokumen & Master Data
              </FrameTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* InputGroup Search */}
              <InputGroup className="bg-background w-44 sm:w-56 h-8">
                <InputGroupAddon align="inline-start">
                  <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Cari prefiks atau nama..."
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

              {/* Filter Modul Dokumen */}
              <Select value={modulFilter} onValueChange={setModulFilter}>
                <SelectTrigger size="sm" className="h-8 w-28 sm:w-40 text-xs bg-background">
                  <SelectValue placeholder="Semua Modul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua Modul</SelectItem>
                  <SelectItem value="MASTER DATA">Master Data</SelectItem>
                  <SelectItem value="PENJUALAN">Penjualan</SelectItem>
                  <SelectItem value="PEMBELIAN">Pembelian</SelectItem>
                  <SelectItem value="KAS & BANK">Kas & Bank</SelectItem>
                  <SelectItem value="AKUNTANSI">Akuntansi</SelectItem>
                  <SelectItem value="PERSEDIAAN">Persediaan</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Dialog Penyesuaian Counter */}
      <PenomoranEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
