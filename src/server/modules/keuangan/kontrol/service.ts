import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "../shared/context";
import {
  approvalActions,
  approvalRules,
  auditLogs,
  branches,
  companies,
  companyInvitations,
  companyUsers,
  currencies,
  documentApprovals,
  roles,
  transactionLocks,
  userBranchAccess,
  userWarehouseAccess,
  warehouses,
  type AturanPersetujuan,
  type JenisDokumenPersetujuan,
  type Perusahaan,
} from "@/db/schema/keuangan";
import { user } from "@/db/schema/auth";
import { galat } from "@/server/core/errors";
import { keBigInt } from "../shared/decimal";
import { bacaHalaman } from "../shared/pagination";
import type {
  AksiPersetujuanInput,
  AturAksesCabangInput,
  AturAksesGudangInput,
  QueryAturanPersetujuanInput,
  QueryAuditLogInput,
  QueryPersetujuanInput,
  QueryPerusahaanInput,
  SimpanAturanPersetujuanInput,
  SimpanKunciTransaksiInput,
  SimpanPerusahaanInput,
  UbahAturanPersetujuanInput,
  UbahPerusahaanInput,
  UndangPenggunaInput,
} from "./model";

// ==========================================
// 1. PENGELOLAAN PERUSAHAAN (COMPANIES)
// ==========================================

