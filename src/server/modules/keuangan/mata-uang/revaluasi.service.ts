import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  chartOfAccounts,
  currencies,
  currencyRevaluationLines,
  currencyRevaluations,
  journalEntries,
  journalItems,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { galat } from "@/server/core/errors";
import { akunByPeran } from "../akun/service";
import { ambilMataUangDasar, dapatkanKursBerlaku } from "./service";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import { PREFIKS, nomorBerikut } from "../shared/transaction";
import { bagi, kaliKurs, keBigInt, keString } from "../shared/decimal";
import { nullJikaKosong } from "../shared/text";
import type { InputEksekusiRevaluasi, InputPreviewRevaluasi } from "./revaluasi.model";

export type BarisKalkulasiRevaluasi = {
  akunId: string;
  akunKode: string;
  akunNama: string;
  tipeAkun: string;
  mataUangId: string;
  mataUangKode: string;
  saldoValas: string;
  kursBuku: string;
  saldoBukuIdr: string;
  kursBaru: string;
  saldoWajarIdr: string;
  selisih: string;
  jenisSelisih: "LABA" | "RUGI";
};

export async function hitungRevaluasi(input: InputPreviewRevaluasi) {
  const mataUangDasar = await ambilMataUangDasar();

  // Ambil daftar mata uang asing yang aktif
  const kondisiMu = and(
    eq(currencies.aktif, true),
    eq(currencies.adalahMataUangDasar, false),
    input.mataUangId ? eq(currencies.id, input.mataUangId) : undefined,
  );
  const daftarMu = await db.select().from(currencies).where(kondisiMu);
  if (daftarMu.length === 0) {
    return {
      tanggal: input.tanggal,
      mataUangDasar,
      daftarBaris: [],
      totalLaba: "0",
      totalRugi: "0",
    };
  }

  const petaKurs = new Map<string, string>();
  for (const mu of daftarMu) {
    const k = await dapatkanKursBerlaku(mu.id, input.tanggal);
    petaKurs.set(mu.id, k.kurs);
  }

  // Cari semua akun moneter berdenominasi valas yang memiliki mutasi / saldo
  const akunValas = await db
    .select({
      id: chartOfAccounts.id,
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      mataUangId: chartOfAccounts.mataUangId,
    })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.aktif, true),
        eq(chartOfAccounts.bisaDiposting, true),
        inArray(chartOfAccounts.mataUangId, daftarMu.map((m) => m.id)),
      ),
    );

  const daftarBaris: BarisKalkulasiRevaluasi[] = [];
  let totalLabaBig = BigInt(0);
  let totalRugiBig = BigInt(0);

  for (const akun of akunValas) {
    if (!akun.mataUangId) continue;
    const muId = akun.mataUangId;
    const kursBaruStr = petaKurs.get(muId);
    if (!kursBaruStr) continue;
    const kursBaruBig = keBigInt(kursBaruStr, 8);

    // Agregasi mutasi jurnal terposting sampai tanggal revaluasi
    const [agregasi] = await db
      .select({
        debitValas: sql<string>`coalesce(sum(${journalItems.debit}), 0)::text`,
        kreditValas: sql<string>`coalesce(sum(${journalItems.kredit}), 0)::text`,
        debitDasar: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)::text`,
        kreditDasar: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)::text`,
      })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
      .where(
        and(
          eq(journalItems.akunId, akun.id),
          eq(journalEntries.status, "POSTED"),
          lte(journalEntries.tanggal, input.tanggal),
        ),
      );

    const debValas = keBigInt(agregasi?.debitValas ?? "0");
    const kreValas = keBigInt(agregasi?.kreditValas ?? "0");
    const debDasar = keBigInt(agregasi?.debitDasar ?? "0");
    const kreDasar = keBigInt(agregasi?.kreditDasar ?? "0");

    const adalahAsetAtauBeban = akun.tipeAkun === "ASET" || akun.tipeAkun === "BEBAN";
    const saldoValasBig = adalahAsetAtauBeban ? debValas - kreValas : kreValas - debValas;
    const saldoBukuIdrBig = adalahAsetAtauBeban ? debDasar - kreDasar : kreDasar - debDasar;

    // Hanya evaluasi akun yang memiliki saldo valas berjalan
    if (saldoValasBig === BigInt(0)) continue;

    // Nilai wajar baru dalam mata uang dasar = saldoValas x kursBaru
    const saldoWajarIdrBig = kaliKurs(saldoValasBig, kursBaruBig);

    // Selisih nilai wajar vs nilai buku
    let selisihBig: bigint;
    let jenisSelisih: "LABA" | "RUGI";

    if (adalahAsetAtauBeban) {
      // Aset: nilai wajar > nilai buku = LABA
      selisihBig = saldoWajarIdrBig - saldoBukuIdrBig;
      if (selisihBig >= BigInt(0)) {
        jenisSelisih = "LABA";
      } else {
        jenisSelisih = "RUGI";
        selisihBig = -selisihBig;
      }
    } else {
      // Kewajiban: nilai wajar > nilai buku = kewajiban bertambah = RUGI
      selisihBig = saldoWajarIdrBig - saldoBukuIdrBig;
      if (selisihBig >= BigInt(0)) {
        jenisSelisih = "RUGI";
      } else {
        jenisSelisih = "LABA";
        selisihBig = -selisihBig;
      }
    }

    if (selisihBig === BigInt(0)) continue;

    if (jenisSelisih === "LABA") totalLabaBig += selisihBig;
    else totalRugiBig += selisihBig;

    const kursBukuBig = bagi(saldoBukuIdrBig, saldoValasBig);
    const muObj = daftarMu.find((m) => m.id === muId);

    daftarBaris.push({
      akunId: akun.id,
      akunKode: akun.kode,
      akunNama: akun.nama,
      tipeAkun: akun.tipeAkun,
      mataUangId: muId,
      mataUangKode: muObj?.kode ?? "",
      saldoValas: keString(saldoValasBig),
      kursBuku: keString(kursBukuBig, 8),
      saldoBukuIdr: keString(saldoBukuIdrBig),
      kursBaru: kursBaruStr,
      saldoWajarIdr: keString(saldoWajarIdrBig),
      selisih: keString(selisihBig),
      jenisSelisih,
    });
  }

  return {
    tanggal: input.tanggal,
    mataUangDasar,
    daftarBaris,
    totalLaba: keString(totalLabaBig),
    totalRugi: keString(totalRugiBig),
  };
}

