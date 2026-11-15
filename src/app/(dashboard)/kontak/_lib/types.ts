export interface KontakItem {
  id: string;
  kode: string;
  nama: string;
  adalahPelanggan: boolean;
  adalahPemasok: boolean;
  npwp: string | null;
  nik: string | null;
  adalahPkp: boolean;
  grup: string | null;
  namaKontak: string | null;
  email: string | null;
  telepon: string | null;
  alamat: string | null;
  kota: string | null;
  provinsi: string | null;
  kodePos: string | null;
  negara: string;
  terminPembayaranId: string | null;
  mataUangId: string | null;
  batasKredit: string;
  catatan: string | null;
  tags?: { id: string; nama: string; warna: string | null }[];
  aktif: boolean;
}

export interface TerminOption {
  id: string;
  kode: string;
  nama: string;
  jumlahHari: number;
}

export interface KontakStats {
  total: number;
  aktif: number;
  nonaktif: number;
  totalBatasKredit: number;
  pkpCount: number;
}
