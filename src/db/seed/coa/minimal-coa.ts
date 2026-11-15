import type { DefinisiAkunSeed } from "./builder";

/**
 * Template Bagan Akun Minimalis.
 * Hanya menyediakan struktur ringkas beserta 17 Akun Peran Sistem Wajib
 * agar mesin jurnal otomatis ERP dapat bekerja sempurna tanpa akun bawaan yang berlebih.
 */
export const MINIMAL_COA: DefinisiAkunSeed[] = [
  // 1000 - ASET
  { kode: "1000", nama: "ASET", tipe: "ASET", header: true },
  { kode: "1100", nama: "Kas & Bank", tipe: "ASET", induk: "1000", peran: "KAS_BANK" },
  { kode: "1200", nama: "Piutang Usaha", tipe: "ASET", induk: "1000", peran: "PIUTANG_USAHA" },
  { kode: "1300", nama: "Persediaan", tipe: "ASET", induk: "1000", peran: "PERSEDIAAN" },
  { kode: "1400", nama: "PPN Masukan", tipe: "ASET", induk: "1000", peran: "PPN_MASUKAN" },
  { kode: "1500", nama: "Uang Muka Pembelian", tipe: "ASET", induk: "1000", peran: "UANG_MUKA_PEMASOK" },
  { kode: "1600", nama: "Pajak Dibayar Dimuka", tipe: "ASET", induk: "1000", peran: "PAJAK_DIBAYAR_DIMUKA" },

  // 2000 - KEWAJIBAN
  { kode: "2000", nama: "KEWAJIBAN", tipe: "KEWAJIBAN", header: true },
  { kode: "2100", nama: "Hutang Usaha", tipe: "KEWAJIBAN", induk: "2000", peran: "HUTANG_USAHA" },
  { kode: "2200", nama: "PPN Keluaran", tipe: "KEWAJIBAN", induk: "2000", peran: "PPN_KELUARAN" },
  { kode: "2300", nama: "Hutang Pajak", tipe: "KEWAJIBAN", induk: "2000", peran: "HUTANG_PAJAK" },
  { kode: "2400", nama: "Uang Muka Penjualan", tipe: "KEWAJIBAN", induk: "2000", peran: "UANG_MUKA_PELANGGAN" },

  // 3000 - EKUITAS
  { kode: "3000", nama: "EKUITAS", tipe: "EKUITAS", header: true },
  { kode: "3100", nama: "Modal Disetor", tipe: "EKUITAS", induk: "3000", peran: "MODAL_DISETOR", arusKas: "PENDANAAN" },
  { kode: "3200", nama: "Laba Ditahan", tipe: "EKUITAS", induk: "3000", peran: "LABA_DITAHAN" },
  { kode: "3300", nama: "Ekuitas Saldo Awal", tipe: "EKUITAS", induk: "3000", peran: "EKUITAS_SALDO_AWAL" },

  // 4000 - PENDAPATAN
  { kode: "4000", nama: "PENDAPATAN", tipe: "PENDAPATAN", header: true },
  { kode: "4100", nama: "Pendapatan Operasional", tipe: "PENDAPATAN", induk: "4000", peran: "PENDAPATAN_PENJUALAN" },
  { kode: "4900", nama: "Laba Selisih Kurs", tipe: "PENDAPATAN", induk: "4000", peran: "LABA_SELISIH_KURS" },

  // 5000 - BEBAN POKOK & OPERASIONAL
  { kode: "5000", nama: "HARGA POKOK PENJUALAN", tipe: "BEBAN", header: true },
  { kode: "5100", nama: "Harga Pokok Penjualan", tipe: "BEBAN", induk: "5000", peran: "HARGA_POKOK_PENJUALAN" },

  { kode: "6000", nama: "BEBAN OPERASIONAL & LAINNYA", tipe: "BEBAN", header: true },
  { kode: "6100", nama: "Beban Operasional Umum", tipe: "BEBAN", induk: "6000" },
  { kode: "6900", nama: "Rugi Selisih Kurs", tipe: "BEBAN", induk: "6000", peran: "RUGI_SELISIH_KURS" },
];
