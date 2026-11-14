import type { ComponentType } from "react";
import type { IconProps } from "@tabler/icons-react";
import {
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconFileReport,
  IconNotebook,
  IconPackages,
  IconReceipt2,
  IconShoppingBag,
  IconShoppingCart,
} from "@tabler/icons-react";
import { ROUTES } from "../sidebar/routes";

export type MegaMenuTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface MegaMenuApp {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<IconProps>;
  tone: MegaMenuTone;
}

export interface MegaMenuQuickLink {
  id: string;
  label: string;
  href: string;
}

/** Kolom kiri: modul utama dalam grid 2 kolom. */
export const MEGA_MENU_APPS: MegaMenuApp[] = [
  {
    id: "sales",
    title: "Penjualan",
    description: "Faktur & penerimaan",
    href: ROUTES.sales.invoices,
    icon: IconShoppingCart,
    tone: "primary",
  },
  {
    id: "purchases",
    title: "Pembelian",
    description: "Faktur & pembayaran",
    href: ROUTES.purchases.invoices,
    icon: IconShoppingBag,
    tone: "secondary",
  },
  {
    id: "cash-bank",
    title: "Kas & Bank",
    description: "Saldo & transfer",
    href: ROUTES.cashBank.accounts,
    icon: IconBuildingBank,
    tone: "success",
  },
  {
    id: "expenses",
    title: "Biaya",
    description: "Catat pengeluaran",
    href: ROUTES.expenses.list,
    icon: IconReceipt2,
    tone: "warning",
  },
  {
    id: "inventory",
    title: "Produk & Persediaan",
    description: "Stok & gudang",
    href: ROUTES.inventory.products,
    icon: IconPackages,
    tone: "info",
  },
  {
    id: "fixed-assets",
    title: "Aset Tetap",
    description: "Penyusutan aset",
    href: ROUTES.fixedAssets.list,
    icon: IconBuildingSkyscraper,
    tone: "danger",
  },
  {
    id: "journals",
    title: "Jurnal Umum",
    description: "Entri jurnal manual",
    href: ROUTES.accounting.journals,
    icon: IconNotebook,
    tone: "secondary",
  },
  {
    id: "reports",
    title: "Laporan Keuangan",
    description: "Neraca & laba rugi",
    href: ROUTES.reports.financial,
    icon: IconFileReport,
    tone: "primary",
  },
];

/** Kolom kanan: pintasan ke pekerjaan yang paling sering dilakukan. */
export const MEGA_MENU_QUICK_LINKS: MegaMenuQuickLink[] = [
  { id: "new-invoice", label: "Faktur penjualan", href: ROUTES.sales.invoices },
  { id: "new-expense", label: "Catat biaya", href: ROUTES.expenses.list },
  { id: "receive-payment", label: "Terima pembayaran", href: ROUTES.sales.payments },
  { id: "financial-report", label: "Laporan finansial", href: ROUTES.reports.financial },
  { id: "subledger-aging", label: "Buku besar pembantu & aging", href: ROUTES.reports.subledgerAging },
  { id: "recurring", label: "Transaksi berulang", href: ROUTES.automation.recurring },
  { id: "reminders", label: "Pengingat jatuh tempo", href: ROUTES.automation.reminders },
  { id: "company", label: "Profil perusahaan", href: ROUTES.settings.company },
];

/** Baris bawah: tautan FAQ di kiri, tombol di kanan. */
export const MEGA_MENU_FOOTER = {
  faq: { label: "Pertanyaan yang sering diajukan", href: ROUTES.help.faq },
  cta: { label: "Pusat bantuan", href: ROUTES.help.center },
} as const;