export async function daftarPerusahaan(query: QueryPerusahaanInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.q) {
    const qLower = `%${query.q.toLowerCase()}%`;
    conditions.push(or(ilike(companies.kode, qLower), ilike(companies.nama, qLower)));
  }
  if (query.aktif !== undefined) {
    conditions.push(eq(companies.aktif, query.aktif));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(companies)
    .where(whereClause);

  const items = await db
    .select({
      id: companies.id,
      kode: companies.kode,
      nama: companies.nama,
      npwp: companies.npwp,
      alamat: companies.alamat,
      telepon: companies.telepon,
      email: companies.email,
      mataUangDasarId: companies.mataUangDasarId,
      mataUangKode: currencies.kode,
      adalahHolding: companies.adalahHolding,
      indukId: companies.indukId,
      aktif: companies.aktif,
      dibuatPada: companies.dibuatPada,
      jumlahPengguna: sql<number>`(SELECT count(*)::int FROM ${companyUsers} WHERE ${companyUsers.perusahaanId} = ${companies.id})`,
    })
    .from(companies)
    .leftJoin(currencies, eq(companies.mataUangDasarId, currencies.id))
    .where(whereClause)
    .orderBy(desc(companies.adalahHolding), asc(companies.kode))
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

export async function ambilPerusahaan(id: string) {
  const [perusahaan] = await db
    .select({
      id: companies.id,
      kode: companies.kode,
      nama: companies.nama,
      npwp: companies.npwp,
      alamat: companies.alamat,
      telepon: companies.telepon,
      email: companies.email,
      mataUangDasarId: companies.mataUangDasarId,
      mataUangKode: currencies.kode,
      mataUangNama: currencies.nama,
      mataUangSimbol: currencies.simbol,
      adalahHolding: companies.adalahHolding,
      indukId: companies.indukId,
      logo: companies.logo,
      aktif: companies.aktif,
      dibuatPada: companies.dibuatPada,
      diubahPada: companies.diubahPada,
    })
    .from(companies)
    .leftJoin(currencies, eq(companies.mataUangDasarId, currencies.id))
    .where(eq(companies.id, id));

  if (!perusahaan) throw galat.tidakDitemukan(`Perusahaan dengan ID ${id}`);

  // Ambil anak perusahaan bila merupakan holding
  const anakPerusahaan = await db
    .select({ id: companies.id, kode: companies.kode, nama: companies.nama })
    .from(companies)
    .where(eq(companies.indukId, id));

  return {
    ...perusahaan,
    anakPerusahaan,
  };
}

export async function buatPerusahaan(input: SimpanPerusahaanInput, oleh: string): Promise<Perusahaan> {
  const kodeBersih = input.kode.trim().toUpperCase();

  const [ada] = await db.select({ id: companies.id }).from(companies).where(eq(companies.kode, kodeBersih));
  if (ada) throw galat.aturanBisnis(`Perusahaan dengan kode '${kodeBersih}' sudah terdaftar.`);

  return await db.transaction(async (tx) => {
    const [baru] = await tx
      .insert(companies)
      .values({
        kode: kodeBersih,
        nama: input.nama.trim(),
        npwp: input.npwp?.trim() ?? null,
        alamat: input.alamat?.trim() ?? null,
        telepon: input.telepon?.trim() ?? null,
        email: input.email?.trim() ?? null,
        mataUangDasarId: input.mataUangDasarId ?? null,
        adalahHolding: input.adalahHolding ?? false,
        indukId: input.indukId ?? null,
        logo: input.logo?.trim() ?? null,
        aktif: true,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    if (!baru) throw galat.aturanBisnis("Gagal membuat data perusahaan.");

    // Tautkan pembuat ke perusahaan ini
    await tx
      .insert(companyUsers)
      .values({
        perusahaanId: baru.id,
        penggunaId: oleh,
        adalahUtama: true,
        dibuatOleh: oleh,
      })
      .onConflictDoNothing();

    return baru;
  });
}

export async function ubahPerusahaan(id: string, input: UbahPerusahaanInput, oleh: string) {
  const [current] = await db.select().from(companies).where(eq(companies.id, id));
  if (!current) throw galat.tidakDitemukan(`Perusahaan dengan ID ${id}`);

  const [updated] = await db
    .update(companies)
    .set({
      nama: input.nama ? input.nama.trim() : current.nama,
      npwp: input.npwp !== undefined ? input.npwp?.trim() ?? null : current.npwp,
      alamat: input.alamat !== undefined ? input.alamat?.trim() ?? null : current.alamat,
      telepon: input.telepon !== undefined ? input.telepon?.trim() ?? null : current.telepon,
      email: input.email !== undefined ? input.email?.trim() ?? null : current.email,
      mataUangDasarId: input.mataUangDasarId !== undefined ? input.mataUangDasarId : current.mataUangDasarId,
      adalahHolding: input.adalahHolding !== undefined ? input.adalahHolding : current.adalahHolding,
      indukId: input.indukId !== undefined ? input.indukId : current.indukId,
      logo: input.logo !== undefined ? input.logo?.trim() ?? null : current.logo,
      aktif: input.aktif !== undefined ? input.aktif : current.aktif,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(companies.id, id))
    .returning();

  return updated;
}

// ==========================================
// 2. UNDANGAN PENGGUNA (INVITATIONS)
// ==========================================

export async function buatUndangan(input: UndangPenggunaInput, oleh: string) {
  const [perusahaan] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, input.perusahaanId));
  if (!perusahaan) throw galat.tidakDitemukan("Perusahaan");

  const token = `inv_${crypto.randomUUID().replace(/-/g, "")}`;
  const kedaluwarsaPada = new Date();
  kedaluwarsaPada.setDate(kedaluwarsaPada.getDate() + 7); // 7 hari

  const [undangan] = await db
    .insert(companyInvitations)
    .values({
      perusahaanId: input.perusahaanId,
      email: input.email.trim().toLowerCase(),
      peranId: input.peranId,
      token,
      status: "MENUNGGU",
      kedaluwarsaPada,
      dibuatOleh: oleh,
    })
    .returning();

  return undangan;
}

export async function terimaUndangan(token: string, penggunaId: string) {
  const [undangan] = await db
    .select()
    .from(companyInvitations)
    .where(eq(companyInvitations.token, token));

  if (!undangan) throw galat.tidakDitemukan("Undangan tidak valid atau tidak ditemukan.");
  if (undangan.status !== "MENUNGGU") {
    throw galat.aturanBisnis(`Undangan sudah berstatus ${undangan.status}.`);
  }
  if (new Date() > undangan.kedaluwarsaPada) {
    await db
      .update(companyInvitations)
      .set({ status: "KADALUARSA" })
      .where(eq(companyInvitations.id, undangan.id));
    throw galat.aturanBisnis("Undangan telah kedaluwarsa. Minta administrator untuk mengirim ulang undangan.");
  }

  return await db.transaction(async (tx) => {
    // Tautkan user ke company_users
    await tx
      .insert(companyUsers)
      .values({
        perusahaanId: undangan.perusahaanId,
        penggunaId,
        peranId: undangan.peranId,
        adalahUtama: false,
        dibuatOleh: penggunaId,
      })
      .onConflictDoNothing();

    // Perbarui status undangan
    const [updated] = await tx
      .update(companyInvitations)
      .set({ status: "DITERIMA", diubahOleh: penggunaId, diubahPada: new Date() })
      .where(eq(companyInvitations.id, undangan.id))
      .returning();

    return updated;
  });
}

export async function batalkanUndangan(id: string, oleh: string) {
  const [undangan] = await db.select().from(companyInvitations).where(eq(companyInvitations.id, id));
  if (!undangan) throw galat.tidakDitemukan("Undangan");

  const [updated] = await db
    .update(companyInvitations)
    .set({ status: "DIBATALKAN", diubahOleh: oleh, diubahPada: new Date() })
    .where(eq(companyInvitations.id, id))
    .returning();

  return updated;
}

export async function daftarUndangan(perusahaanId: string) {
  return await db
    .select({
      id: companyInvitations.id,
      email: companyInvitations.email,
      peranId: companyInvitations.peranId,
      peranNama: roles.nama,
      token: companyInvitations.token,
      status: companyInvitations.status,
      kedaluwarsaPada: companyInvitations.kedaluwarsaPada,
      dibuatPada: companyInvitations.dibuatPada,
    })
    .from(companyInvitations)
    .leftJoin(roles, eq(companyInvitations.peranId, roles.id))
    .where(eq(companyInvitations.perusahaanId, perusahaanId))
    .orderBy(desc(companyInvitations.dibuatPada));
}

// ==========================================
// 3. PEMBATASAN AKSES CABANG & GUDANG
// ==========================================

export async function aturAksesCabangPengguna(input: AturAksesCabangInput, oleh: string) {
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, input.penggunaId));
  if (!u) throw galat.tidakDitemukan(`Pengguna ID ${input.penggunaId}`);

  return await db.transaction(async (tx) => {
    await tx.delete(userBranchAccess).where(eq(userBranchAccess.penggunaId, input.penggunaId));
    if (input.cabangIds.length > 0) {
      await tx.insert(userBranchAccess).values(
        input.cabangIds.map((cabangId) => ({
          penggunaId: input.penggunaId,
          cabangId,
          dibuatOleh: oleh,
        })),
      );
    }
    return { penggunaId: input.penggunaId, totalCabangDiizinkan: input.cabangIds.length };
  });
}

