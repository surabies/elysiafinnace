export interface ItemMataUang {
  id: string;
  kode: string;
  nama: string;
  simbol: string;
  jumlahDesimal: number;
  adalahMataUangDasar: boolean;
  aktif: boolean;
  dibuatPada?: string;
  diubahPada?: string;
}

export interface ItemKurs {
  id: string;
  mataUangId: string;
  kodeMataUang: string;
  tanggalBerlaku: string;
  kurs: string;
  sumber: string | null;
  aktif: boolean;
}

export interface MataUangStats {
  total: number;
  dasarKode: string;
  valasAktif: number;
  totalKurs: number;
}
