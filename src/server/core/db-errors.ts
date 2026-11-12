import { ApiError } from "./errors";

/** Mengambil kode & nama constraint PostgreSQL dari error driver (mentah atau terbungkus Drizzle `cause`). */
function readPgError(err: unknown): { code: string; constraint?: string } | null {
  let current: unknown = err;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    const c = current as { code?: unknown; constraint?: unknown; constraint_name?: unknown; cause?: unknown };
    if (typeof c.code === "string" && /^[0-9A-Z]{5}$/.test(c.code)) {
      const constraint = c.constraint_name ?? c.constraint;
      return { code: c.code, constraint: typeof constraint === "string" ? constraint : undefined };
    }
    current = c.cause;
  }
  return null;
}

/** Pesan ramah pengguna per nama constraint DB. Tambahkan di sini saat membuat constraint baru. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  uq_currencies_satu_mata_uang_dasar: "Hanya boleh ada satu mata uang dasar.",
  uq_chart_of_accounts_peran_tunggal: "Peran sistem tersebut sudah dimiliki akun lain.",
  ck_chart_of_accounts_saldo_normal_sesuai_tipe:
    "Saldo normal tidak sesuai dengan tipe akun (hanya akun kontra yang boleh berkebalikan).",
  ck_chart_of_accounts_peran_sesuai_tipe: "Peran sistem tidak sesuai dengan tipe akun.",
  ck_chart_of_accounts_peran_hanya_akun_detail: "Akun header tidak boleh memiliki peran sistem.",
  ck_items_barang_persediaan_wajib_akun_persediaan: "Barang persediaan wajib memiliki akun persediaan.",
  ck_partners_minimal_satu_peran: "Kontak harus berperan sebagai pelanggan, pemasok, atau keduanya.",
  ck_bank_accounts_rekening_bank_lengkap: "Rekening bank wajib memiliki nama bank dan nomor rekening.",
  uq_bank_accounts_bank_nomor: "Nomor rekening pada bank tersebut sudah terdaftar.",
  ck_payment_terms_hari_diskon: "Hari diskon tidak boleh melebihi jumlah hari jatuh tempo.",
  ck_journal_entries_seimbang: "Jurnal yang diposting wajib seimbang (total debit = total kredit).",
  ck_journal_items_satu_sisi: "Setiap baris jurnal hanya boleh berisi debit atau kredit.",
  ck_bank_reconciliations_selesai_seimbang: "Rekonsiliasi hanya dapat diselesaikan bila selisihnya nol.",
};

/** Menerjemahkan pelanggaran constraint PostgreSQL menjadi ApiError. `null` bila bukan error DB yang dikenal. */
export function translateDbError(err: unknown): ApiError | null {
  const pg = readPgError(err);
  if (!pg) return null;
  const details = pg.constraint ? { constraint: pg.constraint } : undefined;
  const custom = pg.constraint ? CONSTRAINT_MESSAGES[pg.constraint] : undefined;
  switch (pg.code) {
    case "23505":
      return new ApiError(409, "CONFLICT", custom ?? "Data dengan kode/nilai unik tersebut sudah ada.", details);
    case "23503":
    case "23001":
      return new ApiError(
        409,
        "IN_USE",
        "Data tidak dapat diproses karena masih dirujuk data lain atau rujukan yang diberikan tidak ada.",
        details,
      );
    case "23514":
    case "23502":
      return new ApiError(422, "BUSINESS_RULE", custom ?? "Data melanggar aturan validasi basis data.", details);
    default:
      return null;
  }
}
