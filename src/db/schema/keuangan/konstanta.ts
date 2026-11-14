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
  PAJAK_DIBAYAR_DIMUKA: "ASET",
  UANG_MUKA_PEMASOK: "ASET",
  HUTANG_USAHA: "KEWAJIBAN",
  PPN_KELUARAN: "KEWAJIBAN",
  HUTANG_PAJAK: "KEWAJIBAN",
  UANG_MUKA_PELANGGAN: "KEWAJIBAN",
  MODAL_DISETOR: "EKUITAS",
  LABA_DITAHAN: "EKUITAS",
  EKUITAS_SALDO_AWAL: "EKUITAS",
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

export const TIPE_BARANG = ["BARANG_PERSEDIAAN", "BARANG_NON_PERSEDIAAN", "JASA", "BUNDEL"] as const;
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
  "REVALUASI_KURS",
  "SALDO_AWAL",
  "RETUR_PEMBELIAN",
  "RETUR_PENJUALAN",
  "TRANSFER_GUDANG",
  "PENYUSUTAN_ASET",
  "PELEPASAN_ASET",
] as const;
export type SumberJurnal = (typeof SUMBER_JURNAL)[number];

export const STATUS_TRANSFER_GUDANG = ["DRAFT", "POSTED", "DIBATALKAN"] as const;
export type StatusTransferGudang = (typeof STATUS_TRANSFER_GUDANG)[number];

export const METODE_PENILAIAN_STOK = ["RATA_RATA", "FIFO"] as const;
export type MetodePenilaianStok = (typeof METODE_PENILAIAN_STOK)[number];

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
/* Phase 4: Pajak Indonesia (PPN, PPh, e-Faktur, e-Bupot)             */
/* ------------------------------------------------------------------ */

export const TIPE_PAJAK = [
  "PPN",
  "PPH_21",
  "PPH_22",
  "PPH_23",
  "PPH_4_AYAT_2",
  "PPH_15",
  "PPH_25",
  "PPH_26",
  "LAINNYA",
] as const;
export type TipePajak = (typeof TIPE_PAJAK)[number];

export const KATEGORI_PAJAK = ["PAJAK_KELUARAN", "PAJAK_MASUKAN", "PEMOTONGAN_PEMUNGUTAN"] as const;
export type KategoriPajak = (typeof KATEGORI_PAJAK)[number];

export const JENIS_FAKTUR_PAJAK = ["KELUARAN", "MASUKAN", "DIBATALKAN", "DIGANTI"] as const;
export type JenisFakturPajak = (typeof JENIS_FAKTUR_PAJAK)[number];

export const STATUS_FAKTUR_PAJAK = ["DRAFT", "SIAP_UPLOAD", "DISETUJUI_DJP", "DITOLAK_DJP", "BATAL"] as const;
export type StatusFakturPajak = (typeof STATUS_FAKTUR_PAJAK)[number];

export const JENIS_BUPOT = [
  "BP_PASAL_21",
  "BP_PASAL_22",
  "BP_PASAL_23",
  "BP_PASAL_4_2",
  "BP_PASAL_15",
  "BP_UNIFIKASI",
] as const;
export type JenisBupot = (typeof JENIS_BUPOT)[number];

export const STATUS_BUPOT = ["DRAFT", "TERBIT", "DIBATALKAN"] as const;
export type StatusBupot = (typeof STATUS_BUPOT)[number];

/* ------------------------------------------------------------------ */
/* Phase 4: Periode akuntansi                                           */
/* ------------------------------------------------------------------ */

export const STATUS_PERIODE = ["TERBUKA", "DITUTUP"] as const;
export type StatusPeriode = (typeof STATUS_PERIODE)[number];

/* ------------------------------------------------------------------ */
/* Phase 4: Aset Tetap & Penyusutan                                     */
/* ------------------------------------------------------------------ */

export const METODE_PENYUSUTAN = ["GARIS_LURUS", "SALDO_MENURUN", "TIDAK_DISUSUTKAN"] as const;
export type MetodePenyusutan = (typeof METODE_PENYUSUTAN)[number];

export const GOLONGAN_FISKAL_ASET = [
  "NON_FISKAL",
  "GOLONGAN_1",
  "GOLONGAN_2",
  "GOLONGAN_3",
  "GOLONGAN_4",
  "BANGUNAN_PERMANEN",
  "BANGUNAN_SEMI_PERMANEN",
] as const;
export type GolonganFiskalAset = (typeof GOLONGAN_FISKAL_ASET)[number];

