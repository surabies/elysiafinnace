import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../shared/context";
import {
  DAFTAR_IZIN,
  KATALOG_IZIN,
  rolePermissions,
  roles,
  userRoles,
  type Peran,
} from "@/db/schema/keuangan";
import { user } from "@/db/schema/auth";
import { galat } from "@/server/core/errors";
import { muatAksesPengguna } from "../shared/rbac";
import { bacaHalaman } from "../shared/pagination";
import type {
  CabutPeranInput,
  QueryPenggunaPeranInput,
  QueryPeranInput,
  SimpanPeranInput,
  TugaskanPeranInput,
  UbahPeranInput,
} from "./model";

const SET_IZIN_VALID = new Set<string>(DAFTAR_IZIN);

// ==========================================
// 1. PENGELOLAAN PERAN (ROLES)
// ==========================================

export async function daftarPeran(query: QueryPeranInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.q) {
    const qLower = `%${query.q.toLowerCase()}%`;
    conditions.push(or(ilike(roles.kode, qLower), ilike(roles.nama, qLower)));
  }
  if (query.aksesPenuh !== undefined) {
    conditions.push(eq(roles.aksesPenuh, query.aksesPenuh));
  }
  if (query.adalahSistem !== undefined) {
    conditions.push(eq(roles.adalahSistem, query.adalahSistem));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(roles)
    .where(whereClause);

  const items = await db
    .select({
      id: roles.id,
      kode: roles.kode,
      nama: roles.nama,
      keterangan: roles.keterangan,
      aksesPenuh: roles.aksesPenuh,
      adalahSistem: roles.adalahSistem,
      dibuatPada: roles.dibuatPada,
      diubahPada: roles.diubahPada,
      jumlahPengguna: sql<number>`(SELECT count(*)::int FROM ${userRoles} WHERE ${userRoles.peranId} = ${roles.id})`,
      jumlahIzin: sql<number>`(SELECT count(*)::int FROM ${rolePermissions} WHERE ${rolePermissions.peranId} = ${roles.id})`,
    })
    .from(roles)
    .where(whereClause)
    .orderBy(desc(roles.adalahSistem), asc(roles.kode))
    .limit(ukuran)
    .offset(offset);

  return {
    items,
    total: totalRow?.total ?? 0,
    halaman,
    ukuran,
    totalHalaman: Math.ceil((totalRow?.total ?? 0) / ukuran),
  };
}

export async function ambilPeran(id: string) {
  const [peran] = await db.select().from(roles).where(eq(roles.id, id));
  if (!peran) throw galat.tidakDitemukan(`Peran dengan ID ${id}`);

  const izinRows = await db
    .select({ izin: rolePermissions.izin })
    .from(rolePermissions)
    .where(eq(rolePermissions.peranId, id));

  return {
    ...peran,
    izin: izinRows.map((r) => r.izin),
  };
}