export async function eksekusiRevaluasi(input: InputEksekusiRevaluasi, oleh: string) {
  const hasilHitung = await hitungRevaluasi(input);
  if (hasilHitung.daftarBaris.length === 0) {
    throw galat.aturanBisnis("Tidak ada selisih kurs yang perlu direvaluasi pada tanggal ini.");
  }

  const akunLaba = await akunByPeran("LABA_SELISIH_KURS");
  const akunRugi = await akunByPeran("RUGI_SELISIH_KURS");
  const mataUangDasar = hasilHitung.mataUangDasar;
  const balikOtomatis = input.balikOtomatis ?? true;

  return db.transaction(async (tx) => {
    const nomor = await nomorBerikut(tx, PREFIKS.REVALUASI_KURS, input.tanggal);
    const barisJurnal: BarisJurnalInput[] = [];

    for (const b of hasilHitung.daftarBaris) {
      const adalahAsetAtauBeban = b.tipeAkun === "ASET" || b.tipeAkun === "BEBAN";
      if (b.jenisSelisih === "LABA") {
        if (adalahAsetAtauBeban) {
          // Dr Akun Valas (Aset bertambah), Cr Laba Selisih Kurs
          barisJurnal.push({
            akunId: b.akunId,
            debit: "0",
            kredit: "0",
            nilaiDasar: b.selisih,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Penyesuaian kurs valas ${b.mataUangKode} (Laba)`,
          });
          barisJurnal.push({
            akunId: akunLaba.id,
            debit: "0",
            kredit: "0",
            nilaiDasar: `-${b.selisih}`,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Laba selisih kurs belum terealisasi - ${b.akunKode} ${b.akunNama}`,
          });
        } else {
          // Dr Akun Valas (Kewajiban berkurang), Cr Laba Selisih Kurs
          barisJurnal.push({
            akunId: b.akunId,
            debit: "0",
            kredit: "0",
            nilaiDasar: b.selisih,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Penyesuaian kurs valas ${b.mataUangKode} (Laba)`,
          });
          barisJurnal.push({
            akunId: akunLaba.id,
            debit: "0",
            kredit: "0",
            nilaiDasar: `-${b.selisih}`,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Laba selisih kurs belum terealisasi - ${b.akunKode} ${b.akunNama}`,
          });
        }
      } else {
        // RUGI
        if (adalahAsetAtauBeban) {
          // Dr Rugi Selisih Kurs, Cr Akun Valas (Aset berkurang)
          barisJurnal.push({
            akunId: akunRugi.id,
            debit: "0",
            kredit: "0",
            nilaiDasar: b.selisih,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Rugi selisih kurs belum terealisasi - ${b.akunKode} ${b.akunNama}`,
          });
          barisJurnal.push({
            akunId: b.akunId,
            debit: "0",
            kredit: "0",
            nilaiDasar: `-${b.selisih}`,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Penyesuaian kurs valas ${b.mataUangKode} (Rugi)`,
          });
        } else {
          // Dr Rugi Selisih Kurs, Cr Akun Valas (Kewajiban bertambah)
          barisJurnal.push({
            akunId: akunRugi.id,
            debit: "0",
            kredit: "0",
            nilaiDasar: b.selisih,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Rugi selisih kurs belum terealisasi - ${b.akunKode} ${b.akunNama}`,
          });
          barisJurnal.push({
            akunId: b.akunId,
            debit: "0",
            kredit: "0",
            nilaiDasar: `-${b.selisih}`,
            mataUangId: mataUangDasar.id,
            kurs: "1.00000000",
            deskripsi: `Penyesuaian kurs valas ${b.mataUangKode} (Rugi)`,
          });
        }
      }
    }

    // Format baris agar valid di double-entry: debit dan kredit
    const barisTerformat: BarisJurnalInput[] = barisJurnal.map((b) => {
      const val = b.nilaiDasar!;
      const adalahDebit = !val.startsWith("-");
      const absVal = adalahDebit ? val : val.slice(1);
      return {
        akunId: b.akunId,
        debit: adalahDebit ? absVal : undefined,
        kredit: adalahDebit ? undefined : absVal,
        deskripsi: b.deskripsi,
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
      };
    });

    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: input.tanggal,
        deskripsi: nullJikaKosong(input.keterangan) ?? `Revaluasi kurs akhir periode ${input.tanggal}`,
        referensi: nomor,
        sumber: "REVALUASI_KURS",
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
        baris: barisTerformat,
        posting: true,
      },
      oleh,
    );

    let jurnalBalikId: string | null = null;
    if (balikOtomatis) {
      // Hari pertama bulan berikutnya
      const [thn, bln] = input.tanggal.split("-").map(Number);
      const nextThn = bln === 12 ? thn! + 1 : thn!;
      const nextBln = bln === 12 ? 1 : bln! + 1;
      const tanggalBalik = `${nextThn}-${String(nextBln).padStart(2, "0")}-01`;

      const pembalik = await balikJurnal(
        tx,
        jurnal.id,
        {
          tanggal: tanggalBalik,
          deskripsi: `Pembalik otomatis revaluasi kurs ${nomor} (${tanggalBalik})`,
          sumber: "PEMBALIK",
        },
        oleh,
      );
      jurnalBalikId = pembalik.id;
    }

    const [revaluasi] = await tx
      .insert(currencyRevaluations)
      .values({
        nomor,
        tanggal: input.tanggal,
        keterangan: nullJikaKosong(input.keterangan),
        jurnalId: jurnal.id,
        jurnalBalikId,
        totalLaba: hasilHitung.totalLaba,
        totalRugi: hasilHitung.totalRugi,
        balikOtomatis,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    for (const b of hasilHitung.daftarBaris) {
      await tx.insert(currencyRevaluationLines).values({
        revaluasiId: revaluasi!.id,
        akunId: b.akunId,
        mataUangId: b.mataUangId,
        saldoValas: b.saldoValas,
        kursBuku: b.kursBuku,
        saldoBukuIdr: b.saldoBukuIdr,
        kursBaru: b.kursBaru,
        saldoWajarIdr: b.saldoWajarIdr,
        selisih: b.selisih,
        jenisSelisih: b.jenisSelisih,
      });
    }

    return ambilRevaluasi(revaluasi!.id);
  });
}

export async function daftarRevaluasi(opsi: { dari?: string; sampai?: string; offset: number; ukuran: number }) {
  const kondisi = and(
    opsi.dari ? gte(currencyRevaluations.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(currencyRevaluations.tanggal, opsi.sampai) : undefined,
  );

  const [data, [hitung]] = await Promise.all([
    db
      .select({
        id: currencyRevaluations.id,
        nomor: currencyRevaluations.nomor,
        tanggal: currencyRevaluations.tanggal,
        keterangan: currencyRevaluations.keterangan,
        totalLaba: currencyRevaluations.totalLaba,
        totalRugi: currencyRevaluations.totalRugi,
        balikOtomatis: currencyRevaluations.balikOtomatis,
        jurnalId: currencyRevaluations.jurnalId,
        jurnalNomor: journalEntries.nomor,
        jurnalBalikId: currencyRevaluations.jurnalBalikId,
        dibuatOleh: currencyRevaluations.dibuatOleh,
        dibuatPada: currencyRevaluations.dibuatPada,
      })
      .from(currencyRevaluations)
      .innerJoin(journalEntries, eq(currencyRevaluations.jurnalId, journalEntries.id))
      .where(kondisi)
      .orderBy(desc(currencyRevaluations.tanggal), desc(currencyRevaluations.dibuatPada))
      .limit(opsi.ukuran)
      .offset(opsi.offset),
    db.select({ total: sql<number>`count(*)::int` }).from(currencyRevaluations).where(kondisi),
  ]);

  return { data, total: hitung?.total ?? 0 };
}

export async function ambilRevaluasi(id: string) {
  const [header] = await db
    .select({
      id: currencyRevaluations.id,
      nomor: currencyRevaluations.nomor,
      tanggal: currencyRevaluations.tanggal,
      keterangan: currencyRevaluations.keterangan,
      totalLaba: currencyRevaluations.totalLaba,
      totalRugi: currencyRevaluations.totalRugi,
      balikOtomatis: currencyRevaluations.balikOtomatis,
      jurnalId: currencyRevaluations.jurnalId,
      jurnalNomor: journalEntries.nomor,
      jurnalBalikId: currencyRevaluations.jurnalBalikId,
      dibuatOleh: currencyRevaluations.dibuatOleh,
      dibuatPada: currencyRevaluations.dibuatPada,
    })
    .from(currencyRevaluations)
    .innerJoin(journalEntries, eq(currencyRevaluations.jurnalId, journalEntries.id))
    .where(eq(currencyRevaluations.id, id));

  if (!header) throw galat.tidakDitemukan("Revaluasi kurs");

  const lines = await db
    .select({
      id: currencyRevaluationLines.id,
      akunId: currencyRevaluationLines.akunId,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      mataUangId: currencyRevaluationLines.mataUangId,
      mataUangKode: currencies.kode,
      saldoValas: currencyRevaluationLines.saldoValas,
      kursBuku: currencyRevaluationLines.kursBuku,
      saldoBukuIdr: currencyRevaluationLines.saldoBukuIdr,
      kursBaru: currencyRevaluationLines.kursBaru,
      saldoWajarIdr: currencyRevaluationLines.saldoWajarIdr,
      selisih: currencyRevaluationLines.selisih,
      jenisSelisih: currencyRevaluationLines.jenisSelisih,
    })
    .from(currencyRevaluationLines)
    .innerJoin(chartOfAccounts, eq(currencyRevaluationLines.akunId, chartOfAccounts.id))
    .innerJoin(currencies, eq(currencyRevaluationLines.mataUangId, currencies.id))
    .where(eq(currencyRevaluationLines.revaluasiId, id))
    .orderBy(chartOfAccounts.kode);

  return {
    ...header,
    daftarBaris: lines,
  };
}
