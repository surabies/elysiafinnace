import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  bankAccounts,
  bankReconciliations,
  currencies,
  journalEntries,
  journalItems,
  partners,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { keBigInt, keString } from "../shared/decimal";
import { bacaHalaman } from "../shared/pagination";
import { galat } from "@/server/core/errors";
import { nullJikaKosong } from "../shared/text";
import type {
  InputBuatRekonsiliasi,
  InputCocokkanBaris,
  InputImportMutasiBank,
  InputUbahRekonsiliasi,
} from "./rekonsiliasi.model";

const kolomRekonsiliasi = {
  id: bankReconciliations.id,
  rekeningBankId: bankReconciliations.rekeningBankId,
  namaRekening: bankAccounts.nama,
  kodeRekening: bankAccounts.kode,
  namaBank: bankAccounts.namaBank,
  nomorRekening: bankAccounts.nomorRekening,
  kodeMataUang: currencies.kode,
  tanggalLaporan: bankReconciliations.tanggalLaporan,
  saldoLaporanBank: bankReconciliations.saldoLaporanBank,
  saldoBukuTercocok: bankReconciliations.saldoBukuTercocok,
  selisih: bankReconciliations.selisih,
  status: bankReconciliations.status,
  catatan: bankReconciliations.catatan,
  diselesaikanOleh: bankReconciliations.diselesaikanOleh,
  diselesaikanPada: bankReconciliations.diselesaikanPada,
  dibuatOleh: bankReconciliations.dibuatOleh,
  diubahOleh: bankReconciliations.diubahOleh,
  dibuatPada: bankReconciliations.dibuatPada,
  diubahPada: bankReconciliations.diubahPada,
};