export async function ambilAksesCabangPengguna(penggunaId: string) {
  const baris = await db
    .select({
      cabangId: userBranchAccess.cabangId,
      kode: branches.kode,
      nama: branches.nama,
      pusat: branches.pusat,
    })
    .from(userBranchAccess)
    .innerJoin(branches, eq(userBranchAccess.cabangId, branches.id))
    .where(eq(userBranchAccess.penggunaId, penggunaId));

  return {
    terbatas: baris.length > 0,
    daftarCabang: baris,
  };
}

export async function aturAksesGudangPengguna(input: AturAksesGudangInput, oleh: string) {
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, input.penggunaId));
  if (!u) throw galat.tidakDitemukan(`Pengguna ID ${input.penggunaId}`);

  return await db.transaction(async (tx) => {
    await tx.delete(userWarehouseAccess).where(eq(userWarehouseAccess.penggunaId, input.penggunaId));
    if (input.gudangIds.length > 0) {
      await tx.insert(userWarehouseAccess).values(
        input.gudangIds.map((gudangId) => ({
          penggunaId: input.penggunaId,
          gudangId,
          dibuatOleh: oleh,
        })),
      );
    }
    return { penggunaId: input.penggunaId, totalGudangDiizinkan: input.gudangIds.length };
  });
}

