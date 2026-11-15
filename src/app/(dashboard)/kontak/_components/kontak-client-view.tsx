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
  IconMail,
  IconPhone,
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
import { KontakStatsStrip } from "./kontak-stats";
import { KontakFormDialog } from "./kontak-form-dialog";
import { KontakImportDialog } from "./kontak-import-dialog";
import type { KontakItem, KontakStats, TerminOption } from "../_lib/types";

interface KontakClientViewProps {
  initialData: KontakItem[];
  stats: KontakStats;
  entityTitle: string; // "Pelanggan" atau "Pemasok"
  jenis: "PELANGGAN" | "PEMASOK";
  terminOptions: TerminOption[];
}

export function KontakClientView({
  initialData,
  stats,
  entityTitle,
  jenis,
  terminOptions,
}: KontakClientViewProps) {
  const router = useRouter();

  const [kontakList] = React.useState<KontakItem[]>(initialData);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGroup, setSelectedGroup] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [selectedTag, setSelectedTag] = React.useState("ALL");

  // State pagination, sorting, dan row selection DataGrid v9
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "nama", desc: false },
  ]);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const selectedCount = React.useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]).length;
  }, [rowSelection]);

  // Modal Dialogs state
  const [formOpen, setFormOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [kontakToEdit, setKontakToEdit] = React.useState<KontakItem | null>(null);

  // Kumpulan grup unik
  const availableGroups = React.useMemo(() => {
    const set = new Set<string>();
    for (const k of kontakList) {
      if (k.grup) set.add(k.grup);
    }
    return Array.from(set);
  }, [kontakList]);

  // Kumpulan tag unik yang digunakan kontak
  const availableTags = React.useMemo(() => {
    const map = new Map<string, { id: string; nama: string; warna: string }>();
    for (const k of kontakList) {
      for (const t of k.tags || []) {
        if (!map.has(t.id)) {
          map.set(t.id, {
            id: t.id,
            nama: t.nama,
            warna: t.warna || "#6366f1",
          });
        }
      }
    }
    return Array.from(map.values());
  }, [kontakList]);

  const handleEdit = React.useCallback((k: KontakItem) => {
    setKontakToEdit(k);
    setFormOpen(true);
  }, []);

  const handleCreateNew = () => {
    setKontakToEdit(null);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  // Kolom DataGrid untuk Kontak
  const columns = React.useMemo<ColumnDef<DataGridFeatures, KontakItem>[]>(
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
          <DataGridColumnHeader title="Kode" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {row.getValue("kode")}
          </span>
        ),
        size: 110,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader title="Nama Kontak" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground truncate">
              {row.getValue("nama")}
            </span>
            {row.original.namaKontak && (
              <span className="text-[10px] text-muted-foreground truncate">
                PIC: {row.original.namaKontak}
              </span>
            )}
          </div>
        ),
        size: 240,
        enableSorting: true,
      },
      {
        accessorKey: "grup",
        id: "grup",
        header: ({ column }) => (
          <DataGridColumnHeader title="Grup" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const val = row.getValue("grup") as string | null;
          return val ? (
            <Badge variant="secondary" size="sm">
              {val}
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">-</span>
          );
        },
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "tags",
        id: "tags",
        header: ({ column }) => (
          <DataGridColumnHeader title="Tag Label" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const tags = row.original.tags || [];
          if (tags.length === 0) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-[220px]">
              {tags.map((t) => {
                const hexWarna = t.warna || "#6366f1";
                return (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border"
                    style={{
                      backgroundColor: `${hexWarna}15`,
                      borderColor: `${hexWarna}40`,
                      color: hexWarna,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: hexWarna }}
                    />
                    <span className="truncate max-w-[80px]">{t.nama}</span>
                  </span>
                );
              })}
            </div>
          );
        },
        size: 160,
        enableSorting: false,
      },
      {
        accessorKey: "email",
        id: "email",
        header: ({ column }) => (
          <DataGridColumnHeader title="Kontak Utama" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const email = row.original.email;
          const tel = row.original.telepon;
          return (
            <div className="flex flex-col gap-0.5 text-[11px]">
              {email && (
                <span className="flex items-center gap-1 text-muted-foreground truncate" title={email}>
                  <IconMail className="size-3 shrink-0" />
                  <span className="truncate">{email}</span>
                </span>
              )}
              {tel && (
                <span className="flex items-center gap-1 font-mono text-muted-foreground">
                  <IconPhone className="size-3 shrink-0" />
                  <span>{tel}</span>
                </span>
              )}
              {!email && !tel && <span className="text-muted-foreground">-</span>}
            </div>
          );
        },
        size: 190,
        enableSorting: false,
      },
      {
        accessorKey: "npwp",
        id: "npwp",
        header: ({ column }) => (
          <DataGridColumnHeader title="Perpajakan" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const npwp = row.original.npwp;
          const isPkp = row.original.adalahPkp;
          return (
            <div className="flex flex-col gap-0.5">
              {isPkp ? (
                <Badge variant="primary-light" size="sm" className="w-fit">
                  PKP
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">Non-PKP</span>
              )}
              {npwp && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {npwp}
                </span>
              )}
            </div>
          );
        },
        size: 150,
        enableSorting: false,
      },
      {
        accessorKey: "batasKredit",
        id: "batasKredit",
        header: ({ column }) => (
          <DataGridColumnHeader title="Plafon Kredit" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const val = Number(row.getValue("batasKredit") || 0);
          if (val === 0) {
            return <span className="text-[11px] text-muted-foreground">Tak Terbatas</span>;
          }
          return (
            <span className="font-mono text-xs tabular-nums text-foreground">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(val)}
            </span>
          );
        },
        size: 140,
        enableSorting: true,
      },
      {
        accessorKey: "aktif",
        id: "aktif",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const aktif = row.getValue("aktif") as boolean;
          return aktif ? (
            <Badge variant="success-light" size="sm">
              Aktif
            </Badge>
          ) : (
            <Badge variant="destructive-light" size="sm">
              Nonaktif
            </Badge>
          );
        },
        size: 90,
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
                Ubah Profil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [handleEdit]
  );

  const filteredData = React.useMemo(() => {
    return kontakList.filter((k) => {
      const matchSearch =
        !searchQuery ||
        k.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.email && k.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (k.telepon && k.telepon.includes(searchQuery));

      const matchGroup =
        selectedGroup === "ALL" || k.grup === selectedGroup;

      const matchStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "AKTIF" && k.aktif) ||
        (selectedStatus === "NONAKTIF" && !k.aktif);

      const matchTag =
        selectedTag === "ALL" ||
        (k.tags && k.tags.some((t) => t.id === selectedTag));

      return matchSearch && matchGroup && matchStatus && matchTag;
    });
  }, [kontakList, searchQuery, selectedGroup, selectedStatus, selectedTag]);

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: KontakItem) => row.id,
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
      <KontakStatsStrip stats={stats} entityTitle={entityTitle} />

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
            <div>
              <FrameTitle className="text-base font-semibold tracking-tight text-foreground">
                Daftar {entityTitle}
              </FrameTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol batal seleksi: gaya seamless ghost dengan badge count (di depan search box) */}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setRowSelection({})}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title={`Batalkan pilihan (${selectedCount} ${entityTitle.toLowerCase()} terpilih)`}
                  aria-label={`Batalkan pilihan (${selectedCount} ${entityTitle.toLowerCase()} terpilih)`}
                >
                  <span className="font-mono text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                    {selectedCount}
                  </span>
                  <IconX className="size-3.5 text-destructive" aria-hidden="true" />
                </button>
              )}

              {/* InputGroup Search */}
              <InputGroup className="bg-background w-44 sm:w-56 h-8">
                <InputGroupAddon align="inline-start">
                  <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={`Cari nama, kode, email...`}
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

              {/* Filter Grup */}
              {availableGroups.length > 0 && (
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger size="sm" className="h-8 w-28 sm:w-32 text-xs bg-background">
                    <SelectValue placeholder="Semua Grup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Grup</SelectItem>
                    {availableGroups.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Filter Tag */}
              {availableTags.length > 0 && (
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger size="sm" className="h-8 w-28 sm:w-36 text-xs bg-background">
                    <SelectValue placeholder="Semua Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tag</SelectItem>
                    {availableTags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: t.warna }}
                          />
                          <span className="truncate">{t.nama}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Filter Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger size="sm" className="h-8 w-24 sm:w-28 text-xs bg-background">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                </SelectContent>
              </Select>

              {/* ToggleGroup Shadcn UI: Import CSV & Tambah Baru (Icon Only) */}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value=""
                className="h-8 shadow-xs"
              >
                <ToggleGroupItem
                  value="import"
                  aria-label={`Import ${entityTitle} CSV`}
                  title={`Import ${entityTitle} CSV`}
                  onClick={() => setImportOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <IconFileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="add"
                  aria-label={`Tambah ${entityTitle} Baru`}
                  title={`Tambah ${entityTitle} Baru`}
                  onClick={handleCreateNew}
                  className="h-8 w-8 p-0"
                >
                  <IconPlus className="size-4" aria-hidden="true" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </FrameHeader>

          {/* FramePanel: DataGridTable */}
          <FramePanel className="p-0 shadow-none">
            <DataGridScrollArea className="w-full">
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>

          {/* FrameFooter: Paginasi */}
          <FrameFooter className="py-1.5 pr-2 pl-2.5">
            <DataGridPagination sizes={[10, 20, 50, 100]} />
          </FrameFooter>
        </Frame>
      </DataGrid>

      {/* Form Dialog & Import Dialog */}
      <KontakFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        kontakToEdit={kontakToEdit}
        defaultJenis={jenis}
        terminOptions={terminOptions}
        onSuccess={handleSuccess}
      />

      <KontakImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityTitle={entityTitle}
        defaultTipe={jenis}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