const dasarQuery = () =>
  db
    .select(kolomRekonsiliasi)
    .from(bankReconciliations)
    .innerJoin(bankAccounts, eq(bankAccounts.id, bankReconciliations.rekeningBankId))
    .innerJoin(currencies, eq(currencies.id, bankAccounts.mataUangId));

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function hitungUlangSaldo(
  tx: Tx,
  rekonsiliasiId: string,
  rekeningBankId: string,
  akunCoaId: string,
  tanggalLaporan: string,
  saldoLaporanBank: string,
  diubahOleh?: string,
) {
  const selesaiLalu = await tx
    .select({ id: bankReconciliations.id })
    .from(bankReconciliations)
    .where(
      and(
        eq(bankReconciliations.rekeningBankId, rekeningBankId),
        eq(bankReconciliations.status, "SELESAI"),
        lte(bankReconciliations.tanggalLaporan, tanggalLaporan),
      ),
    );

  const daftarIdRekonsiliasi = [rekonsiliasiId, ...selesaiLalu.map((r) => r.id)];

  const [rekap] = await tx
    .select({
      totalDebit: sql<string>`coalesce(sum(${journalItems.debit}), 0)::text`,
      totalKredit: sql<string>`coalesce(sum(${journalItems.kredit}), 0)::text`,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
    .where(
      and(
        eq(journalItems.akunId, akunCoaId),
        eq(journalEntries.status, "POSTED"),
        inArray(journalItems.rekonsiliasiId, daftarIdRekonsiliasi),
      ),
    );

  const saldoBukuInt = keBigInt(rekap?.totalDebit ?? "0") - keBigInt(rekap?.totalKredit ?? "0");
  const saldoLaporanInt = keBigInt(saldoLaporanBank);
  const selisihInt = saldoLaporanInt - saldoBukuInt;

  const saldoBukuTercocok = keString(saldoBukuInt);
  const selisih = keString(selisihInt);

  await tx
    .update(bankReconciliations)
    .set({
      saldoBukuTercocok,
      selisih,
      ...(diubahOleh ? { diubahOleh } : {}),
    })
    .where(eq(bankReconciliations.id, rekonsiliasiId));

  return { saldoBukuTercocok, selisih };
}

export async function daftarRekonsiliasi(opsi: {
  rekeningBankId?: string | null;
  status?: "DRAFT" | "SELESAI";
  dari?: string;
  sampai?: string;
  halaman?: number;
  ukuran?: number;
}) {
  const { offset, ukuran, halaman } = bacaHalaman(opsi);
  const kondisi = and(
    opsi.rekeningBankId ? eq(bankReconciliations.rekeningBankId, opsi.rekeningBankId) : undefined,
    opsi.status ? eq(bankReconciliations.status, opsi.status) : undefined,
    opsi.dari ? gte(bankReconciliations.tanggalLaporan, opsi.dari) : undefined,
    opsi.sampai ? lte(bankReconciliations.tanggalLaporan, opsi.sampai) : undefined,
  );

  const [data, [hitungTotal]] = await Promise.all([
    dasarQuery()
      .where(kondisi)
      .orderBy(desc(bankReconciliations.tanggalLaporan), desc(bankReconciliations.dibuatPada))
      .limit(ukuran)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(bankReconciliations).where(kondisi),
  ]);

  return { data, total: hitungTotal?.total ?? 0, halaman, ukuran };
}

export async function ambilRekonsiliasi(id: string) {
  const [header] = await dasarQuery().where(eq(bankReconciliations.id, id));
  if (!header) throw galat.tidakDitemukan("Rekonsiliasi bank");

  const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, header.rekeningBankId));
  if (!rek) throw galat.tidakDitemukan("Rekening kas/bank");

  const [barisTercocok, barisBelumCocok] = await Promise.all([
    db
      .select({
        id: journalItems.id,
        jurnalId: journalItems.jurnalId,
        nomorJurnal: journalEntries.nomor,
        tanggal: journalEntries.tanggal,
        deskripsi: journalItems.deskripsi,
        debit: journalItems.debit,
        kredit: journalItems.kredit,
        kontakId: journalItems.kontakId,
        namaKontak: partners.nama,
      })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
      .leftJoin(partners, eq(partners.id, journalItems.kontakId))
      .where(eq(journalItems.rekonsiliasiId, id))
      .orderBy(asc(journalEntries.tanggal), asc(journalEntries.nomor)),

    db
      .select({
        id: journalItems.id,
        jurnalId: journalItems.jurnalId,
        nomorJurnal: journalEntries.nomor,
        tanggal: journalEntries.tanggal,
        deskripsi: journalItems.deskripsi,
        debit: journalItems.debit,
        kredit: journalItems.kredit,
        kontakId: journalItems.kontakId,
        namaKontak: partners.nama,
      })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
      .leftJoin(partners, eq(partners.id, journalItems.kontakId))
      .where(
        and(
          eq(journalItems.akunId, rek.akunCoaId),
          eq(journalEntries.status, "POSTED"),
          lte(journalEntries.tanggal, header.tanggalLaporan),
          sql`${journalItems.rekonsiliasiId} IS NULL`,
        ),
      )
      .orderBy(asc(journalEntries.tanggal), asc(journalEntries.nomor)),
  ]);

  return { ...header, barisTercocok, barisBelumCocok };
}

export async function buatRekonsiliasi(input: InputBuatRekonsiliasi, oleh: string) {
  const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.rekeningBankId));
  if (!rek || !rek.aktif) throw galat.tidakDitemukan("Rekening kas/bank");

  return db.transaction(async (tx) => {
    const [baru] = await tx
      .insert(bankReconciliations)
      .values({
        rekeningBankId: input.rekeningBankId,
        tanggalLaporan: input.tanggalLaporan,
        saldoLaporanBank: keString(keBigInt(input.saldoLaporanBank)),
        saldoBukuTercocok: "0",
        selisih: keString(keBigInt(input.saldoLaporanBank)),
        status: "DRAFT",
        catatan: nullJikaKosong(input.catatan),
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    await hitungUlangSaldo(
      tx,
      baru!.id,
      input.rekeningBankId,
      rek.akunCoaId,
      input.tanggalLaporan,
      input.saldoLaporanBank,
      oleh,
    );

    return ambilRekonsiliasi(baru!.id);
  });
}

export async function ubahRekonsiliasi(id: string, input: InputUbahRekonsiliasi, oleh: string) {
  const [ada] = await db.select().from(bankReconciliations).where(eq(bankReconciliations.id, id));
  if (!ada) throw galat.tidakDitemukan("Rekonsiliasi bank");
  if (ada.status !== "DRAFT") throw galat.aturanBisnis("Hanya rekonsiliasi berstatus DRAFT yang dapat diubah.");

  const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, ada.rekeningBankId));
  if (!rek) throw galat.tidakDitemukan("Rekening kas/bank");

  return db.transaction(async (tx) => {
    const tanggalLaporan = input.tanggalLaporan ?? ada.tanggalLaporan;
    const saldoLaporanBank = input.saldoLaporanBank ? keString(keBigInt(input.saldoLaporanBank)) : ada.saldoLaporanBank;

    await tx
      .update(bankReconciliations)
      .set({
        tanggalLaporan,
        saldoLaporanBank,
        catatan: input.catatan !== undefined ? nullJikaKosong(input.catatan) : ada.catatan,
        diubahOleh: oleh,
      })
      .where(eq(bankReconciliations.id, id));

    await hitungUlangSaldo(tx, id, ada.rekeningBankId, rek.akunCoaId, tanggalLaporan, saldoLaporanBank, oleh);

    return ambilRekonsiliasi(id);
  });
}

