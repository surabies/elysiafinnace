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