export const STATUS_ASET = ["DRAFT", "AKTIF", "DISUSUTKAN_PENUH", "DILEPAS"] as const;
export type StatusAset = (typeof STATUS_ASET)[number];

export const STATUS_PENYUSUTAN_ASET = ["DRAFT", "POSTED", "DIBATALKAN"] as const;
export type StatusPenyusutanAset = (typeof STATUS_PENYUSUTAN_ASET)[number];

/* ------------------------------------------------------------------ */
/* Phase 4: Dimensi Bisnis & Anggaran (M10)                          */
/* ------------------------------------------------------------------ */

export const STATUS_PROYEK = ["PERENCANAAN", "BERJALAN", "SELESAI", "DIBATALKAN"] as const;
export type StatusProyek = (typeof STATUS_PROYEK)[number];

export const STATUS_ANGGARAN = ["DRAFT", "DISETUJUI", "DITUTUP"] as const;
export type StatusAnggaran = (typeof STATUS_ANGGARAN)[number];

/* ------------------------------------------------------------------ */
/* Phase 5: RBAC Penuh, Multi-Perusahaan & Kontrol (M11)              */
/* ------------------------------------------------------------------ */

export const STATUS_UNDANGAN = ["MENUNGGU", "DITERIMA", "KADALUARSA", "DIBATALKAN"] as const;
export type StatusUndangan = (typeof STATUS_UNDANGAN)[number];

export const JENIS_DOKUMEN_PERSETUJUAN = [
  "PESANAN_PEMBELIAN",
  "FAKTUR_PEMBELIAN",
  "FAKTUR_PENJUALAN",
  "PEMBAYARAN",
  "BIAYA",
  "JURNAL_UMUM",
  "ANGGARAN",
] as const;
export type JenisDokumenPersetujuan = (typeof JENIS_DOKUMEN_PERSETUJUAN)[number];

export const STATUS_PERSETUJUAN = ["MENUNGGU", "DISETUJUI", "DITOLAK", "DIBATALKAN"] as const;
export type StatusPersetujuan = (typeof STATUS_PERSETUJUAN)[number];

export const AKSI_PERSETUJUAN = ["DISETUJUI", "DITOLAK"] as const;
export type AksiPersetujuan = (typeof AKSI_PERSETUJUAN)[number];

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
  "pajak.baca": "Melihat data pajak, faktur pajak, dan bukti potong",
  "pajak.kelola": "Mengelola master pajak, nomor seri faktur pajak, dan bukti potong",
  "pajak.ekspor": "Mengekspor e-Faktur dan data Coretax DJP",
  "aset_tetap.baca": "Melihat daftar aset tetap dan penyusutan",
  "aset_tetap.kelola": "Mendaftarkan dan mengubah data aset tetap",
  "aset_tetap.penyusutan": "Menjalankan & membatalkan posting penyusutan aset",
  "aset_tetap.pelepasan": "Melakukan pelepasan atau penjualan aset tetap",
  "dimensi.baca": "Melihat cabang, departemen, proyek, dan tag",
  "dimensi.kelola": "Mengelola cabang, departemen, proyek, dan tag",
  "anggaran.baca": "Melihat anggaran dan laporan realisasi",
  "anggaran.kelola": "Mengelola dan menyetujui anggaran",
  "laporan.baca": "Melihat laporan keuangan",
  "rbac.baca": "Melihat peran, izin, dan penugasan pengguna",
  "rbac.kelola": "Mengelola peran & hak akses pengguna",
  "perusahaan.baca": "Melihat data perusahaan, profil, dan akses pengguna",
  "perusahaan.kelola": "Mengelola data perusahaan, undangan, dan pembatasan cabang/gudang",
  "audit.baca": "Melihat riwayat audit log aktivitas sistem",
  "persetujuan.kelola": "Mengelola konfigurasi aturan alur persetujuan",
  "persetujuan.eksekusi": "Menyetujui atau menolak dokumen pengajuan persetujuan",
  "kunci_transaksi.kelola": "Mengatur tanggal penguncian transaksi (lock date)",
  "otomasi.baca": "Melihat jadwal transaksi berulang dan log pengingat",
  "otomasi.kelola": "Mengelola dan mengeksekusi transaksi berulang serta pengingat jatuh tempo",
  "integrasi.kelola": "Mengelola API key dan webhook pihak ketiga",
} as const;

export type Izin = keyof typeof KATALOG_IZIN;
export const DAFTAR_IZIN = Object.keys(KATALOG_IZIN) as [Izin, ...Izin[]];
