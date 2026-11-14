import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  budgetLines,
  budgets,
  chartOfAccounts,
  departments,
  journalEntries,
  journalItems,
  partners,
  projects,
  type Anggaran,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { keBigInt, keString } from "../shared/decimal";
import { PREFIKS, nomorBerikut } from "../shared/transaction";
import type {
  QueryAnggaranInput,
  QueryLabaRugiCabangInput,
  QueryLabaRugiProyekInput,
  QueryLaporanRealisasiInput,
  SimpanAnggaranInput,
} from "./model";

// ==========================================
// 1. PENGELOLAAN ANGGARAN (BUDGETS CRUD)
// ==========================================

export async function daftarAnggaran(query: QueryAnggaranInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.tahun) conditions.push(eq(budgets.tahun, query.tahun));
  if (query.status) conditions.push(eq(budgets.status, query.status));
  if (query.cabangId) conditions.push(eq(budgets.cabangId, query.cabangId));
  if (query.departemenId) conditions.push(eq(budgets.departemenId, query.departemenId));
  if (query.proyekId) conditions.push(eq(budgets.proyekId, query.proyekId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(budgets)
    .where(whereClause);

  const rows = await db
    .select({
      id: budgets.id,
      nomor: budgets.nomor,
      nama: budgets.nama,
      tahun: budgets.tahun,
      cabangId: budgets.cabangId,
      cabangNama: branches.nama,
      departemenId: budgets.departemenId,
      departemenNama: departments.nama,
      proyekId: budgets.proyekId,
      proyekNama: projects.nama,
      status: budgets.status,
      totalAnggaran: budgets.totalAnggaran,
      keterangan: budgets.keterangan,
      disetujuiOleh: budgets.disetujuiOleh,
      disetujuiPada: budgets.disetujuiPada,
      dibuatPada: budgets.dibuatPada,
    })
    .from(budgets)
    .leftJoin(branches, eq(budgets.cabangId, branches.id))
    .leftJoin(departments, eq(budgets.departemenId, departments.id))
    .leftJoin(projects, eq(budgets.proyekId, projects.id))
    .where(whereClause)
    .orderBy(desc(budgets.tahun), desc(budgets.dibuatPada))
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

export async function ambilAnggaran(id: string) {
  const [budget] = await db
    .select({
      id: budgets.id,
      nomor: budgets.nomor,
      nama: budgets.nama,
      tahun: budgets.tahun,
      cabangId: budgets.cabangId,
      cabangNama: branches.nama,
      departemenId: budgets.departemenId,
      departemenNama: departments.nama,
      proyekId: budgets.proyekId,
      proyekNama: projects.nama,
      status: budgets.status,
      totalAnggaran: budgets.totalAnggaran,
      keterangan: budgets.keterangan,
      disetujuiOleh: budgets.disetujuiOleh,
      disetujuiPada: budgets.disetujuiPada,
      dibuatOleh: budgets.dibuatOleh,
      dibuatPada: budgets.dibuatPada,
    })
    .from(budgets)
    .leftJoin(branches, eq(budgets.cabangId, branches.id))
    .leftJoin(departments, eq(budgets.departemenId, departments.id))
    .leftJoin(projects, eq(budgets.proyekId, projects.id))
    .where(eq(budgets.id, id));

  if (!budget) throw galat.tidakDitemukan(`Anggaran dengan ID ${id}`);

  const lines = await db
    .select({
      id: budgetLines.id,
      akunId: budgetLines.akunId,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
      akunTipe: chartOfAccounts.tipeAkun,
      periode: budgetLines.periode,
      jumlah: budgetLines.jumlah,
      keterangan: budgetLines.keterangan,
    })
    .from(budgetLines)
    .innerJoin(chartOfAccounts, eq(budgetLines.akunId, chartOfAccounts.id))
    .where(eq(budgetLines.anggaranId, id))
    .orderBy(chartOfAccounts.kode, budgetLines.periode);

  return {
    ...budget,
    baris: lines,
  };
}

export async function buatAnggaran(
  input: SimpanAnggaranInput,
  penggunaId: string,
): Promise<Anggaran> {
  return await db.transaction(async (tx) => {
    const tanggalRef = `${input.tahun}-01-01`;
    const nomor = input.nomor?.trim()
      ? input.nomor.trim()
      : await nomorBerikut(tx, PREFIKS.ANGGARAN, tanggalRef);

    const [existing] = await tx.select().from(budgets).where(eq(budgets.nomor, nomor));
    if (existing) throw galat.sudahAda(`Anggaran dengan nomor '${nomor}' sudah terdaftar.`);

    // Validasi akun COA
    const idAkunUnik = [...new Set(input.baris.map((b) => b.akunId))];
    const daftarAkun = await tx
      .select()
      .from(chartOfAccounts)
      .where(inArray(chartOfAccounts.id, idAkunUnik));

    if (daftarAkun.length !== idAkunUnik.length) {
      throw galat.aturanBisnis("Terdapat akun yang tidak ditemukan di bagan akun (COA).");
    }

    // Hitung total anggaran
    let totalAnggaranBig = BigInt(0);
    for (const b of input.baris) {
      // Pastikan periode sesuai dengan tahun anggaran
      if (!b.periode.startsWith(`${input.tahun}-`)) {
        throw galat.aturanBisnis(`Periode baris '${b.periode}' harus berada pada tahun anggaran ${input.tahun}.`);
      }
      totalAnggaranBig += keBigInt(b.jumlah);
    }

    const [header] = await tx
      .insert(budgets)
      .values({
        nomor,
        nama: input.nama,
        tahun: input.tahun,
        cabangId: input.cabangId ?? null,
        departemenId: input.departemenId ?? null,
        proyekId: input.proyekId ?? null,
        status: "DRAFT",
        totalAnggaran: keString(totalAnggaranBig),
        keterangan: input.keterangan ?? null,
        dibuatOleh: penggunaId,
        diubahOleh: penggunaId,
      })
      .returning();

    if (!header) throw galat.aturanBisnis("Gagal membuat anggaran.");

    // Simpan rincian baris
    await tx.insert(budgetLines).values(
      input.baris.map((b) => ({
        anggaranId: header.id,
        akunId: b.akunId,
        periode: b.periode,
        jumlah: b.jumlah,
        keterangan: b.keterangan ?? null,
        dibuatOleh: penggunaId,
        diubahOleh: penggunaId,
      })),
    );

    return header;
  });
}

export async function ubahAnggaran(
  id: string,
  input: SimpanAnggaranInput,
  penggunaId: string,
): Promise<Anggaran> {
  return await db.transaction(async (tx) => {
    const [current] = await tx.select().from(budgets).where(eq(budgets.id, id)).for("update");
    if (!current) throw galat.tidakDitemukan(`Anggaran dengan ID ${id}`);

    if (current.status !== "DRAFT") {
      throw galat.aturanBisnis(`Hanya anggaran berstatus DRAFT yang dapat diubah (status saat ini: ${current.status}).`);
    }

    let totalAnggaranBig = BigInt(0);
    for (const b of input.baris) {
      if (!b.periode.startsWith(`${input.tahun}-`)) {
        throw galat.aturanBisnis(`Periode baris '${b.periode}' harus berada pada tahun anggaran ${input.tahun}.`);
      }
      totalAnggaranBig += keBigInt(b.jumlah);
    }

    // Hapus baris lama dan re-insert
    await tx.delete(budgetLines).where(eq(budgetLines.anggaranId, id));
    await tx.insert(budgetLines).values(
      input.baris.map((b) => ({
        anggaranId: id,
        akunId: b.akunId,
        periode: b.periode,
        jumlah: b.jumlah,
        keterangan: b.keterangan ?? null,
        dibuatOleh: penggunaId,
        diubahOleh: penggunaId,
      })),
    );

    const [updated] = await tx
      .update(budgets)
      .set({
        nama: input.nama,
        tahun: input.tahun,
        cabangId: input.cabangId ?? null,
        departemenId: input.departemenId ?? null,
        proyekId: input.proyekId ?? null,
        totalAnggaran: keString(totalAnggaranBig),
        keterangan: input.keterangan ?? null,
        diubahOleh: penggunaId,
        diubahPada: new Date(),
      })
      .where(eq(budgets.id, id))
      .returning();

    if (!updated) throw galat.aturanBisnis("Gagal memperbarui anggaran.");
    return updated;
  });
}

export async function setujuiAnggaran(id: string, penggunaId: string): Promise<Anggaran> {
  const [current] = await db.select().from(budgets).where(eq(budgets.id, id));
  if (!current) throw galat.tidakDitemukan(`Anggaran dengan ID ${id}`);
  if (current.status !== "DRAFT") {
    throw galat.aturanBisnis(`Hanya anggaran DRAFT yang dapat disetujui (status: ${current.status}).`);
  }

  const [updated] = await db
    .update(budgets)
    .set({
      status: "DISETUJUI",
      disetujuiOleh: penggunaId,
      disetujuiPada: new Date(),
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(budgets.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal menyetujui anggaran.");
  return updated;
}

export async function tutupAnggaran(id: string, penggunaId: string): Promise<Anggaran> {
  const [current] = await db.select().from(budgets).where(eq(budgets.id, id));
  if (!current) throw galat.tidakDitemukan(`Anggaran dengan ID ${id}`);

  const [updated] = await db
    .update(budgets)
    .set({
      status: "DITUTUP",
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(budgets.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal menutup anggaran.");
  return updated;
}

function hitungRentangTanggalPeriode(tahun: number, periode?: string): { awal: string; akhir: string } {
  if (!periode) {
    return { awal: `${tahun}-01-01`, akhir: `${tahun}-12-31` };
  }
  const parts = periode.split("-");
  const y = parseInt(parts[0] ?? String(tahun), 10);
  const m = parseInt(parts[1] ?? "1", 10);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    awal: `${periode}-01`,
    akhir: `${periode}-${String(lastDay).padStart(2, "0")}`,
  };
}

// ==========================================
// 2. LAPORAN ANGGARAN VS REALISASI
// ==========================================

export async function laporanAnggaranVsRealisasi(query: QueryLaporanRealisasiInput) {
  // 1. Ambil baris anggaran target
  const budgetConditions = [eq(budgets.tahun, query.tahun)];
  if (query.anggaranId) budgetConditions.push(eq(budgets.id, query.anggaranId));
  else budgetConditions.push(eq(budgets.status, "DISETUJUI"));

  if (query.cabangId) budgetConditions.push(eq(budgets.cabangId, query.cabangId));
  if (query.departemenId) budgetConditions.push(eq(budgets.departemenId, query.departemenId));
  if (query.proyekId) budgetConditions.push(eq(budgets.proyekId, query.proyekId));

  const budgetLinesConditions = [];
  if (query.periode) budgetLinesConditions.push(eq(budgetLines.periode, query.periode));

  const targetRows = await db
    .select({
      akunId: budgetLines.akunId,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
      akunTipe: chartOfAccounts.tipeAkun,
      periode: budgetLines.periode,
      jumlahAnggaran: budgetLines.jumlah,
    })
    .from(budgetLines)
    .innerJoin(budgets, eq(budgetLines.anggaranId, budgets.id))
    .innerJoin(chartOfAccounts, eq(budgetLines.akunId, chartOfAccounts.id))
    .where(
      and(
        ...budgetConditions,
        ...(budgetLinesConditions.length > 0 ? budgetLinesConditions : []),
      ),
    );

  // 2. Agregasi anggaran per akun
  const petaAnggaran = new Map<
    string,
    {
      akunId: string;
      akunKode: string;
      akunNama: string;
      akunTipe: string;
      totalAnggaran: bigint;
    }
  >();

  for (const r of targetRows) {
    const existing = petaAnggaran.get(r.akunId);
    const jml = keBigInt(r.jumlahAnggaran);
    if (existing) {
      existing.totalAnggaran += jml;
    } else {
      petaAnggaran.set(r.akunId, {
        akunId: r.akunId,
        akunKode: r.akunKode,
        akunNama: r.akunNama,
        akunTipe: r.akunTipe,
        totalAnggaran: jml,
      });
    }
  }

  // 3. Ambil Realisasi dari Jurnal Terposting (Journal Items)
  const rentang = hitungRentangTanggalPeriode(query.tahun, query.periode);
  const awalTahun = rentang.awal;
  const akhirTahun = rentang.akhir;

  const journalConditions = [
    eq(journalEntries.status, "POSTED"),
    gte(journalEntries.tanggal, awalTahun),
    lte(journalEntries.tanggal, akhirTahun),
  ];

  if (query.cabangId) journalConditions.push(eq(journalItems.cabangId, query.cabangId));
  if (query.departemenId) journalConditions.push(eq(journalItems.departemenId, query.departemenId));
  if (query.proyekId) journalConditions.push(eq(journalItems.proyekId, query.proyekId));

  const realisasiRows = await db
    .select({
      akunId: journalItems.akunId,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
      akunTipe: chartOfAccounts.tipeAkun,
      debitDasar: journalItems.debitDasar,
      kreditDasar: journalItems.kreditDasar,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
    .innerJoin(chartOfAccounts, eq(journalItems.akunId, chartOfAccounts.id))
    .where(and(...journalConditions));

  const petaRealisasi = new Map<string, bigint>();
  for (const row of realisasiRows) {
    const debit = keBigInt(row.debitDasar);
    const kredit = keBigInt(row.kreditDasar);

    // Untuk PENDAPATAN: net kredit (kredit - debit)
    // Untuk BEBAN: net debit (debit - kredit)
    let net = BigInt(0);
    if (row.akunTipe === "PENDAPATAN") {
      net = kredit - debit;
    } else {
      net = debit - kredit;
    }

    const cur = petaRealisasi.get(row.akunId) ?? BigInt(0);
    petaRealisasi.set(row.akunId, cur + net);
  }

  // 4. Gabungkan seluruh akun yang memiliki anggaran atau realisasi
  const semuaAkunId = new Set([...petaAnggaran.keys(), ...petaRealisasi.keys()]);
  const daftarPerbandingan = [];

  let totalAnggaranPendapatan = BigInt(0);
  let totalRealisasiPendapatan = BigInt(0);
  let totalAnggaranBeban = BigInt(0);
  let totalRealisasiBeban = BigInt(0);

  for (const idAkun of semuaAkunId) {
    const b = petaAnggaran.get(idAkun);
    const r = petaRealisasi.get(idAkun) ?? BigInt(0);

    let akunKode = b?.akunKode;
    let akunNama = b?.akunNama;
    let akunTipe = b?.akunTipe;

    if (!b) {
      // Cari metadata akun dari database jika tidak ada di anggaran
      const [akunDb] = await db
        .select({ kode: chartOfAccounts.kode, nama: chartOfAccounts.nama, tipe: chartOfAccounts.tipeAkun })
        .from(chartOfAccounts)
        .where(eq(chartOfAccounts.id, idAkun));
      akunKode = akunDb?.kode ?? "";
      akunNama = akunDb?.nama ?? "";
      akunTipe = akunDb?.tipe ?? "BEBAN";
    }

    const anggaranBig = b?.totalAnggaran ?? BigInt(0);
    const selisihBig = r - anggaranBig;

    // Persentase realisasi
    let persenRealisasi = 0;
    if (anggaranBig > BigInt(0)) {
      persenRealisasi = Number((r * BigInt(10000)) / anggaranBig) / 100;
    }

    if (akunTipe === "PENDAPATAN") {
      totalAnggaranPendapatan += anggaranBig;
      totalRealisasiPendapatan += r;
    } else if (akunTipe === "BEBAN") {
      totalAnggaranBeban += anggaranBig;
      totalRealisasiBeban += r;
    }

    daftarPerbandingan.push({
      akunId: idAkun,
      akunKode,
      akunNama,
      akunTipe,
      anggaran: keString(anggaranBig),
      realisasi: keString(r),
      selisih: keString(selisihBig),
      persenRealisasi: persenRealisasi.toFixed(2),
      statusVarian:
        akunTipe === "BEBAN"
          ? selisihBig > BigInt(0)
            ? "OVER_BUDGET"
            : "UNDER_BUDGET"
          : selisihBig >= BigInt(0)
            ? "ACHIEVED"
            : "UNACHIEVED",
    });
  }

  // Urutkan berdasarkan kode akun
  daftarPerbandingan.sort((a, b) => (a.akunKode ?? "").localeCompare(b.akunKode ?? ""));

  return {
    tahun: query.tahun,
    periode: query.periode ?? "TAHUNAN",
    ringkasan: {
      totalAnggaranPendapatan: keString(totalAnggaranPendapatan),
      totalRealisasiPendapatan: keString(totalRealisasiPendapatan),
      totalAnggaranBeban: keString(totalAnggaranBeban),
      totalRealisasiBeban: keString(totalRealisasiBeban),
      labaAnggaran: keString(totalAnggaranPendapatan - totalAnggaranBeban),
      labaRealisasi: keString(totalRealisasiPendapatan - totalRealisasiBeban),
    },
    daftarAkun: daftarPerbandingan,
  };
}

// ==========================================
// 3. LAPORAN LABA RUGI PER PROYEK
// ==========================================

export async function laporanLabaRugiProyek(query: QueryLabaRugiProyekInput) {
  const [proyek] = await db
    .select({
      id: projects.id,
      kode: projects.kode,
      nama: projects.nama,
      nilaiKontrak: projects.nilaiKontrak,
      status: projects.status,
      pelangganNama: partners.nama,
    })
    .from(projects)
    .leftJoin(partners, eq(projects.pelangganId, partners.id))
    .where(eq(projects.id, query.proyekId));

  if (!proyek) throw galat.tidakDitemukan(`Proyek ID ${query.proyekId}`);

  const conditions = [
    eq(journalEntries.status, "POSTED"),
    eq(journalItems.proyekId, query.proyekId),
  ];

  if (query.dariTanggal) conditions.push(gte(journalEntries.tanggal, query.dariTanggal));
  if (query.sampaiTanggal) conditions.push(lte(journalEntries.tanggal, query.sampaiTanggal));

  const rows = await db
    .select({
      akunId: journalItems.akunId,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
      akunTipe: chartOfAccounts.tipeAkun,
      debitDasar: journalItems.debitDasar,
      kreditDasar: journalItems.kreditDasar,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
    .innerJoin(chartOfAccounts, eq(journalItems.akunId, chartOfAccounts.id))
    .where(and(...conditions));

  const itemsPendapatan = new Map<string, { kode: string; nama: string; total: bigint }>();
  const itemsBeban = new Map<string, { kode: string; nama: string; total: bigint }>();

  let totalPendapatanBig = BigInt(0);
  let totalBebanBig = BigInt(0);

  for (const r of rows) {
    const debit = keBigInt(r.debitDasar);
    const kredit = keBigInt(r.kreditDasar);

    if (r.akunTipe === "PENDAPATAN") {
      const net = kredit - debit;
      totalPendapatanBig += net;
      const ex = itemsPendapatan.get(r.akunId) ?? { kode: r.akunKode, nama: r.akunNama, total: BigInt(0) };
      ex.total += net;
      itemsPendapatan.set(r.akunId, ex);
    } else if (r.akunTipe === "BEBAN") {
      const net = debit - kredit;
      totalBebanBig += net;
      const ex = itemsBeban.get(r.akunId) ?? { kode: r.akunKode, nama: r.akunNama, total: BigInt(0) };
      ex.total += net;
      itemsBeban.set(r.akunId, ex);
    }
  }

  const labaBersihBig = totalPendapatanBig - totalBebanBig;
  let profitMarginPersen = 0;
  if (totalPendapatanBig > BigInt(0)) {
    profitMarginPersen = Number((labaBersihBig * BigInt(10000)) / totalPendapatanBig) / 100;
  }

  return {
    proyek: {
      id: proyek.id,
      kode: proyek.kode,
      nama: proyek.nama,
      nilaiKontrak: proyek.nilaiKontrak,
      status: proyek.status,
    },
    ringkasan: {
      totalPendapatan: keString(totalPendapatanBig),
      totalBeban: keString(totalBebanBig),
      labaBersih: keString(labaBersihBig),
      profitMarginPersen: profitMarginPersen.toFixed(2),
    },
    rincianPendapatan: Array.from(itemsPendapatan.values()).map((p) => ({
      ...p,
      total: keString(p.total),
    })),
    rincianBeban: Array.from(itemsBeban.values()).map((b) => ({
      ...b,
      total: keString(b.total),
    })),
  };
}

// ==========================================
// 4. LAPORAN LABA RUGI PER CABANG
// ==========================================

export async function laporanLabaRugiCabang(query: QueryLabaRugiCabangInput) {
  // Ambil daftar cabang
  const branchConditions = [];
  if (query.cabangId) branchConditions.push(eq(branches.id, query.cabangId));

  const listCabang = await db
    .select({
      id: branches.id,
      kode: branches.kode,
      nama: branches.nama,
      pusat: branches.pusat,
    })
    .from(branches)
    .where(branchConditions.length > 0 ? and(...branchConditions) : undefined)
    .orderBy(desc(branches.pusat), branches.kode);

  // Ambil transaksi jurnal POSTED
  const conditions = [eq(journalEntries.status, "POSTED")];
  if (query.cabangId) conditions.push(eq(journalItems.cabangId, query.cabangId));
  if (query.dariTanggal) conditions.push(gte(journalEntries.tanggal, query.dariTanggal));
  if (query.sampaiTanggal) conditions.push(lte(journalEntries.tanggal, query.sampaiTanggal));

  const rows = await db
    .select({
      cabangId: journalItems.cabangId,
      akunTipe: chartOfAccounts.tipeAkun,
      debitDasar: journalItems.debitDasar,
      kreditDasar: journalItems.kreditDasar,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
    .innerJoin(chartOfAccounts, eq(journalItems.akunId, chartOfAccounts.id))
    .where(and(...conditions));

  const petaCabang = new Map<string, { pendapatan: bigint; beban: bigint }>();
  for (const c of listCabang) {
    petaCabang.set(c.id, { pendapatan: BigInt(0), beban: BigInt(0) });
  }

  let totalPendapatanKonsolidasi = BigInt(0);
  let totalBebanKonsolidasi = BigInt(0);

  for (const r of rows) {
    const debit = keBigInt(r.debitDasar);
    const kredit = keBigInt(r.kreditDasar);

    if (r.akunTipe === "PENDAPATAN") {
      const net = kredit - debit;
      totalPendapatanKonsolidasi += net;
      if (r.cabangId && petaCabang.has(r.cabangId)) {
        petaCabang.get(r.cabangId)!.pendapatan += net;
      }
    } else if (r.akunTipe === "BEBAN") {
      const net = debit - kredit;
      totalBebanKonsolidasi += net;
      if (r.cabangId && petaCabang.has(r.cabangId)) {
        petaCabang.get(r.cabangId)!.beban += net;
      }
    }
  }

  const hasilCabang = listCabang.map((c) => {
    const data = petaCabang.get(c.id) ?? { pendapatan: BigInt(0), beban: BigInt(0) };
    const labaBersih = data.pendapatan - data.beban;
    let margin = 0;
    if (data.pendapatan > BigInt(0)) {
      margin = Number((labaBersih * BigInt(10000)) / data.pendapatan) / 100;
    }

    return {
      cabangId: c.id,
      cabangKode: c.kode,
      cabangNama: c.nama,
      pusat: c.pusat,
      pendapatan: keString(data.pendapatan),
      beban: keString(data.beban),
      labaBersih: keString(labaBersih),
      marginPersen: margin.toFixed(2),
    };
  });

  return {
    periode: {
      dariTanggal: query.dariTanggal ?? null,
      sampaiTanggal: query.sampaiTanggal ?? null,
    },
    konsolidasi: {
      totalPendapatan: keString(totalPendapatanKonsolidasi),
      totalBeban: keString(totalBebanKonsolidasi),
      labaBersih: keString(totalPendapatanKonsolidasi - totalBebanKonsolidasi),
    },
    daftarCabang: hasilCabang,
  };
}