export async function buatPeran(input: SimpanPeranInput, oleh: string): Promise<Peran> {
  const kodeBersih = input.kode.trim().toUpperCase();

  // Validasi kode peran unik
  const [ada] = await db.select({ id: roles.id }).from(roles).where(eq(roles.kode, kodeBersih));
  if (ada) throw galat.aturanBisnis(`Peran dengan kode '${kodeBersih}' sudah terdaftar.`);

  // Validasi izin yang dimasukkan
  const izinValid = input.izin.filter((i) => SET_IZIN_VALID.has(i));

  return await db.transaction(async (tx) => {
    const [baru] = await tx
      .insert(roles)
      .values({
        kode: kodeBersih,
        nama: input.nama.trim(),
        keterangan: input.keterangan?.trim() ?? null,
        aksesPenuh: input.aksesPenuh ?? false,
        adalahSistem: false,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    if (!baru) throw galat.aturanBisnis("Gagal membuat peran.");

    if (izinValid.length > 0) {
      await tx.insert(rolePermissions).values(
        izinValid.map((izin) => ({
          peranId: baru.id,
          izin,
        })),
      );
    }

    return baru;
  });
}

export async function ubahPeran(id: string, input: UbahPeranInput, oleh: string) {
  const [peran] = await db.select().from(roles).where(eq(roles.id, id));
  if (!peran) throw galat.tidakDitemukan(`Peran dengan ID ${id}`);

  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(roles)
      .set({
        nama: input.nama.trim(),
        keterangan: input.keterangan?.trim() ?? null,
        aksesPenuh: peran.adalahSistem && peran.aksesPenuh ? true : (input.aksesPenuh ?? peran.aksesPenuh),
        diubahOleh: oleh,
        diubahPada: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();

    if (input.izin !== undefined) {
      const izinValid = input.izin.filter((i) => SET_IZIN_VALID.has(i));
      await tx.delete(rolePermissions).where(eq(rolePermissions.peranId, id));
      if (izinValid.length > 0) {
        await tx.insert(rolePermissions).values(
          izinValid.map((izin) => ({
            peranId: id,
            izin,
          })),
        );
      }
    }

    return updated;
  });
}

export async function hapusPeran(id: string) {
  const [peran] = await db.select().from(roles).where(eq(roles.id, id));
  if (!peran) throw galat.tidakDitemukan(`Peran dengan ID ${id}`);

  if (peran.adalahSistem) {
    throw galat.aturanBisnis(`Peran bawaan sistem '${peran.nama}' (${peran.kode}) tidak dapat dihapus.`);
  }

  const [pengguna] = await db
    .select({ count: count() })
    .from(userRoles)
    .where(eq(userRoles.peranId, id));

  if ((pengguna?.count ?? 0) > 0) {
    throw galat.aturanBisnis(
      `Peran '${peran.nama}' sedang ditugaskan ke ${pengguna?.count} pengguna. Cabut penugasan terlebih dahulu sebelum menghapus.`,
    );
  }

  await db.delete(roles).where(eq(roles.id, id));
  return { id, sukses: true, pesan: `Peran '${peran.nama}' berhasil dihapus.` };
}

// ==========================================
// 2. KATALOG IZIN
// ==========================================

export function ambilKatalogIzin() {
  const kelompok: Record<string, { kode: string; deskripsi: string }[]> = {};

  for (const [kode, deskripsi] of Object.entries(KATALOG_IZIN)) {
    const modul = kode.split(".")[0] ?? "umum";
    if (!kelompok[modul]) kelompok[modul] = [];
    kelompok[modul]!.push({ kode, deskripsi });
  }

  return {
    total: Object.keys(KATALOG_IZIN).length,
    daftar: Object.entries(KATALOG_IZIN).map(([kode, deskripsi]) => ({
      kode,
      deskripsi,
      modul: kode.split(".")[0],
    })),
    berkelompok: kelompok,
  };
}

// ==========================================
// 3. PENUGASAN PERAN PENGGUNA (USER ROLES)
// ==========================================

export async function daftarPenggunaDanPeran(query: QueryPenggunaPeranInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.q) {
    const qLower = `%${query.q.toLowerCase()}%`;
    conditions.push(or(ilike(user.name, qLower), ilike(user.email, qLower)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(user)
    .where(whereClause);

  const daftarPengguna = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(ukuran)
    .offset(offset);

  const userIds = daftarPengguna.map((u) => u.id);
  const penugasan = userIds.length > 0
    ? await db
        .select({
          penggunaId: userRoles.penggunaId,
          peranId: roles.id,
          peranKode: roles.kode,
          peranNama: roles.nama,
          aksesPenuh: roles.aksesPenuh,
        })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.peranId))
        .where(inArray(userRoles.penggunaId, userIds))
    : [];

  const petaPeran = new Map<string, typeof penugasan>();
  for (const p of penugasan) {
    const list = petaPeran.get(p.penggunaId) ?? [];
    list.push(p);
    petaPeran.set(p.penggunaId, list);
  }

  return {
    items: daftarPengguna.map((u) => ({
      ...u,
      peran: petaPeran.get(u.id) ?? [],
    })),
    total: totalRow?.total ?? 0,
    halaman,
    ukuran,
    totalHalaman: Math.ceil((totalRow?.total ?? 0) / ukuran),
  };
}

export async function tugaskanPeranPengguna(input: TugaskanPeranInput, oleh: string) {
  const [u] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, input.penggunaId));
  if (!u) throw galat.tidakDitemukan(`Pengguna ID ${input.penggunaId}`);

  const rolesFound = await db
    .select({ id: roles.id, nama: roles.nama })
    .from(roles)
    .where(inArray(roles.id, input.peranIds));

  if (rolesFound.length === 0) {
    throw galat.aturanBisnis("Tidak ada peran valid yang dipilih.");
  }

  await db.transaction(async (tx) => {
    for (const r of rolesFound) {
      await tx
        .insert(userRoles)
        .values({
          penggunaId: input.penggunaId,
          peranId: r.id,
          dibuatOleh: oleh,
        })
        .onConflictDoNothing();
    }
  });

  return await muatAksesPengguna(input.penggunaId);
}

export async function cabutPeranPengguna(input: CabutPeranInput) {
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.penggunaId, input.penggunaId), eq(userRoles.peranId, input.peranId)));

  return await muatAksesPengguna(input.penggunaId);
}

export async function ambilAksesPenggunaDetail(penggunaId: string) {
  const [u] = await db.select().from(user).where(eq(user.id, penggunaId));
  if (!u) throw galat.tidakDitemukan(`Pengguna ID ${penggunaId}`);

  const akses = await muatAksesPengguna(penggunaId);

  const peranList = await db
    .select({
      id: roles.id,
      kode: roles.kode,
      nama: roles.nama,
      aksesPenuh: roles.aksesPenuh,
      adalahSistem: roles.adalahSistem,
    })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.peranId))
    .where(eq(userRoles.penggunaId, penggunaId));

  return {
    pengguna: {
      id: u.id,
      name: u.name,
      email: u.email,
    },
    akses: {
      peran: peranList,
      aksesPenuh: akses.aksesPenuh,
      izin: Array.from(akses.izin),
    },
  };
}