export async function hapusRekonsiliasi(id: string) {
  const [ada] = await db.select().from(bankReconciliations).where(eq(bankReconciliations.id, id));
  if (!ada) throw galat.tidakDitemukan("Rekonsiliasi bank");
  if (ada.status !== "DRAFT") throw galat.aturanBisnis("Hanya rekonsiliasi DRAFT yang dapat dihapus.");

  return db.transaction(async (tx) => {
    await tx
      .update(journalItems)
      .set({ rekonsiliasiId: null })
      .where(eq(journalItems.rekonsiliasiId, id));

    await tx.delete(bankReconciliations).where(eq(bankReconciliations.id, id));
    return { id };
  });
}

export async function cocokkanBaris(id: string, input: InputCocokkanBaris, oleh: string) {
  const [ada] = await db.select().from(bankReconciliations).where(eq(bankReconciliations.id, id));
  if (!ada) throw galat.tidakDitemukan("Rekonsiliasi bank");
  if (ada.status !== "DRAFT") throw galat.aturanBisnis("Hanya rekonsiliasi DRAFT yang dapat dicocokkan.");

  const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, ada.rekeningBankId));
  if (!rek) throw galat.tidakDitemukan("Rekening kas/bank");

  return db.transaction(async (tx) => {
    const barisTersedia = await tx
      .select({ id: journalItems.id })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
      .where(
        and(
          inArray(journalItems.id, input.itemIds),
          eq(journalItems.akunId, rek.akunCoaId),
          eq(journalEntries.status, "POSTED"),
          lte(journalEntries.tanggal, ada.tanggalLaporan),
          sql`${journalItems.rekonsiliasiId} IS NULL`,
        ),
      );

    if (barisTersedia.length === 0) {
      throw galat.aturanBisnis("Tidak ada baris transaksi valid yang dapat dicocokkan.");
    }

    const idValid = barisTersedia.map((b) => b.id);
    await tx
      .update(journalItems)
      .set({ rekonsiliasiId: id })
      .where(inArray(journalItems.id, idValid));

    await hitungUlangSaldo(tx, id, ada.rekeningBankId, rek.akunCoaId, ada.tanggalLaporan, ada.saldoLaporanBank, oleh);
    return ambilRekonsiliasi(id);
  });
}

export async function lepasBaris(id: string, input: InputCocokkanBaris, oleh: string) {
  const [ada] = await db.select().from(bankReconciliations).where(eq(bankReconciliations.id, id));
  if (!ada) throw galat.tidakDitemukan("Rekonsiliasi bank");
  if (ada.status !== "DRAFT") throw galat.aturanBisnis("Hanya rekonsiliasi DRAFT yang dapat diubah barisnya.");

  const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, ada.rekeningBankId));
  if (!rek) throw galat.tidakDitemukan("Rekening kas/bank");

  return db.transaction(async (tx) => {
    await tx
      .update(journalItems)
      .set({ rekonsiliasiId: null })
      .where(and(inArray(journalItems.id, input.itemIds), eq(journalItems.rekonsiliasiId, id)));

    await hitungUlangSaldo(tx, id, ada.rekeningBankId, rek.akunCoaId, ada.tanggalLaporan, ada.saldoLaporanBank, oleh);
    return ambilRekonsiliasi(id);
  });
}

