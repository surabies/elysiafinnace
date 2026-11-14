import { and, desc, eq, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assetCategories,
  assetDepreciations,
  chartOfAccounts,
  fixedAssets,
  type AsetTetap,
  type KategoriAset,
  type PenyusutanAset,
} from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { balikJurnal, simpanJurnal } from "../jurnal/engine";
import { ambilMataUangDasar } from "../mata-uang/service";
import { keBigInt, keString } from "../shared/decimal";
import { PREFIKS, nomorBerikut, type Tx } from "../shared/transaction";
import type {
  PelepasanAsetInput,
  QueryAsetTetapInput,
  QueryKategoriAsetInput,
  QueryLaporanAsetInput,
  QueryLaporanPenyusutanInput,
  SimpanAsetTetapInput,
} from "./model";

// ==========================================
// 1. KATEGORI ASET TETAP
// ==========================================

export async function daftarKategoriAset(query: QueryKategoriAsetInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.q) {
    conditions.push(or(ilike(assetCategories.kode, `%${query.q}%`), ilike(assetCategories.nama, `%${query.q}%`)));
  }
  if (query.aktif !== undefined) {
    const isAktif = typeof query.aktif === "string" ? query.aktif === "true" : Boolean(query.aktif);
    conditions.push(eq(assetCategories.aktif, isAktif));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assetCategories)
    .where(whereClause);

  const rows = await db
    .select()
    .from(assetCategories)
    .where(whereClause)
    .orderBy(assetCategories.kode)
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

export async function ambilKategoriAset(id: string): Promise<KategoriAset> {
  const [row] = await db.select().from(assetCategories).where(eq(assetCategories.id, id));
  if (!row) throw galat.tidakDitemukan(`Kategori aset dengan ID ${id}`);
  return row;
}

