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
  IconPlus,
  IconX,
  IconCoin,
  IconArrowsExchange,
  IconBuildingBank,
  IconCheck,
  IconDots,
  IconCalendar,
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
import { formatDate } from "@/lib/format";
import type { ItemKurs, ItemMataUang, MataUangStats } from "../_lib/types";
import { MataUangFormDialog } from "./mata-uang-form-dialog";
import { KursFormDialog } from "./kurs-form-dialog";

interface MataUangClientViewProps {
  initialCurrencies: ItemMataUang[];
  initialRates: ItemKurs[];
  stats: MataUangStats;
}

export function MataUangClientView({
  initialCurrencies,
  initialRates,
  stats,
}: MataUangClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<string>("mata-uang");

  // State Dialog Mata Uang
  const [currencyDialogOpen, setCurrencyDialogOpen] = React.useState(false);
  const [currencyToEdit, setCurrencyToEdit] = React.useState<ItemMataUang | null>(null);

  // State Dialog Kurs
  const [rateDialogOpen, setRateDialogOpen] = React.useState(false);
  const [rateToEdit, setRateToEdit] = React.useState<ItemKurs | null>(null);

  // Filter Mata Uang
  const [searchCurrency, setSearchCurrency] = React.useState("");
  const [filterCurrencyStatus, setFilterCurrencyStatus] = React.useState<string>("SEMUA");
  const [currencyPagination, setCurrencyPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [currencySorting, setCurrencySorting] = React.useState<SortingState>([
    { id: "adalahMataUangDasar", desc: true },
  ]);

  // Filter Kurs
  const [searchRate, setSearchRate] = React.useState("");
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = React.useState<string>("ALL");
  const [ratePagination, setRatePagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [rateSorting, setRateSorting] = React.useState<SortingState>([
    { id: "tanggalBerlaku", desc: true },
  ]);

  // Filtered Currencies
  const filteredCurrencies = React.useMemo(() => {
    return initialCurrencies.filter((c) => {
      const q = searchCurrency.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.kode.toLowerCase().includes(q) ||
        c.nama.toLowerCase().includes(q) ||
        c.simbol.toLowerCase().includes(q);

      const matchStatus =
        filterCurrencyStatus === "SEMUA" ||
        (filterCurrencyStatus === "AKTIF" && c.aktif) ||
        (filterCurrencyStatus === "NONAKTIF" && !c.aktif);

      return matchSearch && matchStatus;
    });
  }, [initialCurrencies, searchCurrency, filterCurrencyStatus]);

  // Filtered Rates
  const filteredRates = React.useMemo(() => {
    return initialRates.filter((r) => {
      const matchCurrency =
        selectedCurrencyFilter === "ALL" || r.mataUangId === selectedCurrencyFilter;

      const q = searchRate.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.kodeMataUang.toLowerCase().includes(q) ||
        r.tanggalBerlaku.includes(q) ||
        (r.sumber && r.sumber.toLowerCase().includes(q));

      return matchCurrency && matchSearch;
    });
  }, [initialRates, selectedCurrencyFilter, searchRate]);

  // Kolom Tabel Mata Uang
  const currencyColumns = React.useMemo<ColumnDef<DataGridFeatures, ItemMataUang>[]>(() => {
    return [
      {
        accessorKey: "kode",
        id: "kode",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Kode ISO" visibility={true} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-foreground tracking-wider">
              {row.original.kode}
            </span>
            {row.original.adalahMataUangDasar && (
              <Badge variant="outline" className="text-[10px] h-4 font-semibold px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                Mata Uang Dasar
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
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nama Mata Uang" visibility={true} />,
        cell: ({ row }) => (
          <span className="font-medium text-xs text-foreground">
            {row.original.nama}
          </span>
        ),
        size: 240,
        enableSorting: true,
      },
      {
        accessorKey: "simbol",
        id: "simbol",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Simbol" visibility={true} />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/50">
            {row.original.simbol}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: "jumlahDesimal",
        id: "jumlahDesimal",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Desimal" visibility={true} className="justify-center" />
        ),
        cell: ({ row }) => (
          <div className="text-center font-mono text-xs text-muted-foreground">
            {row.original.jumlahDesimal}
          </div>
        ),
        size: 90,
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
        size: 110,
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
                  <span className="sr-only">Buka menu aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => {
                    setCurrencyToEdit(row.original);
                    setCurrencyDialogOpen(true);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <IconEdit className="size-3.5" />
                  Ubah
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 60,
      },
    ];
  }, []);

  // Kolom Tabel Kurs
  const rateColumns = React.useMemo<ColumnDef<DataGridFeatures, ItemKurs>[]>(() => {
    return [
      {
        accessorKey: "tanggalBerlaku",
        id: "tanggalBerlaku",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Tanggal Berlaku" visibility={true} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
            <IconCalendar className="size-3.5 text-muted-foreground shrink-0" />
            <span>{formatDate(row.original.tanggalBerlaku)}</span>
            <span className="font-mono text-[10px] text-muted-foreground">({row.original.tanggalBerlaku})</span>
          </div>
        ),
        size: 200,
        enableSorting: true,
      },
      {
        accessorKey: "kodeMataUang",
        id: "kodeMataUang",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Valuta Asing" visibility={true} />,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/20">
            {row.original.kodeMataUang}
          </span>
        ),
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "kurs",
        id: "kurs",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nilai Kurs (Rp per 1 Unit)" visibility={true} className="justify-end" />
        ),
        cell: ({ row }) => {
          const num = Number(row.original.kurs);
          return (
            <div className="text-right font-mono tabular-nums text-xs font-semibold text-foreground">
              Rp {num.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          );
        },
        size: 220,
        enableSorting: true,
      },
      {
        accessorKey: "sumber",
        id: "sumber",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Sumber Acuan" visibility={true} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
            {row.original.sumber || "Manual"}
          </span>
        ),
        size: 220,
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
                  <span className="sr-only">Buka menu aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => {
                    setRateToEdit(row.original);
                    setRateDialogOpen(true);
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <IconEdit className="size-3.5" />
                  Perbarui Kurs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 60,
      },
    ];
  }, []);

  // Table Instances
  const currencyTable = useTable({
    features: dataGridFeatures,
    columns: currencyColumns,
    data: filteredCurrencies,
    pageCount: Math.ceil((filteredCurrencies?.length || 0) / currencyPagination.pageSize),
    state: {
      pagination: currencyPagination,
      sorting: currencySorting,
    },
    onPaginationChange: setCurrencyPagination,
    onSortingChange: setCurrencySorting,
  });

  const rateTable = useTable({
    features: dataGridFeatures,
    columns: rateColumns,
    data: filteredRates,
    pageCount: Math.ceil((filteredRates?.length || 0) / ratePagination.pageSize),
    state: {
      pagination: ratePagination,
      sorting: rateSorting,
    },
    onPaginationChange: setRatePagination,
    onSortingChange: setRateSorting,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* KPI Stats Strip Seragam dengan Tag, Penomoran & Katalog */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconBuildingBank className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Mata Uang Dasar</span>
            <span className="text-lg font-bold font-mono text-foreground truncate block">{stats.dasarKode}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconCoin className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Total Mata Uang</span>
            <span className="text-lg font-bold text-foreground truncate block">
              {stats.total} <span className="text-xs font-normal text-muted-foreground">Valas</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconCheck className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Valas Aktif</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate block">
              {stats.valasAktif} <span className="text-xs font-normal text-muted-foreground">Siap Pakai</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <IconArrowsExchange className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Catatan Kurs</span>
            <span className="text-lg font-bold text-foreground truncate block">
              {stats.totalKurs} <span className="text-xs font-normal text-muted-foreground">Titik Tanggal</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & DataGrid Terpadu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full max-w-[360px] grid-cols-2 h-9 p-1 bg-muted/60">
          <TabsTrigger value="mata-uang" className="text-xs flex items-center gap-1.5 cursor-pointer">
            <IconCoin className="size-3.5" />
            Daftar Mata Uang
          </TabsTrigger>
          <TabsTrigger value="kurs" className="text-xs flex items-center gap-1.5 cursor-pointer">
            <IconArrowsExchange className="size-3.5" />
            Kurs Valas Historis
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DAFTAR MATA UANG */}
        <TabsContent value="mata-uang" className="mt-0 focus-visible:outline-none">
          <DataGrid
            table={currencyTable}
            recordCount={filteredCurrencies.length}
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
                    Daftar Mata Uang Global
                  </FrameTitle>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                    {filteredCurrencies.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <InputGroup className="bg-background w-44 sm:w-56 h-8">
                    <InputGroupAddon align="inline-start">
                      <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Cari kode/nama..."
                      value={searchCurrency}
                      onChange={(e) => setSearchCurrency(e.target.value)}
                      className="text-xs"
                    />
                    {searchCurrency.length > 0 && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          aria-label="Hapus pencarian"
                          size="icon-xs"
                          onClick={() => setSearchCurrency("")}
                        >
                          <IconX className="size-3" aria-hidden="true" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </InputGroup>

                  {/* Filter Status */}
                  <Select value={filterCurrencyStatus} onValueChange={setFilterCurrencyStatus}>
                    <SelectTrigger size="sm" className="h-8 w-28 sm:w-32 text-xs bg-background">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMUA">Semua Status</SelectItem>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Tambah Mata Uang Button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrencyToEdit(null);
                      setCurrencyDialogOpen(true);
                    }}
                    className="h-8 gap-1.5 text-xs shadow-xs cursor-pointer"
                  >
                    <IconPlus className="size-3.5" />
                    Tambah Mata Uang
                  </Button>
                </div>
              </FrameHeader>

              <FramePanel className="p-0 shadow-none">
                <DataGridScrollArea className="w-full">
                  <DataGridTable />
                </DataGridScrollArea>
              </FramePanel>

              <FrameFooter className="py-1.5 pr-2 pl-2.5">
                <DataGridPagination sizes={[10, 20, 50, 100]} />
              </FrameFooter>
            </Frame>
          </DataGrid>
        </TabsContent>

        {/* TAB 2: KURS VALAS HISTORIS */}
        <TabsContent value="kurs" className="mt-0 focus-visible:outline-none">
          <DataGrid
            table={rateTable}
            recordCount={filteredRates.length}
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
                    Riwayat & Kurs Valas
                  </FrameTitle>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                    {filteredRates.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Currency Filter Dropdown */}
                  <Select
                    value={selectedCurrencyFilter}
                    onValueChange={setSelectedCurrencyFilter}
                  >
                    <SelectTrigger size="sm" className="w-36 text-xs h-8 bg-background">
                      <SelectValue placeholder="Semua Valas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Valas</SelectItem>
                      {initialCurrencies
                        .filter((c) => !c.adalahMataUangDasar)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.kode} ({c.simbol})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Search Input */}
                  <InputGroup className="bg-background w-44 sm:w-56 h-8">
                    <InputGroupAddon align="inline-start">
                      <IconSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Cari tanggal/sumber..."
                      value={searchRate}
                      onChange={(e) => setSearchRate(e.target.value)}
                      className="text-xs"
                    />
                    {searchRate.length > 0 && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          aria-label="Hapus pencarian"
                          size="icon-xs"
                          onClick={() => setSearchRate("")}
                        >
                          <IconX className="size-3" aria-hidden="true" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </InputGroup>

                  {/* Entri Kurs Baru Button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      setRateToEdit(null);
                      setRateDialogOpen(true);
                    }}
                    className="h-8 gap-1.5 text-xs shadow-xs cursor-pointer"
                  >
                    <IconPlus className="size-3.5" />
                    Entri Kurs Baru
                  </Button>
                </div>
              </FrameHeader>

              <FramePanel className="p-0 shadow-none">
                <DataGridScrollArea className="w-full">
                  <DataGridTable />
                </DataGridScrollArea>
              </FramePanel>

              <FrameFooter className="py-1.5 pr-2 pl-2.5">
                <DataGridPagination sizes={[10, 20, 50, 100]} />
              </FrameFooter>
            </Frame>
          </DataGrid>
        </TabsContent>
      </Tabs>

      {/* Dialog Formulir Mata Uang */}
      <MataUangFormDialog
        open={currencyDialogOpen}
        onOpenChange={setCurrencyDialogOpen}
        itemToEdit={currencyToEdit}
        onSuccess={() => router.refresh()}
      />

      {/* Dialog Formulir Kurs */}
      <KursFormDialog
        open={rateDialogOpen}
        onOpenChange={setRateDialogOpen}
        currencies={initialCurrencies}
        itemToEdit={rateToEdit}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