export async function selesaikanRekonsiliasi(id: string, oleh: string) {
  const [ada] = await db.select().from(bankReconciliations).where(eq(bankReconciliations.id, id));
  if (!ada) throw galat.tidakDitemukan("Rekonsiliasi bank");
  if (ada.status !== "DRAFT") throw galat.aturanBisnis(`Rekonsiliasi ini berstatus ${ada.status}.`);

  const [rek] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, ada.rekeningBankId));
  if (!rek) throw galat.tidakDitemukan("Rekening kas/bank");

  return db.transaction(async (tx) => {
    const { selisih } = await hitungUlangSaldo(
      tx,
      id,
      ada.rekeningBankId,
      rek.akunCoaId,
      ada.tanggalLaporan,
      ada.saldoLaporanBank,
      oleh,
    );

    if (keBigInt(selisih) !== BigInt(0)) {
      throw galat.aturanBisnis(
        `Rekonsiliasi belum seimbang (selisih ${selisih}). Rekonsiliasi hanya dapat diselesaikan bila selisihnya nol.`,
      );
    }

    const [selesai] = await tx
      .update(bankReconciliations)
      .set({
        status: "SELESAI",
        diselesaikanOleh: oleh,
        diselesaikanPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(bankReconciliations.id, id))
      .returning();

    return selesai!;
  });
}

export async function bukaKembaliRekonsiliasi(id: string, oleh: string) {
  const [ada] = await db.select().from(bankReconciliations).where(eq(bankReconciliations.id, id));
  if (!ada) throw galat.tidakDitemukan("Rekonsiliasi bank");
  if (ada.status !== "SELESAI") throw galat.aturanBisnis("Hanya rekonsiliasi SELESAI yang dapat dibuka kembali.");

  const [rekonsiliasiLebihBaru] = await db
    .select({ id: bankReconciliations.id })
    .from(bankReconciliations)
    .where(
      and(
        eq(bankReconciliations.rekeningBankId, ada.rekeningBankId),
        eq(bankReconciliations.status, "SELESAI"),
        sql`${bankReconciliations.tanggalLaporan} > ${ada.tanggalLaporan}`,
      ),
    )
    .limit(1);

  if (rekonsiliasiLebihBaru) {
    throw galat.aturanBisnis(
      "Terdapat rekonsiliasi bank yang lebih baru sudah diselesaikan. Batalkan rekonsiliasi yang lebih baru terlebih dahulu.",
    );
  }

  const [buka] = await db
    .update(bankReconciliations)
    .set({
      status: "DRAFT",
      diselesaikanOleh: null,
      diselesaikanPada: null,
      diubahOleh: oleh,
    })
    .where(eq(bankReconciliations.id, id))
    .returning();

  return buka!;
}

export async function importDanCocokkanMutasi(id: string, input: InputImportMutasiBank, oleh: string) {
  const detail = await ambilRekonsiliasi(id);
  if (detail.status !== "DRAFT") throw galat.aturanBisnis("Hanya rekonsiliasi DRAFT yang dapat mengimpor mutasi.");

  const sisaBelumCocok = [...detail.barisBelumCocok];
  const barisTercocokOtomatis: string[] = [];
  const rincianHasil = [];

  for (const baris of input.baris) {
    const nominal = keBigInt(baris.jumlah);
    const adalahMasuk = baris.jenis === "CR" || baris.jenis === "MASUK";

    const indeksKandidat = sisaBelumCocok.findIndex((b) => {
      const nominalBuku = adalahMasuk ? keBigInt(b.debit) : keBigInt(b.kredit);
      return nominalBuku === nominal;
    });

    if (indeksKandidat !== -1) {
      const [kandidat] = sisaBelumCocok.splice(indeksKandidat, 1);
      barisTercocokOtomatis.push(kandidat!.id);
      rincianHasil.push({
        barisCsv: baris,
        status: "TERCOCOKKAN",
        barisBuku: kandidat,
      });
    } else {
      rincianHasil.push({
        barisCsv: baris,
        status: "TIDAK_DITEMUKAN",
        barisBuku: null,
      });
    }
  }

  if (input.autoCocokkan && barisTercocokOtomatis.length > 0) {
    await cocokkanBaris(id, { itemIds: barisTercocokOtomatis }, oleh);
  }

  return {
    totalDiimpor: input.baris.length,
    totalTercocok: barisTercocokOtomatis.length,
    totalBelumTercocok: input.baris.length - barisTercocokOtomatis.length,
    otomatisDisimpan: Boolean(input.autoCocokkan),
    rincian: rincianHasil,
  };
}
