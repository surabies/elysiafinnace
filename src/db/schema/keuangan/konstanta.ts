/**
 * Konstanta domain keuangan (Phase 1).
 *
 * Dipisah dari definisi tabel agar bisa dipakai bersama oleh skema Drizzle,
 * service, validasi request, dan seed tanpa saling mengimpor tabel.
 */

export const TIPE_AKUN = ["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"] as const;
export type TipeAkun = (typeof TIPE_AKUN)[number];

export const SALDO_NORMAL = ["DEBIT", "KREDIT"] as const;
export type SaldoNormal = (typeof SALDO_NORMAL)[number];

/** Saldo normal bawaan tiap tipe akun (akun kontra boleh kebalikannya). */
export const SALDO_NORMAL_BAWAAN: Record<TipeAkun, SaldoNormal> = {
  ASET: "DEBIT",
  BEBAN: "DEBIT",
  KEWAJIBAN: "KREDIT",
  EKUITAS: "KREDIT",
  PENDAPATAN: "KREDIT",
};

/**
 * Peran sistem sebuah akun. Dipakai modul otomatis (penjualan, pembelian,
 * penutupan buku) untuk menemukan akun yang tepat tanpa menebak berdasarkan nama.
 *
 * Setiap peran hanya boleh dimiliki satu akun, kecuali KAS_BANK dan PERSEDIAAN
 * (bisa banyak akun: beberapa rekening bank, beberapa gudang/kelompok persediaan).
 */
export const PERAN_SISTEM_KE_TIPE = {
  KAS_BANK: "ASET",
  PIUTANG_USAHA: "ASET",
  PERSEDIAAN: "ASET",
  PPN_MASUKAN: "ASET",
  HUTANG_USAHA: "KEWAJIBAN",
  PPN_KELUARAN: "KEWAJIBAN",
  MODAL_DISETOR: "EKUITAS",
  LABA_DITAHAN: "EKUITAS",
  PENDAPATAN_PENJUALAN: "PENDAPATAN",
  LABA_SELISIH_KURS: "PENDAPATAN",
  HARGA_POKOK_PENJUALAN: "BEBAN",
  RUGI_SELISIH_KURS: "BEBAN",
} as const satisfies Record<string, TipeAkun>;

export type PeranSistem = keyof typeof PERAN_SISTEM_KE_TIPE;
export const PERAN_SISTEM = Object.keys(PERAN_SISTEM_KE_TIPE) as [PeranSistem, ...PeranSistem[]];

/** Peran yang boleh dimiliki lebih dari satu akun. */
export const PERAN_SISTEM_BANYAK_AKUN = ["KAS_BANK", "PERSEDIAAN"] as const satisfies readonly PeranSistem[];

/** Peran yang hanya dimiliki satu akun (dapat dicari langsung lewat `akunByPeran`). */
export type PeranTunggal = Exclude<PeranSistem, (typeof PERAN_SISTEM_BANYAK_AKUN)[number]>;

export const TIPE_BARANG = ["BARANG_PERSEDIAAN", "BARANG_NON_PERSEDIAAN", "JASA"] as const;
export type TipeBarang = (typeof TIPE_BARANG)[number];

export const JENIS_REKENING = ["KAS", "BANK"] as const;
export type JenisRekening = (typeof JENIS_REKENING)[number];

/* ------------------------------------------------------------------ */
/* Phase 1 (tambahan): klasifikasi arus kas akun                        */
/* ------------------------------------------------------------------ */

export const KATEGORI_ARUS_KAS = ["OPERASI", "INVESTASI", "PENDANAAN"] as const;
export type KategoriArusKas = (typeof KATEGORI_ARUS_KAS)[number];

/* ------------------------------------------------------------------ */
/* Phase 2: Jurnal, biaya, kas & bank                                   */
/* ------------------------------------------------------------------ */

export const STATUS_JURNAL = ["DRAFT", "POSTED", "DIBATALKAN"] as const;
export type StatusJurnal = (typeof STATUS_JURNAL)[number];

/** Asal pembuatan jurnal (jurnal otomatis menyimpan ID dokumen sumbernya). */
export const SUMBER_JURNAL = [
  "MANUAL",
  "PEMBALIK",
  "BIAYA",
  "MUTASI_BANK",
  "PENYESUAIAN_STOK",
  "FAKTUR_PEMBELIAN",
  "FAKTUR_PENJUALAN",
  "PEMBAYARAN",
  "TUTUP_BUKU",
] as const;
export type SumberJurnal = (typeof SUMBER_JURNAL)[number];

