import { eq, sql } from "drizzle-orm";
import { DAFTAR_IZIN, rolePermissions, roles, userRoles, type Izin } from "@/db/schema/keuangan";
import { db } from "./_deps";

export type AksesPengguna = {
  /** Kode peran yang dimiliki pengguna. */
  peran: string[];
  /** true bila minimal satu peran berakses penuh. */
  aksesPenuh: boolean;
  /** Izin efektif (gabungan semua peran). */
  izin: Set<Izin>;
};

const IZIN_VALID = new Set<string>(DAFTAR_IZIN);

/**
 * Memuat peran & izin efektif pengguna dalam SATU query.
 * Dipanggil per request (tanpa cache di memori) agar aman untuk serverless
 * dan perubahan peran langsung berlaku.
 */
export async function muatAksesPengguna(penggunaId: string): Promise<AksesPengguna> {
  // Sebelum ada satu pun penugasan peran, pengguna yang sudah login boleh
  // menyiapkan hak akses. Setelah ada penugasan, RBAC berlaku penuh.
  const [hitung] = await db.select({ n: sql<number>`count(*)::int` }).from(userRoles);
  if ((hitung?.n ?? 0) === 0) {
    return { peran: [], aksesPenuh: true, izin: new Set(DAFTAR_IZIN) };
  }

  const baris = await db
    .select({ kode: roles.kode, aksesPenuh: roles.aksesPenuh, izin: rolePermissions.izin })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.peranId))
    .leftJoin(rolePermissions, eq(rolePermissions.peranId, roles.id))
    .where(eq(userRoles.penggunaId, penggunaId));

  const peran = new Set<string>();
  const izin = new Set<Izin>();
  let aksesPenuh = false;
  for (const b of baris) {
    peran.add(b.kode);
    if (b.aksesPenuh) aksesPenuh = true;
    if (b.izin && IZIN_VALID.has(b.izin)) izin.add(b.izin as Izin);
  }
  if (aksesPenuh) for (const i of DAFTAR_IZIN) izin.add(i);
  return { peran: [...peran], aksesPenuh, izin };
}