export async function buatKategoriAset(
  input: Omit<typeof assetCategories.$inferInsert, "id" | "dibuatPada" | "diubahPada">,
  penggunaId: string,
): Promise<KategoriAset> {
  const [existing] = await db.select().from(assetCategories).where(eq(assetCategories.kode, input.kode));
  if (existing) throw galat.sudahAda(`Kategori aset dengan kode '${input.kode}' sudah terdaftar.`);

  // Validasi akun COA terkait
  const [akunAset] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, input.akunAsetId));
  if (!akunAset) throw galat.tidakDitemukan("Akun aset tetap");

  const [akunAkum] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, input.akunAkumulasiPenyusutanId));
  if (!akunAkum) throw galat.tidakDitemukan("Akun akumulasi penyusutan");

  const [akunBeban] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, input.akunBebanPenyusutanId));
  if (!akunBeban) throw galat.tidakDitemukan("Akun beban penyusutan");

  const [row] = await db
    .insert(assetCategories)
    .values({
      ...input,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  if (!row) throw galat.aturanBisnis("Gagal membuat kategori aset tetap.");
  return row;
}

export async function ubahKategoriAset(
  id: string,
  input: Partial<Omit<typeof assetCategories.$inferInsert, "id" | "dibuatPada" | "diubahPada">>,
  penggunaId: string,
): Promise<KategoriAset> {
  await ambilKategoriAset(id);

  if (input.kode) {
    const [conflict] = await db
      .select()
      .from(assetCategories)
      .where(and(eq(assetCategories.kode, input.kode), sql`${assetCategories.id} != ${id}`));
    if (conflict) throw galat.sudahAda(`Kategori aset dengan kode '${input.kode}' sudah digunakan.`);
  }

  const [updated] = await db
    .update(assetCategories)
    .set({
      ...input,
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(assetCategories.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui kategori aset tetap.");
  return updated;
}

// ==========================================
// 2. REGISTRASI ASET TETAP
// ==========================================

export async function daftarAsetTetap(query: QueryAsetTetapInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.kategoriId) conditions.push(eq(fixedAssets.kategoriId, query.kategoriId));
  if (query.status) conditions.push(eq(fixedAssets.status, query.status));
  if (query.lokasi) conditions.push(ilike(fixedAssets.lokasi, `%${query.lokasi}%`));
  if (query.q) {
    conditions.push(or(ilike(fixedAssets.kode, `%${query.q}%`), ilike(fixedAssets.nama, `%${query.q}%`)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fixedAssets)
    .where(whereClause);

  const rows = await db
    .select()
    .from(fixedAssets)
    .where(whereClause)
    .orderBy(desc(fixedAssets.tanggalPerolehan), desc(fixedAssets.kode))
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

export async function ambilAsetTetap(id: string): Promise<AsetTetap> {
  const [row] = await db.select().from(fixedAssets).where(eq(fixedAssets.id, id));
  if (!row) throw galat.tidakDitemukan(`Aset tetap dengan ID ${id}`);
  return row;
}

export async function buatAsetTetap(input: SimpanAsetTetapInput, penggunaId: string): Promise<AsetTetap> {
  return await db.transaction(async (tx) => {
    const kategori = await ambilKategoriAset(input.kategoriId);

    const kode = input.kode?.trim()
      ? input.kode.trim()
      : await nomorBerikut(tx, PREFIKS.ASET_TETAP, input.tanggalPerolehan);

    const [existing] = await tx.select().from(fixedAssets).where(eq(fixedAssets.kode, kode));
    if (existing) throw galat.sudahAda(`Aset dengan kode '${kode}' sudah terdaftar.`);

    const masaManfaat = input.masaManfaatBulan ?? kategori.masaManfaatBulan;
    const metode = input.metodePenyusutan ?? kategori.metodePenyusutan;
    const nilaiResidu = input.nilaiResidu ?? "0.0000";
    const nilaiPerolehan = input.nilaiPerolehan;

    // Nilai buku awal = nilai perolehan
    const nilaiBuku = nilaiPerolehan;
    const tanggalMulai = input.tanggalMulaiPenyusutan ?? input.tanggalPerolehan;

    const [row] = await tx
      .insert(fixedAssets)
      .values({
        kode,
        nama: input.nama,
        kategoriId: input.kategoriId,
        tanggalPerolehan: input.tanggalPerolehan,
        tanggalMulaiPenyusutan: tanggalMulai,
        nilaiPerolehan,
        nilaiResidu,
        masaManfaatBulan: masaManfaat,
        metodePenyusutan: metode,
        lokasi: input.lokasi ?? null,
        penanggungJawab: input.penanggungJawab ?? null,
        nomorSeri: input.nomorSeri ?? null,
        status: "AKTIF",
        akumulasiPenyusutan: "0.0000",
        nilaiBuku,
        sisaManfaatBulan: masaManfaat,
        keterangan: input.keterangan ?? null,
        dibuatOleh: penggunaId,
        diubahOleh: penggunaId,
      })
      .returning();

    if (!row) throw galat.aturanBisnis("Gagal membuat registrasi aset tetap.");
    return row;
  });
}

export async function ubahAsetTetap(
  id: string,
  input: Partial<SimpanAsetTetapInput>,
  penggunaId: string,
): Promise<AsetTetap> {
  const current = await ambilAsetTetap(id);

  if (current.status === "DILEPAS") {
    throw galat.aturanBisnis("Aset yang sudah dilepas tidak dapat diubah lagi datanya.");
  }

  const [updated] = await db
    .update(fixedAssets)
    .set({
      nama: input.nama ?? current.nama,
      lokasi: input.lokasi ?? current.lokasi,
      penanggungJawab: input.penanggungJawab ?? current.penanggungJawab,
      nomorSeri: input.nomorSeri ?? current.nomorSeri,
      keterangan: input.keterangan ?? current.keterangan,
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(fixedAssets.id, id))
    .returning();

  if (!updated) throw galat.aturanBisnis("Gagal memperbarui data aset tetap.");
  return updated;
}

// ==========================================
// 3. KALKULASI & POSTING PENYUSUTAN BULANAN
// ==========================================

/**
 * Menghitung nominal penyusutan bulanan untuk sebuah aset.
 */
export function hitungPenyusutanBulanan(aset: AsetTetap, kategori: KategoriAset): bigint {
  if (aset.metodePenyusutan === "TIDAK_DISUSUTKAN" || aset.status !== "AKTIF") {
    return BigInt(0);
  }

  const nilaiBukuBig = keBigInt(aset.nilaiBuku);
  const nilaiResiduBig = keBigInt(aset.nilaiResidu);

  if (nilaiBukuBig <= nilaiResiduBig) {
    return BigInt(0);
  }

  let susut = BigInt(0);

  if (aset.metodePenyusutan === "GARIS_LURUS") {
    const nilaiDapatDisusutkan = keBigInt(aset.nilaiPerolehan) - nilaiResiduBig;
    const bulan = BigInt(aset.masaManfaatBulan || 1);
    susut = nilaiDapatDisusutkan / bulan;
  } else if (aset.metodePenyusutan === "SALDO_MENURUN") {
    // Saldo menurun: Nilai Buku * (Tarif Tahunan / 12)
    // tarifTahunanPersen skala 4 (misal 50.0000 = 50%)
    const tarif = keBigInt(kategori.tarifTahunanPersen);
    const setahun = (nilaiBukuBig * tarif) / BigInt(1000000); // skala 4 x skala 4 / 100
    susut = setahun / BigInt(12);
  }

  // Maksimum penyusutan tidak boleh menembus batas nilai residu
  const batasSusut = nilaiBukuBig - nilaiResiduBig;
  if (susut > batasSusut) {
    susut = batasSusut;
  }

  return susut > BigInt(0) ? susut : BigInt(0);
}

/**
 * Menjalankan penyusutan untuk 1 aset spesifik pada suatu periode (YYYY-MM).
 */
export async function susutkanAsetTunggal(
  tx: Tx,
  asetId: string,
  periode: string,
  tanggalJurnal: string,
  penggunaId: string,
  mataUangDasarId: string,
): Promise<PenyusutanAset | null> {
  const [aset] = await tx
    .select()
    .from(fixedAssets)
    .where(eq(fixedAssets.id, asetId))
    .for("update");

  if (!aset) throw galat.tidakDitemukan(`Aset ID ${asetId}`);
  if (aset.status !== "AKTIF") {
    throw galat.aturanBisnis(`Aset ${aset.kode} berstatus '${aset.status}' dan tidak dapat disusutkan.`);
  }

  // Cek apakah sudah disusutkan untuk periode ini (yang masih berstatus POSTED)
  const [sudahAda] = await tx
    .select()
    .from(assetDepreciations)
    .where(
      and(
        eq(assetDepreciations.asetId, asetId),
        eq(assetDepreciations.periode, periode),
        eq(assetDepreciations.status, "POSTED"),
      ),
    );

  if (sudahAda) {
    throw galat.aturanBisnis(`Aset ${aset.kode} sudah disusutkan untuk periode ${periode}.`);
  }

  const [kategori] = await tx
    .select()
    .from(assetCategories)
    .where(eq(assetCategories.id, aset.kategoriId));
  if (!kategori) throw galat.tidakDitemukan(`Kategori aset untuk ${aset.kode}`);

  const nilaiSusutBig = hitungPenyusutanBulanan(aset, kategori);
  if (nilaiSusutBig <= BigInt(0)) {
    // Tandai disusutkan penuh jika sudah di nilai residu
    await tx
      .update(fixedAssets)
      .set({ status: "DISUSUTKAN_PENUH", diubahOleh: penggunaId, diubahPada: new Date() })
      .where(eq(fixedAssets.id, asetId));
    return null;
  }

  const nilaiSusutStr = keString(nilaiSusutBig);
  const nilaiBukuAwalBig = keBigInt(aset.nilaiBuku);
  const nilaiBukuAkhirBig = nilaiBukuAwalBig - nilaiSusutBig;
  const akumulasiBaruBig = keBigInt(aset.akumulasiPenyusutan) + nilaiSusutBig;

  // Posting Jurnal Double-Entry Penyusutan
  // (Dr) Beban Penyusutan
  // (Cr) Akumulasi Penyusutan
  const jurnal = await simpanJurnal(
    tx,
    {
      tanggal: tanggalJurnal,
      deskripsi: `Penyusutan Aset Tetap ${aset.nama} (${aset.kode}) Periode ${periode}`,
      referensi: aset.kode,
      sumber: "PENYUSUTAN_ASET",
      sumberId: aset.id,
      mataUangId: mataUangDasarId,
      kurs: "1.00000000",
      posting: true,
      baris: [
        {
          akunId: kategori.akunBebanPenyusutanId,
          debit: nilaiSusutStr,
          kredit: "0.0000",
          deskripsi: `Beban penyusutan ${aset.nama} - ${periode}`,
        },
        {
          akunId: kategori.akunAkumulasiPenyusutanId,
          debit: "0.0000",
          kredit: nilaiSusutStr,
          deskripsi: `Akumulasi penyusutan ${aset.nama} - ${periode}`,
        },
      ],
    },
    penggunaId,
  );

  // Rekam riwayat penyusutan
  const [deprRow] = await tx
    .insert(assetDepreciations)
    .values({
      asetId,
      periode,
      tanggal: tanggalJurnal,
      nilaiPenyusutan: nilaiSusutStr,
      nilaiBukuAwal: keString(nilaiBukuAwalBig),
      nilaiBukuAkhir: keString(nilaiBukuAkhirBig),
      jurnalId: jurnal.id,
      status: "POSTED",
      keterangan: `Penyusutan otomatis periode ${periode}`,
      dibuatOleh: penggunaId,
      diubahOleh: penggunaId,
    })
    .returning();

  const sisaBulan = Math.max(0, aset.sisaManfaatBulan - 1);
  const disusutkanPenuh = nilaiBukuAkhirBig <= keBigInt(aset.nilaiResidu) || sisaBulan === 0;

  // Update nilai buku & akumulasi pada aset tetap
  await tx
    .update(fixedAssets)
    .set({
      akumulasiPenyusutan: keString(akumulasiBaruBig),
      nilaiBuku: keString(nilaiBukuAkhirBig),
      sisaManfaatBulan: sisaBulan,
      status: disusutkanPenuh ? "DISUSUTKAN_PENUH" : "AKTIF",
      diubahOleh: penggunaId,
      diubahPada: new Date(),
    })
    .where(eq(fixedAssets.id, asetId));

  if (!deprRow) throw galat.aturanBisnis("Gagal merekam riwayat penyusutan aset.");
  return deprRow;
}

function tanggalAkhirBulan(periode: string): string {
  const [thnStr, blnStr] = periode.split("-");
  const thn = Number(thnStr);
  const bln = Number(blnStr);
  const lastDay = new Date(thn, bln, 0).getDate();
  return `${periode}-${String(lastDay).padStart(2, "0")}`;
}

/**
 * Menjalankan penyusutan untuk satu aset tertentu pada periode tertentu.
 */
export async function postingPenyusutanTunggal(
  asetId: string,
  input: { periode: string; tanggal?: string; keterangan?: string },
  penggunaId: string,
) {
  const muDasar = await ambilMataUangDasar();
  const tanggalJurnal = input.tanggal ?? tanggalAkhirBulan(input.periode);

  return await db.transaction(async (tx) => {
    return await susutkanAsetTunggal(
      tx,
      asetId,
      input.periode,
      tanggalJurnal,
      penggunaId,
      muDasar.id,
    );
  });
}

/**
 * Menjalankan batch penyusutan bulanan untuk seluruh aset aktif yang jatuh tempo disusutkan.
 */
export async function postingPenyusutanBatch(
  input: { periode: string; tanggal?: string; keterangan?: string },
  penggunaId: string,
) {
  const muDasar = await ambilMataUangDasar();
  const akhirBulanPeriode = tanggalAkhirBulan(input.periode);
  const tanggalJurnal = input.tanggal ?? akhirBulanPeriode;

  return await db.transaction(async (tx) => {
    // Ambil semua aset aktif yang tanggal perolehannya <= akhir bulan periode
    const daftarAsetAktif = await tx
      .select()
      .from(fixedAssets)
      .where(
        and(
          eq(fixedAssets.status, "AKTIF"),
          lte(fixedAssets.tanggalMulaiPenyusutan, akhirBulanPeriode),
        ),
      )
      .orderBy(fixedAssets.kode);

    const hasilList: PenyusutanAset[] = [];
    let totalNominal = BigInt(0);

    for (const aset of daftarAsetAktif) {
      // Cek apakah sudah disusutkan pada periode ini (yang masih berstatus POSTED)
      const [sudah] = await tx
        .select()
        .from(assetDepreciations)
        .where(
          and(
            eq(assetDepreciations.asetId, aset.id),
            eq(assetDepreciations.periode, input.periode),
            eq(assetDepreciations.status, "POSTED"),
          ),
        );

      if (!sudah) {
        const hasil = await susutkanAsetTunggal(
          tx,
          aset.id,
          input.periode,
          tanggalJurnal,
          penggunaId,
          muDasar.id,
        );
        if (hasil) {
          hasilList.push(hasil);
          totalNominal += keBigInt(hasil.nilaiPenyusutan);
        }
      }
    }

    return {
      periode: input.periode,
      tanggal: tanggalJurnal,
      jumlahAsetDisusutkan: hasilList.length,
      totalNilaiPenyusutan: keString(totalNominal),
      daftarPenyusutan: hasilList,
    };
  });
}

/**
 * Membatalkan penyusutan pada suatu bulan dan memulihkan nilai buku aset.
 */
export async function batalkanPenyusutan(
  penyusutanId: string,
  alasan: string | undefined,
  penggunaId: string,
) {
  return await db.transaction(async (tx) => {
    const [depr] = await tx
      .select()
      .from(assetDepreciations)
      .where(eq(assetDepreciations.id, penyusutanId))
      .for("update");

    if (!depr) throw galat.tidakDitemukan(`Data penyusutan dengan ID ${penyusutanId}`);
    if (depr.status === "DIBATALKAN") {
      throw galat.aturanBisnis("Penyusutan ini sudah berstatus DIBATALKAN.");
    }

    const [aset] = await tx
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.id, depr.asetId))
      .for("update");
    if (!aset) throw galat.tidakDitemukan(`Aset terkait`);

    // Balik jurnal jika ada
    if (depr.jurnalId) {
      await balikJurnal(
        tx,
        depr.jurnalId,
        {
          tanggal: depr.tanggal,
          deskripsi: alasan ?? `Pembatalan penyusutan ${aset.kode} periode ${depr.periode}`,
        },
        penggunaId,
      );
    }

    // Pulihkan saldo pada aset tetap
    const susutBig = keBigInt(depr.nilaiPenyusutan);
    const akumulasiPulihBig = keBigInt(aset.akumulasiPenyusutan) - susutBig;
    const nilaiBukuPulihBig = keBigInt(aset.nilaiBuku) + susutBig;
    const sisaBulanPulih = aset.sisaManfaatBulan + 1;

    await tx
      .update(fixedAssets)
      .set({
        akumulasiPenyusutan: keString(akumulasiPulihBig > BigInt(0) ? akumulasiPulihBig : BigInt(0)),
        nilaiBuku: keString(nilaiBukuPulihBig),
        sisaManfaatBulan: sisaBulanPulih,
        status: "AKTIF",
        diubahOleh: penggunaId,
        diubahPada: new Date(),
      })
      .where(eq(fixedAssets.id, aset.id));

    const [updated] = await tx
      .update(assetDepreciations)
      .set({
        status: "DIBATALKAN",
        keterangan: alasan ? `Dibatalkan: ${alasan}` : "Dibatalkan oleh pengguna",
        diubahOleh: penggunaId,
        diubahPada: new Date(),
      })
      .where(eq(assetDepreciations.id, penyusutanId))
      .returning();

    if (!updated) throw galat.aturanBisnis("Gagal membatalkan penyusutan.");
    return updated;
  });
}

// ==========================================
// 4. PELEPASAN / PENJUALAN ASET TETAP
// ==========================================

export async function lepasAsetTetap(
  asetId: string,
  input: PelepasanAsetInput,
  penggunaId: string,
): Promise<AsetTetap> {
  const muDasar = await ambilMataUangDasar();

  return await db.transaction(async (tx) => {
    const [aset] = await tx
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.id, asetId))
      .for("update");

    if (!aset) throw galat.tidakDitemukan(`Aset tetap dengan ID ${asetId}`);
    if (aset.status === "DILEPAS") {
      throw galat.aturanBisnis(`Aset ${aset.kode} sudah berstatus DILEPAS.`);
    }

    const [kategori] = await tx
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, aset.kategoriId));
    if (!kategori) throw galat.tidakDitemukan(`Kategori aset untuk ${aset.kode}`);

    const kasDiterimaBig = input.nilaiPelepasan ? keBigInt(input.nilaiPelepasan) : BigInt(0);
    const perolehanBig = keBigInt(aset.nilaiPerolehan);
    const akumulasiBig = keBigInt(aset.akumulasiPenyusutan);
    const nilaiBukuBig = keBigInt(aset.nilaiBuku);

    // Laba / Rugi = Kas Diterima - Nilai Buku
    const labaRugiBig = kasDiterimaBig - nilaiBukuBig;

    const barisJurnal = [];

    // 1. Debit Kas jika ada penjualan
    if (kasDiterimaBig > BigInt(0)) {
      if (!input.akunKasPelepasanId) {
        throw galat.aturanBisnis("Akun kas/bank penampung penerimaan penjualan aset wajib dipilih.");
      }
      barisJurnal.push({
        akunId: input.akunKasPelepasanId,
        debit: keString(kasDiterimaBig),
        kredit: "0.0000",
        deskripsi: `Kas penerimaan penjualan aset ${aset.nama}`,
      });
    }

    // 2. Debit Akumulasi Penyusutan (menutup akumulasi)
    if (akumulasiBig > BigInt(0)) {
      barisJurnal.push({
        akunId: kategori.akunAkumulasiPenyusutanId,
        debit: keString(akumulasiBig),
        kredit: "0.0000",
        deskripsi: `Penutupan akumulasi penyusutan pelepasan ${aset.nama}`,
      });
    }

    // 3. Catat Laba atau Rugi Pelepasan
    if (labaRugiBig < BigInt(0)) {
      // Rugi Pelepasan Aset (Debit)
      const rugiBig = -labaRugiBig;
      let akunRugiId = input.akunRugiPelepasanId;
      if (!akunRugiId) {
        // Cari akun COA 7110 (Rugi Pelepasan Aset Tetap)
        const [akunDefault] = await tx
          .select({ id: chartOfAccounts.id })
          .from(chartOfAccounts)
          .where(eq(chartOfAccounts.kode, "7110"));
        if (!akunDefault) throw galat.aturanBisnis("Akun rugi pelepasan aset tetap tidak ditemukan (7110).");
        akunRugiId = akunDefault.id;
      }
      barisJurnal.push({
        akunId: akunRugiId,
        debit: keString(rugiBig),
        kredit: "0.0000",
        deskripsi: `Rugi pelepasan aset tetap ${aset.nama}`,
      });
    } else if (labaRugiBig > BigInt(0)) {
      // Laba Pelepasan Aset (Kredit)
      let akunLabaId = input.akunLabaPelepasanId;
      if (!akunLabaId) {
        // Cari akun COA 4920 (Laba Pelepasan Aset Tetap)
        const [akunDefault] = await tx
          .select({ id: chartOfAccounts.id })
          .from(chartOfAccounts)
          .where(eq(chartOfAccounts.kode, "4920"));
        if (!akunDefault) throw galat.aturanBisnis("Akun laba pelepasan aset tetap tidak ditemukan (4920).");
        akunLabaId = akunDefault.id;
      }
      barisJurnal.push({
        akunId: akunLabaId,
        debit: "0.0000",
        kredit: keString(labaRugiBig),
        deskripsi: `Laba pelepasan aset tetap ${aset.nama}`,
      });
    }

    // 4. Kredit Akun Aset Tetap (menghapus harga perolehan dari neraca)
    barisJurnal.push({
      akunId: kategori.akunAsetId,
      debit: "0.0000",
      kredit: keString(perolehanBig),
      deskripsi: `Pelepasan aset tetap ${aset.nama} (${aset.kode})`,
    });

    // Simpan Jurnal Pelepasan
    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: input.tanggalPelepasan,
        deskripsi: `Pelepasan/Penjualan Aset Tetap ${aset.nama} (${aset.kode}): ${input.alasanPelepasan}`,
        referensi: aset.kode,
        sumber: "PELEPASAN_ASET",
        sumberId: aset.id,
        mataUangId: muDasar.id,
        kurs: "1.00000000",
        posting: true,
        baris: barisJurnal,
      },
      penggunaId,
    );

    // Update status aset menjadi DILEPAS
    const [updated] = await tx
      .update(fixedAssets)
      .set({
        status: "DILEPAS",
        tanggalPelepasan: input.tanggalPelepasan,
        nilaiPelepasan: input.nilaiPelepasan ?? "0.0000",
        alasanPelepasan: input.alasanPelepasan,
        akunKasPelepasanId: input.akunKasPelepasanId ?? null,
        jurnalPelepasanId: jurnal.id,
        diubahOleh: penggunaId,
        diubahPada: new Date(),
      })
      .where(eq(fixedAssets.id, asetId))
      .returning();

    if (!updated) throw galat.aturanBisnis("Gagal memperbarui status pelepasan aset.");
    return updated;
  });
}

