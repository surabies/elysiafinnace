import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  departments,
  projects,
  tags,
  type Cabang,
  type Departemen,
  type Proyek,
  type Tag,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { PREFIKS, nomorBerikut, hariIni } from "../shared/transaction";
import type {
  QueryCabangInput,
  QueryDepartemenInput,
  QueryProyekInput,
  QueryTagInput,
  SimpanCabangInput,
  SimpanDepartemenInput,
  SimpanProyekInput,
  SimpanTagInput,
} from "./model";

// ==========================================
// 1. MASTER CABANG (BRANCHES)
// ==========================================

export async function daftarCabang(query: QueryCabangInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.q) {
    conditions.push(or(ilike(branches.kode, `%${query.q}%`), ilike(branches.nama, `%${query.q}%`)));
  }
  if (query.aktif !== undefined) {
    const isAktif = typeof query.aktif === "string" ? query.aktif === "true" : Boolean(query.aktif);
    conditions.push(eq(branches.aktif, isAktif));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(branches)
    .where(whereClause);

  const rows = await db
    .select()
    .from(branches)
    .where(whereClause)
    .orderBy(desc(branches.pusat), branches.kode)
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRows?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalRows?.count ?? 0) / limit),
  };
}

export async function ambilCabang(id: string): Promise<Cabang> {
  const [row] = await db.select().from(branches).where(eq(branches.id, id));
  if (!row) throw galat.tidakDitemukan(`Cabang dengan ID ${id}`);
  return row;
}

export async function buatCabang(input: SimpanCabangInput, penggunaId: string): Promise<Cabang> {
  return await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(branches).where(eq(branches.kode, input.kode));
    if (existing) throw galat.sudahAda(`Cabang dengan kode '${input.kode}' sudah terdaftar.`);

    // Bila cabang ini diset sebagai pusat, cabut flag pusat cabang lain
    if (input.pusat) {
      await tx.update(branches).set({ pusat: false });
    }

    const [row] = await tx
      .insert(branches)
      .values({
        kode: input.kode,
        nama: input.nama,
        alamat: input.alamat ?? null,
        telepon: input.telepon ?? null,
        penanggungJawab: input.penanggungJawab ?? null,
        pusat: input.pusat ?? false,
        aktif: input.aktif ?? true,
        dibuatOleh: penggunaId,
        diubahOleh: penggunaId,
      })
      .returning();

    if (!row) throw galat.aturanBisnis("Gagal membuat cabang.");
    return row;
  });
}

export async function ubahCabang(
  id: string,
  input: Partial<SimpanCabangInput>,
  penggunaId: string,
): Promise<Cabang> {
  return await db.transaction(async (tx) => {
    await ambilCabang(id);

    if (input.kode) {
      const [conflict] = await tx
        .select()
        .from(branches)
        .where(and(eq(branches.kode, input.kode), sql`${branches.id} != ${id}`));
      if (conflict) throw galat.sudahAda(`Cabang dengan kode '${input.kode}' sudah digunakan.`);
    }

    if (input.pusat) {
      await tx.update(branches).set({ pusat: false }).where(sql`${branches.id} != ${id}`);
    }

    const [updated] = await tx
      .update(branches)
      .set({
        ...input,
        diubahOleh: penggunaId,
        diubahPada: new Date(),
      })
      .where(eq(branches.id, id))
      .returning();

    if (!updated) throw galat.aturanBisnis("Gagal memperbarui cabang.");
    return updated;
  });
}

// ==========================================
// 2. MASTER DEPARTEMEN (DEPARTMENTS)
// ==========================================

export async function daftarDepartemen(query: QueryDepartemenInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.q) {
    conditions.push(or(ilike(departments.kode, `%${query.q}%`), ilike(departments.nama, `%${query.q}%`)));
  }
  if (query.aktif !== undefined) {
    const isAktif = typeof query.aktif === "string" ? query.aktif === "true" : Boolean(query.aktif);
    conditions.push(eq(departments.aktif, isAktif));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(departments)
    .where(whereClause);

  const rows = await db
    .select()
    .from(departments)
    .where(whereClause)
    .orderBy(departments.kode)
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRows?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalRows?.count ?? 0) / limit),
  };
}

export async function ambilDepartemen(id: string): Promise<Departemen> {
  const [row] = await db.select().from(departments).where(eq(departments.id, id));
  if (!row) throw galat.tidakDitemukan(`Departemen dengan ID ${id}`);
  return row;
}

