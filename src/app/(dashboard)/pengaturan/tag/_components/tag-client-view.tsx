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
  IconPlus,
  IconX,
  IconDots,
  IconTag,
  IconCheck,
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
import type { ItemTag, TagStats } from "../_lib/types";
import { TagFormDialog } from "./tag-form-dialog";
import { TagDeleteDialog } from "./tag-delete-dialog";

interface TagClientViewProps {
  initialData: ItemTag[];
  stats: TagStats;
}

export function TagClientView({ initialData, stats }: TagClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("SEMUA");
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedTag, setSelectedTag] = React.useState<ItemTag | null>(null);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const filteredData = React.useMemo(() => {
    return initialData.filter((tag) => {
      const matchSearch =
        !searchQuery ||
        tag.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tag.keterangan && tag.keterangan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tag.warna && tag.warna.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        filterStatus === "SEMUA" ||
        (filterStatus === "AKTIF" && tag.aktif) ||
        (filterStatus === "NONAKTIF" && !tag.aktif);

      return matchSearch && matchStatus;
    });
  }, [initialData, searchQuery, filterStatus]);

  const columns = React.useMemo<ColumnDef<DataGridFeatures, ItemTag>[]>(
    () => [
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nama Tag" visibility={true} />
        ),
        cell: ({ row }) => {
          const warna = row.original.warna || "#475569";
          return (
            <div className="flex items-center gap-2 py-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-2xs"
                style={{
                  backgroundColor: `${warna}15`,
                  color: warna,
                  border: `1px solid ${warna}40`,
                }}
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: warna }}
                />
                {row.original.nama}
              </span>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
      },
      {
        accessorKey: "warna",
        id: "warna",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kode Warna" visibility={true} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span
              className="size-3 rounded-full border border-border/80 shrink-0"
              style={{ backgroundColor: row.original.warna || "#475569" }}
            />
            <span>{row.original.warna ?? "-"}</span>
          </div>
        ),
        size: 130,
      },
      {
        accessorKey: "keterangan",
        id: "keterangan",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Keterangan / Fungsi" visibility={true} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {row.original.keterangan || "—"}
          </span>
        ),
        size: 320,
      },
      {
        accessorKey: "aktif",
        id: "aktif",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" visibility={true} />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.aktif ? "success-light" : "destructive-light"}
            size="sm"
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
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTag(row.original);
                    setFormDialogOpen(true);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <IconEdit className="size-3.5" />
                  Ubah Tag
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTag(row.original);
                    setDeleteDialogOpen(true);
                  }}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <IconTrash className="size-3.5" />
                  Hapus Tag
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
      {/* Strip KPI Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconTag className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Total Tag Terdaftar</span>
            <span className="text-lg font-bold text-foreground">{stats.total} Label</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconCheck className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Tag Aktif Digunakan</span>
            <span className="text-lg font-bold text-foreground">{stats.aktif} Label</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <IconX className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block font-medium">Tag Nonaktif</span>
            <span className="text-lg font-bold text-foreground">{stats.nonaktif} Label</span>
          </div>
        </div>
      </div>

      {/* Frame Table DataGrid Terpadu */}
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
                Daftar Tag Transaksi
              </FrameTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* InputGroup Search */}
              <InputGroup className="bg-background w-44 sm:w-56 h-8">
                <InputGroupAddon align="inline-start">
                  <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Cari label tag..."
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

              {/* ToggleGroup Shadcn UI: Tambah Tag (Icon Only) seragam dengan COA/Kontak/Katalog */}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value=""
                className="h-8 shadow-xs"
              >
                <ToggleGroupItem
                  value="add"
                  aria-label="Tambah Tag Baru"
                  title="Tambah Tag Baru"
                  onClick={() => {
                    setSelectedTag(null);
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

      {/* Form Dialog Tambah / Ubah */}
      <TagFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        itemToEdit={selectedTag}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Delete Dialog */}
      <TagDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={selectedTag}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
