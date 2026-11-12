import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { bankAccounts, expenseItems, expenses, paymentAllocations } from "@/db/schema/keuangan";
import { pastikanAkunDetail, akunByPeran } from "../akun/service";
import { db } from "../shared/context";
import { keBigInt, keString } from "../shared/decimal";
import { tentukanMataUangKurs } from "../shared/kurs";
import { PREFIKS, nomorBerikut, tambahHari } from "../shared/transaction";
import { bacaHalaman } from "../shared/pagination";
import { galat } from "@/server/core/errors";
import { nullJikaKosong } from "../shared/text";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import type { InputSimpanBiaya } from "./model";

async function ambil(id: string) {
  const [header] = await db.select().from(expenses).where(eq(expenses.id, id));
  if (!header) throw galat.tidakDitemukan("Biaya");
  const baris = await db.select().from(expenseItems).where(eq(expenseItems.biayaId, id)).orderBy(expenseItems.urutan);
  return { ...header, baris };
}

function hitung(input: InputSimpanBiaya) {
  const baris = input.baris.map((b, i) => {
    const jumlah = keBigInt(b.jumlah);
    if (jumlah <= BigInt(0)) throw galat.aturanBisnis(`Baris ${i + 1}: jumlah harus lebih dari 0.`);
    return { urutan: i + 1, akunBebanId: b.akunBebanId, deskripsi: b.deskripsi?.trim() || null, jumlah: keString(jumlah), jumlahInt: jumlah };
  });
  const subtotal = baris.reduce((s, b) => s + b.jumlahInt, BigInt(0));
  const ppn = keBigInt(input.ppn ?? "0");
  if (ppn < BigInt(0)) throw galat.aturanBisnis("PPN tidak boleh negatif.");
  const total = subtotal + ppn;
  return { baris, subtotal: keString(subtotal), ppn: keString(ppn), total: keString(total), totalInt: total };
}

async function simpan(id: string | null, input: InputSimpanBiaya, oleh: string) {
  const metode = input.metodeBayar ?? "TUNAI";
  const hitungBaris = hitung(input);
  if (metode === "TUNAI" && !input.rekeningBankId) throw galat.aturanBisnis("Biaya tunai wajib memilih rekening kas/bank.");
  if (metode === "HUTANG" && !input.kontakId) throw galat.aturanBisnis("Biaya hutang wajib memilih pemasok.");
  for (const b of hitungBaris.baris) {
    await pastikanAkunDetail(b.akunBebanId, { label: "Akun beban", tipe: "BEBAN" });
  }
  const mu = await tentukanMataUangKurs({ mataUangId: input.mataUangId, kurs: input.kurs, tanggal: input.tanggal });
  if (input.rekeningBankId) {
    const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.rekeningBankId));
    if (!rek || !rek.aktif) throw galat.tidakDitemukan("Rekening kas/bank");
    if (rek.mataUangId !== mu.mataUangId) throw galat.aturanBisnis("Mata uang biaya harus sama dengan mata uang rekening kas/bank.");
  }
  const nilai = {
    tanggal: input.tanggal,
    kontakId: input.kontakId ?? null,
    metodeBayar: metode,
    rekeningBankId: metode === "TUNAI" ? input.rekeningBankId! : null,
    tanggalJatuhTempo: input.tanggalJatuhTempo ?? (metode === "HUTANG" ? tambahHari(input.tanggal, 30) : null),
    referensi: nullJikaKosong(input.referensi),
    deskripsi: input.deskripsi.trim(),
    mataUangId: mu.mataUangId,
    kurs: mu.kurs,
    subtotal: hitungBaris.subtotal,
    ppn: hitungBaris.ppn,
    total: hitungBaris.total,
    sisaTagihan: metode === "HUTANG" ? hitungBaris.total : "0",
    diubahOleh: oleh,
  };
  return db.transaction(async (tx) => {
    let biayaId = id;
    if (!biayaId) {
      const nomor = await nomorBerikut(tx, PREFIKS.BIAYA, input.tanggal);
      const [baru] = await tx.insert(expenses).values({ ...nilai, nomor, dibuatOleh: oleh }).returning({ id: expenses.id });
      biayaId = baru!.id;
    } else {
      await tx.update(expenses).set(nilai).where(eq(expenses.id, biayaId));
      await tx.delete(expenseItems).where(eq(expenseItems.biayaId, biayaId));
    }
    await tx.insert(expenseItems).values(hitungBaris.baris.map((b) => ({ biayaId: biayaId!, urutan: b.urutan, akunBebanId: b.akunBebanId, deskripsi: b.deskripsi, jumlah: b.jumlah })));
    return biayaId!;
  });
}