export async function buatDepartemen(
  input: SimpanDepartemenInput,
  penggunaId: string,
): Promise<Departemen> {
  const [existing] = await db.select().from(departments).where(eq(departments.kode, input.kode));
  if (existing) throw galat.sudahAda(`Departemen dengan kode '${input.kode}' sudah terdaftar.`);

  if (input.indukId) {
    await ambilDepartemen(input.indukId);
  }

  const [row] = await db
    .insert(departments)
    .values({
      kode: input.kode,
      nama: input.nama,
      indukId: input.indukId ?? null,
      manajer: input.manajer ?? null,
      aktif: input.aktif ?? true,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat departemen.");
  return row;
}

export async function ubahDepartemen(
  id: string,
  input: Partial<SimpanDepartemenInput>,
  penggunaId: string,
): Promise<Departemen> {
  await ambilDepartemen(id);

  if (input.kode) {
    const [conflict] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.kode, input.kode), sql`${departments.id} != ${id}`));
    if (conflict) throw galat.sudahAda(`Departemen dengan kode '${input.kode}' sudah digunakan.`);
  }

  if (input.indukId) {
    if (input.indukId === id) {
      throw galat.aturanBisnis("Departemen tidak boleh menjadi induk untuk dirinya sendiri.");
    }
    await ambilDepartemen(input.indukId);
  }

  const [updated] = await db
    .update(departments)
    .set({
      ...input,
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(departments.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui departemen.");
  return updated;
}

// ==========================================
// 3. MASTER PROYEK (PROJECTS)
// ==========================================

export async function daftarProyek(query: QueryProyekInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.q) {
    conditions.push(or(ilike(projects.kode, `%${query.q}%`), ilike(projects.nama, `%${query.q}%`)));
  }
  if (query.status) conditions.push(eq(projects.status, query.status));
  if (query.pelangganId) conditions.push(eq(projects.pelangganId, query.pelangganId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(whereClause);

  const rows = await db
    .select()
    .from(projects)
    .where(whereClause)
    .orderBy(desc(projects.dibuatPada), projects.kode)
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRows?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalRows?.count ?? 0) / limit),
  };
}

export async function ambilProyek(id: string): Promise<Proyek> {
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  if (!row) throw galat.tidakDitemukan(`Proyek dengan ID ${id}`);
  return row;
}

export async function buatProyek(input: SimpanProyekInput, penggunaId: string): Promise<Proyek> {
  return await db.transaction(async (tx) => {
    const tanggalRef = input.tanggalMulai ?? hariIni();
    const kode = input.kode?.trim()
      ? input.kode.trim()
      : await nomorBerikut(tx, PREFIKS.PROYEK, tanggalRef);

    const [existing] = await tx.select().from(projects).where(eq(projects.kode, kode));
    if (existing) throw galat.sudahAda(`Proyek dengan kode '${kode}' sudah terdaftar.`);

    const [row] = await tx
      .insert(projects)
      .values({
        kode,
        nama: input.nama,
        pelangganId: input.pelangganId ?? null,
        tanggalMulai: input.tanggalMulai ?? null,
        tanggalSelesai: input.tanggalSelesai ?? null,
        nilaiKontrak: input.nilaiKontrak ?? "0.0000",
        status: input.status ?? "PERENCANAAN",
        penanggungJawab: input.penanggungJawab ?? null,
        keterangan: input.keterangan ?? null,
        aktif: input.aktif ?? true,
        dibuatOleh: penggunaId,
        diubahOleh: penggunaId,
      })
      .returning();

    if (!row) throw galat.aturanBisnis("Gagal membuat registrasi proyek.");
    return row;
  });
}

export async function ubahProyek(
  id: string,
  input: Partial<SimpanProyekInput>,
  penggunaId: string,
): Promise<Proyek> {
  await ambilProyek(id);

  if (input.kode) {
    const [conflict] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.kode, input.kode), sql`${projects.id} != ${id}`));
    if (conflict) throw galat.sudahAda(`Proyek dengan kode '${input.kode}' sudah digunakan.`);
  }

  const [updated] = await db
    .update(projects)
    .set({
      ...input,
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui proyek.");
  return updated;
}

// ==========================================
// 4. MASTER TAG
// ==========================================

export async function daftarTag(query: QueryTagInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.q) conditions.push(ilike(tags.nama, `%${query.q}%`));
  if (query.aktif !== undefined) {
    const isAktif = typeof query.aktif === "string" ? query.aktif === "true" : Boolean(query.aktif);
    conditions.push(eq(tags.aktif, isAktif));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tags)
    .where(whereClause);

  const rows = await db
    .select()
    .from(tags)
    .where(whereClause)
    .orderBy(tags.nama)
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRows?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((totalRows?.count ?? 0) / limit),
  };
}

export async function ambilTag(id: string): Promise<Tag> {
  const [row] = await db.select().from(tags).where(eq(tags.id, id));
  if (!row) throw galat.tidakDitemukan(`Tag dengan ID ${id}`);
  return row;
}

export async function buatTag(input: SimpanTagInput, penggunaId: string): Promise<Tag> {
  const namaTag = input.nama.trim().startsWith("#") ? input.nama.trim() : `#${input.nama.trim()}`;

  const [existing] = await db.select().from(tags).where(eq(tags.nama, namaTag));
  if (existing) throw galat.sudahAda(`Tag '${namaTag}' sudah terdaftar.`);

  const [row] = await db
    .insert(tags)
    .values({
      nama: namaTag,
      warna: input.warna ?? null,
      keterangan: input.keterangan ?? null,
      aktif: input.aktif ?? true,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat tag.");
  return row;
}

export async function ubahTag(
  id: string,
  input: Partial<SimpanTagInput>,
  penggunaId: string,
): Promise<Tag> {
  await ambilTag(id);

  const dataUpdate: Partial<typeof tags.$inferInsert> = {
    warna: input.warna,
    keterangan: input.keterangan,
    aktif: input.aktif,
    diubahOleh: penggunaId,
    diubahPada: new Date(),
  };

  if (input.nama) {
    const namaTag = input.nama.trim().startsWith("#") ? input.nama.trim() : `#${input.nama.trim()}`;
    const [conflict] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.nama, namaTag), sql`${tags.id} != ${id}`));
    if (conflict) throw galat.sudahAda(`Tag '${namaTag}' sudah digunakan.`);
    dataUpdate.nama = namaTag;
  }

  const [updated] = await db
    .update(tags)
    .set(dataUpdate)
    .where(eq(tags.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui tag.");
  return updated;
}
