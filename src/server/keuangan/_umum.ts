import { Elysia, t } from "elysia";
import type { Izin } from "@/db/schema/keuangan";
import { dapatkanSesi, type SesiPengguna } from "./_deps";
import { muatAksesPengguna, type AksesPengguna } from "./_rbac";

/* ------------------------------------------------------------------ */
/* Galat aplikasi                                                       */
/* ------------------------------------------------------------------ */

export type KodeGalat =
  | "TIDAK_TERAUTENTIKASI"
  | "TIDAK_BERWENANG"
  | "TIDAK_DITEMUKAN"
  | "VALIDASI_GAGAL"
  | "ATURAN_BISNIS"
  | "DATA_SUDAH_ADA"
  | "DATA_MASIH_DIPAKAI"
  | "GALAT_INTERNAL";

/** Galat yang aman ditampilkan ke klien (pesan berbahasa Indonesia). */
export class GalatAplikasi extends Error {
  constructor(
    public readonly status: number,
    public readonly kode: KodeGalat,
    pesan: string,
    public readonly detail?: unknown,
  ) {
    super(pesan);
    this.name = "GalatAplikasi";
  }
}

export const galat = {
  tidakDitemukan: (objek: string) =>
    new GalatAplikasi(404, "TIDAK_DITEMUKAN", `${objek} tidak ditemukan.`),
  aturanBisnis: (pesan: string, detail?: unknown) =>
    new GalatAplikasi(422, "ATURAN_BISNIS", pesan, detail),
  sudahAda: (pesan: string) => new GalatAplikasi(409, "DATA_SUDAH_ADA", pesan),
};

/** Mengambil kode & nama constraint PostgreSQL dari error driver (pg, postgres-js, atau terbungkus Drizzle). */
function bacaGalatPostgres(
  err: unknown,
): { code?: string; constraint?: string } | null {
  let saat: any = err;
  for (let i = 0; i < 4 && saat; i++) {
    if (typeof saat.code === "string" && /^[0-9A-Z]{5}$/.test(saat.code)) {
      return {
        code: saat.code,
        constraint: saat.constraint_name ?? saat.constraint,
      };
    }
    saat = saat.cause;
  }
  return null;
}

const PESAN_CONSTRAINT: Record<string, string> = {
  uq_currencies_satu_mata_uang_dasar: "Hanya boleh ada satu mata uang dasar.",
  uq_chart_of_accounts_peran_tunggal:
    "Peran sistem tersebut sudah dimiliki akun lain.",
  ck_chart_of_accounts_saldo_normal_sesuai_tipe:
    "Saldo normal tidak sesuai dengan tipe akun (hanya akun kontra yang boleh berkebalikan).",
  ck_chart_of_accounts_peran_sesuai_tipe:
    "Peran sistem tidak sesuai dengan tipe akun.",
  ck_chart_of_accounts_peran_hanya_akun_detail:
    "Akun header tidak boleh memiliki peran sistem.",
  ck_items_barang_persediaan_wajib_akun_persediaan:
    "Barang persediaan wajib memiliki akun persediaan.",
  ck_partners_minimal_satu_peran:
    "Kontak harus berperan sebagai pelanggan, pemasok, atau keduanya.",
  ck_bank_accounts_rekening_bank_lengkap:
    "Rekening bank wajib memiliki nama bank dan nomor rekening.",
  uq_bank_accounts_bank_nomor:
    "Nomor rekening pada bank tersebut sudah terdaftar.",
  ck_payment_terms_hari_diskon:
    "Hari diskon tidak boleh melebihi jumlah hari jatuh tempo.",
  ck_journal_entries_seimbang: "Jurnal yang diposting wajib seimbang (total debit = total kredit).",
  ck_journal_items_satu_sisi: "Setiap baris jurnal hanya boleh berisi debit atau kredit.",
  ck_bank_reconciliations_selesai_seimbang: "Rekonsiliasi hanya dapat diselesaikan bila selisihnya nol.",
};

