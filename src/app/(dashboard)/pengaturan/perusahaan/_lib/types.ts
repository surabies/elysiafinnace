export interface ItemPerusahaan {
  id: string;
  kode: string;
  nama: string;
  npwp: string | null;
  alamat: string | null;
  telepon: string | null;
  email: string | null;
  mataUangDasarId: string | null;
  mataUangKode?: string | null;
  mataUangNama?: string | null;
  mataUangSimbol?: string | null;
  adalahHolding: boolean;
  indukId: string | null;
  logo: string | null;
  aktif: boolean;
  dibuatPada: string;
  jumlahPengguna?: number;
}

export interface MataUangOption {
  id: string;
  kode: string;
  nama: string;
  simbol: string;
}

export interface PerusahaanStats {
  totalEntitas: number;
  entitasHolding: number;
  entitasAktif: number;
  mataUangUtama: string;
}
