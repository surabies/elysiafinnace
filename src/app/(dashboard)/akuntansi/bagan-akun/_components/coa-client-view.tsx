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
import {
  IconDots,
  IconEdit,
  IconFileSpreadsheet,
  IconLayoutGrid,
  IconListTree,
  IconPlus,
  IconSearch,
  IconX,
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
import { cn } from "@/lib/utils";
import { CoaStatsStrip } from "./coa-stats";
import { CoaTreeTable, type CoaTreeTableRef } from "./coa-tree-table";
import { CoaFormDialog } from "./coa-form-dialog";
import { CoaImportDialog } from "./coa-import-dialog";
import type { AkunItem, CoaStats, NodeAkun, TipeAkun } from "../_lib/types";

interface CoaClientViewProps {
  initialTree: NodeAkun[];
  initialList: AkunItem[];
  stats: CoaStats;
}

function getTypeBadge(tipe: TipeAkun) {
  switch (tipe) {
    case "ASET":
      return (
        <Badge variant="success-light" size="sm">
          Aset
        </Badge>
      );
    case "KEWAJIBAN":
      return (
        <Badge variant="warning-light" size="sm">
          Kewajiban
        </Badge>
      );
    case "EKUITAS":
      return (
        <Badge variant="primary-light" size="sm">
          Ekuitas
        </Badge>
      );
    case "PENDAPATAN":
      return (
        <Badge variant="info-light" size="sm">
          Pendapatan
        </Badge>
      );
    case "BEBAN":
      return (
        <Badge variant="destructive-light" size="sm">
          Beban
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" size="sm">
          {tipe}
        </Badge>
      );
  }
}

export function CoaClientView({
  initialTree,
  initialList,
  stats,
}: CoaClientViewProps) {
  const router = useRouter();

  const [treeData] = React.useState<NodeAkun[]>(initialTree);
  const [flatData] = React.useState<AkunItem[]>(initialList);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("ALL");
  const [viewMode, setViewMode] = React.useState<"flat" | "tree">("flat");
  const treeRef = React.useRef<CoaTreeTableRef>(null);

  // State pagination, sorting, dan row selection DataGrid
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "kode", desc: false },
  ]);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const selectedCount = React.useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]).length;
  }, [rowSelection]);

  // Modal Dialogs state
  const [formOpen, setFormOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [accountToEdit, setAccountToEdit] = React.useState<AkunItem | null>(null);
  const [defaultParentId, setDefaultParentId] = React.useState<string | null>(null);

  // Daftar akun header untuk opsi induk
  const headerAccounts = React.useMemo(() => {
    return flatData.filter((a) => !a.bisaDiposting);
  }, [flatData]);

  const handleEdit = React.useCallback((acc: AkunItem) => {
    setAccountToEdit(acc);
    setDefaultParentId(null);
    setFormOpen(true);
  }, []);

  const handleAddSub = React.useCallback((parent: AkunItem) => {
    setAccountToEdit(null);
    setDefaultParentId(parent.id);
    setFormOpen(true);
  }, []);

  const handleCreateNew = () => {
    setAccountToEdit(null);
    setDefaultParentId(null);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  // Kolom terpadu untuk DataGrid
  const columns = React.useMemo<ColumnDef<DataGridFeatures, AkunItem>[]>(
    () => [
      {
        accessorKey: "id",
        id: "id",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "kode",
        id: "kode",
        header: ({ column }) => (
          <DataGridColumnHeader title="Kode Akun" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const level = row.original.level;
          const isHeader = !row.original.bisaDiposting;
          return (
            <span
              className={cn(
                "font-mono text-xs",
                level === 1
                  ? "font-bold text-foreground text-xs"
                  : level === 2
                  ? "font-semibold text-foreground"
                  : isHeader
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {row.getValue("kode")}
            </span>
          );
        },
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader title="Nama Akun" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const level = row.original.level;
          const isHeader = !row.original.bisaDiposting;

          return (
            <span
              className={cn(
                "truncate",
                level === 1
                  ? "text-sm font-bold tracking-tight text-foreground"
                  : level === 2
                  ? "text-xs font-semibold text-foreground"
                  : isHeader
                  ? "text-xs font-medium text-foreground"
                  : "text-xs font-normal text-muted-foreground hover:text-foreground"
              )}
            >
              {row.getValue("nama")}
            </span>
          );
        },
        size: 280,
        enableSorting: true,
      },
      {
        accessorKey: "tipeAkun",
        id: "tipeAkun",
        header: ({ column }) => (
          <DataGridColumnHeader title="Tipe Akun" visibility={true} column={column} />
        ),
        cell: ({ row }) => getTypeBadge(row.getValue("tipeAkun") as TipeAkun),
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "bisaDiposting",
        id: "bisaDiposting",
        header: ({ column }) => (
          <DataGridColumnHeader title="Klasifikasi" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const isHeader = !row.original.bisaDiposting;
          const level = row.original.level;

          if (isHeader) {
            return (
              <Badge variant="secondary" size="sm">
                Header (L{level})
              </Badge>
            );
          }

          return (
            <span className="text-[11px] text-muted-foreground">
              Posting
            </span>
          );
        },
        size: 140,
        enableSorting: true,
      },
      {
        accessorKey: "normalBalance",
        id: "normalBalance",
        header: ({ column }) => (
          <DataGridColumnHeader title="Saldo Normal" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const nb = row.getValue("normalBalance") as string;
          return nb === "DEBIT" ? (
            <Badge variant="success-light" size="sm" className="font-mono">
              Debit (Dr)
            </Badge>
          ) : (
            <Badge variant="info-light" size="sm" className="font-mono">
              Kredit (Cr)
            </Badge>
          );
        },
        size: 130,
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <IconDots className="size-4" />
                <span className="sr-only">Buka menu aksi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                <IconEdit className="mr-2 size-3.5" />
                Ubah
              </DropdownMenuItem>
              {!row.original.bisaDiposting && (
                <DropdownMenuItem onClick={() => handleAddSub(row.original)}>
                  <IconPlus className="mr-2 size-3.5" />
                  Tambah Sub
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [handleEdit, handleAddSub]
  );

  const filteredData = React.useMemo(() => {
    return flatData.filter((acc) => {
      const matchSearch =
        !searchQuery ||
        acc.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType =
        selectedType === "ALL" || acc.tipeAkun === selectedType;
      return matchSearch && matchType;
    });
  }, [flatData, searchQuery, selectedType]);

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: AkunItem) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
      rowSelection,
    },
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* KPI Stats Strip */}
      <CoaStatsStrip stats={stats} />

      {/* Frame Kontainer Utama: Header, Controls, Table, & Pagination */}
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
          {/* FrameHeader Terpadu */}
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FrameTitle className="text-base font-semibold tracking-tight text-foreground">
                Bagan Akun
              </FrameTitle>

              {viewMode === "tree" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-l border-border pl-3">
                  <span className="text-[11px] font-medium text-foreground">Pohon Hierarki</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => treeRef.current?.expandAll()}
                    className="hover:text-foreground hover:underline transition-colors cursor-pointer"
                  >
                    Buka Semua
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => treeRef.current?.collapseAll()}
                    className="hover:text-foreground hover:underline transition-colors cursor-pointer"
                  >
                    Tutup Semua
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol batal seleksi: gaya seamless ghost dengan badge count (di depan search box) */}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setRowSelection({})}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title={`Batalkan pilihan (${selectedCount} akun terpilih)`}
                  aria-label={`Batalkan pilihan (${selectedCount} akun terpilih)`}
                >
                  <span className="font-mono text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                    {selectedCount}
                  </span>
                  <IconX className="size-3.5 text-destructive" aria-hidden="true" />
                </button>
              )}

              {/* InputGroup Search */}
              <InputGroup className="bg-background w-44 sm:w-52 h-8">
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

              {/* Select Filter Tipe Akun */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger size="sm" className="h-8 w-28 sm:w-32 text-xs bg-background">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Tipe</SelectItem>
                  <SelectItem value="ASET">Aset</SelectItem>
                  <SelectItem value="KEWAJIBAN">Kewajiban</SelectItem>
                  <SelectItem value="EKUITAS">Ekuitas</SelectItem>
                  <SelectItem value="PENDAPATAN">Pendapatan</SelectItem>
                  <SelectItem value="BEBAN">Beban</SelectItem>
                </SelectContent>
              </Select>

              {/* ToggleGroup Shadcn UI: Mengintegrasikan Menu Tab Switcher (Flat & Tree), Import CSV, dan Tambah Akun (Icon Only) */}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={viewMode}
                onValueChange={(val) => {
                  if (val === "flat" || val === "tree") {
                    setViewMode(val);
                  }
                }}
                className="h-8 shadow-xs"
              >
                <ToggleGroupItem
                  value="flat"
                  aria-label="Tabel Datar"
                  title="Tabel Datar"
                  className="h-8 w-8 p-0"
                >
                  <IconLayoutGrid className="size-4" aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="tree"
                  aria-label="Pohon Hierarki"
                  title="Pohon Hierarki"
                  className="h-8 w-8 p-0"
                >
                  <IconListTree className="size-4" aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="import"
                  aria-label="Import CSV"
                  title="Import CSV"
                  onClick={() => setImportOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <IconFileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="add"
                  aria-label="Tambah Akun Baru"
                  title="Tambah Akun Baru"
                  onClick={handleCreateNew}
                  className="h-8 w-8 p-0"
                >
                  <IconPlus className="size-4" aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </FrameHeader>

          {/* FramePanel: Transisi mulus antara Tabel Datar & Pohon Hierarki di kontainer yang sama dengan style konsisten */}
          <FramePanel className="p-0 shadow-none">
            <DataGridScrollArea className="w-full">
              {viewMode === "flat" ? (
                <DataGridTable />
              ) : (
                <CoaTreeTable
                  ref={treeRef}
                  nodes={treeData}
                  onEdit={handleEdit}
                  onAddSub={handleAddSub}
                  searchQuery={searchQuery}
                  selectedType={selectedType}
                />
              )}
            </DataGridScrollArea>
          </FramePanel>

          {/* FrameFooter: Paginasi saat tabel datar, info hierarki saat pohon */}
          <FrameFooter className="py-1.5 pr-2 pl-2.5">
            {viewMode === "flat" ? (
              <DataGridPagination sizes={[10, 20, 50, 100]} />
            ) : (
              <div className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                <span>Struktur Pohon Hierarki Bagan Akun</span>
                <span className="font-mono text-[11px]">Total {flatData.length} akun</span>
              </div>
            )}
          </FrameFooter>
        </Frame>
      </DataGrid>

      {/* Form Dialog & Import Dialog */}
      <CoaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        accountToEdit={accountToEdit}
        defaultParentId={defaultParentId}
        headerAccounts={headerAccounts}
        onSuccess={handleSuccess}
      />

      <CoaImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