export async function ambilAksesGudangPengguna(penggunaId: string) {
  const baris = await db
    .select({
      gudangId: userWarehouseAccess.gudangId,
      kode: warehouses.kode,
      nama: warehouses.nama,
    })
    .from(userWarehouseAccess)
    .innerJoin(warehouses, eq(userWarehouseAccess.gudangId, warehouses.id))
    .where(eq(userWarehouseAccess.penggunaId, penggunaId));

  return {
    terbatas: baris.length > 0,
    daftarGudang: baris,
  };
}

// ==========================================
// 4. AUDIT LOG (SIAPA, APA, KAPAN, SEBELUM/SESUDAH)
// ==========================================

export async function catatAuditLog(input: {
  perusahaanId?: string | null;
  penggunaId: string;
  penggunaNama?: string | null;
  aksi: string;
  entitas: string;
  entitasId: string;
  nomorReferensi?: string | null;
  dataSebelum?: unknown;
  dataSesudah?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    const [log] = await db
      .insert(auditLogs)
      .values({
        perusahaanId: input.perusahaanId ?? null,
        penggunaId: input.penggunaId,
        penggunaNama: input.penggunaNama ?? null,
        aksi: input.aksi.toUpperCase(),
        entitas: input.entitas.toUpperCase(),
        entitasId: input.entitasId,
        nomorReferensi: input.nomorReferensi ?? null,
        dataSebelum: input.dataSebelum !== undefined ? JSON.stringify(input.dataSebelum) : null,
        dataSesudah: input.dataSesudah !== undefined ? JSON.stringify(input.dataSesudah) : null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      })
      .returning();
    return log;
  } catch (err) {
    console.error("[catatAuditLog] Gagal menyimpan log audit:", err);
    return null;
  }
}

