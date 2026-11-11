import { eq, inArray } from "drizzle-orm";
import {
  chartOfAccounts,
  currencies,
  journalEntries,
  journalItems,
  type SumberJurnal,
} from "@/db/schema/keuangan";
import { galat } from "../_umum";
import { PREFIKS, nomorBerikut, type Tx } from "../_tx";
import { SKALA_KURS, kaliKurs, keBigInt, keString } from "../_desimal";
import { pastikanPeriodeTerbuka, pastikanTahunBelumTutupBuku } from "../periode/service";

/**
 * MESIN DOUBLE-ENTRY
 *
 * Semua jurnal (manual maupun otomatis dari biaya, faktur, pembayaran, stok, tutup buku)
 * WAJIB lewat `simpanJurnal`. Fungsi ini menolak jurnal yang:
 *  - kurang dari 2 baris, atau ada baris yang debit & kredit keduanya terisi/kosong,
 *  - memakai akun header / nonaktif / tidak ada, atau mata uang baris tidak cocok dengan akun,
 *  - total DEBIT != total KREDIT (dalam mata uang dokumen bila satu mata uang, dan SELALU dalam mata uang dasar),
 *  - (bila diposting) bertanggal di periode yang sudah ditutup.
 */

export type BarisJurnalInput = {
  akunId: string;
  debit?: string;
  kredit?: string;
  deskripsi?: string | null;
  kontakId?: string | null;
  /** Default: mata uang header. */
  mataUangId?: string;
  /** Default: kurs header. */
  kurs?: string;
  /**
   * Khusus internal (pembayaran/faktur): nilai mata uang dasar yang sudah ditentukan.
   * Tidak diekspos ke API jurnal manual.
   */
  nilaiDasar?: string;
};

export type InputSimpanJurnal = {
  tanggal: string;
  deskripsi: string;
  referensi?: string | null;
  sumber: SumberJurnal;
  sumberId?: string | null;
  mataUangId: string;
  kurs: string;
  baris: BarisJurnalInput[];
  posting: boolean;
  membalikJurnalId?: string | null;
};

type BarisTerhitung = {
  urutan: number;
  akunId: string;
  kontakId: string | null;
  deskripsi: string | null;
  mataUangId: string;
  kurs: bigint;
  debit: bigint;
  kredit: bigint;
  debitDasar: bigint;
  kreditDasar: bigint;
  tetap: boolean; // nilai dasar ditentukan pemanggil (tidak disesuaikan pembulatan)
};

