export interface DataKunciTransaksi {
  id: string | null;
  perusahaanId: string | null;
  kunciSemuaSebelum: string | null;
  kunciNonAdminSebelum: string | null;
  catatan: string | null;
}

export interface KunciTransaksiStats {
  statusKunci: "TERKUNCI" | "PARSIAL" | "TERBUKA";
  kunciSemua: string | null;
  kunciNonAdmin: string | null;
  perusahaanNama: string;
}
