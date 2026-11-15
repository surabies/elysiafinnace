import type { TipeBarang } from "@/db/schema/keuangan";

export interface ItemProduk {
  id: string;
  sku: string;
  barcode?: string | null;
  nama: string;
  deskripsi?: string | null;
  tipeBarang: TipeBarang;
  kategoriId?: string | null;
  kategoriNama?: string | null;
  satuanId: string;
  satuanKode?: string | null;
  satuanNama?: string | null;
  mataUangId?: string | null;
  kodeMataUang?: string | null;
  hargaBeliStandar: string;
  hargaJualStandar: string;
  stokMinimum: string;
  totalStok?: string;
  akunPersediaanId?: string | null;
  akunHppId?: string | null;
  akunPendapatanId?: string | null;
  tags?: Array<{
    id: string;
    nama: string;
    warna: string;
  }>;
  aktif: boolean;
  createdAt?: string | Date;
}

export interface KategoriOption {
  id: string;
  kode: string;
  nama: string;
}

export interface SatuanOption {
  id: string;
  kode: string;
  nama: string;
}

export interface AkunOption {
  id: string;
  kode: string;
  nama: string;
  tipeAkun: string;
}

export interface ProdukStats {
  totalItem: number;
  totalPersediaan: number;
  totalNonPersediaan: number;
  totalJasa: number;
}
