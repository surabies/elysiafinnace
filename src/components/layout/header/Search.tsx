"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconActivity,
  IconArrowRight,
  IconArrowsExchange,
  IconBuildingBank,
  IconCalculator,
  IconCornerDownLeft,
  IconFileReport,
  IconLayoutDashboard,
  IconPackages,
  IconReceipt,
  IconReceipt2,
  IconRobot,
  IconSearch,
  IconSearchOff,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ROUTES } from "../sidebar/routes";
import { SIDEBAR_MENU } from "../navigation/sidebar-menu";
import { flattenNavigation, type SearchableLink } from "../navigation/utils";

// Indeks menu utama yang telah diratakan dari sidebar
const SEARCH_INDEX = flattenNavigation(SIDEBAR_MENU);

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: typeof IconReceipt;
  tag: string;
  tagColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "qa-invoice",
    label: "Buat Faktur Penjualan Baru",
    description:
      "Terbitkan invoice ke pelanggan, kalkulasi PPN & posting piutang",
    href: ROUTES.sales.invoices,
    icon: IconReceipt,
    tag: "Penjualan",
    tagColor:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "qa-expense",
    label: "Catat Biaya Operasional",
    description:
      "Input pengeluaran kas/bank untuk operasional & overhead kantor",
    href: ROUTES.expenses.list,
    icon: IconReceipt2,
    tag: "Biaya",
    tagColor:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    id: "qa-transfer",
    label: "Transfer Saldo Kas & Bank",
    description: "Pindah dana antar rekening bank tanpa selisih kliring",
    href: ROUTES.cashBank.transfer,
    icon: IconArrowsExchange,
    tag: "Kas & Bank",
    tagColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  {
    id: "qa-journal",
    label: "Input Jurnal Penyesuaian",
    description:
      "Pencatatan debet-kredit akuntansi manual dengan double-entry ketat",
    href: ROUTES.accounting.journals,
    icon: IconCalculator,
    tag: "Akuntansi",
    tagColor:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  {
    id: "qa-diagnostics",
    label: "Diagnostik & Latensi DB",
    description:
      "Monitor waktu ping live PostgreSQL, pool connection & uptime server",
    href: ROUTES.settings.diagnostics,
    icon: IconActivity,
    tag: "DevOps",
    tagColor:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];

const POPULAR_MODULES: SearchableLink[] = [
  {
    id: "pop-dash",
    label: "Dasbor Finansial Eksekutif",
    href: ROUTES.dashboard,
    icon: IconLayoutDashboard,
    trail: "Utama → Dasbor",
    category: "Utama",
  },
  {
    id: "pop-rep",
    label: "Pusat Laporan Finansial (Laba Rugi & Neraca)",
    href: ROUTES.reports.financial,
    icon: IconFileReport,
    trail: "Laporan Enterprise → Finansial",
    category: "Laporan Enterprise",
  },
  {
    id: "pop-aging",
    label: "Subledger & Analisis Umur Piutang/Utang",
    href: ROUTES.reports.subledgerAging,
    icon: IconFileReport,
    trail: "Laporan Enterprise → Subledger & Aging",
    category: "Laporan Enterprise",
  },
  {
    id: "pop-coa",
    label: "Bagan Akun (Chart of Accounts / COA)",
    href: ROUTES.accounting.chartOfAccounts,
    icon: IconBuildingBank,
    trail: "Akuntansi & Pajak → Bagan Akun",
    category: "Akuntansi & Pajak",
  },
  {
    id: "pop-inv",
    label: "Katalog Produk & Multi-Gudang",
    href: ROUTES.inventory.products,
    icon: IconPackages,
    trail: "Operasional & Persediaan → Produk & Stok",
    category: "Operasional & Persediaan",
  },
  {
    id: "pop-auto",
    label: "Otomasi Transaksi Berulang & Webhook",
    href: ROUTES.automation.recurring,
    icon: IconRobot,
    trail: "Otomasi & Sistem → Transaksi Berulang",
    category: "Otomasi & Sistem",
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "Semua" },
  { id: "quick", label: "⚡ Aksi Cepat" },
  { id: "Transaksi", label: "Transaksi" },
  { id: "Operasional & Persediaan", label: "Persediaan" },
  { id: "Akuntansi & Pajak", label: "Akuntansi" },
  { id: "Laporan Enterprise", label: "Laporan" },
  { id: "Otomasi & Sistem", label: "Otomasi" },
] as const;

/**
 * Palet Perintah Enterprise & Pusat Aksi Cepat (Executive Command Center).
 * Desain mewah, fungsional, dan responsif dengan navigasi keyboard presisi tinggi.
 */
export default function Search() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("all");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  // Filter daftar menu berdasarkan scope tab yang dipilih
  const filteredIndex = useMemo(() => {
    if (selectedTab === "all" || selectedTab === "quick") {
      return SEARCH_INDEX;
    }
    return SEARCH_INDEX.filter((item) => item.category === selectedTab);
  }, [selectedTab]);

  // Kelompokkan menu hasil filter berdasarkan kategori
  const groupedMenu = useMemo(() => {
    const groups: Record<string, SearchableLink[]> = {};
    for (const item of filteredIndex) {
      const cat = item.category || "Lainnya";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [filteredIndex]);

  const isSearching = query.trim().length > 0;
  const showQuickActions = selectedTab === "all" || selectedTab === "quick";

  return (
    <>
      {/* Tombol Trigger Pencarian di Header: Bergaya Mewah & Minimalis */}
      <button
        type="button"
        data-search-trigger
        onClick={() => setOpen(true)}
        className="group relative flex h-9.5 w-60 items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3 text-xs font-medium text-muted-foreground shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-primary/40 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-primary">
            <IconSearch className="size-3.5" />
          </div>
          <span className="truncate text-[13px] text-muted-foreground/90 group-hover:text-foreground">
            Cari menu & aksi cepat...
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="flex h-5 items-center justify-center rounded-md border border-border/80 bg-muted/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
            Ctrl K
          </span>
        </div>
      </button>

      {/* Dialog Command Palette Mewah */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Palet Perintah Eksekutif"
        description="Pusat navigasi cepat, transaksi, laporan finansial, dan diagnostik sistem"
      >
        <Command className="rounded-2xl border-none bg-transparent" loop>
          {/* Header Input Pencarian */}
          <div className="relative border-b border-border/60">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Cari transaksi, laporan, COA, atau ketik kata kunci aksi…"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Hapus pencarian"
              >
                <IconX className="size-4" />
              </button>
            )}
          </div>

          {/* Baris Filter Kategori Cepat (Pill Chips) */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/50 bg-muted/20 px-4 py-2.5 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Daftar Hasil / Beranda Aksi Cepat */}
          <CommandList className="max-h-[460px] p-2">
            <CommandEmpty className="py-12 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-muted/30 text-muted-foreground">
                <IconSearchOff className="size-6 text-muted-foreground/70" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Menu tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tidak ada entri yang cocok dengan &ldquo;{query}&rdquo;. Coba
                kata kunci lain atau pilih tab &ldquo;Semua&rdquo;.
              </p>
            </CommandEmpty>

            {/* Mode Awal: Saat query masih kosong & Tab 'all' / 'quick' aktif */}
            {!isSearching && showQuickActions && (
              <>
                <CommandGroup heading="⚡ Aksi Cepat Finansial">
                  {QUICK_ACTIONS.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={`${action.label} ${action.description} ${action.tag}`}
                      onSelect={() => go(action.href)}
                      className="group/item flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-primary shadow-2xs transition-colors group-hover/item:border-primary/40 group-hover/item:bg-primary/10">
                          <action.icon className="size-4.5" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                              {action.label}
                            </span>
                            <span
                              className={cn(
                                "rounded-md border px-1.5 py-0.2 text-[10px] font-medium tracking-tight",
                                action.tagColor,
                              )}
                            >
                              {action.tag}
                            </span>
                          </div>
                          <span className="truncate text-xs text-muted-foreground">
                            {action.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground opacity-60 transition-opacity group-hover/item:opacity-100">
                        <span className="hidden text-[11px] font-medium sm:inline">
                          Jalankan
                        </span>
                        <IconCornerDownLeft className="size-3.5" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="⭐ Modul Sering Diakses">
                  {POPULAR_MODULES.map((pop) => (
                    <CommandItem
                      key={pop.id}
                      value={`${pop.label} ${pop.trail}`}
                      onSelect={() => go(pop.href)}
                      className="group/item flex items-center justify-between gap-3 rounded-xl p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors group-hover/item:text-foreground">
                          {pop.icon && <pop.icon className="size-4" />}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-foreground">
                            {pop.label}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {pop.trail}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100">
                        <span className="text-[11px]">Buka</span>
                        <IconArrowRight className="size-3.5" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />
              </>
            )}

            {/* Daftar Menu Terindeks (Tampil saat mencari atau saat tab kategori aktif) */}
            {(isSearching || selectedTab !== "quick") &&
              Object.entries(groupedMenu).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.label} ${item.trail} ${category}`}
                      onSelect={() => go(item.href)}
                      className="group/item flex items-center justify-between gap-3 rounded-xl p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground transition-colors group-hover/item:border-primary/40 group-hover/item:bg-primary/10 group-hover/item:text-primary">
                          {item.icon ? (
                            <item.icon className="size-4" />
                          ) : (
                            <IconSparkles className="size-4" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium tracking-tight text-foreground">
                            {item.label}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.trail}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-muted-foreground opacity-0 transition-all duration-150 group-hover/item:translate-x-0.5 group-hover/item:opacity-100">
                        <span className="hidden text-[11px] sm:inline">
                          Buka
                        </span>
                        <IconArrowRight className="size-3.5 text-primary" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
          </CommandList>

          {/* Footer Baris Bawah: Status Indeks & Panduan Tombol Pintas */}
          <div className="flex h-11 items-center justify-between border-t border-border/60 bg-muted/20 px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-foreground/80">SurabieDev</span>
              <span className="hidden text-muted-foreground/60 sm:inline">
                •
              </span>
              <span className="hidden text-muted-foreground/80 sm:inline">
                {SEARCH_INDEX.length + QUICK_ACTIONS.length} aksi & rute siap
                digunakan
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <kbd className="rounded border border-border/80 bg-background px-1 py-0.5 shadow-2xs">
                  ↑
                </kbd>
                <kbd className="rounded border border-border/80 bg-background px-1 py-0.5 shadow-2xs">
                  ↓
                </kbd>
                <span className="ml-0.5 text-muted-foreground">Pilih</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 shadow-2xs">
                  ↵
                </kbd>
                <span className="ml-0.5 text-muted-foreground">Buka</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 shadow-2xs">
                  Esc
                </kbd>
                <span className="ml-0.5 text-muted-foreground">Tutup</span>
              </span>
            </div>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
