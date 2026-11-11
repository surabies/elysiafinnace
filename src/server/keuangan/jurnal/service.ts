import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import {
  chartOfAccounts,
  journalEntries,
  journalItems,
} from "@/db/schema/keuangan";
import { db } from "../_deps";
import { keBigInt, keString } from "../_desimal";
import { tentukanMataUangKurs } from "../_kurs";
import { bacaHalaman, escapeLike, galat, nullJikaKosong } from "../_umum";
import { gantiJurnalDraft, postingJurnalDraft, simpanJurnal, balikJurnal } from "./engine";
import type { InputSimpanJurnalManual, InputUbahJurnalManual } from "./skema";

const NAMA = "Jurnal";

async function ambilHeader(id: string) {
  const [baris] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
  if (!baris) throw galat.tidakDitemukan(NAMA);
  return baris;
}

export async function daftarJurnal(opsi: {
  status?: "DRAFT" | "POSTED" | "DIBATALKAN";
  dari?: string;
  sampai?: string;
  q?: string;
  halaman?: number;
  ukuran?: number;
}) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const kata = opsi.q?.trim();
  const kondisi = and(
    opsi.status ? eq(journalEntries.status, opsi.status) : undefined,
    opsi.dari ? gte(journalEntries.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(journalEntries.tanggal, opsi.sampai) : undefined,
    kata
      ? ilike(journalEntries.nomor, `%${escapeLike(kata)}%`)
      : undefined,
  );
  const [data, [hitung]] = await Promise.all([
    db
      .select()
      .from(journalEntries)
      .where(kondisi)
      .orderBy(desc(journalEntries.tanggal), desc(journalEntries.nomor))
      .limit(ukuran)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(journalEntries).where(kondisi),
  ]);
  return { data, total: hitung?.total ?? 0, halaman, ukuran };
}

export async function ambilJurnal(id: string) {
  const header = await ambilHeader(id);
  const baris = await db
    .select({
      id: journalItems.id,
      urutan: journalItems.urutan,
      akunId: journalItems.akunId,
      kodeAkun: chartOfAccounts.kode,
      namaAkun: chartOfAccounts.nama,
      kontakId: journalItems.kontakId,
      deskripsi: journalItems.deskripsi,
      debit: journalItems.debit,
      kredit: journalItems.kredit,
      mataUangId: journalItems.mataUangId,
      kurs: journalItems.kurs,
      debitDasar: journalItems.debitDasar,
      kreditDasar: journalItems.kreditDasar,
    })
    .from(journalItems)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalItems.akunId))
    .where(eq(journalItems.jurnalId, id))
    .orderBy(asc(journalItems.urutan));
  return { ...header, baris };
}

function keInputMesin(input: InputUbahJurnalManual, mataUangId: string, kurs: string) {
  return {
    tanggal: input.tanggal,
    deskripsi: input.deskripsi,
    referensi: nullJikaKosong(input.referensi),
    sumber: "MANUAL" as const,
    mataUangId,
    kurs,
    baris: input.baris.map((b) => ({
      akunId: b.akunId,
      debit: b.debit,
      kredit: b.kredit,
      deskripsi: b.deskripsi,
      kontakId: b.kontakId,
    })),
  };
}

export async function buatJurnalManual(input: InputSimpanJurnalManual, oleh: string) {
  const mu = await tentukanMataUangKurs({ mataUangId: input.mataUangId, kurs: input.kurs, tanggal: input.tanggal });
  return db.transaction(async (tx) => {
    const header = await simpanJurnal(
      tx,
      { ...keInputMesin(input, mu.mataUangId, mu.kurs), posting: input.posting ?? false },
      oleh,
    );
    return header;
  });
}

export async function ubahJurnalManual(id: string, input: InputUbahJurnalManual, oleh: string) {
  const ada = await ambilHeader(id);
  if (ada.status !== "DRAFT") throw galat.aturanBisnis(`Jurnal ${ada.nomor} berstatus ${ada.status} dan tidak dapat diubah.`);
  if (ada.sumber !== "MANUAL") throw galat.aturanBisnis("Hanya jurnal manual yang dapat diubah dari endpoint ini.");
  const mu = await tentukanMataUangKurs({ mataUangId: input.mataUangId, kurs: input.kurs, tanggal: input.tanggal });
  return db.transaction(async (tx) => gantiJurnalDraft(tx, id, keInputMesin(input, mu.mataUangId, mu.kurs), oleh));
}

export async function hapusJurnalDraft(id: string) {
  const ada = await ambilHeader(id);
  if (ada.status !== "DRAFT") throw galat.aturanBisnis(`Jurnal ${ada.nomor} bukan DRAFT dan tidak dapat dihapus.`);
  if (ada.sumber !== "MANUAL") throw galat.aturanBisnis("Hanya draft jurnal manual yang dapat dihapus.");
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
  return { id };
}

