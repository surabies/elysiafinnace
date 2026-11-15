"use client";

import * as React from "react";
import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconAlertCircle,
  IconBan,
  IconChartLine,
  IconCheck,
  IconClock,
  IconCopy,
  IconDots,
  IconEye,
  IconList,
  IconPlus,
  IconReceipt2,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { PurchasesOverview, type SalesYear } from "./purchases-overview";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApi } from "@/lib/api-client";
import { FakturPembelianDetailDialog } from "./faktur-pembelian-detail-dialog";

export interface ItemFakturPembelian {
  id: string;
  nomor: string;
  nomorFakturPemasok?: string | null;
  tanggal: string;
  tanggalJatuhTempo?: string | null;
  status: "DRAFT" | "POSTED" | "DIBATALKAN";
  total: string;
  sisaTagihan: string;
  mataUangId: string;
  catatan?: string | null;
  pemasok?: {
    id: string;
    kode: string;
    nama: string;
  } | null;
}

interface FakturPembelianClientViewProps {
  initialBills: ItemFakturPembelian[];
  analyticsYears?: SalesYear[];
}

export function FakturPembelianClientView({
  initialBills,
  analyticsYears,
}: FakturPembelianClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"daftar" | "analisis">("daftar");

  // DataGrid Table states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("SEMUA");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "tanggal", desc: true },
  ]);
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Dialog States
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedBill, setSelectedBill] = React.useState<ItemFakturPembelian | null>(null);

  // KPI Calculations
  const kpiData = React.useMemo(() => {
    let totalNominal = 0;
    let totalSisa = 0;
    let countLunas = 0;
    let countOverdue = 0;
    const now = new Date();

    for (const item of initialBills) {
      if (item.status === "DIBATALKAN") continue;
      const t = Number(item.total || 0);
      const s = Number(item.sisaTagihan || 0);
      totalNominal += t;
      totalSisa += s;
      if (s <= 0 && item.status === "POSTED") countLunas += 1;
      if (s > 0 && item.tanggalJatuhTempo && new Date(item.tanggalJatuhTempo) < now) {
        countOverdue += 1;
      }
    }

    return { totalNominal, totalSisa, countLunas, countOverdue };
  }, [initialBills]);

  const filteredData = React.useMemo(() => {
    return initialBills.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.nomor.toLowerCase().includes(q) ||
        (item.nomorFakturPemasok && item.nomorFakturPemasok.toLowerCase().includes(q)) ||
        (item.pemasok?.nama && item.pemasok.nama.toLowerCase().includes(q)) ||
        (item.pemasok?.kode && item.pemasok.kode.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "SEMUA" ||
        (statusFilter === "LUNAS" && Number(item.sisaTagihan || 0) <= 0 && item.status === "POSTED") ||
        (statusFilter === "BELUM_LUNAS" && Number(item.sisaTagihan || 0) > 0 && item.status !== "DIBATALKAN") ||
        item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [initialBills, searchQuery, statusFilter]);

  const handlePostingBill = React.useCallback(
    async (item: ItemFakturPembelian) => {
      try {
        const res = await getApi().keuangan.pembelian.faktur({ id: item.id }).posting.post();
        if (res.error) {
          toast.error("Gagal memposting tagihan: " + JSON.stringify(res.error.value));
          return;
        }
        toast.success(`Tagihan ${item.nomor} berhasil diposting ke Hutang Usaha (AP).`);
        router.refresh();
      } catch {
        toast.error("Gagal memposting tagihan.");
      }
    },
    [router],
  );

  const handleBatalkanBill = React.useCallback(
    async (item: ItemFakturPembelian) => {
      const alasan = prompt(`Masukkan alasan pembatalan tagihan ${item.nomor}:`, "Pembatalan tagihan pemasok");
      if (!alasan) return;

      try {
        const res = await getApi()
          .keuangan.pembelian.faktur({ id: item.id })
          .batal.post({
            deskripsi: alasan,
            tanggal: new Date().toISOString().split("T")[0]!,
          });
        if (res.error) {
          toast.error("Gagal membatalkan tagihan: " + JSON.stringify(res.error.value));
          return;
        }
        toast.success(`Tagihan ${item.nomor} telah dibatalkan.`);
        router.refresh();
      } catch {
        toast.error("Gagal membatalkan tagihan.");
      }
    },
    [router],
  );

  // Columns definition
  const columns = React.useMemo<ColumnDef<DataGridFeatures, ItemFakturPembelian>[]>(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 38,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
      {
        accessorKey: "nomor",
        id: "nomor",
        header: ({ column }) => (
          <DataGridColumnHeader title="Nomor Tagihan" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <div className="flex items-center gap-1.5 font-mono font-semibold text-primary">
                <span>{item.nomor}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(item.nomor);
                    toast.success(`Nomor ${item.nomor} disalin`);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Salin nomor"
                >
                  <IconCopy className="size-3" />
                </button>
              </div>
              {item.nomorFakturPemasok && (
                <div className="text-[10px] text-muted-foreground font-mono">
                  Ref: {item.nomorFakturPemasok}
                </div>
              )}
            </div>
          );
        },
        size: 180,
        enableSorting: true,
      },
      {
        accessorKey: "pemasok",
        id: "pemasok",
        header: ({ column }) => (
          <DataGridColumnHeader title="Pemasok / Vendor" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const p = row.original.pemasok;
          return (
            <div>
              <div className="font-medium text-foreground">{p?.nama ?? "-"}</div>
              {p?.kode && (
                <div className="text-[10px] text-muted-foreground font-mono">{p.kode}</div>
              )}
            </div>
          );
        },
        size: 200,
        enableSorting: false,
      },
      {
        accessorKey: "tanggal",
        id: "tanggal",
        header: ({ column }) => (
          <DataGridColumnHeader title="Tanggal" visibility={true} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.tanggal).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
        size: 110,
        enableSorting: true,
      },
      {
        accessorKey: "tanggalJatuhTempo",
        id: "tanggalJatuhTempo",
        header: ({ column }) => (
          <DataGridColumnHeader title="Jatuh Tempo" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const dt = row.original.tanggalJatuhTempo;
          if (!dt) return <span className="text-muted-foreground">-</span>;
          const isOverdue =
            new Date(dt) < new Date() &&
            Number(row.original.sisaTagihan || 0) > 0 &&
            row.original.status !== "DIBATALKAN";
          return (
            <span className={cn(isOverdue ? "text-rose-600 font-semibold" : "text-muted-foreground")}>
              {new Date(dt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        },
        size: 110,
        enableSorting: true,
      },
      {
        accessorKey: "total",
        id: "total",
        header: ({ column }) => (
          <DataGridColumnHeader title="Total Tagihan" visibility={true} column={column} className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            Rp {Number(row.original.total || 0).toLocaleString("id-ID")}
          </div>
        ),
        size: 140,
        enableSorting: true,
      },
      {
        accessorKey: "sisaTagihan",
        id: "sisaTagihan",
        header: ({ column }) => (
          <DataGridColumnHeader title="Sisa Hutang" visibility={true} column={column} className="justify-end" />
        ),
        cell: ({ row }) => {
          const sisa = Number(row.original.sisaTagihan || 0);
          if (sisa <= 0 && row.original.status === "POSTED") {
            return (
              <div className="text-right">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  Lunas
                </span>
              </div>
            );
          }
          return (
            <div className="text-right font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              Rp {sisa.toLocaleString("id-ID")}
            </div>
          );
        },
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" visibility={true} column={column} className="justify-center" />
        ),
        cell: ({ row }) => {
          const st = row.original.status;
          return (
            <div className="flex justify-center">
              <Badge
                variant={
                  st === "POSTED"
                    ? "default"
                    : st === "DRAFT"
                      ? "secondary"
                      : "destructive"
                }
                className="text-[10px]"
              >
                {st}
              </Badge>
            </div>
          );
        },
        size: 110,
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="h-7 w-7 p-0">
                  <IconDots className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedBill(item);
                    setDetailDialogOpen(true);
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <IconEye className="size-4 text-primary" />
                  Lihat Detail
                </DropdownMenuItem>

                {item.status === "DRAFT" && (
                  <DropdownMenuItem
                    onClick={() => handlePostingBill(item)}
                    className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                  >
                    <IconCheck className="size-4" />
                    Posting ke AP
                  </DropdownMenuItem>
                )}

                {item.status === "POSTED" && (
                  <DropdownMenuItem
                    onClick={() => handleBatalkanBill(item)}
                    className="gap-2 cursor-pointer text-destructive"
                  >
                    <IconBan className="size-4" />
                    Batalkan Tagihan
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(item.nomor);
                    toast.success(`Nomor ${item.nomor} disalin`);
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <IconCopy className="size-4 text-muted-foreground" />
                  Salin Nomor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [handleBatalkanBill, handlePostingBill],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
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

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6">
      {/* 1. Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("daftar")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px",
            activeTab === "daftar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <IconList className="size-4" />
          Daftar Tagihan
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted font-mono font-medium">
            {initialBills.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analisis")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px",
            activeTab === "analisis"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <IconChartLine className="size-4" />
          Analisis & Tren Pengadaan
        </button>
      </div>

      {/* 2. Tab Content: Daftar Tagihan */}
      {activeTab === "daftar" && (
        <div className="space-y-6">
          {/* Quick KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Total Nilai Tagihan</span>
                <IconReceipt2 className="size-4 text-primary" />
              </div>
              <div className="text-xl font-bold tracking-tight mt-1">
                Rp {kpiData.totalNominal.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-muted-foreground">Akumulasi seluruh tagihan masuk</div>
            </div>

            <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Total Sisa Hutang</span>
                <IconClock className="size-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">
                Rp {kpiData.totalSisa.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-muted-foreground">Kewajiban hutang belum dibayar</div>
            </div>

            <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Lewat Jatuh Tempo</span>
                <IconAlertCircle className="size-4 text-rose-500" />
              </div>
              <div className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-1">
                {kpiData.countOverdue} Tagihan
              </div>
              <div className="text-[11px] text-muted-foreground">Hutang jatuh tempo (overdue)</div>
            </div>

            <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Tagihan Lunas</span>
                <IconCheck className="size-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                {kpiData.countLunas} Tagihan
              </div>
              <div className="text-[11px] text-muted-foreground">Pembayaran vendor tuntas</div>
            </div>
          </div>

          {/* DataGrid Table Frame Standard */}
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
                <div className="flex items-center gap-2">
                  <FrameTitle className="text-base font-semibold tracking-tight text-foreground">
                    Daftar Tagihan Masuk (AP)
                  </FrameTitle>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {filteredData.length} Data
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setRowSelection({})}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <span className="font-mono text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                        {selectedCount}
                      </span>
                      <IconX className="size-3.5 text-destructive" />
                    </button>
                  )}

                  <InputGroup className="bg-background w-44 sm:w-64 h-8">
                    <InputGroupAddon align="inline-start">
                      <IconSearch className="size-3.5 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Cari nomor tagihan / pemasok..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs"
                    />
                    {searchQuery.length > 0 && (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-xs"
                          onClick={() => setSearchQuery("")}
                        >
                          <IconX className="size-3" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    )}
                  </InputGroup>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-32 text-xs bg-background">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMUA">Semua Status</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="POSTED">Posted</SelectItem>
                      <SelectItem value="LUNAS">Lunas</SelectItem>
                      <SelectItem value="BELUM_LUNAS">Belum Lunas</SelectItem>
                      <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>

                  <Link href="/pembelian/faktur/baru">
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs font-semibold"
                    >
                      <IconPlus className="size-3.5" />
                      Catat Tagihan
                    </Button>
                  </Link>
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
        </div>
      )}

      {/* 3. Tab Content: Analisis & Tren Pengadaan */}
      {activeTab === "analisis" && (
        <div className="pt-2">
          <PurchasesOverview
            years={analyticsYears && analyticsYears.length > 0 ? analyticsYears : undefined}
            currency="Rp "
          />
        </div>
      )}

      {/* 4. Detail Dialog */}
      <FakturPembelianDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        faktur={selectedBill}
        onStatusChanged={() => router.refresh()}
      />
    </div>
  );
}
