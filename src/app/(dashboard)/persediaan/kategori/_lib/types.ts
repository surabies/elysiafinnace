export interface KategoriItem {
  id: string;
  kode: string;
  nama: string;
  indukId: string | null;
  indukNama: string | null;
  keterangan: string | null;
  tags?: Array<{
    id: string;
    nama: string;
    warna: string;
  }>;
  aktif: boolean;
  createdAt: string;
}

export interface KategoriStats {
  totalKategori: number;
  kategoriAktif: number;
  kategoriInduk: number;
  subKategori: number;
}
