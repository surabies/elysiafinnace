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
  IconCategory,
  IconPlus,
  IconX,
  IconHierarchy,
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
import type { KategoriItem, KategoriStats } from "../_lib/types";
import { KategoriFormDialog } from "./kategori-form-dialog";
import { KategoriDeleteDialog } from "./kategori-delete-dialog";

interface KategoriClientViewProps {
  initialData: KategoriItem[];
  stats: KategoriStats;
}

export function KategoriClientView({ initialData, stats }: KategoriClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterAktif, setFilterAktif] = React.useState<string>("SEMUA");
  const [filterTag, setFilterTag] = React.useState<string>("SEMUA");
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedKategori, setSelectedKategori] = React.useState<KategoriItem | null>(null);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "kode", desc: false },
  ]);

  const availableTags = React.useMemo(() => {
    const map = new Map<string, { id: string; nama: string; warna: string }>();
    for (const item of initialData) {
      for (const t of item.tags || []) {
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
  }, [initialData]);

  const filteredData = React.useMemo(() => {
    return initialData.filter((kat) => {
      const matchSearch =
        !searchQuery ||
        kat.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kat.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (kat.keterangan && kat.keterangan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (kat.indukNama && kat.indukNama.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAktif =
        filterAktif === "SEMUA" ||
        (filterAktif === "AKTIF" && kat.aktif) ||
        (filterAktif === "NONAKTIF" && !kat.aktif);

      const matchTag =
        filterTag === "SEMUA" ||
        (kat.tags && kat.tags.some((t) => t.id === filterTag));

      return matchSearch && matchAktif && matchTag;
    });
  }, [initialData, searchQuery, filterAktif, filterTag]);

  const columns = React.useMemo<ColumnDef<DataGridFeatures, KategoriItem>[]>(
    () => [
      {
        accessorKey: "kode",
        id: "kode",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kode Kategori" visibility={true} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-border/80 bg-muted/60 text-foreground">
            {row.original.kode}
          </span>
        ),
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nama Kategori" visibility={true} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-0.5">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {row.original.nama}
            </span>
            {row.original.keterangan && (
              <span className="text-[11px] text-muted-foreground line-clamp-1">
                {row.original.keterangan}
              </span>
            )}
          </div>
        ),
        size: 280,
        enableSorting: true,
      },
      {
        accessorKey: "indukNama",
        id: "indukNama",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kategori Induk" visibility={true} />
        ),
        cell: ({ row }) => {
          if (!row.original.indukNama) {
            return (
              <span className="text-[11px] text-muted-foreground italic">
                Utama (Top Level)
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <IconHierarchy className="size-3.5 text-primary opacity-80 shrink-0" />
              <span>{row.original.indukNama}</span>
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "tags",
        id: "tags",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Tag Label" visibility={true} />
        ),
        cell: ({ row }) => {
          const tags = row.original.tags || [];
          if (tags.length === 0) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
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
        size: 150,
        enableSorting: false,
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
        size: 100,
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
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedKategori(row.original);
                    setFormDialogOpen(true);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <IconEdit className="size-3.5" />
                  Ubah Kategori
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedKategori(row.original);
                    setDeleteDialogOpen(true);
                  }}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <IconTrash className="size-3.5" />
                  Hapus Kategori
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
      {/* KPI Stats Strip Kategori */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconCategory className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Total Kategori</span>
            <span className="text-lg font-bold text-foreground">{stats.totalKategori}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconCheck className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Kategori Aktif</span>
            <span className="text-lg font-bold text-foreground">{stats.kategoriAktif}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconCategory className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Kategori Utama</span>
            <span className="text-lg font-bold text-foreground">{stats.kategoriInduk}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <IconHierarchy className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Sub-Kategori</span>
            <span className="text-lg font-bold text-foreground">{stats.subKategori}</span>
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
                Kategori Produk & Jasa
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

              {/* Filter Tag */}
              {availableTags.length > 0 && (
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger size="sm" className="h-8 w-28 sm:w-36 text-xs bg-background">
                    <SelectValue placeholder="Semua Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMUA">Semua Tag</SelectItem>
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

              {/* ToggleGroup Shadcn UI: Tambah Kategori (Icon Only) */}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value=""
                className="h-8 shadow-xs"
              >
                <ToggleGroupItem
                  value="add"
                  aria-label="Tambah Kategori Baru"
                  title="Tambah Kategori Baru"
                  onClick={() => {
                    setSelectedKategori(null);
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
      <KategoriFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        itemToEdit={selectedKategori}
        daftarKategori={initialData}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Modal Hapus */}
      <KategoriDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={selectedKategori}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
