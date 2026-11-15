import {
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconCalculator,
  IconCashRegister,
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
  IconTargetArrow,
  IconUsers,
} from "@tabler/icons-react";
import { ROUTES } from "../sidebar/routes";
import type { NavSection } from "./types";

/**
 * Struktur menu aplikasi keuangan lengkap terorganisir:
 * Ringkasan → Keuangan & Akuntansi → Persediaan & Gudang → Ekosistem Enterprise (PRO) → Pusat Laporan → Otomasi & Sistem.
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
    id: "finance",
    heading: "Keuangan & Akuntansi",
    items: [
      {
        id: "sales",
        label: "Penjualan",
        icon: IconShoppingCart,
        children: [
          {
            id: "sales-orders",
            label: "Pesanan Penjualan",
            href: ROUTES.sales.orders,
          },
          {
            id: "sales-invoices",
            label: "Faktur Penjualan",
            href: ROUTES.sales.invoices,
          },
          {
            id: "sales-payments",
            label: "Pembayaran Piutang",
            href: ROUTES.sales.payments,
          },
          {
            id: "sales-returns",
            label: "Retur Penjualan",
            href: ROUTES.sales.returns,
          },
          {
            id: "sales-customers",
            label: "Pelanggan",
            href: ROUTES.sales.customers,
          },
        ],
      },
      {
        id: "purchases",
        label: "Pembelian",
        icon: IconShoppingBag,
        children: [
          {
            id: "purchase-orders",
            label: "Pesanan Pembelian",
            href: ROUTES.purchases.orders,
          },
          {
            id: "purchase-invoices",
            label: "Faktur Pembelian",
            href: ROUTES.purchases.invoices,
          },
          {
            id: "purchase-payments",
            label: "Pembayaran Hutang",
            href: ROUTES.purchases.payments,
          },
          {
            id: "purchase-returns",
            label: "Retur Pembelian",
            href: ROUTES.purchases.returns,
          },
          {
            id: "purchase-suppliers",
            label: "Pemasok",
            href: ROUTES.purchases.suppliers,
          },
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
          {
            id: "cash-accounts",
            label: "Rekening Kas",
            href: ROUTES.cashBank.accounts,
          },
          {
            id: "cash-mutations",
            label: "Buku Mutasi",
            href: ROUTES.cashBank.mutations,
          },
          {
            id: "cash-transfer",
            label: "Transfer Kas",
            href: ROUTES.cashBank.transfer,
          },
          {
            id: "cash-reconcile",
            label: "Rekonsiliasi",
            href: ROUTES.cashBank.reconcile,
          },
        ],
      },
      {
        id: "acc",
        label: "Akuntansi",
        icon: IconCalculator,
        children: [
          {
            id: "acc-coa",
            label: "Bagan Akun",
            href: ROUTES.accounting.chartOfAccounts,
          },
          {
            id: "acc-journals",
            label: "Jurnal Umum",
            href: ROUTES.accounting.journals,
          },
          {
            id: "acc-dimensions",
            label: "Dimensi Biaya",
            href: ROUTES.accounting.dimensions,
          },
          {
            id: "acc-budgets",
            label: "Anggaran & Realisasi",
            href: ROUTES.accounting.budgets,
          },
          {
            id: "acc-closing",
            label: "Tutup Buku",
            href: ROUTES.accounting.closing,
          },
        ],
      },
      {
        id: "taxes",
        label: "Perpajakan",
        icon: IconReceiptTax,
        children: [
          { id: "tax-ppn", label: "Faktur Pajak", href: ROUTES.taxes.ppn },
          { id: "tax-pph", label: "Bukti Potong PPh", href: ROUTES.taxes.pph },
          {
            id: "tax-rekap",
            label: "Rekap SPT Masa",
            href: ROUTES.taxes.rekap,
          },
        ],
      },
    ],
  },
  {
    id: "supply-chain",
    heading: "Persediaan & Gudang",
    items: [
      {
        id: "inventory",
        label: "Persediaan",
        icon: IconPackages,
        children: [
          {
            id: "inv-products",
            label: "Katalog Produk",
            href: ROUTES.inventory.products,
          },
          {
            id: "inv-categories",
            label: "Kategori Produk",
            href: ROUTES.inventory.categories,
          },
          {
            id: "inv-units",
            label: "Satuan Ukur",
            href: ROUTES.inventory.units,
          },
          {
            id: "inv-warehouses",
            label: "Lokasi Gudang",
            href: ROUTES.inventory.warehouses,
          },
          {
            id: "inv-transfers",
            label: "Transfer Gudang",
            href: ROUTES.inventory.transfers,
          },
          {
            id: "inv-adjustments",
            label: "Stok Opname",
            href: ROUTES.inventory.adjustments,
          },
        ],
      },
    ],
  },
  {
    id: "enterprise",
    heading: "Ekosistem Enterprise",
    items: [
      {
        id: "pos",
        label: "POS",
        icon: IconCashRegister,
        href: ROUTES.pos.cashier,
        badge: "PRO",
      },
      {
        id: "payroll",
        label: "Payroll",
        icon: IconUsers,
        badge: "PRO",
        children: [
          {
            id: "payroll-dash",
            label: "Proses Penggajian",
            href: ROUTES.payroll.dashboard,
            exact: true,
          },
          {
            id: "payroll-emp",
            label: "Direktori Karyawan",
            href: ROUTES.payroll.employees,
          },
        ],
      },
      {
        id: "marketplace",
        label: "Marketplace",
        icon: IconBuildingStore,
        href: ROUTES.marketplace.channels,
        badge: "PRO",
      },
      {
        id: "crm",
        label: "CRM",
        icon: IconTargetArrow,
        badge: "PRO",
        children: [
          {
            id: "crm-leads",
            label: "Prospek (Leads)",
            href: ROUTES.crm.leads,
          },
          {
            id: "crm-deals",
            label: "Peluang (Deals)",
            href: ROUTES.crm.deals,
          },
        ],
      },
      {
        id: "fixed-assets",
        label: "Aset Tetap",
        icon: IconBuildingSkyscraper,
        badge: "PRO",
        children: [
          {
            id: "fa-list",
            label: "Daftar Aset",
            href: ROUTES.fixedAssets.list,
          },
          {
            id: "fa-depreciation",
            label: "Penyusutan",
            href: ROUTES.fixedAssets.depreciation,
          },
          {
            id: "fa-disposal",
            label: "Pelepasan Aset",
            href: ROUTES.fixedAssets.disposal,
          },
        ],
      },
    ],
  },
  {
    id: "reports",
    heading: "Pusat Laporan",
    items: [
      {
        id: "reports-group",
        label: "Pusat Laporan",
        icon: IconFileReport,
        children: [
          {
            id: "rep-financial",
            label: "Laporan Keuangan",
            href: ROUTES.reports.financial,
          },
          {
            id: "rep-subledger",
            label: "Buku Pembantu & Aging",
            href: ROUTES.reports.subledgerAging,
          },
          {
            id: "rep-trade",
            label: "Laporan Komersial",
            href: ROUTES.reports.trade,
          },
          {
            id: "rep-comparative",
            label: "Laporan Komparatif",
            href: ROUTES.reports.comparative,
          },
          {
            id: "rep-consolidation",
            label: "Konsolidasi Holding",
            href: ROUTES.reports.consolidation,
          },
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
        label: "Otomasi",
        icon: IconRobot,
        children: [
          {
            id: "auto-recurring",
            label: "Transaksi Rutin",
            href: ROUTES.automation.recurring,
          },
          {
            id: "auto-reminders",
            label: "Pengingat Tempo",
            href: ROUTES.automation.reminders,
          },
          {
            id: "auto-integration",
            label: "API & Webhook",
            href: ROUTES.automation.integration,
          },
        ],
      },
      {
        id: "settings",
        label: "Pengaturan",
        icon: IconSettings,
        children: [
          {
            id: "set-company",
            label: "Profil Perusahaan",
            href: ROUTES.settings.company,
          },
          {
            id: "set-currencies",
            label: "Mata Uang & Kurs",
            href: ROUTES.settings.currencies,
          },
          {
            id: "set-numbering",
            label: "Penomoran Dokumen",
            href: ROUTES.settings.numbering,
          },
          {
            id: "set-tags",
            label: "Tag Transaksi",
            href: ROUTES.settings.tags,
          },
          {
            id: "set-users",
            label: "Pengguna & Peran",
            href: ROUTES.settings.users,
          },
          {
            id: "set-approvals",
            label: "Alur Persetujuan",
            href: ROUTES.settings.approvals,
          },
          {
            id: "set-lock-date",
            label: "Kunci Transaksi",
            href: ROUTES.settings.lockDate,
          },
          {
            id: "set-audit-log",
            label: "Jejak Audit",
            href: ROUTES.settings.auditLog,
          },
          {
            id: "set-diagnostics",
            label: "Diagnostik Sistem",
            href: ROUTES.settings.diagnostics,
          },
        ],
      },
    ],
  },
];
