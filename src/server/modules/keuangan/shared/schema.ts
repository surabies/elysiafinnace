import { t } from "elysia";

/** Pembuat skema TypeBox dengan pesan galat Bahasa Indonesia (dipakai di model.ts tiap fitur). */
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