export async function daftarBiaya(opsi: { status?: "DRAFT" | "POSTED" | "DIBATALKAN"; dari?: string; sampai?: string; halaman?: number; ukuran?: number }) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const kondisi = and(
    opsi.status ? eq(expenses.status, opsi.status) : undefined,
    opsi.dari ? gte(expenses.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(expenses.tanggal, opsi.sampai) : undefined,
  );
  const [data, [hitungTotal]] = await Promise.all([
    db.select().from(expenses).where(kondisi).orderBy(desc(expenses.tanggal), desc(expenses.nomor)).limit(ukuran).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(expenses).where(kondisi),
  ]);
  return { data, total: hitungTotal?.total ?? 0, halaman, ukuran };
}

export const ambilBiaya = ambil;

export async function buatBiaya(input: InputSimpanBiaya, oleh: string) {
  return ambil(await simpan(null, input, oleh));
}

export async function ubahBiaya(id: string, input: InputSimpanBiaya, oleh: string) {
  const ada = await ambil(id);
  if (ada.status !== "DRAFT") throw galat.aturanBisnis(`Biaya ${ada.nomor} bukan DRAFT.`);
  await simpan(id, input, oleh);
  return ambil(id);
}

export async function hapusBiaya(id: string) {
  const ada = await ambil(id);
  if (ada.status !== "DRAFT") throw galat.aturanBisnis(`Biaya ${ada.nomor} bukan DRAFT.`);
  await db.delete(expenses).where(eq(expenses.id, id));
  return { id };
}

export async function postingBiaya(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [header] = await tx.select().from(expenses).where(eq(expenses.id, id)).for("update");
    if (!header) throw galat.tidakDitemukan("Biaya");
    if (header.status !== "DRAFT") throw galat.aturanBisnis(`Biaya ${header.nomor} berstatus ${header.status}.`);
    const baris = await tx.select().from(expenseItems).where(eq(expenseItems.biayaId, id)).orderBy(expenseItems.urutan);
    const jurnalBaris: BarisJurnalInput[] = baris.map((b) => ({ akunId: b.akunBebanId, debit: b.jumlah, deskripsi: b.deskripsi }));
    if (keBigInt(header.ppn) > BigInt(0)) {
      jurnalBaris.push({ akunId: (await akunByPeran("PPN_MASUKAN")).id, debit: header.ppn, deskripsi: "PPN Masukan" });
    }
    if (header.metodeBayar === "TUNAI") {
      const [rek] = await tx.select().from(bankAccounts).where(eq(bankAccounts.id, header.rekeningBankId!));
      if (!rek) throw galat.tidakDitemukan("Rekening kas/bank");
      jurnalBaris.push({ akunId: rek.akunCoaId, kredit: header.total, deskripsi: header.deskripsi });
    } else {
      jurnalBaris.push({ akunId: (await akunByPeran("HUTANG_USAHA")).id, kredit: header.total, deskripsi: header.deskripsi });
    }
    const jurnal = await simpanJurnal(tx, {
      tanggal: header.tanggal,
      deskripsi: `Biaya ${header.nomor}: ${header.deskripsi}`,
      referensi: header.referensi,
      sumber: "BIAYA",
      sumberId: header.id,
      mataUangId: header.mataUangId,
      kurs: header.kurs,
      posting: true,
      baris: jurnalBaris,
    }, oleh);
    const [hasil] = await tx.update(expenses).set({
      status: "POSTED",
      jurnalId: jurnal.id,
      sisaTagihan: header.metodeBayar === "HUTANG" ? header.total : "0",
      dipostingOleh: oleh,
      dipostingPada: new Date(),
      diubahOleh: oleh,
    }).where(eq(expenses.id, id)).returning();
    return hasil!;
  });
}

export async function batalBiaya(id: string, input: { tanggal: string; deskripsi?: string | null }, oleh: string) {
  return db.transaction(async (tx) => {
    const [header] = await tx.select().from(expenses).where(eq(expenses.id, id)).for("update");
    if (!header) throw galat.tidakDitemukan("Biaya");
    if (header.status !== "POSTED") throw galat.aturanBisnis(`Biaya ${header.nomor} tidak dapat dibatalkan (status ${header.status}).`);
    if (header.metodeBayar === "HUTANG" && keBigInt(header.sisaTagihan) !== keBigInt(header.total)) {
      throw galat.aturanBisnis("Batalkan pembayaran yang sudah dialokasikan ke biaya ini terlebih dahulu.");
    }
    const [alokasi] = await tx.select({ id: paymentAllocations.id }).from(paymentAllocations).where(eq(paymentAllocations.biayaId, id)).limit(1);
    if (alokasi) throw galat.aturanBisnis("Biaya ini masih dirujuk pembayaran. Hapus atau batalkan pembayaran tersebut terlebih dahulu.");
    const pembalik = await balikJurnal(tx, header.jurnalId!, { tanggal: input.tanggal, deskripsi: input.deskripsi ?? undefined, sumber: "BIAYA" }, oleh);
    const [hasil] = await tx.update(expenses).set({ status: "DIBATALKAN", sisaTagihan: "0", diubahOleh: oleh }).where(eq(expenses.id, id)).returning();
    return { ...hasil!, jurnalPembalikId: pembalik.id };
  });
}