export async function postingJurnal(id: string, oleh: string) {
  const ada = await ambilHeader(id);
  if (ada.sumber !== "MANUAL") throw galat.aturanBisnis("Jurnal otomatis diposting lewat dokumen sumbernya.");
  return db.transaction(async (tx) => postingJurnalDraft(tx, id, oleh));
}

export async function balikJurnalManual(id: string, input: { tanggal: string; deskripsi?: string | null }, oleh: string) {
  return db.transaction(async (tx) =>
    balikJurnal(tx, id, { tanggal: input.tanggal, deskripsi: input.deskripsi ?? undefined, sumber: "PEMBALIK" }, oleh),
  );
}

function saldoNormal(debit: bigint, kredit: bigint, normal: "DEBIT" | "KREDIT") {
  return normal === "DEBIT" ? debit - kredit : kredit - debit;
}

/** Mutasi dan saldo satu akun, atau ringkasan seluruh akun, pada rentang tanggal. */
export async function bukuBesar(opsi: { akunId?: string; dari: string; sampai: string }) {
  if (opsi.dari > opsi.sampai) throw galat.aturanBisnis("Tanggal mulai tidak boleh setelah tanggal selesai.");
  const kondisiAkun = opsi.akunId ? eq(journalItems.akunId, opsi.akunId) : undefined;
  const dasar = and(eq(journalEntries.status, "POSTED"), kondisiAkun);

  const ringkas = await db
    .select({
      akunId: chartOfAccounts.id,
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      debitAwal: sql<string>`coalesce(sum(${journalItems.debitDasar}) filter (where ${journalEntries.tanggal} < ${opsi.dari}), 0)`,
      kreditAwal: sql<string>`coalesce(sum(${journalItems.kreditDasar}) filter (where ${journalEntries.tanggal} < ${opsi.dari}), 0)`,
      debitMutasi: sql<string>`coalesce(sum(${journalItems.debitDasar}) filter (where ${journalEntries.tanggal} >= ${opsi.dari} and ${journalEntries.tanggal} <= ${opsi.sampai}), 0)`,
      kreditMutasi: sql<string>`coalesce(sum(${journalItems.kreditDasar}) filter (where ${journalEntries.tanggal} >= ${opsi.dari} and ${journalEntries.tanggal} <= ${opsi.sampai}), 0)`,
    })
    .from(chartOfAccounts)
    .leftJoin(journalItems, eq(journalItems.akunId, chartOfAccounts.id))
    .leftJoin(journalEntries, and(eq(journalEntries.id, journalItems.jurnalId), eq(journalEntries.status, "POSTED")))
    .where(opsi.akunId ? eq(chartOfAccounts.id, opsi.akunId) : undefined)
    .groupBy(chartOfAccounts.id)
    .orderBy(asc(chartOfAccounts.kode));

  const akun = ringkas
    .map((a) => {
      const dAwal = keBigInt(a.debitAwal);
      const kAwal = keBigInt(a.kreditAwal);
      const dMut = keBigInt(a.debitMutasi);
      const kMut = keBigInt(a.kreditMutasi);
      const adaMutasi = dAwal !== BigInt(0) || kAwal !== BigInt(0) || dMut !== BigInt(0) || kMut !== BigInt(0);
      return {
        akunId: a.akunId,
        kode: a.kode,
        nama: a.nama,
        tipeAkun: a.tipeAkun,
        normalBalance: a.normalBalance,
        saldoAwal: keString(saldoNormal(dAwal, kAwal, a.normalBalance)),
        debit: keString(dMut),
        kredit: keString(kMut),
        saldoAkhir: keString(saldoNormal(dAwal + dMut, kAwal + kMut, a.normalBalance)),
        adaMutasi,
      };
    })
    .filter((a) => (opsi.akunId ? true : a.adaMutasi));

  if (opsi.akunId && akun.length === 0) throw galat.tidakDitemukan("Akun");

  if (!opsi.akunId) return { dari: opsi.dari, sampai: opsi.sampai, akun };

  const mutasi = await db
    .select({
      jurnalId: journalEntries.id,
      nomor: journalEntries.nomor,
      tanggal: journalEntries.tanggal,
      deskripsi: journalEntries.deskripsi,
      debit: journalItems.debitDasar,
      kredit: journalItems.kreditDasar,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
    .where(and(dasar, gte(journalEntries.tanggal, opsi.dari), lte(journalEntries.tanggal, opsi.sampai)))
    .orderBy(asc(journalEntries.tanggal), asc(journalEntries.nomor), asc(journalItems.urutan));

  let berjalan = keBigInt(akun[0]!.saldoAwal);
  const normal = akun[0]!.normalBalance;
  const rincian = mutasi.map((m) => {
    const delta = saldoNormal(keBigInt(m.debit), keBigInt(m.kredit), normal);
    berjalan += delta;
    return { ...m, saldoBerjalan: keString(berjalan) };
  });
  return { dari: opsi.dari, sampai: opsi.sampai, akun: akun[0], rincian };
}