// ==========================================
// 5. LAPORAN ASET TETAP
// ==========================================

export async function laporanDaftarAset(query: QueryLaporanAsetInput) {
  const conditions = [];
  if (query.kategoriId) conditions.push(eq(fixedAssets.kategoriId, query.kategoriId));
  if (query.status) conditions.push(eq(fixedAssets.status, query.status));
  if (query.perTanggal) conditions.push(lte(fixedAssets.tanggalPerolehan, query.perTanggal));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: fixedAssets.id,
      kode: fixedAssets.kode,
      nama: fixedAssets.nama,
      kategoriId: fixedAssets.kategoriId,
      kategoriNama: assetCategories.nama,
      tanggalPerolehan: fixedAssets.tanggalPerolehan,
      nilaiPerolehan: fixedAssets.nilaiPerolehan,
      nilaiResidu: fixedAssets.nilaiResidu,
      masaManfaatBulan: fixedAssets.masaManfaatBulan,
      sisaManfaatBulan: fixedAssets.sisaManfaatBulan,
      metodePenyusutan: fixedAssets.metodePenyusutan,
      status: fixedAssets.status,
      akumulasiPenyusutan: fixedAssets.akumulasiPenyusutan,
      nilaiBuku: fixedAssets.nilaiBuku,
      lokasi: fixedAssets.lokasi,
      penanggungJawab: fixedAssets.penanggungJawab,
    })
    .from(fixedAssets)
    .innerJoin(assetCategories, eq(fixedAssets.kategoriId, assetCategories.id))
    .where(whereClause)
    .orderBy(assetCategories.nama, fixedAssets.kode);

  let totalPerolehan = BigInt(0);
  let totalAkumulasi = BigInt(0);
  let totalNilaiBuku = BigInt(0);

  for (const r of rows) {
    totalPerolehan += keBigInt(r.nilaiPerolehan);
    totalAkumulasi += keBigInt(r.akumulasiPenyusutan);
    totalNilaiBuku += keBigInt(r.nilaiBuku);
  }

  return {
    ringkasan: {
      jumlahAset: rows.length,
      totalNilaiPerolehan: keString(totalPerolehan),
      totalAkumulasiPenyusutan: keString(totalAkumulasi),
      totalNilaiBuku: keString(totalNilaiBuku),
    },
    daftarAset: rows,
  };
}

