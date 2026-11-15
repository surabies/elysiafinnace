import type { DefinisiAkunSeed } from "./builder";

/**
 * Template Bagan Akun Standar Perusahaan Manufaktur, Fabrikasi, & F&B Produksi Indonesia.
 * Meliputi Persediaan Bahan Baku, Barang Dalam Proses (WIP), Barang Jadi,
 * Biaya Tenaga Kerja Langsung (BTKL), Biaya Overhead Pabrik (BOP), dan HPP Manufaktur.
 */
export const MANUFACTURING_COA: DefinisiAkunSeed[] = [
  // ==========================================
  // 1000 - ASET
  // ==========================================
  { kode: "1000", nama: "ASET", tipe: "ASET", header: true },

  // 1100 - Aset Lancar
  { kode: "1100", nama: "Aset Lancar", tipe: "ASET", induk: "1000", header: true },
  { kode: "1110", nama: "Kas dan Setara Kas", tipe: "ASET", induk: "1100", header: true },
  { kode: "1111", nama: "Kas Kecil Operasional", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1112", nama: "Bank Operasional Utama", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1113", nama: "Bank Payroll & Produksi", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },

  { kode: "1120", nama: "Piutang Usaha (Accounts Receivable)", tipe: "ASET", induk: "1100", peran: "PIUTANG_USAHA" },
  { kode: "1121", nama: "Cadangan Kerugian Piutang", tipe: "ASET", induk: "1100", kontra: true },
  { kode: "1125", nama: "Piutang Lain-lain", tipe: "ASET", induk: "1100" },

  // Persediaan Manufaktur (3 Pilar Persediaan)
  { kode: "1130", nama: "Persediaan (Inventories)", tipe: "ASET", induk: "1100", header: true },
  { kode: "1131", nama: "Persediaan Bahan Baku (Raw Materials)", tipe: "ASET", induk: "1130", peran: "PERSEDIAAN" },
  { kode: "1132", nama: "Persediaan Bahan Penolong / Kemasan", tipe: "ASET", induk: "1130" },
  { kode: "1133", nama: "Persediaan Barang Dalam Proses (WIP)", tipe: "ASET", induk: "1130" },
  { kode: "1134", nama: "Persediaan Barang Jadi (Finished Goods)", tipe: "ASET", induk: "1130" },
  { kode: "1135", nama: "Barang Dalam Perjalanan (In-Transit)", tipe: "ASET", induk: "1130" },

  { kode: "1140", nama: "PPN Masukan (VAT In)", tipe: "ASET", induk: "1100", peran: "PPN_MASUKAN" },
  { kode: "1150", nama: "Uang Muka Pembelian Vendor Bahan Baku", tipe: "ASET", induk: "1100", peran: "UANG_MUKA_PEMASOK" },
  { kode: "1160", nama: "Pajak Dibayar Dimuka (PPh 22 / 23 / 25)", tipe: "ASET", induk: "1100", peran: "PAJAK_DIBAYAR_DIMUKA" },
  { kode: "1170", nama: "Biaya Dibayar Dimuka (Sewa & Asuransi Pabrik)", tipe: "ASET", induk: "1100" },

  // 1200 - Aset Tetap
  { kode: "1200", nama: "Aset Tetap (Fixed Assets)", tipe: "ASET", induk: "1000", header: true },
  { kode: "1210", nama: "Mesin & Peralatan Pabrik", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1219", nama: "Akumulasi Penyusutan Mesin & Pabrik", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1220", nama: "Peralatan & Inventaris Kantor", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1229", nama: "Akumulasi Penyusutan Peralatan Kantor", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1230", nama: "Kendaraan Distribusi & Armada Logistik", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1239", nama: "Akumulasi Penyusutan Kendaraan", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1240", nama: "Gedung Pabrik & Gudang", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1249", nama: "Akumulasi Penyusutan Gedung Pabrik", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1250", nama: "Tanah (Land)", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },

  // ==========================================
  // 2000 - KEWAJIBAN
  // ==========================================
  { kode: "2000", nama: "KEWAJIBAN", tipe: "KEWAJIBAN", header: true },

  // 2100 - Kewajiban Jangka Pendek
  { kode: "2100", nama: "Kewajiban Jangka Pendek (Current Liabilities)", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2110", nama: "Hutang Usaha / Vendor Bahan Baku", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_USAHA" },
  { kode: "2120", nama: "PPN Keluaran (VAT Out)", tipe: "KEWAJIBAN", induk: "2100", peran: "PPN_KELUARAN" },
  { kode: "2130", nama: "Hutang Gaji & Upah Tenaga Kerja Langsung", tipe: "KEWAJIBAN", induk: "2100" },
  { kode: "2140", nama: "Uang Muka Penjualan / Pesanan Klien", tipe: "KEWAJIBAN", induk: "2100", peran: "UANG_MUKA_PELANGGAN" },
  { kode: "2150", nama: "Hutang Pajak (PPh 21 / 23 / 25 / 29)", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_PAJAK" },
  { kode: "2160", nama: "Biaya yang Masih Harus Dibayar (Accrued Expenses)", tipe: "KEWAJIBAN", induk: "2100" },

  // 2200 - Kewajiban Jangka Panjang
  { kode: "2200", nama: "Kewajiban Jangka Panjang", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2210", nama: "Hutang Bank / Kredit Investasi Mesin", tipe: "KEWAJIBAN", induk: "2200", arusKas: "PENDANAAN" },

  // ==========================================
  // 3000 - EKUITAS
  // ==========================================
  { kode: "3000", nama: "EKUITAS", tipe: "EKUITAS", header: true },
  { kode: "3100", nama: "Modal Disetor", tipe: "EKUITAS", induk: "3000", peran: "MODAL_DISETOR", arusKas: "PENDANAAN" },
  { kode: "3200", nama: "Laba Ditahan (Retained Earnings)", tipe: "EKUITAS", induk: "3000", peran: "LABA_DITAHAN" },
  { kode: "3400", nama: "Ekuitas Saldo Awal", tipe: "EKUITAS", induk: "3000", peran: "EKUITAS_SALDO_AWAL" },
  { kode: "3900", nama: "Prive / Dividen", tipe: "EKUITAS", induk: "3000", kontra: true, arusKas: "PENDANAAN" },

  // ==========================================
  // 4000 - PENDAPATAN
  // ==========================================
  { kode: "4000", nama: "PENDAPATAN", tipe: "PENDAPATAN", header: true },
  { kode: "4100", nama: "Pendapatan Penjualan Barang Jadi", tipe: "PENDAPATAN", induk: "4000", peran: "PENDAPATAN_PENJUALAN" },
  { kode: "4110", nama: "Retur Penjualan", tipe: "PENDAPATAN", induk: "4000", kontra: true },
  { kode: "4120", nama: "Potongan / Diskon Penjualan", tipe: "PENDAPATAN", induk: "4000", kontra: true },
  { kode: "4200", nama: "Pendapatan Jasa Maklon / Produksi", tipe: "PENDAPATAN", induk: "4000" },
  { kode: "4900", nama: "Laba Selisih Kurs", tipe: "PENDAPATAN", induk: "4000", peran: "LABA_SELISIH_KURS" },

  // ==========================================
  // 5000 - HARGA POKOK PRODUKSI & PENJUALAN (HPP)
  // ==========================================
  { kode: "5000", nama: "HARGA POKOK PENJUALAN", tipe: "BEBAN", header: true },
  { kode: "5100", nama: "Harga Pokok Penjualan (HPP) Barang Jadi", tipe: "BEBAN", induk: "5000", peran: "HARGA_POKOK_PENJUALAN" },
  { kode: "5200", nama: "Biaya Bahan Baku Langsung (BBL)", tipe: "BEBAN", induk: "5000" },
  { kode: "5300", nama: "Biaya Tenaga Kerja Langsung (BTKL)", tipe: "BEBAN", induk: "5000" },
  { kode: "5400", nama: "Biaya Overhead Pabrik (BOP)", tipe: "BEBAN", induk: "5000", header: true },
  { kode: "5410", nama: "BOP - Bahan Penolong", tipe: "BEBAN", induk: "5400" },
  { kode: "5420", nama: "BOP - Gaji Pengawas Pabrik", tipe: "BEBAN", induk: "5400" },
  { kode: "5430", nama: "BOP - Listrik & Air Pabrik", tipe: "BEBAN", induk: "5400" },
  { kode: "5440", nama: "BOP - Pemeliharaan & Perbaikan Mesin", tipe: "BEBAN", induk: "5400" },
  { kode: "5450", nama: "BOP - Penyusutan Mesin & Gedung Pabrik", tipe: "BEBAN", induk: "5400" },

  // ==========================================
  // 6000 - BEBAN OPERASIONAL (ADMIN & PENJUALAN)
  // ==========================================
  { kode: "6000", nama: "BEBAN OPERASIONAL", tipe: "BEBAN", header: true },
  { kode: "6100", nama: "Gaji & Tunjangan Manajemen & Admin", tipe: "BEBAN", induk: "6000" },
  { kode: "6200", nama: "Beban Pemasaran & Promosi", tipe: "BEBAN", induk: "6000" },
  { kode: "6300", nama: "Beban Pengiriman & Logistik Distribusi", tipe: "BEBAN", induk: "6000" },
  { kode: "6400", nama: "Beban Sewa & Kantor", tipe: "BEBAN", induk: "6000" },
  { kode: "6500", nama: "Beban Utilitas Kantor (Listrik & Internet)", tipe: "BEBAN", induk: "6000" },
  { kode: "6600", nama: "Beban Penyusutan Aset Tetap Kantor", tipe: "BEBAN", induk: "6000" },
  { kode: "6900", nama: "Beban Umum & Operasional Lainnya", tipe: "BEBAN", induk: "6000" },

  // ==========================================
  // 7000 - PENDAPATAN & BEBAN NON-OPERASIONAL
  // ==========================================
  { kode: "7000", nama: "PENDAPATAN & BEBAN LAINNYA", tipe: "BEBAN", header: true },
  { kode: "7100", nama: "Beban Bunga Pinjaman Bank", tipe: "BEBAN", induk: "7000" },
  { kode: "7200", nama: "Rugi Selisih Kurs", tipe: "BEBAN", induk: "7000", peran: "RUGI_SELISIH_KURS" },
  { kode: "7300", nama: "Beban Administrasi Bank", tipe: "BEBAN", induk: "7000" },
];
