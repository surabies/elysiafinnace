import { ROUTES } from "../sidebar/routes";
import type { NavSection } from "./types";

/**
 * Struktur menu aplikasi keuangan (pola yang umum di Jurnal.id, Kledo, Accurate Online):
 * Dasbor → Transaksi → Data master → Akuntansi & laporan → Sistem.
 *
 * Menambah menu = menambah objek di sini. Komponen sidebar tidak perlu diubah.
 */
export const SIDEBAR_MENU: NavSection[] = [
  {
    id: "main",
    items: [
      {
        id: "dashboard",
        label: "Dasbor",
        icon: "solar:widget-2-linear",
        href: ROUTES.dashboard,
      },
    ],
  },
  {
    id: "transactions",
    heading: "Transaksi",
    items: [
      {
        id: "sales",
        label: "Penjualan",
        icon: "solar:cart-large-2-linear",
        children: [
          { id: "sales-quotes", label: "Penawaran", href: ROUTES.sales.quotes },
          { id: "sales-orders", label: "Pesanan Penjualan", href: ROUTES.sales.orders },
          { id: "sales-invoices", label: "Faktur Penjualan", href: ROUTES.sales.invoices },
          { id: "sales-payments", label: "Penerimaan Pembayaran", href: ROUTES.sales.payments },
          { id: "sales-returns", label: "Retur Penjualan", href: ROUTES.sales.returns },
        ],
      },
      {
        id: "purchases",
        label: "Pembelian",
        icon: "solar:bag-5-linear",
        children: [
          { id: "purchase-orders", label: "Pesanan Pembelian", href: ROUTES.purchases.orders },
          { id: "purchase-invoices", label: "Faktur Pembelian", href: ROUTES.purchases.invoices },
          { id: "purchase-payments", label: "Pembayaran Pembelian", href: ROUTES.purchases.payments },
          { id: "purchase-returns", label: "Retur Pembelian", href: ROUTES.purchases.returns },
        ],
      },
      {
        id: "expenses",
        label: "Biaya",
        icon: "solar:bill-list-linear",
        href: ROUTES.expenses.list,
      },
      {
        id: "cash-bank",
        label: "Kas & Bank",
        icon: "solar:wallet-linear",
        children: [
          { id: "cash-accounts", label: "Akun Kas & Bank", href: ROUTES.cashBank.accounts },
          { id: "cash-receive", label: "Terima Uang", href: ROUTES.cashBank.receive },
          { id: "cash-send", label: "Kirim Uang", href: ROUTES.cashBank.send },
          { id: "cash-transfer", label: "Transfer Uang", href: ROUTES.cashBank.transfer },
          { id: "cash-reconcile", label: "Rekonsiliasi Bank", href: ROUTES.cashBank.reconcile },
        ],
      },
    ],
  },
  {
    id: "master",
    heading: "Data master",
    items: [
      {
        id: "contacts",
        label: "Kontak",
        icon: "solar:users-group-rounded-linear",
        children: [
          { id: "contact-customers", label: "Pelanggan", href: ROUTES.contacts.customers },
          { id: "contact-suppliers", label: "Pemasok", href: ROUTES.contacts.suppliers },
          { id: "contact-employees", label: "Karyawan", href: ROUTES.contacts.employees },
        ],
      },
      {
        id: "products",
        label: "Produk & Jasa",
        icon: "solar:tag-price-linear",
        href: ROUTES.products,
      },
      {
        id: "inventory",
        label: "Persediaan",
        icon: "solar:box-minimalistic-linear",
        children: [
          { id: "inventory-warehouses", label: "Gudang", href: ROUTES.inventory.warehouses },
          { id: "inventory-adjustments", label: "Penyesuaian Stok", href: ROUTES.inventory.adjustments },
          { id: "inventory-transfers", label: "Transfer Gudang", href: ROUTES.inventory.transfers },
          { id: "inventory-opname", label: "Stok Opname", href: ROUTES.inventory.opname },
        ],
      },
      {
        id: "fixed-assets",
        label: "Aset Tetap",
        icon: "solar:buildings-2-linear",
        href: ROUTES.fixedAssets,
      },
    ],
  },
  {
    id: "accounting",
    heading: "Akuntansi & laporan",
    items: [
      {
        id: "accounting",
        label: "Akuntansi",
        icon: "solar:calculator-minimalistic-linear",
        children: [
          { id: "acc-coa", label: "Bagan Akun", href: ROUTES.accounting.chartOfAccounts },
          { id: "acc-journals", label: "Jurnal Umum", href: ROUTES.accounting.journals },
          { id: "acc-budgets", label: "Anggaran", href: ROUTES.accounting.budgets },
          { id: "acc-closing", label: "Tutup Buku", href: ROUTES.accounting.closing },
        ],
      },
      {
        id: "reports",
        label: "Laporan",
        icon: "solar:pie-chart-2-linear",
        children: [
          { id: "rep-balance-sheet", label: "Neraca", href: ROUTES.reports.balanceSheet },
          { id: "rep-income", label: "Laba Rugi", href: ROUTES.reports.incomeStatement },
          { id: "rep-cash-flow", label: "Arus Kas", href: ROUTES.reports.cashFlow },
          { id: "rep-equity", label: "Perubahan Ekuitas", href: ROUTES.reports.equity },
          { id: "rep-ledger", label: "Buku Besar", href: ROUTES.reports.generalLedger },
          { id: "rep-trial", label: "Neraca Saldo", href: ROUTES.reports.trialBalance },
          { id: "rep-receivable", label: "Umur Piutang", href: ROUTES.reports.receivableAging },
          { id: "rep-payable", label: "Umur Utang", href: ROUTES.reports.payableAging },
        ],
      },
    ],
  },
  {
    id: "system",
    heading: "Sistem",
    items: [
      {
        id: "settings",
        label: "Pengaturan",
        icon: "solar:settings-minimalistic-linear",
        children: [
          { id: "set-company", label: "Profil Perusahaan", href: ROUTES.settings.company },
          { id: "set-users", label: "Pengguna & Hak Akses", href: ROUTES.settings.users },
          { id: "set-taxes", label: "Pajak", href: ROUTES.settings.taxes },
          { id: "set-currencies", label: "Mata Uang", href: ROUTES.settings.currencies },
          { id: "set-numbering", label: "Penomoran Dokumen", href: ROUTES.settings.numbering },
        ],
      },
    ],
  },
];