/** Validasi keras & konversi ke mata uang dasar. Melempar GalatAplikasi bila tidak valid. */
export async function validasiDanHitung(tx: Tx, input: Omit<InputSimpanJurnal, "posting" | "sumberId">) {
  if (input.baris.length < 2) throw galat.aturanBisnis("Jurnal minimal terdiri dari 2 baris (debit dan kredit).");

  const idMataUang = new Set([input.mataUangId, ...input.baris.map((b) => b.mataUangId ?? input.mataUangId)]);
  const daftarMu = await tx.select().from(currencies).where(inArray(currencies.id, [...idMataUang]));
  const petaMu = new Map(daftarMu.map((m) => [m.id, m]));
  for (const id of idMataUang) {
    const mu = petaMu.get(id);
    if (!mu) throw galat.tidakDitemukan("Mata uang");
    if (!mu.aktif) throw galat.aturanBisnis(`Mata uang ${mu.kode} tidak aktif.`);
  }

  const idAkun = [...new Set(input.baris.map((b) => b.akunId))];
  const daftarAkun = await tx.select().from(chartOfAccounts).where(inArray(chartOfAccounts.id, idAkun));
  const petaAkun = new Map(daftarAkun.map((a) => [a.id, a]));

  const baris: BarisTerhitung[] = input.baris.map((b, i) => {
    const no = i + 1;
    const akun = petaAkun.get(b.akunId);
    if (!akun) throw galat.aturanBisnis(`Baris ${no}: akun tidak ditemukan.`);
    if (!akun.aktif) throw galat.aturanBisnis(`Baris ${no}: akun ${akun.kode} - ${akun.nama} tidak aktif.`);
    if (!akun.bisaDiposting) {
      throw galat.aturanBisnis(`Baris ${no}: akun ${akun.kode} - ${akun.nama} adalah akun header dan tidak dapat dijurnal.`);
    }
    const mataUangId = b.mataUangId ?? input.mataUangId;
    const mu = petaMu.get(mataUangId)!;
    if (akun.mataUangId && akun.mataUangId !== mataUangId) {
      const muAkun = daftarMu.find((m) => m.id === akun.mataUangId)?.kode ?? "lain";
      throw galat.aturanBisnis(`Baris ${no}: akun ${akun.kode} hanya menerima transaksi dalam mata uang ${muAkun}.`);
    }
    const kurs = keBigInt(b.kurs ?? input.kurs, SKALA_KURS);
    if (kurs <= BigInt(0)) throw galat.aturanBisnis(`Baris ${no}: kurs harus lebih dari 0.`);
    if (mu.adalahMataUangDasar && kurs !== keBigInt("1", SKALA_KURS)) {
      throw galat.aturanBisnis(`Baris ${no}: kurs untuk mata uang dasar (${mu.kode}) harus 1.`);
    }
    const debit = keBigInt(b.debit ?? "0");
    const kredit = keBigInt(b.kredit ?? "0");
    if (debit < BigInt(0) || kredit < BigInt(0)) throw galat.aturanBisnis(`Baris ${no}: nilai tidak boleh negatif.`);
    if ((debit === BigInt(0)) === (kredit === BigInt(0))) {
      throw galat.aturanBisnis(`Baris ${no}: isi salah satu dari debit ATAU kredit (tidak boleh keduanya/kosong).`);
    }
    const tetap = b.nilaiDasar !== undefined;
    const dasar = tetap ? keBigInt(b.nilaiDasar) : kaliKurs(debit || kredit, kurs);
    return {
      urutan: no,
      akunId: akun.id,
      kontakId: b.kontakId ?? null,
      deskripsi: b.deskripsi?.trim() || null,
      mataUangId,
      kurs,
      debit,
      kredit,
      debitDasar: debit > BigInt(0) ? dasar : BigInt(0),
      kreditDasar: kredit > BigInt(0) ? dasar : BigInt(0),
      tetap,
    };
  });

  // Per kelompok (mata uang + kurs) yang seimbang sendiri: buang selisih pembulatan konversi
  // ke baris terbesar yang nilai dasarnya tidak ditetapkan pemanggil.
  const kelompok = new Map<string, BarisTerhitung[]>();
  for (const b of baris) {
    const k = `${b.mataUangId}|${b.kurs}`;
    kelompok.set(k, [...(kelompok.get(k) ?? []), b]);
  }
  const satuKelompok = kelompok.size === 1;
  for (const anggota of kelompok.values()) {
    const d = anggota.reduce((s, b) => s + b.debit, BigInt(0));
    const k = anggota.reduce((s, b) => s + b.kredit, BigInt(0));
    if (d !== k) {
      if (satuKelompok) {
        const kode = petaMu.get(anggota[0]!.mataUangId)!.kode;
        throw galat.aturanBisnis(
          `Jurnal tidak seimbang: total debit ${keString(d)} ${kode} tidak sama dengan total kredit ${keString(k)} ${kode}.`,
          { totalDebit: keString(d), totalKredit: keString(k), selisih: keString(d - k) },
        );
      }
      continue;
    }
    const residu =
      anggota.reduce((s, b) => s + b.debitDasar, BigInt(0)) - anggota.reduce((s, b) => s + b.kreditDasar, BigInt(0));
    if (residu === BigInt(0)) continue;
    const kandidat = anggota
      .filter((b) => !b.tetap)
      .sort((a, b) => Number((b.debitDasar + b.kreditDasar) - (a.debitDasar + a.kreditDasar)))[0];
    if (!kandidat) continue;
    if (kandidat.debitDasar > BigInt(0)) kandidat.debitDasar -= residu;
    else kandidat.kreditDasar += residu;
  }

  const totalDebit = baris.reduce((s, b) => s + b.debitDasar, BigInt(0));
  const totalKredit = baris.reduce((s, b) => s + b.kreditDasar, BigInt(0));
  if (totalDebit !== totalKredit) {
    throw galat.aturanBisnis(
      `Jurnal tidak seimbang dalam mata uang dasar: total debit ${keString(totalDebit)} tidak sama dengan total kredit ${keString(totalKredit)}.`,
      { totalDebit: keString(totalDebit), totalKredit: keString(totalKredit), selisih: keString(totalDebit - totalKredit) },
    );
  }
  if (totalDebit === BigInt(0)) throw galat.aturanBisnis("Nilai jurnal tidak boleh nol.");
  if (baris.some((b) => b.debitDasar < BigInt(0) || b.kreditDasar < BigInt(0))) {
    throw galat.aturanBisnis("Nilai dasar baris jurnal menjadi negatif setelah pembulatan. Periksa nilai & kurs.");
  }
  return { baris, totalDebit, totalKredit };
}

