import type { DefinisiAkunSeed } from "./builder";

/**
 * Template Bagan Akun Standar Perusahaan Jasa, Agensi, IT, & Konsultan Indonesia.
 * Fokus pada Pendapatan Jasa, Beban Subkontraktor, Biaya Proyek, dan Profesional.
 */
export const SERVICE_COA: DefinisiAkunSeed[] = [
  // 1000 - ASET
  { kode: "1000", nama: "ASET", tipe: "ASET", header: true },
  { kode: "1100", nama: "Aset Lancar", tipe: "ASET", induk: "1000", header: true },
  { kode: "1110", nama: "Kas dan Setara Kas", tipe: "ASET", induk: "1100", header: true },
  { kode: "1111", nama: "Kas Kecil", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1112", nama: "Bank Operasional Utama", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1120", nama: "Piutang Usaha / Klien", tipe: "ASET", induk: "1100", peran: "PIUTANG_USAHA" },
  { kode: "1130", nama: "Perlengkapan & Bahan Habis Pakai", tipe: "ASET", induk: "1100", peran: "PERSEDIAAN" },
  { kode: "1140", nama: "PPN Masukan", tipe: "ASET", induk: "1100", peran: "PPN_MASUKAN" },
  { kode: "1150", nama: "Uang Muka Vendor / Subkontraktor", tipe: "ASET", induk: "1100", peran: "UANG_MUKA_PEMASOK" },
  { kode: "1160", nama: "Pajak Dibayar Dimuka (PPh 23)", tipe: "ASET", induk: "1100", peran: "PAJAK_DIBAYAR_DIMUKA" },
  { kode: "1170", nama: "Beban Sewa & Software Dibayar Dimuka", tipe: "ASET", induk: "1100" },

  // Aset Tetap
  { kode: "1200", nama: "Aset Tetap", tipe: "ASET", induk: "1000", header: true },
  { kode: "1210", nama: "Komputer, Server, & Peralatan IT", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1219", nama: "Akumulasi Penyusutan Peralatan IT", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  { kode: "1220", nama: "Kendaraan Operasional", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1229", nama: "Akumulasi Penyusutan Kendaraan", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },

  // 2000 - KEWAJIBAN
  { kode: "2000", nama: "KEWAJIBAN", tipe: "KEWAJIBAN", header: true },
  { kode: "2100", nama: "Kewajiban Jangka Pendek", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2110", nama: "Hutang Usaha / Vendor", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_USAHA" },
  { kode: "2120", nama: "PPN Keluaran", tipe: "KEWAJIBAN", induk: "2100", peran: "PPN_KELUARAN" },
  { kode: "2130", nama: "Hutang Gaji & Honor Tim", tipe: "KEWAJIBAN", induk: "2100" },
  { kode: "2140", nama: "Uang Muka Klien / Retainer Jasa", tipe: "KEWAJIBAN", induk: "2100", peran: "UANG_MUKA_PELANGGAN" },
  { kode: "2150", nama: "Hutang Pajak (PPh 21 / 23)", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_PAJAK" },

  // 3000 - EKUITAS
  { kode: "3000", nama: "EKUITAS", tipe: "EKUITAS", header: true },
  { kode: "3100", nama: "Modal Disetor", tipe: "EKUITAS", induk: "3000", peran: "MODAL_DISETOR", arusKas: "PENDANAAN" },
  { kode: "3200", nama: "Laba Ditahan", tipe: "EKUITAS", induk: "3000", peran: "LABA_DITAHAN" },
  { kode: "3400", nama: "Ekuitas Saldo Awal", tipe: "EKUITAS", induk: "3000", peran: "EKUITAS_SALDO_AWAL" },
  { kode: "3900", nama: "Prive / Dividen", tipe: "EKUITAS", induk: "3000", kontra: true, arusKas: "PENDANAAN" },

  // 4000 - PENDAPATAN
  { kode: "4000", nama: "PENDAPATAN", tipe: "PENDAPATAN", header: true },
  { kode: "4100", nama: "Pendapatan Jasa & Konsultasi", tipe: "PENDAPATAN", induk: "4000", peran: "PENDAPATAN_PENJUALAN" },
  { kode: "4120", nama: "Diskon / Potongan Fee Jasa", tipe: "PENDAPATAN", induk: "4000", kontra: true },
  { kode: "4900", nama: "Laba Selisih Kurs", tipe: "PENDAPATAN", induk: "4000", peran: "LABA_SELISIH_KURS" },

  // 5000 - BIAYA LANGSUNG PROYEK / HPP JASA
  { kode: "5000", nama: "BIAYA LANGSUNG JASA (HPP)", tipe: "BEBAN", header: true },
  { kode: "5100", nama: "Biaya Subkontraktor & Tenaga Ahli Luar", tipe: "BEBAN", induk: "5000", peran: "HARGA_POKOK_PENJUALAN" },
  { kode: "5200", nama: "Beban Server, Cloud, & Lisensi Proyek", tipe: "BEBAN", induk: "5000" },
  { kode: "5300", nama: "Beban Operasional Lapangan Proyek", tipe: "BEBAN", induk: "5000" },

  // 6000 - BEBAN OPERASIONAL
  { kode: "6000", nama: "BEBAN OPERASIONAL", tipe: "BEBAN", header: true },
  { kode: "6100", nama: "Gaji & Tunjangan Karyawan Kantor", tipe: "BEBAN", induk: "6000" },
  { kode: "6200", nama: "Sewa Kantor & Coworking Space", tipe: "BEBAN", induk: "6000" },
  { kode: "6300", nama: "Utilitas (Listrik & Internet Cepat)", tipe: "BEBAN", induk: "6000" },
  { kode: "6400", nama: "Pemasaran & Portofolio", tipe: "BEBAN", induk: "6000" },
  { kode: "6600", nama: "Beban Penyusutan Aset Tetap", tipe: "BEBAN", induk: "6000" },
  { kode: "6900", nama: "Beban Operasional Lainnya", tipe: "BEBAN", induk: "6000" },

  // 7000 - NON OPERASIONAL
  { kode: "7000", nama: "BEBAN NON-OPERASIONAL", tipe: "BEBAN", header: true },
  { kode: "7100", nama: "Rugi Selisih Kurs", tipe: "BEBAN", induk: "7000", peran: "RUGI_SELISIH_KURS" },
  { kode: "7200", nama: "Beban Administrasi Bank", tipe: "BEBAN", induk: "7000" },
];