export async function laporanRekapPenyusutan(query: QueryLaporanPenyusutanInput) {
  const conditions = [
    eq(assetDepreciations.periode, query.periode),
    eq(assetDepreciations.status, "POSTED"),
  ];

  if (query.kategoriId) {
    conditions.push(eq(fixedAssets.kategoriId, query.kategoriId));
  }

  const rows = await db
    .select({
      penyusutanId: assetDepreciations.id,
      periode: assetDepreciations.periode,
      tanggal: assetDepreciations.tanggal,
      asetId: fixedAssets.id,
      asetKode: fixedAssets.kode,
      asetNama: fixedAssets.nama,
      kategoriNama: assetCategories.nama,
      nilaiPenyusutan: assetDepreciations.nilaiPenyusutan,
      nilaiBukuAwal: assetDepreciations.nilaiBukuAwal,
      nilaiBukuAkhir: assetDepreciations.nilaiBukuAkhir,
      jurnalId: assetDepreciations.jurnalId,
    })
    .from(assetDepreciations)
    .innerJoin(fixedAssets, eq(assetDepreciations.asetId, fixedAssets.id))
    .innerJoin(assetCategories, eq(fixedAssets.kategoriId, assetCategories.id))
    .where(and(...conditions))
    .orderBy(assetCategories.nama, fixedAssets.kode);

  let totalPenyusutanPeriode = BigInt(0);
  for (const r of rows) {
    totalPenyusutanPeriode += keBigInt(r.nilaiPenyusutan);
  }

  return {
    periode: query.periode,
    jumlahAset: rows.length,
    totalPenyusutan: keString(totalPenyusutanPeriode),
    daftarPenyusutan: rows,
  };
}