/** Status dokumen transaksi (biaya, faktur, pembayaran, mutasi bank). */
export const STATUS_DOKUMEN = ["DRAFT", "POSTED", "DIBATALKAN"] as const;
export type StatusDokumen = (typeof STATUS_DOKUMEN)[number];

export const METODE_BAYAR_BIAYA = ["TUNAI", "HUTANG"] as const;
export type MetodeBayarBiaya = (typeof METODE_BAYAR_BIAYA)[number];

export const JENIS_MUTASI_BANK = ["MASUK", "KELUAR", "TRANSFER"] as const;
export type JenisMutasiBank = (typeof JENIS_MUTASI_BANK)[number];

export const STATUS_REKONSILIASI = ["DRAFT", "SELESAI"] as const;
export type StatusRekonsiliasi = (typeof STATUS_REKONSILIASI)[number];

/* ------------------------------------------------------------------ */
/* Phase 3: Persediaan & siklus dagang                                  */
/* ------------------------------------------------------------------ */

export const JENIS_MUTASI_STOK = ["MASUK", "KELUAR"] as const;
export type JenisMutasiStok = (typeof JENIS_MUTASI_STOK)[number];

export const STATUS_PESANAN = ["DRAFT", "DISETUJUI", "SEBAGIAN", "SELESAI", "DIBATALKAN"] as const;
export type StatusPesanan = (typeof STATUS_PESANAN)[number];

export const JENIS_PEMBAYARAN = ["PENERIMAAN", "PENGELUARAN"] as const;
export type JenisPembayaran = (typeof JENIS_PEMBAYARAN)[number];

/* ------------------------------------------------------------------ */
/* Phase 4: Periode akuntansi                                           */
/* ------------------------------------------------------------------ */

export const STATUS_PERIODE = ["TERBUKA", "DITUTUP"] as const;
export type StatusPeriode = (typeof STATUS_PERIODE)[number];

/* ------------------------------------------------------------------ */
/* RBAC: katalog izin                                                    */
/* ------------------------------------------------------------------ */

/**
 * Katalog izin (permission) modul keuangan. Peran (role) menyimpan daftar izin;
 * pengguna mendapat gabungan izin dari seluruh perannya. Peran dengan
 * `akses_penuh = true` otomatis memiliki SEMUA izin (termasuk yang ditambahkan nanti).
 */
export const KATALOG_IZIN = {
  "master_data.baca": "Melihat master data (mata uang, kurs, COA, kontak, item, rekening)",
  "master_data.kelola": "Membuat & mengubah master data",
  "jurnal.baca": "Melihat jurnal umum & buku besar",
  "jurnal.kelola": "Membuat, mengubah, dan menghapus draft jurnal manual",
  "jurnal.posting": "Memposting & membalik jurnal",
  "kas_bank.baca": "Melihat mutasi & rekonsiliasi bank",
  "kas_bank.kelola": "Mencatat mutasi kas/bank",
  "kas_bank.rekonsiliasi": "Melakukan rekonsiliasi bank",
  "biaya.baca": "Melihat biaya operasional",
  "biaya.kelola": "Membuat & mengubah draft biaya",
  "biaya.posting": "Memposting & membatalkan biaya",
  "persediaan.baca": "Melihat stok & kartu stok",
  "persediaan.kelola": "Melakukan penyesuaian stok",
  "pembelian.baca": "Melihat pesanan & faktur pembelian",
  "pembelian.kelola": "Membuat & mengubah pesanan/faktur pembelian",
  "pembelian.posting": "Menyetujui PO, memposting & membatalkan faktur pembelian",
  "penjualan.baca": "Melihat pesanan & faktur penjualan",
  "penjualan.kelola": "Membuat & mengubah pesanan/faktur penjualan",
  "penjualan.posting": "Menyetujui SO, memposting & membatalkan faktur penjualan",
  "pembayaran.baca": "Melihat pembayaran hutang/piutang",
  "pembayaran.kelola": "Membuat draft pembayaran",
  "pembayaran.posting": "Memposting & membatalkan pembayaran",
  "periode.baca": "Melihat periode akuntansi",
  "periode.kelola": "Membuka/menutup periode bulanan",
  "tutup_buku.kelola": "Menjalankan & membatalkan tutup buku tahunan",
  "laporan.baca": "Melihat laporan keuangan",
  "rbac.kelola": "Mengelola peran & hak akses pengguna",
} as const;

export type Izin = keyof typeof KATALOG_IZIN;
export const DAFTAR_IZIN = Object.keys(KATALOG_IZIN) as [Izin, ...Izin[]];
