import { and, asc, eq, ilike, or } from "drizzle-orm";
import { bankAccounts, chartOfAccounts, currencies } from "@/db/schema/keuangan";
import { db } from "../_deps";
import { pastikanAkunDetail } from "../akun/service";
import { escapeLike, galat, nullJikaKosong } from "../_umum";
import { ambilMataUang, ambilMataUangDasar } from "../mata-uang/service";
import type { InputBuatRekening, InputUbahRekening } from "./skema";

/** Kolom rekening beserta akun COA dan kode mata uangnya. */
const kolomRekening = {
  id: bankAccounts.id,
  kode: bankAccounts.kode,
  nama: bankAccounts.nama,
  jenis: bankAccounts.jenis,
  namaBank: bankAccounts.namaBank,
  nomorRekening: bankAccounts.nomorRekening,
  atasNama: bankAccounts.atasNama,
  cabang: bankAccounts.cabang,
  akunCoaId: bankAccounts.akunCoaId,
  kodeAkunCoa: chartOfAccounts.kode,
  namaAkunCoa: chartOfAccounts.nama,
  mataUangId: bankAccounts.mataUangId,
  kodeMataUang: currencies.kode,
  keterangan: bankAccounts.keterangan,
  aktif: bankAccounts.aktif,
  dibuatPada: bankAccounts.dibuatPada,
  diubahPada: bankAccounts.diubahPada,
};

const dasarQuery = () =>
  db
    .select(kolomRekening)
    .from(bankAccounts)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, bankAccounts.akunCoaId))
    .innerJoin(currencies, eq(currencies.id, bankAccounts.mataUangId));

export async function daftarRekening(opsi: { jenis?: "KAS" | "BANK"; aktif?: boolean; q?: string }) {
  const q = opsi.q?.trim();
  return dasarQuery()
    .where(
      and(
        opsi.jenis ? eq(bankAccounts.jenis, opsi.jenis) : undefined,
        opsi.aktif === undefined ? undefined : eq(bankAccounts.aktif, opsi.aktif),
        q
          ? or(
              ilike(bankAccounts.kode, `${escapeLike(q)}%`),
              ilike(bankAccounts.nama, `%${escapeLike(q)}%`),
              ilike(bankAccounts.nomorRekening, `%${escapeLike(q)}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(bankAccounts.kode));
}

export async function ambilRekening(id: string) {
  const [baris] = await dasarQuery().where(eq(bankAccounts.id, id));
  if (!baris) throw galat.tidakDitemukan("Rekening kas/bank");
  return baris;
}

export async function buatRekening(input: InputBuatRekening, oleh: string) {
  const jenis = input.jenis ?? "BANK";
  const namaBank = nullJikaKosong(input.namaBank);
  const nomorRekening = nullJikaKosong(input.nomorRekening);
  if (jenis === "BANK" && (!namaBank || !nomorRekening)) {
    throw galat.aturanBisnis("Rekening bank wajib memiliki nama bank dan nomor rekening.");
  }

  const akun = await pastikanAkunDetail(input.akunCoaId, {
    label: "Akun kas/bank",
    tipe: "ASET",
    peran: "KAS_BANK",
  });
  const [terpakai] = await db
    .select({ kode: bankAccounts.kode, nama: bankAccounts.nama })
    .from(bankAccounts)
    .where(eq(bankAccounts.akunCoaId, akun.id));
  if (terpakai) {
    throw galat.sudahAda(`Akun ${akun.kode} sudah terhubung ke rekening ${terpakai.kode} - ${terpakai.nama}.`);
  }

  const mataUangId = input.mataUangId ?? akun.mataUangId ?? (await ambilMataUangDasar()).id;
  if (input.mataUangId) await ambilMataUang(input.mataUangId);
  if (akun.mataUangId && akun.mataUangId !== mataUangId) {
    throw galat.aturanBisnis(`Mata uang rekening harus sama dengan mata uang akun COA ${akun.kode}.`);
  }

  const [baru] = await db
    .insert(bankAccounts)
    .values({
      kode: input.kode.trim(),
      nama: input.nama.trim(),
      jenis,
      namaBank,
      nomorRekening,
      atasNama: nullJikaKosong(input.atasNama),
      cabang: nullJikaKosong(input.cabang),
      akunCoaId: akun.id,
      mataUangId,
      keterangan: nullJikaKosong(input.keterangan),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning({ id: bankAccounts.id });
  return ambilRekening(baru!.id);
}

export async function ubahRekening(id: string, input: InputUbahRekening, oleh: string) {
  const ada = await ambilRekening(id);
  const set: Partial<typeof bankAccounts.$inferInsert> = {};
  if (input.kode !== undefined) set.kode = input.kode.trim();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.namaBank !== undefined) set.namaBank = nullJikaKosong(input.namaBank);
  if (input.nomorRekening !== undefined) set.nomorRekening = nullJikaKosong(input.nomorRekening);
  if (input.atasNama !== undefined) set.atasNama = nullJikaKosong(input.atasNama);
  if (input.cabang !== undefined) set.cabang = nullJikaKosong(input.cabang);
  if (input.keterangan !== undefined) set.keterangan = nullJikaKosong(input.keterangan);
  if (input.aktif !== undefined) set.aktif = input.aktif;
  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  if (ada.jenis === "BANK") {
    const namaBank = "namaBank" in set ? set.namaBank : ada.namaBank;
    const nomor = "nomorRekening" in set ? set.nomorRekening : ada.nomorRekening;
    if (!namaBank || !nomor) throw galat.aturanBisnis("Rekening bank wajib memiliki nama bank dan nomor rekening.");
  }

  await db
    .update(bankAccounts)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(bankAccounts.id, id));
  return ambilRekening(id);
}
