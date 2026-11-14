import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import {
  currencies,
  journalEntries,
  journalItems,
  partnerAddresses,
  partnerContacts,
  partners,
  paymentTerms,
} from "@/db/schema/keuangan";
import { akunByPeran } from "../akun/service";
import { db } from "../shared/context";
import type { Tx } from "../shared/transaction";
import { keBigInt, keString } from "../shared/decimal";
import { escapeLike, nullJikaKosong } from "../shared/text";
import { parseCsvKeObjek } from "../shared/csv";
import { galat } from "@/server/core/errors";
import type {
  InputBuatKontak,
  InputBuatTermin,
  InputSimpanAlamat,
  InputSimpanPic,
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
    const [mu] = await db
      .select({ aktif: currencies.aktif, kode: currencies.kode })
      .from(currencies)
      .where(eq(currencies.id, mataUangId));
    if (!mu) throw galat.tidakDitemukan("Mata uang");
    if (!mu.aktif) throw galat.aturanBisnis(`Mata uang ${mu.kode} tidak aktif.`);
  }
}

export async function daftarKontak(opsi: {
  jenis?: "PELANGGAN" | "PEMASOK";
  grup?: string | null;
  aktif?: boolean;
  q?: string;
  offset: number;
  ukuran: number;
}) {
  const q = opsi.q?.trim();
  const grup = opsi.grup?.trim();
  const kondisi = and(
    opsi.jenis === "PELANGGAN" ? eq(partners.adalahPelanggan, true) : undefined,
    opsi.jenis === "PEMASOK" ? eq(partners.adalahPemasok, true) : undefined,
    grup ? eq(partners.grup, grup) : undefined,
    opsi.aktif === undefined ? undefined : eq(partners.aktif, opsi.aktif),
    q
      ? or(
          ilike(partners.kode, `${escapeLike(q)}%`),
          ilike(partners.nama, `%${escapeLike(q)}%`),
          ilike(partners.npwp, `${escapeLike(q)}%`),
          ilike(partners.nik, `${escapeLike(q)}%`),
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

export async function ambilKontak(id: string, koneksi: Tx | typeof db = db) {
  const [baris] = await koneksi.select().from(partners).where(eq(partners.id, id));
  if (!baris) throw galat.tidakDitemukan("Kontak");
  const [daftarAlamat, daftarPic] = await Promise.all([
    koneksi.select().from(partnerAddresses).where(eq(partnerAddresses.kontakId, id)),
    koneksi.select().from(partnerContacts).where(eq(partnerContacts.kontakId, id)),
  ]);
  return { ...baris, daftarAlamat, daftarPic };
}

export async function buatKontak(input: InputBuatKontak, oleh: string) {
  const adalahPelanggan = input.adalahPelanggan ?? false;
  const adalahPemasok = input.adalahPemasok ?? false;
  if (!adalahPelanggan && !adalahPemasok) {
    throw galat.aturanBisnis("Kontak harus berperan sebagai pelanggan, pemasok, atau keduanya.");
  }
  await pastikanTerminDanMataUang(input.terminPembayaranId, input.mataUangId);

  return db.transaction(async (tx) => {
    const [baru] = await tx
      .insert(partners)
      .values({
        kode: input.kode.trim(),
        nama: input.nama.trim(),
        adalahPelanggan,
        adalahPemasok,
        npwp: nullJikaKosong(input.npwp),
        nik: nullJikaKosong(input.nik),
        adalahPkp: input.adalahPkp ?? false,
        grup: nullJikaKosong(input.grup),
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

    if (input.daftarAlamat?.length) {
      await tx.insert(partnerAddresses).values(
        input.daftarAlamat.map((a) => ({
          kontakId: baru!.id,
          judul: a.judul.trim(),
          jenis: a.jenis ?? "UTAMA",
          alamat: a.alamat.trim(),
          kota: nullJikaKosong(a.kota),
          provinsi: nullJikaKosong(a.provinsi),
          kodePos: nullJikaKosong(a.kodePos),
          negara: a.negara?.trim() || "Indonesia",
          adalahUtama: a.adalahUtama ?? false,
        })),
      );
    }

    if (input.daftarPic?.length) {
      await tx.insert(partnerContacts).values(
        input.daftarPic.map((p) => ({
          kontakId: baru!.id,
          nama: p.nama.trim(),
          jabatan: nullJikaKosong(p.jabatan),
          email: nullJikaKosong(p.email),
          telepon: nullJikaKosong(p.telepon),
          ponsel: nullJikaKosong(p.ponsel),
          adalahUtama: p.adalahUtama ?? false,
        })),
      );
    }

    return ambilKontak(baru!.id, tx);
  });
}

export async function ubahKontak(id: string, input: InputUbahKontak, oleh: string) {
  const ada = await ambilKontak(id);
  const set: Partial<typeof partners.$inferInsert> = {};

  if (input.kode !== undefined) set.kode = input.kode.trim();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.adalahPelanggan !== undefined) set.adalahPelanggan = input.adalahPelanggan;
  if (input.adalahPemasok !== undefined) set.adalahPemasok = input.adalahPemasok;
  if (input.npwp !== undefined) set.npwp = nullJikaKosong(input.npwp);
  if (input.nik !== undefined) set.nik = nullJikaKosong(input.nik);
  if (input.adalahPkp !== undefined) set.adalahPkp = input.adalahPkp;
  if (input.grup !== undefined) set.grup = nullJikaKosong(input.grup);
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

  if (
    Object.keys(set).length === 0 &&
    input.daftarAlamat === undefined &&
    input.daftarPic === undefined
  ) {
    throw galat.aturanBisnis("Tidak ada data yang diubah.");
  }

  if (!(set.adalahPelanggan ?? ada.adalahPelanggan) && !(set.adalahPemasok ?? ada.adalahPemasok)) {
    throw galat.aturanBisnis("Kontak harus berperan sebagai pelanggan, pemasok, atau keduanya.");
  }
  await pastikanTerminDanMataUang(input.terminPembayaranId, input.mataUangId);

  return db.transaction(async (tx) => {
    if (Object.keys(set).length > 0) {
      await tx
        .update(partners)
        .set({ ...set, diubahOleh: oleh })
        .where(eq(partners.id, id));
    }

    if (input.daftarAlamat !== undefined) {
      await tx.delete(partnerAddresses).where(eq(partnerAddresses.kontakId, id));
      if (input.daftarAlamat.length > 0) {
        await tx.insert(partnerAddresses).values(
          input.daftarAlamat.map((a) => ({
            kontakId: id,
            judul: a.judul.trim(),
            jenis: a.jenis ?? "UTAMA",
            alamat: a.alamat.trim(),
            kota: nullJikaKosong(a.kota),
            provinsi: nullJikaKosong(a.provinsi),
            kodePos: nullJikaKosong(a.kodePos),
            negara: a.negara?.trim() || "Indonesia",
            adalahUtama: a.adalahUtama ?? false,
          })),
        );
      }
    }

    if (input.daftarPic !== undefined) {
      await tx.delete(partnerContacts).where(eq(partnerContacts.kontakId, id));
      if (input.daftarPic.length > 0) {
        await tx.insert(partnerContacts).values(
          input.daftarPic.map((p) => ({
            kontakId: id,
            nama: p.nama.trim(),
            jabatan: nullJikaKosong(p.jabatan),
            email: nullJikaKosong(p.email),
            telepon: nullJikaKosong(p.telepon),
            ponsel: nullJikaKosong(p.ponsel),
            adalahUtama: p.adalahUtama ?? false,
          })),
        );
      }
    }

    return ambilKontak(id);
  });
}

/* ----------------- Sub-pengelolaan Alamat & PIC ----------------- */

export async function tambahAlamatKontak(kontakId: string, input: InputSimpanAlamat) {
  await ambilKontak(kontakId);
  const [baru] = await db
    .insert(partnerAddresses)
    .values({
      kontakId,
      judul: input.judul.trim(),
      jenis: input.jenis ?? "UTAMA",
      alamat: input.alamat.trim(),
      kota: nullJikaKosong(input.kota),
      provinsi: nullJikaKosong(input.provinsi),
      kodePos: nullJikaKosong(input.kodePos),
      negara: input.negara?.trim() || "Indonesia",
      adalahUtama: input.adalahUtama ?? false,
    })
    .returning();
  return baru!;
}

export async function hapusAlamatKontak(alamatId: string) {
  const [ada] = await db.select().from(partnerAddresses).where(eq(partnerAddresses.id, alamatId));
  if (!ada) throw galat.tidakDitemukan("Alamat kontak");
  await db.delete(partnerAddresses).where(eq(partnerAddresses.id, alamatId));
  return { id: alamatId };
}

export async function tambahPicKontak(kontakId: string, input: InputSimpanPic) {
  await ambilKontak(kontakId);
  const [baru] = await db
    .insert(partnerContacts)
    .values({
      kontakId,
      nama: input.nama.trim(),
      jabatan: nullJikaKosong(input.jabatan),
      email: nullJikaKosong(input.email),
      telepon: nullJikaKosong(input.telepon),
      ponsel: nullJikaKosong(input.ponsel),
      adalahUtama: input.adalahUtama ?? false,
    })
    .returning();
  return baru!;
}

export async function hapusPicKontak(picId: string) {
  const [ada] = await db.select().from(partnerContacts).where(eq(partnerContacts.id, picId));
  if (!ada) throw galat.tidakDitemukan("Kontak person (PIC)");
  await db.delete(partnerContacts).where(eq(partnerContacts.id, picId));
  return { id: picId };
}

/* ----------------- Pemeriksaan Batas Kredit ----------------- */

export async function cekBatasKredit(kontakId: string, nominalBaru: string = "0") {
  const kontak = await ambilKontak(kontakId);
  const batasKreditInt = keBigInt(kontak.batasKredit);

  if (batasKreditInt <= BigInt(0)) {
    return {
      batasKredit: kontak.batasKredit,
      saldoPiutangBerjalan: "0",
      sisaBatasKredit: "0",
      totalSetelahTransaksi: nominalBaru,
      melebihiBatas: false,
    };
  }

  const akunPiutang = await akunByPeran("PIUTANG_USAHA");
  const [piutangRow] = await db
    .select({
      totalDebit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)::text`,
      totalKredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)::text`,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
    .where(
      and(
        eq(journalItems.kontakId, kontakId),
        eq(journalItems.akunId, akunPiutang.id),
        eq(journalEntries.status, "POSTED"),
      ),
    );

  const saldoPiutangInt = keBigInt(piutangRow?.totalDebit ?? "0") - keBigInt(piutangRow?.totalKredit ?? "0");
  const nominalBaruInt = keBigInt(nominalBaru);
  const totalSetelahTransaksi = saldoPiutangInt + nominalBaruInt;
  const melebihiBatas = totalSetelahTransaksi > batasKreditInt;
  const sisaBatasKreditInt = batasKreditInt - saldoPiutangInt;

  return {
    batasKredit: kontak.batasKredit,
    saldoPiutangBerjalan: keString(saldoPiutangInt),
    sisaBatasKredit: keString(sisaBatasKreditInt),
    totalSetelahTransaksi: keString(totalSetelahTransaksi),
    melebihiBatas,
  };
}

export async function importKontak(csv: string, oleh: string) {
  const baris = parseCsvKeObjek(csv);
  if (baris.length === 0) throw galat.aturanBisnis("CSV kosong atau format tidak sesuai.");

  const hasil = [];
  const semuaTermin = await db.select({ id: paymentTerms.id, kode: paymentTerms.kode }).from(paymentTerms);
  const petaTermin = new Map(semuaTermin.map((t) => [t.kode.toUpperCase(), t.id]));

  for (const row of baris) {
    const kode = (row.kode || row.kode_kontak || "").trim();
    const nama = (row.nama || row.nama_kontak || "").trim();
    if (!kode || !nama) continue;

    const tipe = (row.tipe || "").trim().toUpperCase();
    const adalahPelanggan = tipe === "PELANGGAN" || tipe === "CUSTOMER" || row.adalah_pelanggan === "true" || row.adalah_pelanggan === "1";
    const adalahPemasok = tipe === "PEMASOK" || tipe === "SUPPLIER" || tipe === "VENDOR" || row.adalah_pemasok === "true" || row.adalah_pemasok === "1";

    const terminKode = (row.termin || row.termin_pembayaran || "").trim().toUpperCase();
    const terminPembayaranId = terminKode ? petaTermin.get(terminKode) ?? null : null;

    const baru = await buatKontak(
      {
        kode,
        nama,
        adalahPelanggan: adalahPelanggan || !adalahPemasok,
        adalahPemasok,
        npwp: row.npwp?.trim() || undefined,
        nik: row.nik?.trim() || undefined,
        grup: row.grup?.trim() || undefined,
        email: row.email?.trim() || undefined,
        telepon: row.telepon?.trim() || undefined,
        alamat: row.alamat?.trim() || undefined,
        kota: row.kota?.trim() || undefined,
        provinsi: row.provinsi?.trim() || undefined,
        kodePos: row.kode_pos?.trim() || undefined,
        batasKredit: row.batas_kredit?.trim() || undefined,
        terminPembayaranId: terminPembayaranId ?? undefined,
      },
      oleh,
    );

    hasil.push(baru);
  }

  return { totalDiimpor: hasil.length, data: hasil };
}