/** Menerjemahkan galat PostgreSQL yang umum menjadi GalatAplikasi berbahasa Indonesia. */
export function terjemahkanGalat(err: unknown): GalatAplikasi | null {
  if (err instanceof GalatAplikasi) return err;
  const pg = bacaGalatPostgres(err);
  if (!pg) return null;
  const khusus = pg.constraint ? PESAN_CONSTRAINT[pg.constraint] : undefined;
  switch (pg.code) {
    case "23505":
      return new GalatAplikasi(
        409,
        "DATA_SUDAH_ADA",
        khusus ?? "Data dengan kode/nilai unik tersebut sudah ada.",
        {
          constraint: pg.constraint,
        },
      );
    case "23503": // foreign key violation
    case "23001": // restrict violation (ON DELETE RESTRICT)
      return new GalatAplikasi(
        409,
        "DATA_MASIH_DIPAKAI",
        "Data tidak dapat diproses karena masih dirujuk data lain atau rujukan yang diberikan tidak ada.",
        { constraint: pg.constraint },
      );
    case "23514":
    case "23502":
      return new GalatAplikasi(
        422,
        "ATURAN_BISNIS",
        khusus ?? "Data melanggar aturan validasi basis data.",
        {
          constraint: pg.constraint,
        },
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Bentuk respons seragam                                               */
/* ------------------------------------------------------------------ */

export const ok = <T>(data: T, meta?: Record<string, unknown>) => ({
  sukses: true as const,
  data,
  ...(meta ? { meta } : {}),
});

/* ------------------------------------------------------------------ */
/* Skema validasi (pesan berbahasa Indonesia)                           */
/* ------------------------------------------------------------------ */

export const skema = {
  teks: (label: string, maks = 255) =>
    t.String({
      minLength: 1,
      maxLength: maks,
      error: `${label} wajib diisi (maksimal ${maks} karakter).`,
    }),
  teksOpsional: (label: string, maks = 255) =>
    t.Optional(
      t.Union([t.String({ maxLength: maks }), t.Null()], {
        error: `${label} maksimal ${maks} karakter.`,
      }),
    ),
  emailOpsional: (label: string) =>
    t.Optional(
      t.Union([t.String({ format: "email", maxLength: 150 }), t.Null()], {
        error: `${label} harus berupa alamat email yang valid (maksimal 150 karakter).`,
      }),
    ),
  kode: (label: string, maks = 30) =>
    t.String({
      minLength: 1,
      maxLength: maks,
      pattern: "^[A-Za-z0-9][A-Za-z0-9._/\\-]*$",
      error: `${label} wajib diisi, hanya huruf/angka/titik/garis/garis miring, maksimal ${maks} karakter.`,
    }),
  uuid: (label: string) =>
    t.String({
      format: "uuid",
      error: `${label} harus berupa UUID yang valid.`,
    }),
  uuidOpsional: (label: string) =>
    t.Optional(
      t.Union([t.String({ format: "uuid" }), t.Null()], {
        error: `${label} harus berupa UUID yang valid.`,
      }),
    ),
  /** Nilai uang/kuantitas non-negatif sebagai STRING desimal (maks 4 desimal) agar tidak terkena pembulatan float. */
  uang: (label: string) =>
    t.String({
      pattern: "^\\d{1,16}(\\.\\d{1,4})?$",
      error: `${label} harus berupa angka desimal tidak negatif (maks 4 desimal), dikirim sebagai string.`,
    }),
  kurs: (label: string) =>
    t.String({
      pattern: "^\\d{1,12}(\\.\\d{1,8})?$",
      error: `${label} harus berupa angka desimal (maks 8 desimal), dikirim sebagai string.`,
    }),
  persen: (label: string) =>
    t.String({
      pattern: "^\\d{1,3}(\\.\\d{1,4})?$",
      error: `${label} harus berupa angka 0-100 (maks 4 desimal), dikirim sebagai string.`,
    }),
  tanggal: (label: string) =>
    t.String({ format: "date", error: `${label} harus berformat YYYY-MM-DD.` }),
  boolean: (label: string) =>
    t.Boolean({ error: `${label} harus bernilai true atau false.` }),
  /** Salah satu dari daftar nilai tetap (enum). */
  pilihan: <const T extends readonly string[]>(label: string, daftar: T) =>
    t.Union(
      daftar.map((v) => t.Literal(v)) as unknown as [
        ReturnType<typeof t.Literal<T[number]>>,
      ],
      { error: `${label} harus salah satu dari: ${daftar.join(", ")}.` },
    ),
};

export const skemaHalaman = {
  halaman: t.Optional(
    t.Numeric({ minimum: 1, error: "halaman harus angka >= 1." }),
  ),
  ukuran: t.Optional(
    t.Numeric({ minimum: 1, maximum: 200, error: "ukuran harus angka 1-200." }),
  ),
  q: t.Optional(t.String({ maxLength: 100 })),
};

export function bacaHalaman(query: { halaman?: number; ukuran?: number }) {
  const halaman = query.halaman ?? 1;
  const ukuran = query.ukuran ?? 50;
  return { halaman, ukuran, offset: (halaman - 1) * ukuran };
}

/** Escape karakter wildcard LIKE agar pencarian pengguna diperlakukan sebagai teks biasa. */
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Membersihkan string kosong menjadi null untuk kolom teks opsional. */
export const nullJikaKosong = (v: string | null | undefined) => {
  const s = v?.trim();
  return s ? s : null;
};

/* ------------------------------------------------------------------ */
/* Plugin dasar: penanganan galat + wajib login                         */
/* ------------------------------------------------------------------ */

/**
 * Dipasang oleh setiap grup rute keuangan. Hook memakai cakupan "scoped"
 * sehingga hanya berlaku untuk rute modul keuangan, tidak mengubah rute lain
 * (login, logout, cek kesehatan, dst.) yang sudah ada di project.
 */
export const dasarKeuangan = new Elysia({ name: "keuangan.dasar" })
  .onError({ as: "scoped" }, ({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return {
        sukses: false as const,
        galat: {
          kode: "VALIDASI_GAGAL" as const,
          pesan: "Data yang dikirim tidak valid.",
          detail: error.all.map((e) => ({
            kolom: (e.path ?? "").replace(/^\//, "") || "(body)",
            // Utamakan pesan Indonesia dari skema (opsi `error`), lalu pesan bawaan TypeBox.
            pesan:
              typeof (e.schema as { error?: unknown } | undefined)?.error ===
              "string"
                ? (e.schema as { error: string }).error
                : (e.summary ?? e.message),
          })),
        },
      };
    }
    if (code === "NOT_FOUND") return; // biarkan perilaku bawaan untuk rute yang tidak ada

    const dikenal = terjemahkanGalat(error);
    if (dikenal) {
      set.status = dikenal.status;
      return {
        sukses: false as const,
        galat: {
          kode: dikenal.kode,
          pesan: dikenal.message,
          detail: dikenal.detail,
        },
      };
    }

    console.error("[keuangan] Terjadi galat tak terduga:", error);
    set.status = 500;
    return {
      sukses: false as const,
      galat: {
        kode: "GALAT_INTERNAL" as const,
        pesan: "Terjadi kesalahan pada server. Silakan coba lagi.",
      },
    };
  })
  .derive({ as: "scoped" }, async ({ request }) => {
    const pengguna = await dapatkanSesi(request.headers);
    if (!pengguna) {
      throw new GalatAplikasi(
        401,
        "TIDAK_TERAUTENTIKASI",
        "Anda belum login. Silakan login terlebih dahulu.",
      );
    }
    const akses = await muatAksesPengguna(pengguna.penggunaId);
    const sesi: SesiAkses = { ...pengguna, ...akses };
    return { sesi };
  });

/* ------------------------------------------------------------------ */
/* RBAC: pemeriksaan izin                                               */
/* ------------------------------------------------------------------ */

export type SesiAkses = SesiPengguna & AksesPengguna;

export const punyaIzin = (sesi: SesiAkses, izin: Izin) =>
  sesi.aksesPenuh || sesi.izin.has(izin);

/** Melempar 403 bila pengguna tidak memiliki SEMUA izin yang diminta. */
export function pastikanIzin(sesi: SesiAkses, ...izin: Izin[]) {
  const kurang = izin.filter((i) => !punyaIzin(sesi, i));
  if (kurang.length > 0) {
    throw new GalatAplikasi(
      403,
      "TIDAK_BERWENANG",
      `Anda tidak memiliki hak akses untuk tindakan ini (dibutuhkan izin: ${kurang.join(", ")}).`,
      { izinDibutuhkan: kurang },
    );
  }
}

/**
 * Hook `beforeHandle` per rute:  .post("/", h, { beforeHandle: wajibIzin("jurnal.kelola") })
 */
export const wajibIzin =
  (...izin: Izin[]) =>
  ({ sesi }: { sesi: SesiAkses }) => {
    pastikanIzin(sesi, ...izin);
  };

/**
 * Hook untuk seluruh grup rute berdasarkan metode HTTP:
 * GET/HEAD membutuhkan `<modul>.baca`, metode lain membutuhkan `<modul>.kelola`.
 *   new Elysia(...).use(dasarKeuangan).onBeforeHandle(izinPerMetode("master_data"))
 */
export const izinPerMetode =
  (modul: "master_data") =>
  ({ sesi, request }: { sesi: SesiAkses; request: Request }) => {
    const baca = request.method === "GET" || request.method === "HEAD";
    pastikanIzin(sesi, `${modul}.${baca ? "baca" : "kelola"}` as Izin);
  };
