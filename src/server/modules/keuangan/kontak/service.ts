import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { currencies, partners, paymentTerms } from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { escapeLike, nullJikaKosong } from "../shared/text";
import { galat } from "@/server/core/errors";
import type {
  InputBuatKontak,
  InputBuatTermin,
  InputUbahKontak,
  InputUbahTermin,
} from "./model";

/* ------------------------- Termin pembayaran ------------------------- */

export async function daftarTermin(opsi: { aktif?: boolean } = {}) {
  return db
    .select()
    .from(paymentTerms)
    .where(opsi.aktif === undefined ? undefined : eq(paymentTerms.aktif, opsi.aktif))
    .orderBy(asc(paymentTerms.jumlahHari), asc(paymentTerms.kode));
}

export async function ambilTermin(id: string) {
  const [baris] = await db.select().from(paymentTerms).where(eq(paymentTerms.id, id));
  if (!baris) throw galat.tidakDitemukan("Termin pembayaran");
  return baris;
}

export async function buatTermin(input: InputBuatTermin, oleh: string) {
  const jumlahHari = input.jumlahHari ?? 0;
  const hariDiskon = input.hariDiskon ?? 0;
  if (hariDiskon > jumlahHari) {
    throw galat.aturanBisnis("Hari diskon tidak boleh melebihi jumlah hari jatuh tempo.");
  }
  const [baru] = await db
    .insert(paymentTerms)
    .values({
      kode: input.kode.trim(),
      nama: input.nama.trim(),
      jumlahHari,
      persenDiskon: input.persenDiskon ?? "0",
      hariDiskon,
      keterangan: nullJikaKosong(input.keterangan),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahTermin(id: string, input: InputUbahTermin, oleh: string) {
  const ada = await ambilTermin(id);
  const set: Partial<typeof paymentTerms.$inferInsert> = {};
  if (input.kode !== undefined) set.kode = input.kode.trim();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.jumlahHari !== undefined) set.jumlahHari = input.jumlahHari;
  if (input.persenDiskon !== undefined) set.persenDiskon = input.persenDiskon;
  if (input.hariDiskon !== undefined) set.hariDiskon = input.hariDiskon;
  if (input.keterangan !== undefined) set.keterangan = nullJikaKosong(input.keterangan);
  if (input.aktif !== undefined) set.aktif = input.aktif;
  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  if ((set.hariDiskon ?? ada.hariDiskon) > (set.jumlahHari ?? ada.jumlahHari)) {
    throw galat.aturanBisnis("Hari diskon tidak boleh melebihi jumlah hari jatuh tempo.");
  }
  const [baru] = await db
    .update(paymentTerms)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(paymentTerms.id, id))
    .returning();
  return baru!;
}

/* ------------------------------ Kontak ------------------------------ */

async function pastikanTerminDanMataUang(terminId?: string | null, mataUangId?: string | null) {
  if (terminId) {
    const termin = await ambilTermin(terminId);
    if (!termin.aktif) throw galat.aturanBisnis(`Termin ${termin.kode} tidak aktif.`);
  }
  if (mataUangId) {
    const [mu] = await db.select({ aktif: currencies.aktif, kode: currencies.kode }).from(currencies).where(eq(currencies.id, mataUangId));
    if (!mu) throw galat.tidakDitemukan("Mata uang");
    if (!mu.aktif) throw galat.aturanBisnis(`Mata uang ${mu.kode} tidak aktif.`);
  }
}

export async function daftarKontak(opsi: {
  jenis?: "PELANGGAN" | "PEMASOK";
  aktif?: boolean;
  q?: string;
  offset: number;
  ukuran: number;
}) {
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.jenis === "PELANGGAN" ? eq(partners.adalahPelanggan, true) : undefined,
    opsi.jenis === "PEMASOK" ? eq(partners.adalahPemasok, true) : undefined,
    opsi.aktif === undefined ? undefined : eq(partners.aktif, opsi.aktif),
    q
      ? or(
          ilike(partners.kode, `${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
          ilike(partners.npwp, `${escapeLike(q)}%`),
          ilike(partners.email, `%${escapeLike(q)}%`),
        )
      : undefined,
  );
  const [data, [hitung]] = await Promise.all([
    db.select().from(partners).where(kondisi).orderBy(asc(partners.nama)).limit(opsi.ukuran).offset(opsi.offset),
    db.select({ total: sql<number>`count(*)::int` }).from(partners).where(kondisi),
  ]);
  return { data, total: hitung?.total ?? 0 };
}

export async function ambilKontak(id: string) {
  const [baris] = await db.select().from(partners).where(eq(partners.id, id));
  if (!baris) throw galat.tidakDitemukan("Kontak");
  return baris;
}

export async function buatKontak(input: InputBuatKontak, oleh: string) {
  const adalahPelanggan = input.adalahPelanggan ?? false;
  const adalahPemasok = input.adalahPemasok ?? false;
  if (!adalahPelanggan && !adalahPemasok) {
    throw galat.aturanBisnis("Kontak harus berperan sebagai pelanggan, pemasok, atau keduanya.");
  }
  await pastikanTerminDanMataUang(input.terminPembayaranId, input.mataUangId);

  const [baru] = await db
    .insert(partners)
    .values({
      kode: input.kode.trim(),
      nama: input.nama.trim(),
      adalahPelanggan,
      adalahPemasok,
      npwp: nullJikaKosong(input.npwp),
      adalahPkp: input.adalahPkp ?? false,
      namaKontak: nullJikaKosong(input.namaKontak),
      email: nullJikaKosong(input.email),
      telepon: nullJikaKosong(input.telepon),
      alamat: nullJikaKosong(input.alamat),
      kota: nullJikaKosong(input.kota),
      provinsi: nullJikaKosong(input.provinsi),
      kodePos: nullJikaKosong(input.kodePos),
      negara: input.negara?.trim() || "Indonesia",
      terminPembayaranId: input.terminPembayaranId ?? null,
      mataUangId: input.mataUangId ?? null,
      batasKredit: input.batasKredit ?? "0",
      catatan: nullJikaKosong(input.catatan),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahKontak(id: string, input: InputUbahKontak, oleh: string) {
  const ada = await ambilKontak(id);
  const set: Partial<typeof partners.$inferInsert> = {};

  if (input.kode !== undefined) set.kode = input.kode.trim();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.adalahPelanggan !== undefined) set.adalahPelanggan = input.adalahPelanggan;
  if (input.adalahPemasok !== undefined) set.adalahPemasok = input.adalahPemasok;
  if (input.npwp !== undefined) set.npwp = nullJikaKosong(input.npwp);
  if (input.adalahPkp !== undefined) set.adalahPkp = input.adalahPkp;
  if (input.namaKontak !== undefined) set.namaKontak = nullJikaKosong(input.namaKontak);
  if (input.email !== undefined) set.email = nullJikaKosong(input.email);
  if (input.telepon !== undefined) set.telepon = nullJikaKosong(input.telepon);
  if (input.alamat !== undefined) set.alamat = nullJikaKosong(input.alamat);
  if (input.kota !== undefined) set.kota = nullJikaKosong(input.kota);
  if (input.provinsi !== undefined) set.provinsi = nullJikaKosong(input.provinsi);
  if (input.kodePos !== undefined) set.kodePos = nullJikaKosong(input.kodePos);
  if (input.negara !== undefined) set.negara = input.negara.trim() || "Indonesia";
  if (input.terminPembayaranId !== undefined) set.terminPembayaranId = input.terminPembayaranId;
  if (input.mataUangId !== undefined) set.mataUangId = input.mataUangId;
  if (input.batasKredit !== undefined) set.batasKredit = input.batasKredit;
  if (input.catatan !== undefined) set.catatan = nullJikaKosong(input.catatan);
  if (input.aktif !== undefined) set.aktif = input.aktif;
  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  if (!(set.adalahPelanggan ?? ada.adalahPelanggan) && !(set.adalahPemasok ?? ada.adalahPemasok)) {
    throw galat.aturanBisnis("Kontak harus berperan sebagai pelanggan, pemasok, atau keduanya.");
  }
  await pastikanTerminDanMataUang(input.terminPembayaranId, input.mataUangId);

  const [baru] = await db
    .update(partners)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(partners.id, id))
    .returning();
  return baru!;
}
