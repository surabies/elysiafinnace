export interface GudangItem {
  id: string;
  kode: string;
  nama: string;
  alamat?: string | null;
  penanggungJawab?: string | null;
  adalahGudangUtama: boolean;
  aktif: boolean;
  keterangan?: string | null;
  createdAt?: string | Date;
}

export interface GudangStats {
  totalGudang: number;
  gudangAktif: number;
  gudangUtamaNama: string;
}
