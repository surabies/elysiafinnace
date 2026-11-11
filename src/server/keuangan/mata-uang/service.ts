import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { currencies, exchangeRates } from "@/db/schema/keuangan";
import { db } from "../_deps";
import { galat, nullJikaKosong } from "../_umum";
import type { InputBuatMataUang, InputSimpanKurs, InputUbahMataUang } from "./skema";

const NAMA_OBJEK = "Mata uang";

export async function daftarMataUang(opsi: { aktif?: boolean } = {}) {
  return db
    .select()
    .from(currencies)
    .where(opsi.aktif === undefined ? undefined : eq(currencies.aktif, opsi.aktif))
    .orderBy(desc(currencies.adalahMataUangDasar), asc(currencies.kode));
}

export async function ambilMataUang(id: string) {
  const [baris] = await db.select().from(currencies).where(eq(currencies.id, id));
  if (!baris) throw galat.tidakDitemukan(NAMA_OBJEK);
  return baris;
}

export async function ambilMataUangDasar() {
  const [baris] = await db.select().from(currencies).where(eq(currencies.adalahMataUangDasar, true));
  if (!baris) {
    throw galat.aturanBisnis("Mata uang dasar belum diatur. Jalankan seed keuangan terlebih dahulu.");
  }
  return baris;
}

/** Mata uang dasar tidak dapat dibuat lewat API; ditetapkan oleh seed/penyiapan awal. */
export async function buatMataUang(input: InputBuatMataUang, oleh: string) {
  const [baru] = await db
    .insert(currencies)
    .values({
      kode: input.kode.toUpperCase(),
      nama: input.nama.trim(),
      simbol: input.simbol.trim(),
      jumlahDesimal: input.jumlahDesimal ?? 2,
      adalahMataUangDasar: false,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahMataUang(id: string, input: InputUbahMataUang, oleh: string) {
  const ada = await ambilMataUang(id);
  if (input.aktif === false && ada.adalahMataUangDasar) {
    throw galat.aturanBisnis("Mata uang dasar tidak boleh dinonaktifkan.");
  }
  const set: Partial<typeof currencies.$inferInsert> = {};
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.simbol !== undefined) set.simbol = input.simbol.trim();
  if (input.jumlahDesimal !== undefined) set.jumlahDesimal = input.jumlahDesimal;
  if (input.aktif !== undefined) set.aktif = input.aktif;
  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  const [baru] = await db
    .update(currencies)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(currencies.id, id))
    .returning();
  return baru!;
}

/* ----------------------------- Kurs ----------------------------- */

/** True bila string desimal bernilai > 0 (mis. "0.00000000" -> false). */
const lebihDariNol = (nilai: string) => /[1-9]/.test(nilai);

export async function simpanKurs(input: InputSimpanKurs, oleh: string) {
  const mataUang = await ambilMataUang(input.mataUangId);
  if (mataUang.adalahMataUangDasar) {
    throw galat.aturanBisnis("Mata uang dasar tidak memiliki kurs (selalu 1).");
  }
  if (!mataUang.aktif) throw galat.aturanBisnis(`Mata uang ${mataUang.kode} tidak aktif.`);
  if (!lebihDariNol(input.kurs)) throw galat.aturanBisnis("Kurs harus lebih besar dari nol.");

  // Satu kurs per mata uang per tanggal: bila sudah ada, nilainya diperbarui.
  const [baris] = await db
    .insert(exchangeRates)
    .values({
      mataUangId: input.mataUangId,
      tanggalBerlaku: input.tanggalBerlaku,
      kurs: input.kurs,
      sumber: nullJikaKosong(input.sumber) ?? "Manual",
      aktif: true,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .onConflictDoUpdate({
      target: [exchangeRates.mataUangId, exchangeRates.tanggalBerlaku],
      set: { kurs: input.kurs, sumber: nullJikaKosong(input.sumber) ?? "Manual", aktif: true, diubahOleh: oleh },
    })
    .returning();
  return baris!;
}

export async function daftarKurs(opsi: {
  mataUangId?: string;
  dari?: string;
  sampai?: string;
  offset: number;
  ukuran: number;
}) {
  const kondisi = and(
    opsi.mataUangId ? eq(exchangeRates.mataUangId, opsi.mataUangId) : undefined,
    opsi.dari ? gte(exchangeRates.tanggalBerlaku, opsi.dari) : undefined,
    opsi.sampai ? lte(exchangeRates.tanggalBerlaku, opsi.sampai) : undefined,
  );
  const [data, [hitung]] = await Promise.all([
    db
      .select({
        id: exchangeRates.id,
        mataUangId: exchangeRates.mataUangId,
        kodeMataUang: currencies.kode,
        tanggalBerlaku: exchangeRates.tanggalBerlaku,
        kurs: exchangeRates.kurs,
        sumber: exchangeRates.sumber,
        aktif: exchangeRates.aktif,
      })
      .from(exchangeRates)
      .innerJoin(currencies, eq(currencies.id, exchangeRates.mataUangId))
      .where(kondisi)
      .orderBy(desc(exchangeRates.tanggalBerlaku), asc(currencies.kode))
      .limit(opsi.ukuran)
      .offset(opsi.offset),
    db.select({ total: sql<number>`count(*)::int` }).from(exchangeRates).where(kondisi),
  ]);
  return { data, total: hitung?.total ?? 0 };
}

/**
 * Kurs yang berlaku pada suatu tanggal: baris aktif terbaru dengan
 * tanggal_berlaku <= tanggal. Mata uang dasar selalu 1.
 * Dipakai modul transaksi (Phase 2+) untuk mengisi kolom `kurs` pada dokumen.
 */
export async function dapatkanKursBerlaku(mataUangId: string, tanggal: string) {
  const mataUang = await ambilMataUang(mataUangId);
  if (mataUang.adalahMataUangDasar) {
    return { mataUangId, kodeMataUang: mataUang.kode, kurs: "1.00000000", tanggalBerlaku: tanggal, sumber: "Mata uang dasar" };
  }
  const [baris] = await db
    .select({ kurs: exchangeRates.kurs, tanggalBerlaku: exchangeRates.tanggalBerlaku, sumber: exchangeRates.sumber })
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.mataUangId, mataUangId),
        eq(exchangeRates.aktif, true),
        lte(exchangeRates.tanggalBerlaku, tanggal),
      ),
    )
    .orderBy(desc(exchangeRates.tanggalBerlaku))
    .limit(1);
  if (!baris) {
    throw galat.aturanBisnis(`Kurs ${mataUang.kode} untuk tanggal ${tanggal} belum tersedia. Isi kurs terlebih dahulu.`);
  }
  return { mataUangId, kodeMataUang: mataUang.kode, ...baris };
}
