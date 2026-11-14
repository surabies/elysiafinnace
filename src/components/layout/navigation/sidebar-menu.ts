import {
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconCalculator,
  IconChartBar,
  IconFileReport,
  IconLayoutDashboard,
  IconPackages,
  IconReceipt2,
  IconReceiptTax,
  IconRobot,
  IconSettings,
  IconShoppingBag,
  IconShoppingCart,
} from "@tabler/icons-react";
import { ROUTES } from "../sidebar/routes";
import type { NavSection } from "./types";

/**
 * Struktur menu aplikasi keuangan lengkap (M1 - M14):
 * Dasbor/Analytics → Transaksi → Operasional & Persediaan → Akuntansi & Pajak → Laporan Enterprise → Otomasi & Sistem.
 *
 * Menggunakan @tabler/icons-react langsung untuk performa optimal tanpa network request SVG.
 */
export const SIDEBAR_MENU: NavSection[] = [
  {
    id: "main",
    items: [
      {
        id: "dashboard",
        label: "Dasbor",
        icon: IconLayoutDashboard,
        href: ROUTES.dashboard,
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: IconChartBar,
        href: ROUTES.analytics,
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
        icon: IconShoppingCart,
        children: [
          { id: "sales-orders", label: "Pesanan Penjualan", href: ROUTES.sales.orders },
          { id: "sales-invoices", label: "Faktur Penjualan", href: ROUTES.sales.invoices },
          { id: "sales-payments", label: "Penerimaan Pembayaran", href: ROUTES.sales.payments },
          { id: "sales-returns", label: "Retur Penjualan", href: ROUTES.sales.returns },
          { id: "sales-customers", label: "Data Pelanggan", href: ROUTES.sales.customers },
        ],
      },
      {
        id: "purchases",
        label: "Pembelian",
        icon: IconShoppingBag,
        children: [
          { id: "purchase-orders", label: "Pesanan Pembelian", href: ROUTES.purchases.orders },
          { id: "purchase-invoices", label: "Faktur Pembelian", href: ROUTES.purchases.invoices },
          { id: "purchase-payments", label: "Pembayaran Pembelian", href: ROUTES.purchases.payments },
          { id: "purchase-returns", label: "Retur Pembelian", href: ROUTES.purchases.returns },
          { id: "purchase-suppliers", label: "Data Pemasok", href: ROUTES.purchases.suppliers },
        ],
      },
      {
        id: "expenses",
        label: "Biaya Operasional",
        icon: IconReceipt2,
        href: ROUTES.expenses.list,
      },
      {
        id: "cash-bank",
        label: "Kas & Bank",
        icon: IconBuildingBank,
        children: [
          { id: "cash-accounts", label: "Daftar Rekening", href: ROUTES.cashBank.accounts },
          { id: "cash-mutations", label: "Mutasi Kas & Bank", href: ROUTES.cashBank.mutations },
          { id: "cash-transfer", label: "Transfer Antar Kas", href: ROUTES.cashBank.transfer },
          { id: "cash-reconcile", label: "Rekonsiliasi Bank", href: ROUTES.cashBank.reconcile },
        ],
      },
    ],
  },
  {
    id: "operations",
    heading: "Operasional & Persediaan",
    items: [
      {
        id: "inventory",
        label: "Persediaan & Gudang",
        icon: IconPackages,
        children: [
          { id: "inv-products", label: "Katalog Produk & Stok", href: ROUTES.inventory.products },
          { id: "inv-warehouses", label: "Daftar Multi-Gudang", href: ROUTES.inventory.warehouses },
          { id: "inv-transfers", label: "Transfer Antar Gudang", href: ROUTES.inventory.transfers },
          { id: "inv-adjustments", label: "Penyesuaian & Opname", href: ROUTES.inventory.adjustments },
        ],
      },
      {
        id: "fixed-assets",
        label: "Aset Tetap",
        icon: IconBuildingSkyscraper,
        children: [
          { id: "fa-list", label: "Daftar Aset & Register", href: ROUTES.fixedAssets.list },
          { id: "fa-depreciation", label: "Penyusutan Bulanan", href: ROUTES.fixedAssets.depreciation },
          { id: "fa-disposal", label: "Pelepasan & Write-Off", href: ROUTES.fixedAssets.disposal },
        ],
      },
    ],
  },
  {
    id: "accounting",
    heading: "Akuntansi & Pajak",
    items: [
      {
        id: "acc",
        label: "Akuntansi",
        icon: IconCalculator,
        children: [
          { id: "acc-coa", label: "Bagan Akun (COA)", href: ROUTES.accounting.chartOfAccounts },
          { id: "acc-journals", label: "Jurnal Penyesuaian", href: ROUTES.accounting.journals },
          { id: "acc-dimensions", label: "Dimensi Biaya (Cost Center)", href: ROUTES.accounting.dimensions },
          { id: "acc-budgets", label: "Anggaran & Realisasi", href: ROUTES.accounting.budgets },
          { id: "acc-closing", label: "Tutup Buku Periode", href: ROUTES.accounting.closing },
        ],
      },
      {
        id: "taxes",
        label: "Perpajakan",
        icon: IconReceiptTax,
        children: [
          { id: "tax-ppn", label: "Faktur Pajak (PPN)", href: ROUTES.taxes.ppn },
          { id: "tax-pph", label: "Bukti Potong PPh (23/4(2))", href: ROUTES.taxes.pph },
          { id: "tax-rekap", label: "Rekapitulasi SPT Masa", href: ROUTES.taxes.rekap },
        ],
      },
    ],
  },
  {
    id: "reports",
    heading: "Laporan Enterprise",
    items: [
      {
        id: "reports-group",
        label: "Pusat Laporan",
        icon: IconFileReport,
        children: [
          { id: "rep-financial", label: "Laporan Finansial Inti", href: ROUTES.reports.financial },
          { id: "rep-subledger", label: "Subledger & Aging Piutang/Utang", href: ROUTES.reports.subledgerAging },
          { id: "rep-trade", label: "Laporan Penjualan & Pembelian", href: ROUTES.reports.trade },
          { id: "rep-comparative", label: "Laba Rugi Multi-Periode", href: ROUTES.reports.comparative },
          { id: "rep-consolidation", label: "Konsolidasi Grup & Eliminasi", href: ROUTES.reports.consolidation },
        ],
      },
    ],
  },
  {
    id: "automation-system",
    heading: "Otomasi & Sistem",
    items: [
      {
        id: "automation",
        label: "Otomasi & Integrasi",
        icon: IconRobot,
        children: [
          { id: "auto-recurring", label: "Transaksi Berulang", href: ROUTES.automation.recurring },
          { id: "auto-reminders", label: "Pengingat Jatuh Tempo", href: ROUTES.automation.reminders },
          { id: "auto-integration", label: "API Key & Webhook", href: ROUTES.automation.integration },
        ],
      },
      {
        id: "settings",
        label: "Pengaturan & Kontrol",
        icon: IconSettings,
        children: [
          { id: "set-company", label: "Profil Perusahaan", href: ROUTES.settings.company },
          { id: "set-users", label: "Pengguna & Peran (RBAC)", href: ROUTES.settings.users },
          { id: "set-approvals", label: "Hierarki Persetujuan", href: ROUTES.settings.approvals },
          { id: "set-lock-date", label: "Kunci Tanggal Transaksi", href: ROUTES.settings.lockDate },
          { id: "set-audit-log", label: "Jejak Audit (Audit Log)", href: ROUTES.settings.auditLog },
          { id: "set-diagnostics", label: "Diagnostik & Latensi DB", href: ROUTES.settings.diagnostics },
        ],
      },
    ],
  },
];