const keBarisDb = (jurnalId: string, b: BarisTerhitung) => ({
  jurnalId,
  urutan: b.urutan,
  akunId: b.akunId,
  kontakId: b.kontakId,
  deskripsi: b.deskripsi,
  mataUangId: b.mataUangId,
  kurs: keString(b.kurs, SKALA_KURS),
  debit: keString(b.debit),
  kredit: keString(b.kredit),
  debitDasar: keString(b.debitDasar),
  kreditDasar: keString(b.kreditDasar),
});

/** Membuat jurnal baru (DRAFT atau langsung POSTED). Harus dipanggil di dalam transaksi. */
export async function simpanJurnal(tx: Tx, input: InputSimpanJurnal, oleh: string) {
  const hasil = await validasiDanHitung(tx, input);
  if (input.posting) await pastikanTahunBelumTutupBuku(tx, input.tanggal);
  const periode = input.posting ? await pastikanPeriodeTerbuka(tx, input.tanggal) : null;
  const nomor = await nomorBerikut(tx, PREFIKS.JURNAL, input.tanggal);
  const [header] = await tx
    .insert(journalEntries)
    .values({
      nomor,
      tanggal: input.tanggal,
      periodeId: periode?.id ?? null,
      referensi: input.referensi?.trim() || null,
      deskripsi: input.deskripsi.trim(),
      status: input.posting ? "POSTED" : "DRAFT",
      sumber: input.sumber,
      sumberId: input.sumberId ?? null,
      mataUangId: input.mataUangId,
      kurs: input.kurs,
      totalDebit: keString(hasil.totalDebit),
      totalKredit: keString(hasil.totalKredit),
      membalikJurnalId: input.membalikJurnalId ?? null,
      dipostingOleh: input.posting ? oleh : null,
      dipostingPada: input.posting ? new Date() : null,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  await tx.insert(journalItems).values(hasil.baris.map((b) => keBarisDb(header!.id, b)));
  if (input.posting) console.info(`[keuangan] Jurnal ${nomor} (${input.sumber}) diposting oleh ${oleh}.`);
  return header!;
}

/** Mengganti seluruh baris & header jurnal DRAFT. */
export async function gantiJurnalDraft(tx: Tx, id: string, input: Omit<InputSimpanJurnal, "posting">, oleh: string) {
  const hasil = await validasiDanHitung(tx, input);
  await tx.delete(journalItems).where(eq(journalItems.jurnalId, id));
  await tx.insert(journalItems).values(hasil.baris.map((b) => keBarisDb(id, b)));
  const [header] = await tx
    .update(journalEntries)
    .set({
      tanggal: input.tanggal,
      referensi: input.referensi?.trim() || null,
      deskripsi: input.deskripsi.trim(),
      mataUangId: input.mataUangId,
      kurs: input.kurs,
      totalDebit: keString(hasil.totalDebit),
      totalKredit: keString(hasil.totalKredit),
      diubahOleh: oleh,
    })
    .where(eq(journalEntries.id, id))
    .returning();
  return header!;
}

/** Memposting jurnal DRAFT setelah validasi ulang (akun bisa saja dinonaktifkan sejak draft dibuat). */
export async function postingJurnalDraft(tx: Tx, id: string, oleh: string) {
  const [jurnal] = await tx.select().from(journalEntries).where(eq(journalEntries.id, id)).for("update");
  if (!jurnal) throw galat.tidakDitemukan("Jurnal");
  if (jurnal.status !== "DRAFT") throw galat.aturanBisnis(`Jurnal ${jurnal.nomor} berstatus ${jurnal.status}, bukan DRAFT.`);
  const baris = await tx.select().from(journalItems).where(eq(journalItems.jurnalId, id)).orderBy(journalItems.urutan);
  const hasil = await validasiDanHitung(tx, {
    tanggal: jurnal.tanggal,
    deskripsi: jurnal.deskripsi,
    sumber: jurnal.sumber,
    mataUangId: jurnal.mataUangId,
    kurs: jurnal.kurs,
    baris: baris.map((b) => ({
      akunId: b.akunId,
      debit: b.debit,
      kredit: b.kredit,
      kontakId: b.kontakId,
      deskripsi: b.deskripsi,
      mataUangId: b.mataUangId,
      kurs: b.kurs,
    })),
  });
  await pastikanTahunBelumTutupBuku(tx, jurnal.tanggal);
  const periode = await pastikanPeriodeTerbuka(tx, jurnal.tanggal);
  // Tulis ulang nilai dasar hasil validasi (deterministik, sama seperti saat draft disimpan).
  await tx.delete(journalItems).where(eq(journalItems.jurnalId, id));
  await tx.insert(journalItems).values(hasil.baris.map((b) => keBarisDb(id, b)));
  const [hasilUpdate] = await tx
    .update(journalEntries)
    .set({
      status: "POSTED",
      periodeId: periode.id,
      totalDebit: keString(hasil.totalDebit),
      totalKredit: keString(hasil.totalKredit),
      dipostingOleh: oleh,
      dipostingPada: new Date(),
      diubahOleh: oleh,
    })
    .where(eq(journalEntries.id, id))
    .returning();
  console.info(`[keuangan] Jurnal ${jurnal.nomor} diposting oleh ${oleh}.`);
  return hasilUpdate!;
}

/**
 * Membuat jurnal pembalik (debit <-> kredit, nilai dasar identik) untuk jurnal POSTED.
 * Jurnal asli tetap POSTED dan ditandai `dibalik_oleh_id`.
 */
export async function balikJurnal(
  tx: Tx,
  id: string,
  opsi: { tanggal: string; deskripsi?: string; sumber?: SumberJurnal },
  oleh: string,
) {
  const [asli] = await tx.select().from(journalEntries).where(eq(journalEntries.id, id)).for("update");
  if (!asli) throw galat.tidakDitemukan("Jurnal");
  if (asli.status !== "POSTED") throw galat.aturanBisnis(`Hanya jurnal POSTED yang dapat dibalik (status: ${asli.status}).`);
  if (asli.dibalikOlehId) throw galat.aturanBisnis(`Jurnal ${asli.nomor} sudah pernah dibalik.`);
  if (asli.membalikJurnalId) throw galat.aturanBisnis(`Jurnal ${asli.nomor} adalah jurnal pembalik dan tidak dapat dibalik lagi.`);
  if (opsi.tanggal < asli.tanggal) throw galat.aturanBisnis("Tanggal jurnal pembalik tidak boleh sebelum tanggal jurnal asli.");

  await pastikanTahunBelumTutupBuku(tx, opsi.tanggal);
  const periode = await pastikanPeriodeTerbuka(tx, opsi.tanggal);
  const baris = await tx.select().from(journalItems).where(eq(journalItems.jurnalId, id)).orderBy(journalItems.urutan);
  const nomor = await nomorBerikut(tx, PREFIKS.JURNAL, opsi.tanggal);
  const [pembalik] = await tx
    .insert(journalEntries)
    .values({
      nomor,
      tanggal: opsi.tanggal,
      periodeId: periode.id,
      referensi: asli.nomor,
      deskripsi: opsi.deskripsi?.trim() || `Pembalikan jurnal ${asli.nomor}: ${asli.deskripsi}`,
      status: "POSTED",
      sumber: opsi.sumber ?? "PEMBALIK",
      sumberId: asli.sumberId,
      mataUangId: asli.mataUangId,
      kurs: asli.kurs,
      totalDebit: asli.totalKredit,
      totalKredit: asli.totalDebit,
      membalikJurnalId: asli.id,
      dipostingOleh: oleh,
      dipostingPada: new Date(),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  await tx.insert(journalItems).values(
    baris.map((b) => ({
      jurnalId: pembalik!.id,
      urutan: b.urutan,
      akunId: b.akunId,
      kontakId: b.kontakId,
      deskripsi: b.deskripsi,
      mataUangId: b.mataUangId,
      kurs: b.kurs,
      debit: b.kredit,
      kredit: b.debit,
      debitDasar: b.kreditDasar,
      kreditDasar: b.debitDasar,
    })),
  );
  await tx
    .update(journalEntries)
    .set({ dibalikOlehId: pembalik!.id, diubahOleh: oleh })
    .where(eq(journalEntries.id, asli.id));
  console.info(`[keuangan] Jurnal ${asli.nomor} dibalik dengan ${nomor} oleh ${oleh}.`);
  return pembalik!;
}
