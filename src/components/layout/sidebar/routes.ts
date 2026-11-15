/**
 * Satu-satunya tempat mendefinisikan URL halaman.
 * Sidebar, mega menu, header, dan pencarian membaca dari sini,
 * jadi mengganti URL cukup di satu tempat.
 */
export const ROUTES = {
  dashboard: "/dashboard",
  analytics: "/analytics",
  calendar: "/kalender",

  sales: {
    orders: "/penjualan/pesanan",
    invoices: "/penjualan/faktur",
    payments: "/penjualan/pembayaran",
    returns: "/penjualan/retur",
    customers: "/kontak/pelanggan",
  },

  purchases: {
    orders: "/pembelian/pesanan",
    invoices: "/pembelian/faktur",
    payments: "/pembelian/pembayaran",
    returns: "/pembelian/retur",
    suppliers: "/kontak/pemasok",
  },

  expenses: {
    list: "/biaya",
  },

  cashBank: {
    accounts: "/kas-bank/rekening",
    mutations: "/kas-bank/mutasi",
    transfer: "/kas-bank/transfer",
    reconcile: "/kas-bank/rekonsiliasi",
  },

  inventory: {
    products: "/persediaan/produk",
    categories: "/persediaan/kategori",
    units: "/persediaan/satuan",
    warehouses: "/persediaan/gudang",
    transfers: "/persediaan/transfer",
    adjustments: "/persediaan/penyesuaian",
  },

  fixedAssets: {
    list: "/aset-tetap/daftar",
    depreciation: "/aset-tetap/penyusutan",
    disposal: "/aset-tetap/pelepasan",
  },

  payroll: {
    dashboard: "/payroll",
    employees: "/payroll/karyawan",
  },

  pos: {
    cashier: "/pos",
    shifts: "/pos/shift",
  },

  marketplace: {
    channels: "/integrasi/marketplace",
    mappings: "/integrasi/marketplace/mappings",
  },

  crm: {
    leads: "/crm/leads",
    deals: "/crm/deals",
  },

  accounting: {
    chartOfAccounts: "/akuntansi/bagan-akun",
    journals: "/akuntansi/jurnal-umum",
    dimensions: "/akuntansi/dimensi",
    budgets: "/akuntansi/anggaran",
    closing: "/akuntansi/tutup-buku",
  },

  taxes: {
    ppn: "/pajak/faktur-pajak",
    pph: "/pajak/bukti-potong",
    rekap: "/pajak/rekap",
  },

  reports: {
    financial: "/laporan/finansial",
    subledgerAging: "/laporan/subledger-aging",
    trade: "/laporan/dagang",
    comparative: "/laporan/komparatif",
    consolidation: "/laporan/konsolidasi",
  },

  automation: {
    recurring: "/otomasi/berulang",
    reminders: "/otomasi/pengingat",
    integration: "/otomasi/integrasi",
  },

  settings: {
    company: "/pengaturan/perusahaan",
    currencies: "/pengaturan/mata-uang",
    numbering: "/pengaturan/penomoran",
    tags: "/pengaturan/tag",
    users: "/pengaturan/pengguna-peran",
    approvals: "/pengaturan/persetujuan",
    lockDate: "/pengaturan/kunci-transaksi",
    auditLog: "/pengaturan/audit-log",
    diagnostics: "/pengaturan/diagnostik",
  },

  help: {
    center: "/bantuan",
    faq: "/bantuan/faq",
  },
} as const;
