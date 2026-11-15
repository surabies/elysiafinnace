export type TipeAkun = "ASET" | "KEWAJIBAN" | "EKUITAS" | "PENDAPATAN" | "BEBAN";
export type SaldoNormal = "DEBIT" | "KREDIT";

export interface AkunItem {
  id: string;
  kode: string;
  nama: string;
  tipeAkun: TipeAkun;
  normalBalance: SaldoNormal;
  indukId: string | null;
  level: number;
  bisaDiposting: boolean;
  adalahAkunKontra: boolean;
  peranSistem: string | null;
  mataUangId?: string | null;
  kodeMataUang?: string | null;
  keterangan: string | null;
  aktif: boolean;
  saldoBerjalan?: string;
}

export interface NodeAkun extends AkunItem {
  anak: NodeAkun[];
}

export interface CoaStats {
  totalAkun: number;
  totalAset: number;
  totalKewajiban: number;
  totalEkuitas: number;
  totalPendapatan: number;
  totalBeban: number;
}
