import { boolean, numeric, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Helper kolom bersama untuk seluruh tabel modul keuangan.
 *
 * PENTING: semua nilai uang/kuantitas memakai NUMERIC (desimal presisi tetap),
 * bukan float. Drizzle mengembalikan NUMERIC sebagai string sehingga tidak ada
 * pembulatan floating point di sisi JavaScript. Jangan di-parse dengan Number().
 */

/** Primary key UUID (gen_random_uuid() bawaan PostgreSQL 13+). */
export const kolomId = () => uuid("id").primaryKey().defaultRandom();

/** Nilai uang: 16 digit bulat + 4 digit desimal. */
export const uang = (nama: string) => numeric(nama, { precision: 20, scale: 4 });

/** Kuantitas barang: 16 digit bulat + 4 digit desimal. */
export const kuantitas = (nama: string) => numeric(nama, { precision: 20, scale: 4 });

/** Kurs: 12 digit bulat + 8 digit desimal (mis. 15.873,12345678). */
export const kurs = (nama: string) => numeric(nama, { precision: 20, scale: 8 });

/** Persentase 0-100 dengan 4 desimal. */
export const persen = (nama: string) => numeric(nama, { precision: 7, scale: 4 });

export const kolomAktif = () => boolean("aktif").notNull().default(true);

export const kolomWaktu = {
  dibuatPada: timestamp("dibuat_pada", { withTimezone: true }).notNull().defaultNow(),
  diubahPada: timestamp("diubah_pada", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * Jejak audit. Berisi ID pengguna Better-Auth sebagai teks biasa (tanpa FK)
 * agar skema keuangan tidak bergantung pada tabel autentikasi yang sudah ada.
 */
export const kolomAudit = {
  dibuatOleh: text("dibuat_oleh"),
  diubahOleh: text("diubah_oleh"),
};
