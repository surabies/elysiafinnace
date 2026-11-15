import type { DefinisiAkunSeed } from "./builder";

/**
 * Template Bagan Akun Standar Industri Perusahaan Dagang, Ritel, & Distribusi Indonesia.
 * Lengkap dengan Persediaan Barang Dagang, HPP, Retur, Diskon Penjualan, PPN, dan Beban Operasional.
 */
export const TRADING_COA: DefinisiAkunSeed[] = [
  // ==========================================
  // 1000 - ASET
  // ==========================================
  { kode: "1000", nama: "ASET", tipe: "ASET", header: true },

  // 1100 - Aset Lancar
  { kode: "1100", nama: "Aset Lancar", tipe: "ASET", induk: "1000", header: true },
  { kode: "1110", nama: "Kas dan Setara Kas", tipe: "ASET", induk: "1100", header: true },
  { kode: "1111", nama: "Kas Kecil (Petty Cash)", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1112", nama: "Bank Operasional Utama", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1113", nama: "Bank Penerimaan Giro", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },

  { kode: "1120", nama: "Piutang Usaha (Accounts Receivable)", tipe: "ASET", induk: "1100", peran: "PIUTANG_USAHA" },
  { kode: "1121", nama: "Cadangan Kerugian Piutang", tipe: "ASET", induk: "1100", kontra: true },
  { kode: "1125", nama: "Piutang Karyawan & Lain-lain", tipe: "ASET", induk: "1100" },

  { kode: "1130", nama: "Persediaan Barang Dagang (Merchandise Inventory)", tipe: "ASET", induk: "1100", peran: "PERSEDIAAN" },
  { kode: "1135", nama: "Persediaan Barang Dalam Perjalanan (In-Transit)", tipe: "ASET", induk: "1100" },

  { kode: "1140", nama: "PPN Masukan (VAT In)", tipe: "ASET", induk: "1100", peran: "PPN_MASUKAN" },
  { kode: "1150", nama: "Uang Muka Pembelian (Down Payment to Vendor)", tipe: "ASET", induk: "1100", peran: "UANG_MUKA_PEMASOK" },
  { kode: "1160", nama: "Pajak Dibayar Dimuka (PPh 22 / 23 / 25)", tipe: "ASET", induk: "1100", peran: "PAJAK_DIBAYAR_DIMUKA" },
  { kode: "1170", nama: "Biaya Dibayar Dimuka (Sewa & Asuransi)", tipe: "ASET", induk: "1100" },

  // 1200 - Aset Tetap
  { kode: "1200", nama: "Aset Tetap (Fixed Assets)", tipe: "ASET", induk: "1000", header: true },
  { kode: "1210", nama: "Peralatan & Perlengkapan Kantor", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1219", nama: "Akumulasi Penyusutan Peralatan", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1220", nama: "Kendaraan Operasional & Armada", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1229", nama: "Akumulasi Penyusutan Kendaraan", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1230", nama: "Bangunan & Ruko", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1239", nama: "Akumulasi Penyusutan Bangunan", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1240", nama: "Tanah (Land)", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },

  // ==========================================
  // 2000 - KEWAJIBAN
  // ==========================================
  { kode: "2000", nama: "KEWAJIBAN", tipe: "KEWAJIBAN", header: true },

  // 2100 - Kewajiban Jangka Pendek
  { kode: "2100", nama: "Kewajiban Jangka Pendek (Current Liabilities)", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2110", nama: "Hutang Usaha (Accounts Payable)", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_USAHA" },
  { kode: "2120", nama: "PPN Keluaran (VAT Out)", tipe: "KEWAJIBAN", induk: "2100", peran: "PPN_KELUARAN" },
  { kode: "2130", nama: "Hutang Gaji & Upah Karyawan", tipe: "KEWAJIBAN", induk: "2100" },
  { kode: "2140", nama: "Uang Muka Penjualan (Customer Deposit)", tipe: "KEWAJIBAN", induk: "2100", peran: "UANG_MUKA_PELANGGAN" },
  { kode: "2150", nama: "Hutang Pajak (PPh 21 / 23 / 4(2))", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_PAJAK" },
  { kode: "2160", nama: "Beban Yang Masih Harus Dibayar (Accrued Expense)", tipe: "KEWAJIBAN", induk: "2100" },

  // 2200 - Kewajiban Jangka Panjang
  { kode: "2200", nama: "Kewajiban Jangka Panjang", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2210", nama: "Hutang Bank & Pembiayaan Modal Kerja", tipe: "KEWAJIBAN", induk: "2200", arusKas: "PENDANAAN" },

  // ==========================================
  // 3000 - EKUITAS
  // ==========================================
  { kode: "3000", nama: "EKUITAS", tipe: "EKUITAS", header: true },
  { kode: "3100", nama: "Modal Saham Disetor", tipe: "EKUITAS", induk: "3000", peran: "MODAL_DISETOR", arusKas: "PENDANAAN" },
  { kode: "3200", nama: "Laba Ditahan (Retained Earnings)", tipe: "EKUITAS", induk: "3000", peran: "LABA_DITAHAN" },
  { kode: "3300", nama: "Laba / (Rugi) Periode Berjalan", tipe: "EKUITAS", induk: "3000" },
  { kode: "3400", nama: "Ekuitas Saldo Awal (Opening Balance Equity)", tipe: "EKUITAS", induk: "3000", peran: "EKUITAS_SALDO_AWAL" },
  { kode: "3900", nama: "Prive / Dividen Pemegang Saham", tipe: "EKUITAS", induk: "3000", kontra: true, arusKas: "PENDANAAN" },

  // ==========================================
  // 4000 - PENDAPATAN
  // ==========================================
  { kode: "4000", nama: "PENDAPATAN", tipe: "PENDAPATAN", header: true },
  { kode: "4100", nama: "Pendapatan Penjualan Barang Dagang", tipe: "PENDAPATAN", induk: "4000", peran: "PENDAPATAN_PENJUALAN" },
  { kode: "4110", nama: "Retur Penjualan (Sales Return)", tipe: "PENDAPATAN", induk: "4000", kontra: true },
  { kode: "4120", nama: "Diskon & Potongan Penjualan", tipe: "PENDAPATAN", induk: "4000", kontra: true },
  { kode: "4200", nama: "Pendapatan Ongkos Kirim / Pengiriman", tipe: "PENDAPATAN", induk: "4000" },
  { kode: "4900", nama: "Laba Selisih Kurs Terealisasi", tipe: "PENDAPATAN", induk: "4000", peran: "LABA_SELISIH_KURS" },

  // ==========================================
  // 5000 - HARGA POKOK PENJUALAN (HPP)
  // ==========================================
  { kode: "5000", nama: "HARGA POKOK PENJUALAN", tipe: "BEBAN", header: true },
  { kode: "5100", nama: "Harga Pokok Penjualan (COGS)", tipe: "BEBAN", induk: "5000", peran: "HARGA_POKOK_PENJUALAN" },
  { kode: "5200", nama: "Beban Angkut Pembelian (Freight In)", tipe: "BEBAN", induk: "5000" },
  { kode: "5300", nama: "Potongan Pembelian (Purchase Discount)", tipe: "BEBAN", induk: "5000", kontra: true },
  { kode: "5400", nama: "Selisih Stok Opname / Kerusakan Barang", tipe: "BEBAN", induk: "5000" },

  // ==========================================
  // 6000 - BEBAN OPERASIONAL
  // ==========================================
  { kode: "6000", nama: "BEBAN OPERASIONAL", tipe: "BEBAN", header: true },
  { kode: "6100", nama: "Gaji, Upah, & Tunjangan Karyawan", tipe: "BEBAN", induk: "6000" },
  { kode: "6200", nama: "Beban Sewa Kantor & Gudang", tipe: "BEBAN", induk: "6000" },
  { kode: "6300", nama: "Beban Listrik, Air, & Internet (Utilitas)", tipe: "BEBAN", induk: "6000" },
  { kode: "6400", nama: "Beban Pemasaran, Iklan, & Promosi", tipe: "BEBAN", induk: "6000" },
  { kode: "6500", nama: "Beban Pengiriman & Logistik Penjualan", tipe: "BEBAN", induk: "6000" },
  { kode: "6600", nama: "Beban Penyusutan Aset Tetap", tipe: "BEBAN", induk: "6000" },
  { kode: "6700", nama: "Beban Pemeliharaan & Perbaikan", tipe: "BEBAN", induk: "6000" },
  { kode: "6800", nama: "Beban Alat Tulis Kantor & Konsumabel", tipe: "BEBAN", induk: "6000" },
  { kode: "6900", nama: "Beban Operasional Lainnya", tipe: "BEBAN", induk: "6000" },

  // ==========================================
  // 7000 - BEBAN / PENDAPATAN NON-OPERASIONAL
  // ==========================================
  { kode: "7000", nama: "BEBAN NON-OPERASIONAL", tipe: "BEBAN", header: true },
  { kode: "7100", nama: "Rugi Selisih Kurs Terealisasi", tipe: "BEBAN", induk: "7000", peran: "RUGI_SELISIH_KURS" },
  { kode: "7200", nama: "Beban Bunga & Administrasi Bank", tipe: "BEBAN", induk: "7000" },
  { kode: "7300", nama: "Rugi Pelepasan Aset Tetap", tipe: "BEBAN", induk: "7000" },
];
