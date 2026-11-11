/**
 * SATU-SATUNYA file modul keuangan yang bergantung pada struktur project Anda.
 * Jika path impor di bawah berbeda dengan project Anda, ubah di sini saja.
 *
 *  - `db`   : instance Drizzle yang sudah ada (klien Drizzle project Anda).
 *  - `auth` : instance Better-Auth yang sudah ada (yang dipakai login/logout).
 */
import { auth } from "@/lib/auth";

export { db } from "@/db";

export type SesiPengguna = {
  penggunaId: string;
  nama: string;
  email: string;
};

/** Membaca sesi Better-Auth dari header request. Mengembalikan null jika belum login. */
export async function dapatkanSesi(headers: Headers): Promise<SesiPengguna | null> {
  const hasil = await auth.api.getSession({ headers });
  if (!hasil) return null;
  return { penggunaId: hasil.user.id, nama: hasil.user.name, email: hasil.user.email };
}
