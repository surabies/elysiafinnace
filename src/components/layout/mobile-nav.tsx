"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import {
  IconBell,
  IconBuildingBank,
  IconCalculator,
  IconChevronDown,
  IconChevronRight,
  IconCornerDownLeft,
  IconDeviceDesktop,
  IconFilter,
  IconLogout,
  IconMoon,
  IconPlus,
  IconReceipt,
  IconReceipt2,
  IconSearch,
  IconSearchOff,
  IconSettings,
  IconShoppingBag,
  IconSun,
  IconX,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import Notifications from "./header/notifications";
import Profile from "./header/profile";
import { SIDEBAR_MENU } from "./navigation/sidebar-menu";
import type { NavEntry, NavGroup, NavIcon, NavLink } from "./navigation/types";
import { flattenNavigation, isNavGroup, isPathActive } from "./navigation/utils";
import { ROUTES } from "./sidebar/routes";
import { subLinkClass } from "./types/styles";

// ============================================================================
// KONSTANTA & BADGE PRO (Sama persis dengan tampilan desktop)
// ============================================================================

const PRO_BADGE_CLASS =
  "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400 border border-blue-500/25 leading-none";

export const QUICK_DOCUMENTS = [
  {
    id: "doc-sales-inv",
    label: "Faktur Penjualan Baru",
    href: "/penjualan/faktur/baru",
    category: "Penjualan",
    icon: IconReceipt,
  },
  {
    id: "doc-purchase-inv",
    label: "Tagihan Pembelian Baru",
    href: "/pembelian/faktur/baru",
    category: "Pembelian",
    icon: IconShoppingBag,
  },
  {
    id: "doc-expense",
    label: "Catat Biaya Operasional",
    href: ROUTES.expenses.list,
    category: "Biaya",
    icon: IconReceipt2,
  },
  {
    id: "doc-transfer",
    label: "Transfer Kas & Bank",
    href: ROUTES.cashBank.transfer,
    category: "Kas & Bank",
    icon: IconBuildingBank,
  },
  {
    id: "doc-journal",
    label: "Input Jurnal Penyesuaian",
    href: ROUTES.accounting.journals,
    category: "Akuntansi",
    icon: IconCalculator,
  },
];

export const NAV_CATEGORIES = [
  { id: "all", label: "Semua Modul" },
  { id: "finance", label: "Keuangan & Akuntansi" },
  { id: "supply-chain", label: "Persediaan & Gudang" },
  { id: "enterprise", label: "Ekosistem Enterprise" },
  { id: "reports", label: "Pusat Laporan" },
  { id: "automation-system", label: "Otomasi & Sistem" },
];

/** Index pencarian rute menu yang diratakan dari navigasi sidebar */
const SEARCH_INDEX = flattenNavigation(SIDEBAR_MENU);

/** Daftar URL rute utama default saat query pencarian kosong */
const DEFAULT_SEARCH_HREFS: string[] = [
  ROUTES.dashboard,
  ROUTES.sales.invoices,
  ROUTES.expenses.list,
  ROUTES.cashBank.accounts,
  ROUTES.accounting.journals,
  ROUTES.accounting.chartOfAccounts,
  ROUTES.settings.company,
];

// ============================================================================
// CONTEXT
// ============================================================================

interface MobileNavContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleMenu: () => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
}

const MobileNavContext = React.createContext<MobileNavContextValue | null>(
  null,
);

