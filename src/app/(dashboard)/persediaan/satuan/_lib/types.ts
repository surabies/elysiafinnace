export interface SatuanItem {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
  createdAt: string;
}

export interface SatuanStats {
  totalSatuan: number;
  satuanAktif: number;
}
