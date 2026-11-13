/**
 * Satu-satunya tempat mendefinisikan URL halaman.
 * Sidebar, mega menu, header, dan pencarian membaca dari sini,
 * jadi mengganti URL cukup di satu tempat.
 */
export const ROUTES = {
  dashboard: "/",
  analytics: "/analytics",
  calendar: "/kalender",

  sales: {
    quotes: "/penjualan/penawaran",
    orders: "/penjualan/pesanan",
    invoices: "/penjualan/faktur",
    newInvoice: "/penjualan/faktur/baru",
    payments: "/penjualan/penerimaan",
    returns: "/penjualan/retur",
  },

  purchases: {
    orders: "/pembelian/pesanan",
    invoices: "/pembelian/faktur",
    payments: "/pembelian/pembayaran",
    returns: "/pembelian/retur",
  },

  expenses: {
    list: "/biaya",
    newExpense: "/biaya/baru",
  },

  cashBank: {
    accounts: "/kas-bank/akun",
    receive: "/kas-bank/terima-uang",
    send: "/kas-bank/kirim-uang",
    transfer: "/kas-bank/transfer",
    reconcile: "/kas-bank/rekonsiliasi",
  },

  contacts: {
    customers: "/kontak/pelanggan",
    suppliers: "/kontak/pemasok",
    employees: "/kontak/karyawan",
  },

  products: "/produk",

  inventory: {
    warehouses: "/persediaan/gudang",
    adjustments: "/persediaan/penyesuaian",
    transfers: "/persediaan/transfer",
    opname: "/persediaan/stok-opname",
  },

  fixedAssets: "/aset-tetap",

  accounting: {
    chartOfAccounts: "/akuntansi/bagan-akun",
    journals: "/akuntansi/jurnal-umum",
    budgets: "/akuntansi/anggaran",
    closing: "/akuntansi/tutup-buku",
  },

  reports: {
    prefix: "/laporan",
    balanceSheet: "/laporan/neraca",
    incomeStatement: "/laporan/laba-rugi",
    cashFlow: "/laporan/arus-kas",
    equity: "/laporan/perubahan-ekuitas",
    generalLedger: "/laporan/buku-besar",
    trialBalance: "/laporan/neraca-saldo",
    receivableAging: "/laporan/umur-piutang",
    payableAging: "/laporan/umur-utang",
  },

  settings: {
    company: "/pengaturan/perusahaan",
    users: "/pengaturan/pengguna",
    taxes: "/pengaturan/pajak",
    currencies: "/pengaturan/mata-uang",
    numbering: "/pengaturan/penomoran",
  },

  help: {
    center: "/bantuan",
    faq: "/bantuan/faq",
  },
} as const;
