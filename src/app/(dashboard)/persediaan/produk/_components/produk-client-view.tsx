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
  IconFileSpreadsheet,
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
import { ProdukStatsStrip } from "./produk-stats";
import { ProdukFormDialog } from "./produk-form-dialog";
import { ProdukImportDialog } from "./produk-import-dialog";
import type { ItemProduk, ProdukStats, KategoriOption, SatuanOption, AkunOption } from "../_lib/types";

interface ProdukClientViewProps {
  initialData: ItemProduk[];
  stats: ProdukStats;
  kategoriOptions: KategoriOption[];
  satuanOptions: SatuanOption[];
  akunOptions: AkunOption[];
}

export function ProdukClientView({
  initialData,
  stats,
  kategoriOptions,
  satuanOptions,
  akunOptions,
}: ProdukClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterTipe, setFilterTipe] = React.useState<string>("SEMUA");
  const [filterKategori, setFilterKategori] = React.useState<string>("SEMUA");
  const [filterTag, setFilterTag] = React.useState<string>("SEMUA");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "sku", desc: false },
  ]);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Dialog State
  const [formOpen, setFormOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<ItemProduk | null>(null);

  const handleEdit = React.useCallback((item: ItemProduk) => {
    setItemToEdit(item);
    setFormOpen(true);
  }, []);

  const handleAddNew = () => {
    setItemToEdit(null);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

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
    return initialData.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchQuery));

      const matchTipe = filterTipe === "SEMUA" || item.tipeBarang === filterTipe;
      const matchKategori =
        filterKategori === "SEMUA" || item.kategoriId === filterKategori;
      const matchTag =
        filterTag === "SEMUA" ||
        (item.tags && item.tags.some((t) => t.id === filterTag));

      return matchSearch && matchTipe && matchKategori && matchTag;
    });
  }, [initialData, searchQuery, filterTipe, filterKategori, filterTag]);

  const formatRupiah = (nominal: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(nominal || 0));
  };

  const columns = React.useMemo<ColumnDef<DataGridFeatures, ItemProduk>[]>(
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
        accessorKey: "sku",
        id: "sku",
        header: ({ column }) => (
          <DataGridColumnHeader title="SKU" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {row.original.sku}
          </span>
        ),
        size: 110,
        enableSorting: true,
      },
      {
        accessorKey: "nama",
        id: "nama",
        header: ({ column }) => (
          <DataGridColumnHeader title="Nama Produk" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col min-w-0 py-0.5">
              <span className="text-xs font-semibold text-foreground truncate">
                {item.nama}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {item.kategoriNama && (
                  <span className="text-[11px] text-muted-foreground truncate">
                    {item.kategoriNama}
                  </span>
                )}
                {item.barcode && (
                  <span className="text-[10px] font-mono text-muted-foreground/80">
                    • #{item.barcode}
                  </span>
                )}
              </div>
            </div>
          );
        },
        size: 240,
        enableSorting: true,
      },
      {
        accessorKey: "tipeBarang",
        id: "tipeBarang",
        header: ({ column }) => (
          <DataGridColumnHeader title="Tipe" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const tipe = row.original.tipeBarang;
          switch (tipe) {
            case "BARANG_PERSEDIAAN":
              return (
                <Badge variant="primary-light" size="sm" className="font-normal text-[11px]">
                  Persediaan
                </Badge>
              );
            case "BARANG_NON_PERSEDIAAN":
              return (
                <Badge variant="warning-light" size="sm" className="font-normal text-[11px]">
                  Non-Stok
                </Badge>
              );
            case "JASA":
              return (
                <Badge variant="secondary" size="sm" className="font-normal text-[11px]">
                  Jasa
                </Badge>
              );
            case "BUNDEL":
              return (
                <Badge variant="info-light" size="sm" className="font-normal text-[11px]">
                  Bundel
                </Badge>
              );
            default:
              return (
                <Badge variant="outline" size="sm" className="font-normal text-[11px]">
                  {tipe}
                </Badge>
              );
          }
        },
        size: 110,
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
        accessorKey: "satuanKode",
        id: "satuanKode",
        header: ({ column }) => (
          <DataGridColumnHeader title="Satuan" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">
            {row.original.satuanKode || "-"}
          </span>
        ),
        size: 80,
        enableSorting: true,
      },
      {
        accessorKey: "hargaBeliStandar",
        id: "hargaBeliStandar",
        header: ({ column }) => (
          <DataGridColumnHeader title="Harga Beli" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-xs text-muted-foreground">
            {formatRupiah(row.original.hargaBeliStandar)}
          </div>
        ),
        size: 120,
        enableSorting: true,
      },
      {
        accessorKey: "hargaJualStandar",
        id: "hargaJualStandar",
        header: ({ column }) => (
          <DataGridColumnHeader title="Harga Jual" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <div className="font-mono text-xs font-semibold text-foreground">
            {formatRupiah(row.original.hargaJualStandar)}
          </div>
        ),
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
          const item = row.original;
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
                    onClick={() => handleEdit(item)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <IconEdit className="size-3.5" />
                    Ubah Produk
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
      {/* KPI Stats Strip */}
      <ProdukStatsStrip stats={stats} />

      {/* Frame Table Terpadu */}
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
                Katalog Produk & Layanan
              </FrameTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol batal seleksi: gaya seamless ghost dengan badge count (di depan search box) */}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setRowSelection({})}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title={`Batalkan pilihan (${selectedCount} produk terpilih)`}
                  aria-label={`Batalkan pilihan (${selectedCount} produk terpilih)`}
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
                  placeholder="Cari SKU atau nama..."
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

              {/* Filter Tipe Barang */}
              <Select value={filterTipe} onValueChange={setFilterTipe}>
                <SelectTrigger size="sm" className="h-8 w-28 sm:w-36 text-xs bg-background">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua Tipe</SelectItem>
                  <SelectItem value="BARANG_PERSEDIAAN">Persediaan</SelectItem>
                  <SelectItem value="BARANG_NON_PERSEDIAAN">Non-Persediaan</SelectItem>
                  <SelectItem value="JASA">Jasa</SelectItem>
                  <SelectItem value="BUNDEL">Bundel</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Kategori */}
              {kategoriOptions.length > 0 && (
                <Select value={filterKategori} onValueChange={setFilterKategori}>
                  <SelectTrigger size="sm" className="h-8 w-28 sm:w-36 text-xs bg-background">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMUA">Semua Kategori</SelectItem>
                    {kategoriOptions.map((kat) => (
                      <SelectItem key={kat.id} value={kat.id}>
                        {kat.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

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

              {/* ToggleGroup Shadcn UI: Import Excel & Tambah Produk (Icon Only) */}
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value=""
                className="h-8 shadow-xs"
              >
                <ToggleGroupItem
                  value="import"
                  aria-label="Import Excel"
                  title="Import Excel"
                  onClick={() => setImportOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <IconFileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="add"
                  aria-label="Tambah Produk Baru"
                  title="Tambah Produk Baru"
                  onClick={handleAddNew}
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

      {/* Modal Dialog Form & Import */}
      <ProdukFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        itemToEdit={itemToEdit}
        kategoriOptions={kategoriOptions}
        satuanOptions={satuanOptions}
        akunOptions={akunOptions}
        onSuccess={handleSuccess}
      />

      <ProdukImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
