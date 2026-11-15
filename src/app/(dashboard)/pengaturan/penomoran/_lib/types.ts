export interface ItemPenomoran {
  prefiks: string;
  nama: string;
  modul: string;
  deskripsi: string;
  formatPola: string;
  tahun: number;
  nilaiTerakhir: number;
  contohBerikutnya: string;
}

export interface PenomoranStats {
  totalDokumen: number;
  modulList: string[];
}
