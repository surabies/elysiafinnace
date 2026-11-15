"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameFooter,
  FrameTitle,
} from "@/components/reui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  IconDots,
  IconEdit,
  IconPlus,
  IconSearch,
  IconX,
  IconBuildingWarehouse,
} from "@tabler/icons-react";
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
import { GudangFormDialog } from "./gudang-form-dialog";
import type { GudangItem, GudangStats } from "../_lib/types";

interface GudangClientViewProps {
  initialData: GudangItem[];
  stats: GudangStats;
}

export function GudangClientView({
  initialData,
  stats,
}: GudangClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterAktif, setFilterAktif] = React.useState<string>("SEMUA");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "kode", desc: false },
  ]);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Dialog State
  const [formOpen, setFormOpen] = React.useState(false);
  const [gudangToEdit, setGudangToEdit] = React.useState<GudangItem | null>(null);

  const handleEdit = React.useCallback((gudang: GudangItem) => {
    setGudangToEdit(gudang);
    setFormOpen(true);
  }, []);

  const handleAddNew = () => {
    setGudangToEdit(null);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const filteredData = React.useMemo(() => {
    return initialData.filter((gudang) => {
      const matchSearch =
        !searchQuery ||
        gudang.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gudang.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (gudang.penanggungJawab && gudang.penanggungJawab.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (gudang.alamat && gudang.alamat.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAktif =
        filterAktif === "SEMUA" ||
        (filterAktif === "AKTIF" && gudang.aktif) ||
        (filterAktif === "NONAKTIF" && !gudang.aktif);

      return matchSearch && matchAktif;
    });
  }, [initialData, searchQuery, filterAktif]);

  const columns = React.useMemo<ColumnDef<DataGridFeatures, GudangItem>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "kode",
        id: "kode",
        header: ({ column }) => (
          <DataGridColumnHeader title="Kode" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {row.original.kode}
          </span>
        ),
        size: 110,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader title="Nama Gudang" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const g = row.original;
          return (
            <div className="flex flex-col min-w-0 py-0.5">
              <span className="text-xs font-semibold text-foreground truncate">
                {g.nama}
              </span>
              {g.penanggungJawab && (
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  PIC: {g.penanggungJawab}
                </span>
              )}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
      },
      {
        accessorKey: "alamat",
        id: "alamat",
        header: ({ column }) => (
          <DataGridColumnHeader title="Lokasi / Alamat" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[250px] block">
            {row.original.alamat || "-"}
          </span>
        ),
        size: 240,
        enableSorting: true,
      },
      {
        accessorKey: "adalahGudangUtama",
        id: "adalahGudangUtama",
        header: ({ column }) => (
          <DataGridColumnHeader title="Jenis" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          if (row.original.adalahGudangUtama) {
            return (
              <Badge variant="primary-light" size="sm" className="font-normal text-[11px]">
                Gudang Utama
              </Badge>
            );
          }
          return (
            <span className="text-xs text-muted-foreground">Cabang</span>
          );
        },
        size: 120,
        enableSorting: true,
      },
      {
        accessorKey: "aktif",
        id: "aktif",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" visibility={true} column={column} />
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
        size: 85,
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => {
          const g = row.original;
          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <IconDots className="size-4" />
                    <span className="sr-only">Menu Aksi</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => handleEdit(g)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <IconEdit className="size-3.5" />
                    Ubah Gudang
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        size: 60,
      },
    ],
    [handleEdit]
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnOrder,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
  });

  const selectedCount = React.useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]).length;
  }, [rowSelection]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* KPI Stats Strip Gudang */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconBuildingWarehouse className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-muted-foreground block truncate">
              Total Fasilitas Gudang
            </span>
            <div className="text-lg font-bold tracking-tight text-foreground">
              {stats.totalGudang} Lokasi
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconBuildingWarehouse className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-muted-foreground block truncate">
              Gudang Beroperasi Aktif
            </span>
            <div className="text-lg font-bold tracking-tight text-foreground">
              {stats.gudangAktif} Lokasi
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <IconBuildingWarehouse className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-muted-foreground block truncate">
              Gudang Utama Default
            </span>
            <div className="text-sm font-semibold tracking-tight text-foreground truncate">
              {stats.gudangUtamaNama || "Belum Ditentukan"}
            </div>
          </div>
        </div>
      </div>

      {/* Frame Table DataGrid */}
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
                Daftar Gudang & Lokasi Penyimpanan
              </FrameTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol batal seleksi: gaya seamless ghost dengan badge count */}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setRowSelection({})}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title={`Batalkan pilihan (${selectedCount} gudang terpilih)`}
                  aria-label={`Batalkan pilihan (${selectedCount} gudang terpilih)`}
                >
                  <span className="font-mono text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                    {selectedCount}
                  </span>
                  <IconX className="size-3.5 text-destructive" aria-hidden="true" />
                </button>
              )}

              {/* Input Group Search */}
              <InputGroup className="bg-background w-44 sm:w-56 h-8">
                <InputGroupAddon align="inline-start">
                  <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Cari gudang..."
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
                <SelectTrigger size="sm" className="h-8 w-24 sm:w-32 text-xs bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                </SelectContent>
              </Select>

              {/* ToggleGroup Shadcn UI: Tambah Gudang (Icon Only) */}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value=""
                className="h-8 shadow-xs"
              >
                <ToggleGroupItem
                  value="add"
                  aria-label="Tambah Gudang Baru"
                  title="Tambah Gudang Baru"
                  onClick={handleAddNew}
                  className="h-8 w-8 p-0"
                >
                  <IconPlus className="size-4" aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </FrameHeader>

          {/* FramePanel: Table */}
          <FramePanel className="p-0 shadow-none">
            <DataGridScrollArea className="w-full">
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>

          {/* FrameFooter: Pagination */}
          <FrameFooter className="py-1.5 pr-2 pl-2.5">
            <DataGridPagination sizes={[10, 20, 50, 100]} />
          </FrameFooter>
        </Frame>
      </DataGrid>

      {/* Dialog Form */}
      <GudangFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        gudangToEdit={gudangToEdit}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
