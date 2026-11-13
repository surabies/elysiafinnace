import { ROUTES } from "../sidebar/routes";

/** Warna ikon di mega menu. Pemetaan ke class Tailwind ada di komponen MegaMenu. */
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
  icon: string;
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
    icon: "solar:cart-large-2-linear",
    tone: "primary",
  },
  {
    id: "purchases",
    title: "Pembelian",
    description: "Faktur & pembayaran",
    href: ROUTES.purchases.invoices,
    icon: "solar:bag-5-linear",
    tone: "secondary",
  },
  {
    id: "cash-bank",
    title: "Kas & Bank",
    description: "Saldo & transfer",
    href: ROUTES.cashBank.accounts,
    icon: "solar:wallet-linear",
    tone: "success",
  },
  {
    id: "expenses",
    title: "Biaya",
    description: "Catat pengeluaran",
    href: ROUTES.expenses.list,
    icon: "solar:bill-list-linear",
    tone: "warning",
  },
  {
    id: "inventory",
    title: "Produk & Persediaan",
    description: "Stok & gudang",
    href: ROUTES.products,
    icon: "solar:box-minimalistic-linear",
    tone: "info",
  },
  {
    id: "fixed-assets",
    title: "Aset Tetap",
    description: "Penyusutan aset",
    href: ROUTES.fixedAssets,
    icon: "solar:buildings-2-linear",
    tone: "danger",
  },
  {
    id: "journals",
    title: "Jurnal Umum",
    description: "Entri jurnal manual",
    href: ROUTES.accounting.journals,
    icon: "solar:notes-linear",
    tone: "secondary",
  },
  {
    id: "reports",
    title: "Laporan Keuangan",
    description: "Neraca & laba rugi",
    href: ROUTES.reports.balanceSheet,
    icon: "solar:pie-chart-2-linear",
    tone: "primary",
  },
];

/** Kolom kanan: pintasan ke pekerjaan yang paling sering dilakukan. */
export const MEGA_MENU_QUICK_LINKS: MegaMenuQuickLink[] = [
  { id: "new-invoice", label: "Buat faktur penjualan", href: ROUTES.sales.newInvoice },
  { id: "new-expense", label: "Catat biaya", href: ROUTES.expenses.newExpense },
  { id: "receive-payment", label: "Terima pembayaran", href: ROUTES.sales.payments },
  { id: "trial-balance", label: "Neraca saldo", href: ROUTES.reports.trialBalance },
  { id: "ledger", label: "Buku besar", href: ROUTES.reports.generalLedger },
  { id: "receivable", label: "Umur piutang", href: ROUTES.reports.receivableAging },
  { id: "payable", label: "Umur utang", href: ROUTES.reports.payableAging },
  { id: "company", label: "Profil perusahaan", href: ROUTES.settings.company },
];

/** Baris bawah: tautan FAQ di kiri, tombol di kanan. */
export const MEGA_MENU_FOOTER = {
  faq: { label: "Pertanyaan yang sering diajukan", href: ROUTES.help.faq },
  cta: { label: "Pusat bantuan", href: ROUTES.help.center },
} as const;