export async function daftarAuditLog(query: QueryAuditLogInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.q) {
    const qLower = `%${query.q.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(auditLogs.nomorReferensi, qLower),
        ilike(auditLogs.penggunaNama, qLower),
        ilike(auditLogs.entitasId, qLower),
      ),
    );
  }
  if (query.aksi) conditions.push(eq(auditLogs.aksi, query.aksi.toUpperCase()));
  if (query.entitas) conditions.push(eq(auditLogs.entitas, query.entitas.toUpperCase()));
  if (query.penggunaId) conditions.push(eq(auditLogs.penggunaId, query.penggunaId));
  if (query.dariTanggal) conditions.push(gte(auditLogs.waktu, new Date(query.dariTanggal)));
  if (query.sampaiTanggal) {
    const akhir = new Date(query.sampaiTanggal);
    akhir.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogs.waktu, akhir));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(whereClause);

  const items = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.waktu))
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

export async function ambilAuditLog(id: string) {
  const [log] = await db.select().from(auditLogs).where(eq(auditLogs.id, id));
  if (!log) throw galat.tidakDitemukan(`Log Audit ID ${id}`);

  return {
    ...log,
    dataSebelumParsed: log.dataSebelum ? JSON.parse(log.dataSebelum) : null,
    dataSesudahParsed: log.dataSesudah ? JSON.parse(log.dataSesudah) : null,
  };
}

// ==========================================
// 5. ALUR PERSETUJUAN BERTINGKAT (APPROVAL)
// ==========================================

export async function buatAturanPersetujuan(
  input: SimpanAturanPersetujuanInput,
  oleh: string,
): Promise<AturanPersetujuan> {
  const [baru] = await db
    .insert(approvalRules)
    .values({
      perusahaanId: input.perusahaanId ?? null,
      jenisDokumen: input.jenisDokumen,
      nominalMin: input.nominalMin ?? "0.0000",
      nominalMax: input.nominalMax ?? null,
      tingkat: input.tingkat ?? 1,
      peranId: input.peranId ?? null,
      penggunaId: input.penggunaId ?? null,
      keterangan: input.keterangan?.trim() ?? null,
      aktif: true,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  if (!baru) throw galat.aturanBisnis("Gagal membuat aturan persetujuan.");
  return baru;
}

export async function daftarAturanPersetujuan(query: QueryAturanPersetujuanInput) {
  const conditions = [];
  if (query.jenisDokumen) conditions.push(eq(approvalRules.jenisDokumen, query.jenisDokumen));
  if (query.aktif !== undefined) conditions.push(eq(approvalRules.aktif, query.aktif));

  return await db
    .select({
      id: approvalRules.id,
      jenisDokumen: approvalRules.jenisDokumen,
      nominalMin: approvalRules.nominalMin,
      nominalMax: approvalRules.nominalMax,
      tingkat: approvalRules.tingkat,
      peranId: approvalRules.peranId,
      peranNama: roles.nama,
      penggunaId: approvalRules.penggunaId,
      keterangan: approvalRules.keterangan,
      aktif: approvalRules.aktif,
      dibuatPada: approvalRules.dibuatPada,
    })
    .from(approvalRules)
    .leftJoin(roles, eq(approvalRules.peranId, roles.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(approvalRules.jenisDokumen, asc(approvalRules.tingkat));
}

export async function ubahAturanPersetujuan(id: string, input: UbahAturanPersetujuanInput, oleh: string) {
  const [current] = await db.select().from(approvalRules).where(eq(approvalRules.id, id));
  if (!current) throw galat.tidakDitemukan(`Aturan Persetujuan ID ${id}`);

  const [updated] = await db
    .update(approvalRules)
    .set({
      nominalMin: input.nominalMin !== undefined ? input.nominalMin : current.nominalMin,
      nominalMax: input.nominalMax !== undefined ? input.nominalMax : current.nominalMax,
      tingkat: input.tingkat !== undefined ? input.tingkat : current.tingkat,
      peranId: input.peranId !== undefined ? input.peranId : current.peranId,
      penggunaId: input.penggunaId !== undefined ? input.penggunaId : current.penggunaId,
      keterangan: input.keterangan !== undefined ? input.keterangan?.trim() ?? null : current.keterangan,
      aktif: input.aktif !== undefined ? input.aktif : current.aktif,
      diubahOleh: oleh,
      diubahPada: new Date(),
    })
    .where(eq(approvalRules.id, id))
    .returning();

  return updated;
}

export async function hapusAturanPersetujuan(id: string) {
  const [current] = await db.select().from(approvalRules).where(eq(approvalRules.id, id));
  if (!current) throw galat.tidakDitemukan(`Aturan Persetujuan ID ${id}`);

  await db.delete(approvalRules).where(eq(approvalRules.id, id));
  return { id, sukses: true };
}

/**
 * Mengevaluasi aturan persetujuan dan mendaftarkan dokumen ke alur approval jika perlu.
 */
export async function evaluasiDanAjukanPersetujuan(input: {
  perusahaanId?: string | null;
  jenisDokumen: JenisDokumenPersetujuan;
  dokumenId: string;
  nomorDokumen: string;
  nominal: string;
  diajukanOleh: string;
}) {
  const nominalBig = keBigInt(input.nominal);

  // Cari seluruh aturan aktif untuk jenis dokumen ini
  const rules = await db
    .select()
    .from(approvalRules)
    .where(and(eq(approvalRules.jenisDokumen, input.jenisDokumen), eq(approvalRules.aktif, true)))
    .orderBy(asc(approvalRules.tingkat));

  // Filter aturan yang mencakup nominal dokumen ini
  const matchingRules = rules.filter((r) => {
    const min = keBigInt(r.nominalMin);
    const max = r.nominalMax ? keBigInt(r.nominalMax) : null;
    if (nominalBig < min) return false;
    if (max !== null && nominalBig > max) return false;
    return true;
  });

  if (matchingRules.length === 0) {
    // Tidak ada aturan persetujuan yang cocok: dokumen langsung disetujui otomatis
    return {
      perluPersetujuan: false,
      status: "DISETUJUI" as const,
      persetujuanId: null,
    };
  }

  // Tentukan tingkat maksimal
  const tingkatMaksimal = Math.max(...matchingRules.map((r) => r.tingkat));

  const [persetujuan] = await db
    .insert(documentApprovals)
    .values({
      perusahaanId: input.perusahaanId ?? null,
      jenisDokumen: input.jenisDokumen,
      dokumenId: input.dokumenId,
      nomorDokumen: input.nomorDokumen,
      nominal: input.nominal,
      diajukanOleh: input.diajukanOleh,
      tingkatSaatIni: 1,
      tingkatMaksimal,
      status: "MENUNGGU",
    })
    .returning();

  return {
    perluPersetujuan: true,
    status: "MENUNGGU" as const,
    persetujuanId: persetujuan?.id,
    tingkatSaatIni: 1,
    tingkatMaksimal,
  };
}

export async function prosesAksiPersetujuan(
  input: AksiPersetujuanInput,
  penyetujuId: string,
  penyetujuNama?: string,
) {
  const [doc] = await db
    .select()
    .from(documentApprovals)
    .where(eq(documentApprovals.id, input.persetujuanId));

  if (!doc) throw galat.tidakDitemukan(`Pengajuan Persetujuan ID ${input.persetujuanId}`);
  if (doc.status !== "MENUNGGU") {
    throw galat.aturanBisnis(`Pengajuan persetujuan sudah berstatus ${doc.status}.`);
  }

  return await db.transaction(async (tx) => {
    // Catat tindakan persetujuan
    await tx.insert(approvalActions).values({
      persetujuanId: doc.id,
      tingkat: doc.tingkatSaatIni,
      penyetujuId,
      penyetujuNama: penyetujuNama ?? null,
      aksi: input.aksi,
      catatan: input.catatan?.trim() ?? null,
    });

    if (input.aksi === "DITOLAK") {
      const [rejected] = await tx
        .update(documentApprovals)
        .set({
          status: "DITOLAK",
          catatan: input.catatan?.trim() ?? null,
          diubahPada: new Date(),
        })
        .where(eq(documentApprovals.id, doc.id))
        .returning();
      return rejected;
    }

    // Jika DISETUJUI:
    if (doc.tingkatSaatIni < doc.tingkatMaksimal) {
      // Masih butuh persetujuan tingkat berikutnya
      const [nextLevel] = await tx
        .update(documentApprovals)
        .set({
          tingkatSaatIni: doc.tingkatSaatIni + 1,
          catatan: input.catatan?.trim() ?? null,
          diubahPada: new Date(),
        })
        .where(eq(documentApprovals.id, doc.id))
        .returning();
      return nextLevel;
    }

    // Tingkat akhir terpenuhi: dokumen resmi DISETUJUI penuh
    const [finalApproved] = await tx
      .update(documentApprovals)
      .set({
        status: "DISETUJUI",
        catatan: input.catatan?.trim() ?? null,
        diubahPada: new Date(),
      })
      .where(eq(documentApprovals.id, doc.id))
      .returning();

    return finalApproved;
  });
}

export async function daftarPersetujuanDokumen(query: QueryPersetujuanInput) {
  const { halaman, ukuran, offset } = bacaHalaman(query);

  const conditions = [];
  if (query.jenisDokumen) conditions.push(eq(documentApprovals.jenisDokumen, query.jenisDokumen));
  if (query.status) conditions.push(eq(documentApprovals.status, query.status));
  if (query.diajukanOleh) conditions.push(eq(documentApprovals.diajukanOleh, query.diajukanOleh));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(documentApprovals)
    .where(whereClause);

  const items = await db
    .select()
    .from(documentApprovals)
    .where(whereClause)
    .orderBy(desc(documentApprovals.diajukanPada))
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

export async function ambilDetailPersetujuan(id: string) {
  const [doc] = await db.select().from(documentApprovals).where(eq(documentApprovals.id, id));
  if (!doc) throw galat.tidakDitemukan(`Dokumen Persetujuan ID ${id}`);

  const tindakan = await db
    .select()
    .from(approvalActions)
    .where(eq(approvalActions.persetujuanId, id))
    .orderBy(asc(approvalActions.dilakukanPada));

  return {
    ...doc,
    riwayatTindakan: tindakan,
  };
}

// ==========================================
// 6. KUNCI TANGGAL TRANSAKSI (LOCK DATE)
// ==========================================

export async function ambilKunciTransaksi(perusahaanId?: string) {
  const [kunci] = await db
    .select()
    .from(transactionLocks)
    .where(perusahaanId ? eq(transactionLocks.perusahaanId, perusahaanId) : undefined)
    .limit(1);

  return (
    kunci ?? {
      id: null,
      perusahaanId: perusahaanId ?? null,
      kunciSemuaSebelum: null,
      kunciNonAdminSebelum: null,
      catatan: null,
    }
  );
}

export async function simpanKunciTransaksi(input: SimpanKunciTransaksiInput, oleh: string) {
  const existing = await ambilKunciTransaksi(input.perusahaanId);

  if (existing.id) {
    const [updated] = await db
      .update(transactionLocks)
      .set({
        kunciSemuaSebelum: input.kunciSemuaSebelum ?? null,
        kunciNonAdminSebelum: input.kunciNonAdminSebelum ?? null,
        catatan: input.catatan?.trim() ?? null,
        diubahOleh: oleh,
        diubahPada: new Date(),
      })
      .where(eq(transactionLocks.id, existing.id))
      .returning();
    return updated;
  }

  const [baru] = await db
    .insert(transactionLocks)
    .values({
      perusahaanId: input.perusahaanId ?? null,
      kunciSemuaSebelum: input.kunciSemuaSebelum ?? null,
      kunciNonAdminSebelum: input.kunciNonAdminSebelum ?? null,
      catatan: input.catatan?.trim() ?? null,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return baru;
}

/**
 * Validasi apakah tanggal transaksi berada di bawah batas tanggal penguncian (lock date).
 * Digunakan oleh engine jurnal saat membuat/mengubah/memposting jurnal.
 */
export async function pastikanTransaksiTidakTerkunci(
  tanggal: string,
  penggunaId?: string,
  adalahAdmin = false,
  perusahaanId?: string,
) {
  const kunci = await ambilKunciTransaksi(perusahaanId);

  // 1. Kunci Semua Sebelum (terkunci total termasuk bagi administrator)
  if (kunci.kunciSemuaSebelum && tanggal <= kunci.kunciSemuaSebelum) {
    throw galat.aturanBisnis(
      `Buku terkunci: transaksi bertanggal ${tanggal} mendahului tanggal penguncian buku ${kunci.kunciSemuaSebelum}. Koreksi tidak diperkenankan.`,
    );
  }

  // 2. Kunci Non-Admin Sebelum (hanya administrator dengan akses penuh yang boleh memposting)
  if (kunci.kunciNonAdminSebelum && tanggal <= kunci.kunciNonAdminSebelum && !adalahAdmin) {
    throw galat.aturanBisnis(
      `Transaksi terkunci untuk pengguna biasa: tanggal transaksi ${tanggal} berada pada atau sebelum ${kunci.kunciNonAdminSebelum}. Hubungi Administrator Keuangan.`,
    );
  }
}