export function useMobileNav() {
  const ctx = React.useContext(MobileNavContext);
  if (!ctx) {
    throw new Error("useMobileNav must be used within MobileNavProvider");
  }
  return ctx;
}

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuState, setMenuState] = React.useState({ pathname, open: false });
  const isOpen = menuState.pathname === pathname && menuState.open;

  const setIsOpen = React.useCallback(
    (open: boolean) => {
      setMenuState({ pathname, open });
    },
    [pathname],
  );

  const toggleMenu = React.useCallback(() => {
    setMenuState((prev) => ({
      pathname,
      open: prev.pathname === pathname ? !prev.open : true,
    }));
  }, [pathname]);

  const [searchState, setSearchState] = React.useState({ pathname, open: false });
  const isSearchOpen = searchState.pathname === pathname && searchState.open;

  const setIsSearchOpen = React.useCallback(
    (open: boolean) => {
      setSearchState({ pathname, open });
    },
    [pathname],
  );

  const openSearch = React.useCallback(() => {
    setIsOpen(false);
    setIsSearchOpen(true);
  }, [setIsOpen, setIsSearchOpen]);

  const closeSearch = React.useCallback(() => {
    setIsSearchOpen(false);
  }, [setIsSearchOpen]);

  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  // Keyboard shortcut Ctrl+K / Cmd+K di mobile membuka panel pencarian
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (window.innerWidth < 768) {
          e.preventDefault();
          openSearch();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch]);

  // Tutup dengan tombol Esc
  React.useEffect(() => {
    if (!isOpen && !isSearchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSearchOpen, setIsOpen, setIsSearchOpen]);

  return (
    <MobileNavContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleMenu,
        selectedCategory,
        setSelectedCategory,
        isSearchOpen,
        setIsSearchOpen,
        openSearch,
        closeSearch,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

// ============================================================================
// HEADER TOP BAR MOBILE (~48px)
// Kiri: Icon + Nama Aplikasi | Kanan: Notifikasi + Avatar
// ============================================================================

export function MobileTopBar() {
  return (
    <div className="flex h-12 w-full items-center justify-between border-b border-border/80 bg-background/95 px-3.5 backdrop-blur-md">
      {/* Kiri: Icon & Nama Aplikasi */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 transition-transform hover:opacity-90 active:scale-95"
        aria-label="Elysia Finance Dasbor"
      >
        <div className="flex size-7 shrink-0 items-center justify-center">
          <Image
            src="/images/logos/logo.png"
            alt="Elysia Finance"
            width={24}
            height={27}
            className="shrink-0"
            priority
          />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">
          Elysia Finance
        </span>
      </Link>

      {/* Kanan: Notifikasi & Avatar */}
      <div className="flex items-center gap-1 shrink-0">
        <Notifications />
        <Profile />
      </div>
    </div>
  );
}

// ============================================================================
// FLOATING PILL BAR (Bawah Layar)
// ============================================================================

function MobileFloatingBar() {
  const { isOpen, toggleMenu, openSearch } = useMobileNav();

  return (
    <div
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 -translate-x-1/2 md:hidden"
      role="region"
      aria-label="Navigasi mengambang"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-3 py-1.5 shadow-lg backdrop-blur-md transition-all active:scale-[0.99]">
        {/* Tombol Pencarian: ikon + teks Find */}
        <button
          type="button"
          onClick={openSearch}
          className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-95 cursor-pointer"
          aria-label="Cari menu atau transaksi (Find)"
        >
          <IconSearch size={15} stroke={2} className="shrink-0" />
          <span className="text-xs font-semibold tracking-tight">Find</span>
        </button>

        {/* Garis pemisah vertikal tipis */}
        <span aria-hidden className="h-4 w-px bg-border/80" />

        {/* Tombol Hamburger (dua garis) / X saat terbuka */}
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/60 active:scale-95 cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <IconX size={18} stroke={2.25} />
              </motion.div>
            ) : (
              <motion.div
                key="hamburger-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center justify-center gap-1.5"
              >
                <span className="h-[1.75px] w-4.5 rounded-full bg-foreground" />
                <span className="h-[1.75px] w-4.5 rounded-full bg-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MENU ACCORDION SUB-ITEM (Dengan Garis Pemandu & Dot Desktop Style)
// ============================================================================

function MobileAccordionItem({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  // Menu Penjualan dan menu lainnya TIDAK otomatis terbuka
  const [open, setOpen] = React.useState(false);
  const IconComp = group.icon;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
          open
            ? "bg-muted/60 text-foreground font-semibold"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        )}
      >
        <IconComp size={20} stroke={1.75} className="shrink-0" />
        <span className="truncate text-start flex-1">{group.label}</span>

        {/*
          Sisi Kanan: Jika ada badge PRO, sembunyikan arrow right dan hanya tampilkan badge PRO saja
          (klik pada button tetap membuka/menutup accordion)
        */}
        {group.badge ? (
          <span className={cn("ml-auto", PRO_BADGE_CLASS)}>{group.badge}</span>
        ) : (
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="ml-auto shrink-0 text-muted-foreground"
          >
            <IconChevronRight size={16} stroke={1.75} />
          </motion.div>
        )}
      </button>

      {/* Submenu Accordion dengan Garis Pemandu Vertikal & Dot Persis Desktop */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative overflow-hidden"
          >
            <ul className="relative min-h-0 space-y-0.5 py-0.5">
              {group.children.map((child, index) => {
                const active = isPathActive(
                  pathname,
                  child.href,
                  undefined,
                  child.exact,
                );
                const isLast = index === group.children.length - 1;
                return (
                  <li
                    key={child.id}
                    className="relative first:mt-0.5 last:mb-0.5"
                  >
                    {/* Garis pemandu vertikal atas sejajar tengah icon (left-[21.5px]) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-[21.5px] top-0 h-2 w-px bg-border/50"
                    />

                    {/* Garis pemandu vertikal bawah sejajar tengah icon (left-[21.5px]) */}
                    {!isLast && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute bottom-[-2px] left-[21.5px] h-2.5 w-px bg-border/50"
                      />
                    )}

                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={subLinkClass(active)}
                    >
                      {/* Slot indikator 20px (tepat segaris di bawah kolom ikon grup 20px) */}
                      <div className="relative z-10 flex size-5 shrink-0 items-center justify-center">
                        {active ? (
                          <motion.div
                            layoutId={`mobile-sub-nav-dot-${group.id}`}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: [0.5, 1.35, 1], opacity: 1 }}
                            transition={{
                              duration: 0.35,
                              ease: [0.34, 1.56, 0.64, 1],
                            }}
                            className="relative flex items-center justify-center"
                          >
                            <span className="absolute -inset-1 rounded-full bg-primary/25 blur-[1px]" />
                            <span className="relative h-2 w-3.5 rounded-full bg-primary shadow-xs" />
                          </motion.div>
                        ) : (
                          <span className="size-2 rounded-full bg-muted-foreground/25 border border-border/80 transition-transform duration-200 ease-out group-hover/sub:scale-125 group-hover/sub:bg-muted-foreground/60" />
                        )}
                      </div>
                      <span className="relative z-10 truncate flex-1">
                        {child.label}
                      </span>
                      {child.badge && (
                        <span
                          className={cn(
                            "relative z-10 ml-auto",
                            PRO_BADGE_CLASS,
                          )}
                        >
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MENU PANEL DRAWER
// ============================================================================

function MobileMenuPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const { isOpen, setIsOpen, selectedCategory, setSelectedCategory } =
    useMobileNav();

  const [signingOut, setSigningOut] = React.useState(false);

  const userName = session?.user?.name || "Superadmin Finance";
  const userEmail = session?.user?.email || "admin@elysiafinance.com";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      setIsOpen(false);
      router.push("/sign-in");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  // Filter menu berdasarkan kategori aktif
  const filteredSections = React.useMemo(() => {
    if (selectedCategory === "all") return SIDEBAR_MENU;
    return SIDEBAR_MENU.filter((sec) => sec.id === selectedCategory);
  }, [selectedCategory]);

  const activeCategoryLabel =
    NAV_CATEGORIES.find((c) => c.id === selectedCategory)?.label ||
    "Semua Modul";

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay latar belakang semi-transparan (klik untuk menutup) */}
      <motion.div
        key="mobile-nav-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-35 bg-background/60 backdrop-blur-xs md:hidden"
        aria-hidden
      />

      {/*
        Area Celah Kosong Transparan di Atas:
        Mengetuk area celah ini akan menutup menu drawer
      */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-x-0 top-12 h-[22vh] sm:h-[24vh] z-36 cursor-pointer md:hidden"
        aria-hidden
      />

      {/*
        Panel Kontainer Drawer:
        - Dimulai tepat di bawah celah kosong (~22vh dari top-12)
        - Membentang ke bawah hingga ujung layar
        - Pembatas atas diam & stationary, tidak tembus ke celah atas saat di-scroll
      */}
      <motion.div
        key="mobile-nav-panel-wrapper"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-x-0 top-[calc(3rem+22vh)] sm:top-[calc(3rem+24vh)] bottom-0 z-40 flex flex-col md:hidden overflow-hidden"
      >
        {/*
          HEADER PEMBATAS TETAP (STATIONARY / DIAM):
          - Background transparan tanpa card/border sehingga melayang bebas
          - Berisi tombol "Buat Dokumen" dan "Semua Modul"
          - Menjadi pembatas tegas agar menu saat di-scroll tidak tembus ke atas
        */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-transparent z-20">
          {/* Dropdown Aksi Cepat Pembuatan Dokumen Keuangan */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8.5 flex-1 items-center justify-between rounded-full border border-border/80 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/70 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconPlus
                    size={14}
                    stroke={2}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">Buat Dokumen</span>
                </div>
                <IconChevronDown
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 rounded-xl p-1.5 shadow-xl"
            >
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aksi Cepat Dokumen
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {QUICK_DOCUMENTS.map((doc) => (
                <DropdownMenuItem
                  key={doc.id}
                  asChild
                  className="cursor-pointer"
                >
                  <Link
                    href={doc.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <doc.icon
                        size={15}
                        stroke={1.75}
                        className="text-primary shrink-0"
                      />
                      <span className="truncate text-foreground">
                        {doc.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal shrink-0">
                      {doc.category}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown Filter Modul */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8.5 flex-1 items-center justify-between rounded-full border border-border/80 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/70 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconFilter
                    size={13}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">{activeCategoryLabel}</span>
                </div>
                <IconChevronDown
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl p-1.5 shadow-xl"
            >
              <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Filter Modul
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NAV_CATEGORIES.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs",
                    cat.id === selectedCategory
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="truncate">{cat.label}</span>
                  {cat.id === selectedCategory && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/*
          DAFTAR KONTEN YANG BISA DI-SCROLL:
          - Berada tepat DI BAWAH header pembatas
          - Terisolasi rapi dan tidak tembus ke atas celah kosong
        */}
        <div className="flex-1 overflow-y-auto bg-background/98 px-4 pt-2.5 pb-32 overscroll-contain">
          {/* Daftar Navigasi Vertikal */}
          <div className="space-y-3">
            {filteredSections.map((section) => (
              <div key={section.id} className="space-y-1">
                {section.heading && (
                  <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    <div className="flex items-center gap-2">
                      <span>{section.heading}</span>
                      {section.badge && (
                        <span className={PRO_BADGE_CLASS}>{section.badge}</span>
                      )}
                    </div>
                    <span className="h-px flex-1 ml-2 bg-border/40" />
                  </div>
                )}

                <ul className="space-y-0.5">
                  {section.items.map((entry: NavEntry) => {
                    if (isNavGroup(entry)) {
                      return (
                        <li key={entry.id}>
                          <MobileAccordionItem
                            group={entry}
                            pathname={pathname}
                            onNavigate={() => setIsOpen(false)}
                          />
                        </li>
                      );
                    }

                    const item = entry as NavLink;
                    const active = isPathActive(
                      pathname,
                      item.href,
                      undefined,
                      item.exact,
                    );
                    const IconComp = item.icon;

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex h-10 w-full items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors",
                            active
                              ? "bg-muted/70 text-foreground font-semibold"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                          )}
                        >
                          {IconComp ? (
                            <IconComp
                              size={20}
                              stroke={1.75}
                              className="shrink-0"
                            />
                          ) : (
                            <div className="size-5 shrink-0" />
                          )}
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge && (
                            <span className={cn("ml-auto", PRO_BADGE_CLASS)}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {/* Pemisah Bagian Akun Pengguna */}
          <div className="my-3 border-t border-border/80" />
          {/* Blok User: avatar bulat kecil, nama tebal, email abu-abu */}
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar className="size-10 shrink-0 ring-1 ring-border/80">
              <AvatarImage
                src={session?.user?.image || "/images/profile/user-1.jpg"}
                alt={userName}
              />
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold text-foreground leading-tight">
                {userName}
              </span>
              <span className="truncate text-xs text-muted-foreground leading-tight">
                {userEmail}
              </span>
              <span className="mt-1 inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.2 text-[10px] font-semibold text-primary">
                Administrator Keuangan
              </span>
            </div>
          </div>
          {/* Garis pemisah */}
          <div className="my-2 border-t border-border/80" />
          {/* Daftar Aksi Akun: LABEL DI KIRI, IKON DI KANAN */}
          <div className="space-y-1">
            {/* Baris 1: Notifikasi */}
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <span>Notifikasi</span>
              <div className="relative flex items-center justify-center text-muted-foreground">
                <IconBell size={18} stroke={1.75} />
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500 ring-2 ring-background" />
              </div>
            </Link>

            {/* Baris 2: Pengaturan Akun */}
            <Link
              href={ROUTES.settings.company}
              onClick={() => setIsOpen(false)}
              className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <span>Pengaturan Akun</span>
              <IconSettings
                size={18}
                stroke={1.75}
                className="text-muted-foreground"
              />
            </Link>

            {/* Baris 3: Toggle Tema 3 Segmen (Sistem / Terang / Gelap) */}
            <div className="flex h-10 items-center justify-between rounded-lg px-2.5 text-sm font-medium text-foreground">
              <span>Tema Tampilan</span>
              <div
                className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5"
                role="radiogroup"
                aria-label="Pilih tema tampilan"
              >
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  role="radio"
                  aria-checked={theme === "system"}
                  title="Ikuti Sistem"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                    theme === "system"
                      ? "bg-background text-foreground shadow-2xs border border-border/80 font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <IconDeviceDesktop size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  role="radio"
                  aria-checked={theme === "light"}
                  title="Tema Terang"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                    theme === "light"
                      ? "bg-background text-foreground shadow-2xs border border-border/80 font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <IconSun size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  role="radio"
                  aria-checked={theme === "dark"}
                  title="Tema Gelap"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                    theme === "dark"
                      ? "bg-background text-foreground shadow-2xs border border-border/80 font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <IconMoon size={14} />
                </button>
              </div>
            </div>

            {/* Baris 4: Log Out */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex h-10 w-full items-center justify-between rounded-lg px-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer disabled:opacity-50"
            >
              <span>{signingOut ? "Mengeluarkan..." : "Keluar (Log Out)"}</span>
              <IconLogout size={18} stroke={1.75} className="shrink-0" />
            </button>
          </div>
          {/* Tombol Aksi Bawah Ukuran Default */}
          <div className="mt-4 px-1">
            <Link
              href="/penjualan/faktur/baru"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-background font-medium text-xs sm:text-sm shadow-xs transition-transform hover:opacity-95 active:scale-[0.99] cursor-pointer"
            >
              Catat Transaksi / Dokumen Baru
            </Link>
          </div>

          {/* Paling bawah: Teks status biru di kiri dan titik biru di kanan */}
          <div className="mt-4 mb-1 flex items-center justify-between px-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span>Elysia Finance Cloud • Terhubung</span>
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-blue-600 dark:bg-blue-500" />
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============================================================================
// PANEL PENCARIAN PENUH LAYAR (FIND PANEL - VERCEL MOBILE STYLE)
// ============================================================================

interface MobileSearchItem {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  icon?: NavIcon;
  isUser?: boolean;
}

function MobileSearchPanel() {
  const { isSearchOpen, closeSearch } = useMobileNav();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name || "Administrator";
  const userEmail = session?.user?.email || "admin@elysia.finance";

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Kunci scroll body saat panel pencarian penuh layar terbuka
  React.useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isSearchOpen]);

  // Siapkan seluruh data rute navigasi yang dapat dicari
  const allItems: MobileSearchItem[] = React.useMemo(() => {
    const list: MobileSearchItem[] = SEARCH_INDEX.map((item) => ({
      id: item.id,
      label: item.label,
      subtitle: item.trail.includes("→")
        ? item.trail.split("→")[0]!.trim()
        : item.category,
      href: item.href,
      icon: item.icon,
    }));

    // Tambahkan entri akun pengguna / profil (sesuai spesifikasi Gambar 4)
    list.push({
      id: "search-user-profile",
      label: userName,
      subtitle: "Akun Pengguna • Pengaturan",
      href: ROUTES.settings.company,
      isUser: true,
    });

    return list;
  }, [userName]);

  // Filter hasil pencarian secara real-time
  const results = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      // Saat input kosong: tampilkan rute utama/sering dibuka (maksimal 7 baris)
      return allItems
        .filter(
          (item) => item.isUser || DEFAULT_SEARCH_HREFS.includes(item.href),
        )
        .slice(0, 7);
    }
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.isUser &&
          (userEmail.toLowerCase().includes(q) ||
            "profil".includes(q) ||
            "pengaturan".includes(q))),
    );
  }, [allItems, searchQuery, userEmail]);

  // Pastikan index yang aktif selalu dalam batas list hasil
  const safeIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));

  const handleSelect = React.useCallback(
    (href: string) => {
      closeSearch();
      router.push(href);
    },
    [closeSearch, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[safeIndex]) {
        handleSelect(results[safeIndex].href);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    }
  };

  if (!isSearchOpen) return null;

  return (
    <motion.div
      key="mobile-search-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col bg-background text-foreground md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian Cepat Halaman"
    >
      {/*
        Baris Input di Paling Atas:
        - Tinggi 56px (seukuran navbar/header mobile)
        - Kiri: ikon kaca pembesar outline
        - Tengah: input tanpa border & background, placeholder "Cari halaman atau transaksi…" (font 16px)
        - Kanan: tombol X untuk menutup
      */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/80 px-4 bg-background">
        <IconSearch size={19} stroke={1.75} className="shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari halaman atau transaksi…"
          className="h-full flex-1 bg-transparent text-[16px] font-normal text-foreground placeholder:text-muted-foreground/60 outline-none border-none focus:outline-none focus:ring-0"
          autoFocus
        />
        <button
          type="button"
          onClick={closeSearch}
          aria-label="Tutup pencarian"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground active:scale-95 cursor-pointer"
        >
          <IconX size={20} stroke={2} />
        </button>
      </div>

      {/*
        Daftar Hasil Vertikal:
        - Tinggi baris ~52-56px
        - Kiri: ikon outline / avatar pengguna
        - Dua baris teks: Judul (medium) & Subjudul (abu-abu)
        - Baris aktif tersorot berlatar abu muda rounded
      */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1">
        {results.length > 0 ? (
          results.map((item, index) => {
            const isSelected = index === safeIndex;
            const IconComp = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item.href)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "flex min-h-[54px] items-center gap-3 rounded-xl px-3 py-2 transition-colors cursor-pointer select-none",
                  isSelected
                    ? "bg-muted/70 text-foreground"
                    : "text-foreground hover:bg-muted/40",
                )}
              >
                {item.isUser ? (
                  <Avatar className="size-8.5 shrink-0 ring-1 ring-border/80">
                    <AvatarImage
                      src={session?.user?.image || "/images/profile/user-1.jpg"}
                      alt={userName}
                    />
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div
                    className={cn(
                      "flex size-8.5 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {IconComp ? (
                      <IconComp size={18} stroke={1.75} />
                    ) : (
                      <IconSearch size={18} stroke={1.75} />
                    )}
                  </div>
                )}

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-sm font-medium text-foreground leading-snug">
                    {item.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground leading-tight">
                    {item.subtitle}
                  </span>
                </div>

                {isSelected && (
                  <IconCornerDownLeft
                    size={15}
                    stroke={1.75}
                    className="shrink-0 text-muted-foreground/60 mr-1"
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground px-4">
            <IconSearchOff
              size={36}
              stroke={1.5}
              className="mb-2.5 opacity-40 text-muted-foreground"
            />
            <p className="text-sm font-medium text-foreground">
              Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Coba kata kunci lain atau periksa ejaan menu
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// KOMPONEN UTAMA MOBILE NAV
// ============================================================================

export function MobileNav() {
  return (
    <>
      <MobileFloatingBar />
      {/*
        Gradasi Blur Memudar di Bagian Bawah:
        Posisinya menembus setengah tombol floating bar dan tingkat blurnya memudar bergradasi
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-45 h-20 bg-gradient-to-t from-background via-background/70 to-transparent backdrop-blur-[6px] [mask-image:linear-gradient(to_top,black_30%,transparent)] md:hidden"
      />
      <AnimatePresence>
        <MobileMenuPanel />
      </AnimatePresence>
      <AnimatePresence>
        <MobileSearchPanel />
      </AnimatePresence>
    </>
  );
}
