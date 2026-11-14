import { and, asc, desc, eq, exists, gt, gte, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  bankAccounts,
  bankReconciliations,
  chartOfAccounts,
  companies,
  currencies,
  items,
  journalEntries,
  journalItems,
  partners,
  purchaseInvoiceItems,
  purchaseInvoices,
  salesInvoiceItems,
  salesInvoices,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { keBigInt, keString } from "../shared/decimal";
import { galat } from "@/server/core/errors";
import { susunLaporanArusKas } from "./arus-kas";
import { bulanDashboard, susunRingkasanKpiDashboard } from "./dashboard-summary";

/** Baris rincian laporan (akun + nilai terformat). */
type BarisLaporan = Record<string, string | number | null>;

function saldoNormal(debit: bigint, kredit: bigint, normal: "DEBIT" | "KREDIT") {
  return normal === "DEBIT" ? debit - kredit : kredit - debit;
}

export async function ringkasanKpiDashboard(perTanggal: string) {
  const { dari } = bulanDashboard(perTanggal);
  const bulanSql = sql<string>`to_char(${journalEntries.tanggal}, 'YYYY-MM')`;
  const akunBulanan = await db
    .select({
      bulan: bulanSql,
      kode: chartOfAccounts.kode,
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      peranSistem: chartOfAccounts.peranSistem,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(journalItems)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalItems.akunId))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        gte(journalEntries.tanggal, dari),
        lte(journalEntries.tanggal, perTanggal),
      ),
    )
    .where(inArray(chartOfAccounts.tipeAkun, ["PENDAPATAN", "BEBAN"]))
    .groupBy(bulanSql, chartOfAccounts.id);

  const saldoKasAwal = await db
    .select({
      normalBalance: chartOfAccounts.normalBalance,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(journalItems)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalItems.akunId))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        lt(journalEntries.tanggal, dari),
      ),
    )
    .where(eq(chartOfAccounts.peranSistem, "KAS_BANK"))
    .groupBy(chartOfAccounts.normalBalance);

  const mutasiKasBulanan = await db
    .select({
      bulan: bulanSql,
      normalBalance: chartOfAccounts.normalBalance,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(journalItems)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalItems.akunId))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        gte(journalEntries.tanggal, dari),
        lte(journalEntries.tanggal, perTanggal),
      ),
    )
    .where(eq(chartOfAccounts.peranSistem, "KAS_BANK"))
    .groupBy(bulanSql, chartOfAccounts.normalBalance);

  return susunRingkasanKpiDashboard({
    perTanggal,
    akunBulanan,
    saldoKasAwal,
    mutasiKasBulanan,
  });
}

export async function aktivitasJurnalDashboard() {
  const [jurnalTerbaru, [draft]] = await Promise.all([
    db
      .select({
        id: journalEntries.id,
        nomor: journalEntries.nomor,
        tanggal: journalEntries.tanggal,
        deskripsi: journalEntries.deskripsi,
        total: journalEntries.totalDebit,
      })
      .from(journalEntries)
      .where(eq(journalEntries.status, "POSTED"))
      .orderBy(desc(journalEntries.dipostingPada), desc(journalEntries.tanggal))
      .limit(5),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(journalEntries)
      .where(eq(journalEntries.status, "DRAFT")),
  ]);

  return {
    jurnalTerbaru,
    jumlahDraft: draft?.total ?? 0,
  };
}

/**
 * 1. LAPORAN NERACA (Balance Sheet)
 * Posisi Keuangan per tanggal tertentu: Aset = Kewajiban + Ekuitas.
 * Laba periode berjalan dimasukkan ke komponen Ekuitas agar Neraca selalu seimbang (balance).
 */
export async function laporanNeraca(perTanggal: string) {
  const baris = await db
    .select({
      id: chartOfAccounts.id,
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      level: chartOfAccounts.level,
      adalahAkunKontra: chartOfAccounts.adalahAkunKontra,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}) filter (where ${journalEntries.id} is not null), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}) filter (where ${journalEntries.id} is not null), 0)`,
    })
    .from(chartOfAccounts)
    .leftJoin(
      journalItems,
      eq(journalItems.akunId, chartOfAccounts.id),
    )
    .leftJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        lte(journalEntries.tanggal, perTanggal),
      ),
    )
    .groupBy(chartOfAccounts.id)
    .orderBy(asc(chartOfAccounts.kode));

  let totalAset = BigInt(0);
  let totalKewajiban = BigInt(0);
  let totalEkuitas = BigInt(0);
  let totalPendapatanKumulatif = BigInt(0);
  let totalBebanKumulatif = BigInt(0);

  type BarisNeraca = { kode: string; nama: string; level: number; saldo: string };
  const aset: BarisNeraca[] = [];
  const kewajiban: BarisNeraca[] = [];
  const ekuitas: BarisNeraca[] = [];

  for (const b of baris) {
    const d = keBigInt(b.debit);
    const k = keBigInt(b.kredit);
    const saldo = saldoNormal(d, k, b.normalBalance);

    if (b.tipeAkun === "ASET") {
      totalAset += saldo;
      aset.push({ kode: b.kode, nama: b.nama, level: b.level, saldo: keString(saldo) });
    } else if (b.tipeAkun === "KEWAJIBAN") {
      totalKewajiban += saldo;
      kewajiban.push({ kode: b.kode, nama: b.nama, level: b.level, saldo: keString(saldo) });
    } else if (b.tipeAkun === "EKUITAS") {
      totalEkuitas += saldo;
      ekuitas.push({ kode: b.kode, nama: b.nama, level: b.level, saldo: keString(saldo) });
    } else if (b.tipeAkun === "PENDAPATAN") {
      totalPendapatanKumulatif += saldo;
    } else if (b.tipeAkun === "BEBAN") {
      totalBebanKumulatif += saldo;
    }
  }

  // Laba bersih kumulatif berjalan
  const labaBerjalan = totalPendapatanKumulatif - totalBebanKumulatif;
  ekuitas.push({
    kode: "3300",
    nama: "Laba (Rugi) Periode Berjalan",
    level: 2,
    saldo: keString(labaBerjalan),
  });

  const totalEkuitasPlusLaba = totalEkuitas + labaBerjalan;
  const totalLiabilitasDanEkuitas = totalKewajiban + totalEkuitasPlusLaba;
  const seimbang = totalAset === totalLiabilitasDanEkuitas;

  return {
    perTanggal,
    aset: { rincian: aset, total: keString(totalAset) },
    kewajiban: { rincian: kewajiban, total: keString(totalKewajiban) },
    ekuitas: { rincian: ekuitas, total: keString(totalEkuitasPlusLaba) },
    totalLiabilitasDanEkuitas: keString(totalLiabilitasDanEkuitas),
    seimbang,
    selisih: keString(totalAset - totalLiabilitasDanEkuitas),
  };
}

/**
 * 2. LAPORAN LABA RUGI (Income Statement)
 * Kinerja keuangan dalam rentang tanggal: Pendapatan - Beban = Laba Bersih.
 */
export async function laporanLabaRugi(dari: string, sampai: string) {
  if (dari > sampai) throw galat.aturanBisnis("Tanggal mulai tidak boleh setelah tanggal selesai.");

  const baris = await db
    .select({
      id: chartOfAccounts.id,
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      level: chartOfAccounts.level,
      peranSistem: chartOfAccounts.peranSistem,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(chartOfAccounts)
    .innerJoin(journalItems, eq(journalItems.akunId, chartOfAccounts.id))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        gte(journalEntries.tanggal, dari),
        lte(journalEntries.tanggal, sampai),
      ),
    )
    .groupBy(chartOfAccounts.id)
    .orderBy(asc(chartOfAccounts.kode));

  let totalPendapatan = BigInt(0);
  let totalHpp = BigInt(0);
  let totalBebanOperasional = BigInt(0);
  let totalLainLain = BigInt(0);

  const pendapatan: BarisLaporan[] = [];
  const hpp: BarisLaporan[] = [];
  const bebanOperasional: BarisLaporan[] = [];
  const lainLain: BarisLaporan[] = [];

  for (const b of baris) {
    const d = keBigInt(b.debit);
    const k = keBigInt(b.kredit);
    const saldo = saldoNormal(d, k, b.normalBalance);
    if (saldo === BigInt(0)) continue;

    const barisAkun = { kode: b.kode, nama: b.nama, level: b.level, saldo: keString(saldo) };

    if (b.tipeAkun === "PENDAPATAN") {
      if (b.peranSistem === "LABA_SELISIH_KURS") {
        totalLainLain += saldo;
        lainLain.push(barisAkun);
      } else {
        totalPendapatan += saldo;
        pendapatan.push(barisAkun);
      }
    } else if (b.tipeAkun === "BEBAN") {
      if (b.peranSistem === "HARGA_POKOK_PENJUALAN" || b.kode.startsWith("5")) {
        totalHpp += saldo;
        hpp.push(barisAkun);
      } else if (b.peranSistem === "RUGI_SELISIH_KURS") {
        totalLainLain -= saldo;
        lainLain.push(barisAkun);
      } else {
        totalBebanOperasional += saldo;
        bebanOperasional.push(barisAkun);
      }
    }
  }

  const labaKotor = totalPendapatan - totalHpp;
  const labaOperasional = labaKotor - totalBebanOperasional;
  const labaBersih = labaOperasional + totalLainLain;

  return {
    dari,
    sampai,
    pendapatan: { rincian: pendapatan, total: keString(totalPendapatan) },
    hargaPokokPenjualan: { rincian: hpp, total: keString(totalHpp) },
    labaKotor: keString(labaKotor),
    bebanOperasional: { rincian: bebanOperasional, total: keString(totalBebanOperasional) },
    labaOperasional: keString(labaOperasional),
    pendapatanBebanLain: { rincian: lainLain, total: keString(totalLainLain) },
    labaBersih: keString(labaBersih),
  };
}

/**
 * 3. LAPORAN PERUBAHAN MODAL (Statement of Changes in Equity)
 */
export async function laporanPerubahanModal(dari: string, sampai: string) {
  if (dari > sampai) throw galat.aturanBisnis("Tanggal mulai tidak boleh setelah tanggal selesai.");

  // Modal awal: Ekuitas sebelum tanggal `dari`
  const modalAwalRes = await db
    .select({
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(chartOfAccounts)
    .innerJoin(journalItems, eq(journalItems.akunId, chartOfAccounts.id))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        sql`${journalEntries.tanggal} < ${dari}`,
      ),
    )
    .groupBy(chartOfAccounts.tipeAkun, chartOfAccounts.normalBalance);

  let modalAwal = BigInt(0);
  for (const r of modalAwalRes) {
    const s = saldoNormal(keBigInt(r.debit), keBigInt(r.kredit), r.normalBalance as "DEBIT" | "KREDIT");
    if (r.tipeAkun === "EKUITAS" || r.tipeAkun === "PENDAPATAN") modalAwal += s;
    if (r.tipeAkun === "BEBAN") modalAwal -= s;
  }

  // Laba bersih periode ini
  const lr = await laporanLabaRugi(dari, sampai);
  const labaBersihInt = keBigInt(lr.labaBersih);

  // Perubahan modal langsung (setoran modal periode ini)
  const mutasiModal = await db
    .select({
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      normalBalance: chartOfAccounts.normalBalance,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(chartOfAccounts)
    .innerJoin(journalItems, eq(journalItems.akunId, chartOfAccounts.id))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        gte(journalEntries.tanggal, dari),
        lte(journalEntries.tanggal, sampai),
      ),
    )
    .where(eq(chartOfAccounts.tipeAkun, "EKUITAS"))
    .groupBy(chartOfAccounts.id);

  let setoranModal = BigInt(0);
  const rincianModal: BarisLaporan[] = [];
  for (const m of mutasiModal) {
    const s = saldoNormal(keBigInt(m.debit), keBigInt(m.kredit), m.normalBalance as "DEBIT" | "KREDIT");
    if (s !== BigInt(0)) {
      setoranModal += s;
      rincianModal.push({ kode: m.kode, nama: m.nama, mutasi: keString(s) });
    }
  }

  const modalAkhir = modalAwal + labaBersihInt + setoranModal;

  return {
    dari,
    sampai,
    modalAwal: keString(modalAwal),
    labaBersih: lr.labaBersih,
    setoranAtauPerubahanEkuitas: { rincian: rincianModal, total: keString(setoranModal) },
    modalAkhir: keString(modalAkhir),
  };
}

/**
 * 4. LAPORAN ARUS KAS (Cash Flow Statement - Direct / Categorized Method)
 */
export async function laporanArusKas(dari: string, sampai: string) {
  if (dari > sampai) throw galat.aturanBisnis("Tanggal mulai tidak boleh setelah tanggal selesai.");

  const saldoKasAwal = await db
    .select({
      normalBalance: chartOfAccounts.normalBalance,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(journalItems)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalItems.akunId))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        lt(journalEntries.tanggal, dari),
      ),
    )
    .where(eq(chartOfAccounts.peranSistem, "KAS_BANK"))
    .groupBy(chartOfAccounts.normalBalance);

  const barisKas = alias(journalItems, "baris_kas");
  const akunKas = alias(chartOfAccounts, "akun_kas");
  const jurnalDenganKas = db
    .select({ id: barisKas.id })
    .from(barisKas)
    .innerJoin(akunKas, eq(akunKas.id, barisKas.akunId))
    .where(
      and(
        eq(barisKas.jurnalId, journalItems.jurnalId),
        eq(akunKas.peranSistem, "KAS_BANK"),
      ),
    );

  const akunLawanKas = await db
    .select({
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      kategoriArusKas: chartOfAccounts.kategoriArusKas,
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
    })
    .from(journalItems)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalItems.akunId))
    .innerJoin(
      journalEntries,
      and(
        eq(journalEntries.id, journalItems.jurnalId),
        eq(journalEntries.status, "POSTED"),
        gte(journalEntries.tanggal, dari),
        lte(journalEntries.tanggal, sampai),
      ),
    )
    .where(
      and(
        exists(jurnalDenganKas),
        or(
          isNull(chartOfAccounts.peranSistem),
          ne(chartOfAccounts.peranSistem, "KAS_BANK"),
        ),
      ),
    )
    .groupBy(chartOfAccounts.id);

  return susunLaporanArusKas({
    dari,
    sampai,
    saldoKasAwal,
    akunLawan: akunLawanKas,
  });
}

/**
 * 5. LAPORAN MUTASI REKENING (Bank/Cash Statement)
 * Pergerakan historis dana pada satu rekening kas/bank dengan running balance.
 */
export async function laporanMutasiRekening(rekeningBankId: string, dari: string, sampai: string) {
  if (dari > sampai) throw galat.aturanBisnis("Tanggal mulai tidak boleh setelah tanggal selesai.");

  const [rek] = await db
    .select({
      id: bankAccounts.id,
      kode: bankAccounts.kode,
      nama: bankAccounts.nama,
      jenis: bankAccounts.jenis,
      namaBank: bankAccounts.namaBank,
      nomorRekening: bankAccounts.nomorRekening,
      atasNama: bankAccounts.atasNama,
      akunCoaId: bankAccounts.akunCoaId,
      kodeAkun: chartOfAccounts.kode,
      namaAkun: chartOfAccounts.nama,
      mataUangId: bankAccounts.mataUangId,
      kodeMataUang: currencies.kode,
      simbolMataUang: currencies.simbol,
    })
    .from(bankAccounts)
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, bankAccounts.akunCoaId))
    .innerJoin(currencies, eq(currencies.id, bankAccounts.mataUangId))
    .where(eq(bankAccounts.id, rekeningBankId));

  if (!rek) throw galat.tidakDitemukan("Rekening kas/bank");

  // Saldo awal sebelum tanggal `dari`
  const [saldoAwalRow] = await db
    .select({
      totalDebit: sql<string>`coalesce(sum(${journalItems.debit}), 0)::text`,
      totalKredit: sql<string>`coalesce(sum(${journalItems.kredit}), 0)::text`,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
    .where(
      and(
        eq(journalItems.akunId, rek.akunCoaId),
        eq(journalEntries.status, "POSTED"),
        lt(journalEntries.tanggal, dari),
      ),
    );

  const saldoAwalInt = keBigInt(saldoAwalRow?.totalDebit ?? "0") - keBigInt(saldoAwalRow?.totalKredit ?? "0");

  // Pergerakan mutasi kas/bank dalam rentang tanggal
  const barisMutasi = await db
    .select({
      id: journalItems.id,
      jurnalId: journalItems.jurnalId,
      nomorJurnal: journalEntries.nomor,
      tanggal: journalEntries.tanggal,
      sumber: journalEntries.sumber,
      referensi: journalEntries.referensi,
      deskripsi: journalItems.deskripsi,
      debit: journalItems.debit,
      kredit: journalItems.kredit,
      kontakId: journalItems.kontakId,
      namaKontak: partners.nama,
      rekonsiliasiId: journalItems.rekonsiliasiId,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
    .leftJoin(partners, eq(partners.id, journalItems.kontakId))
    .where(
      and(
        eq(journalItems.akunId, rek.akunCoaId),
        eq(journalEntries.status, "POSTED"),
        gte(journalEntries.tanggal, dari),
        lte(journalEntries.tanggal, sampai),
      ),
    )
    .orderBy(asc(journalEntries.tanggal), asc(journalEntries.nomor), asc(journalItems.urutan));

  let runningBalance = saldoAwalInt;
  let totalMasukInt = BigInt(0);
  let totalKeluarInt = BigInt(0);

  const mutasi = barisMutasi.map((b) => {
    const debit = keBigInt(b.debit);
    const kredit = keBigInt(b.kredit);
    totalMasukInt += debit;
    totalKeluarInt += kredit;
    runningBalance += debit - kredit;

    return {
      id: b.id,
      jurnalId: b.jurnalId,
      nomorJurnal: b.nomorJurnal,
      tanggal: b.tanggal,
      sumber: b.sumber,
      referensi: b.referensi,
      deskripsi: b.deskripsi,
      namaKontak: b.namaKontak,
      mutasiMasuk: b.debit,
      mutasiKeluar: b.kredit,
      saldo: keString(runningBalance),
      sudahRekonsiliasi: b.rekonsiliasiId !== null,
    };
  });

  return {
    rekening: {
      id: rek.id,
      kode: rek.kode,
      nama: rek.nama,
      jenis: rek.jenis,
      namaBank: rek.namaBank,
      nomorRekening: rek.nomorRekening,
      atasNama: rek.atasNama,
      kodeAkun: rek.kodeAkun,
      namaAkun: rek.namaAkun,
      kodeMataUang: rek.kodeMataUang,
      simbolMataUang: rek.simbolMataUang,
    },
    periode: { dari, sampai },
    saldoAwal: keString(saldoAwalInt),
    totalMasuk: keString(totalMasukInt),
    totalKeluar: keString(totalKeluarInt),
    saldoAkhir: keString(runningBalance),
    mutasi,
  };
}

/**
 * 6. LAPORAN REKONSILIASI BANK (Bank Reconciliation Statement)
 * Rekonsiliasi formal antara Saldo Rekening Koran vs Saldo Buku Besar Kas/Bank.
 */
export async function laporanRekonsiliasiBank(rekonsiliasiId: string) {
  const [rekonsiliasi] = await db
    .select({
      id: bankReconciliations.id,
      rekeningBankId: bankReconciliations.rekeningBankId,
      namaRekening: bankAccounts.nama,
      kodeRekening: bankAccounts.kode,
      namaBank: bankAccounts.namaBank,
      nomorRekening: bankAccounts.nomorRekening,
      akunCoaId: bankAccounts.akunCoaId,
      kodeAkun: chartOfAccounts.kode,
      namaAkun: chartOfAccounts.nama,
      kodeMataUang: currencies.kode,
      tanggalLaporan: bankReconciliations.tanggalLaporan,
      saldoLaporanBank: bankReconciliations.saldoLaporanBank,
      saldoBukuTercocok: bankReconciliations.saldoBukuTercocok,
      selisih: bankReconciliations.selisih,
      status: bankReconciliations.status,
      catatan: bankReconciliations.catatan,
      diselesaikanOleh: bankReconciliations.diselesaikanOleh,
      diselesaikanPada: bankReconciliations.diselesaikanPada,
    })
    .from(bankReconciliations)
    .innerJoin(bankAccounts, eq(bankAccounts.id, bankReconciliations.rekeningBankId))
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, bankAccounts.akunCoaId))
    .innerJoin(currencies, eq(currencies.id, bankAccounts.mataUangId))
    .where(eq(bankReconciliations.id, rekonsiliasiId));

  if (!rekonsiliasi) throw galat.tidakDitemukan("Rekonsiliasi bank");

  // 1. Saldo Buku Besar Kas/Bank per tanggal laporan
  const [saldoBukuTotalRow] = await db
    .select({
      totalDebit: sql<string>`coalesce(sum(${journalItems.debit}), 0)::text`,
      totalKredit: sql<string>`coalesce(sum(${journalItems.kredit}), 0)::text`,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
    .where(
      and(
        eq(journalItems.akunId, rekonsiliasi.akunCoaId),
        eq(journalEntries.status, "POSTED"),
        lte(journalEntries.tanggal, rekonsiliasi.tanggalLaporan),
      ),
    );

  const saldoBukuBesarInt =
    keBigInt(saldoBukuTotalRow?.totalDebit ?? "0") - keBigInt(saldoBukuTotalRow?.totalKredit ?? "0");

  // 2. Baris kas/bank yang belum kliring (unmatched):
  //    - Setoran dalam perjalanan (Deposit in Transit): penerimaan dicatat di buku tapi belum kliring di bank (debit > 0)
  //    - Pengeluaran beredar (Outstanding Checks): pengeluaran dicatat di buku tapi belum kliring di bank (kredit > 0)
  const barisBelumKliring = await db
    .select({
      id: journalItems.id,
      jurnalId: journalItems.jurnalId,
      nomorJurnal: journalEntries.nomor,
      tanggal: journalEntries.tanggal,
      deskripsi: journalItems.deskripsi,
      debit: journalItems.debit,
      kredit: journalItems.kredit,
      namaKontak: partners.nama,
    })
    .from(journalItems)
    .innerJoin(journalEntries, eq(journalEntries.id, journalItems.jurnalId))
    .leftJoin(partners, eq(partners.id, journalItems.kontakId))
    .where(
      and(
        eq(journalItems.akunId, rekonsiliasi.akunCoaId),
        eq(journalEntries.status, "POSTED"),
        lte(journalEntries.tanggal, rekonsiliasi.tanggalLaporan),
        sql`${journalItems.rekonsiliasiId} IS NULL`,
      ),
    )
    .orderBy(asc(journalEntries.tanggal), asc(journalEntries.nomor));

  const setoranDalamPerjalanan = barisBelumKliring.filter((b) => keBigInt(b.debit) > BigInt(0));
  const pengeluaranBeredar = barisBelumKliring.filter((b) => keBigInt(b.kredit) > BigInt(0));

  const totalSetoranDalamPerjalanan = setoranDalamPerjalanan.reduce(
    (s, b) => s + keBigInt(b.debit),
    BigInt(0),
  );
  const totalPengeluaranBeredar = pengeluaranBeredar.reduce(
    (s, b) => s + keBigInt(b.kredit),
    BigInt(0),
  );

  const saldoBankInt = keBigInt(rekonsiliasi.saldoLaporanBank);
  const saldoBankDisesuaikanInt = saldoBankInt + totalSetoranDalamPerjalanan - totalPengeluaranBeredar;
  const selisihRekonsiliasiInt = saldoBankDisesuaikanInt - saldoBukuBesarInt;

  return {
    rekonsiliasi: {
      id: rekonsiliasi.id,
      rekeningBankId: rekonsiliasi.rekeningBankId,
      namaRekening: rekonsiliasi.namaRekening,
      kodeRekening: rekonsiliasi.kodeRekening,
      namaBank: rekonsiliasi.namaBank,
      nomorRekening: rekonsiliasi.nomorRekening,
      kodeAkun: rekonsiliasi.kodeAkun,
      namaAkun: rekonsiliasi.namaAkun,
      kodeMataUang: rekonsiliasi.kodeMataUang,
      tanggalLaporan: rekonsiliasi.tanggalLaporan,
      status: rekonsiliasi.status,
      catatan: rekonsiliasi.catatan,
      diselesaikanOleh: rekonsiliasi.diselesaikanOleh,
      diselesaikanPada: rekonsiliasi.diselesaikanPada,
    },
    ringkasan: {
      saldoLaporanBank: rekonsiliasi.saldoLaporanBank,
      totalSetoranDalamPerjalanan: keString(totalSetoranDalamPerjalanan),
      totalPengeluaranBeredar: keString(totalPengeluaranBeredar),
      saldoBankDisesuaikan: keString(saldoBankDisesuaikanInt),
      saldoBukuBesar: keString(saldoBukuBesarInt),
      selisih: keString(selisihRekonsiliasiInt),
    },
    rincian: {
      setoranDalamPerjalanan,
      pengeluaranBeredar,
    },
  };
}

/**
 * 7. NERACA SALDO (Trial Balance)
 * Laporan saldo akun buku besar: Saldo Awal, Mutasi Periode, dan Saldo Akhir.
 * Membuktikan keseimbangan akuntansi double-entry (Total Debit = Total Kredit).
 */
export async function laporanNeracaSaldo(dari?: string, sampai?: string) {
  const tanggalSampai = sampai ?? new Date().toISOString().slice(0, 10);
  const tanggalDari = dari ?? null;

  const baris = await db
    .select({
      id: chartOfAccounts.id,
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      level: chartOfAccounts.level,
      adalahAkunKontra: chartOfAccounts.adalahAkunKontra,
      // Saldo sebelum tanggalDari
      debitAwal: sql<string>`coalesce(sum(case when ${tanggalDari ? sql`${journalEntries.tanggal} < ${tanggalDari}` : sql`false`} then ${journalItems.debitDasar} else 0 end), 0)::text`,
      kreditAwal: sql<string>`coalesce(sum(case when ${tanggalDari ? sql`${journalEntries.tanggal} < ${tanggalDari}` : sql`false`} then ${journalItems.kreditDasar} else 0 end), 0)::text`,
      // Mutasi dalam rentang tanggalDari .. tanggalSampai
      mutasiDebit: sql<string>`coalesce(sum(case when ${tanggalDari ? sql`${journalEntries.tanggal} >= ${tanggalDari} and ${journalEntries.tanggal} <= ${tanggalSampai}` : sql`${journalEntries.tanggal} <= ${tanggalSampai}`} then ${journalItems.debitDasar} else 0 end), 0)::text`,
      mutasiKredit: sql<string>`coalesce(sum(case when ${tanggalDari ? sql`${journalEntries.tanggal} >= ${tanggalDari} and ${journalEntries.tanggal} <= ${tanggalSampai}` : sql`${journalEntries.tanggal} <= ${tanggalSampai}`} then ${journalItems.kreditDasar} else 0 end), 0)::text`,
      // Total sampai tanggalSampai
      totalDebit: sql<string>`coalesce(sum(case when ${journalEntries.tanggal} <= ${tanggalSampai} then ${journalItems.debitDasar} else 0 end), 0)::text`,
      totalKredit: sql<string>`coalesce(sum(case when ${journalEntries.tanggal} <= ${tanggalSampai} then ${journalItems.kreditDasar} else 0 end), 0)::text`,
    })
    .from(chartOfAccounts)
    .leftJoin(journalItems, eq(journalItems.akunId, chartOfAccounts.id))
    .leftJoin(
      journalEntries,
      and(
        eq(journalItems.jurnalId, journalEntries.id),
        eq(journalEntries.status, "POSTED"),
      ),
    )
    .where(eq(chartOfAccounts.aktif, true))
    .groupBy(
      chartOfAccounts.id,
      chartOfAccounts.kode,
      chartOfAccounts.nama,
      chartOfAccounts.tipeAkun,
      chartOfAccounts.normalBalance,
      chartOfAccounts.level,
      chartOfAccounts.adalahAkunKontra,
    )
    .orderBy(asc(chartOfAccounts.kode));

  let totAwalDeb = BigInt(0);
  let totAwalKre = BigInt(0);
  let totMutDeb = BigInt(0);
  let totMutKre = BigInt(0);
  let totAkhirDeb = BigInt(0);
  let totAkhirKre = BigInt(0);

  const daftarAkun = [];

  for (const b of baris) {
    const debAwal = keBigInt(b.debitAwal);
    const kreAwal = keBigInt(b.kreditAwal);
    const mutDeb = keBigInt(b.mutasiDebit);
    const mutKre = keBigInt(b.mutasiKredit);
    const totDeb = keBigInt(b.totalDebit);
    const totKre = keBigInt(b.totalKredit);

    // Saldo bersih awal
    const netAwal = b.normalBalance === "DEBIT" ? debAwal - kreAwal : kreAwal - debAwal;
    const awalDeb = b.normalBalance === "DEBIT" ? (netAwal >= BigInt(0) ? netAwal : BigInt(0)) : (netAwal < BigInt(0) ? -netAwal : BigInt(0));
    const awalKre = b.normalBalance === "KREDIT" ? (netAwal >= BigInt(0) ? netAwal : BigInt(0)) : (netAwal < BigInt(0) ? -netAwal : BigInt(0));

    // Saldo bersih akhir
    const netAkhir = b.normalBalance === "DEBIT" ? totDeb - totKre : totKre - totDeb;
    const akhirDeb = b.normalBalance === "DEBIT" ? (netAkhir >= BigInt(0) ? netAkhir : BigInt(0)) : (netAkhir < BigInt(0) ? -netAkhir : BigInt(0));
    const akhirKre = b.normalBalance === "KREDIT" ? (netAkhir >= BigInt(0) ? netAkhir : BigInt(0)) : (netAkhir < BigInt(0) ? -netAkhir : BigInt(0));

    // Skip akun yang tidak memiliki mutasi dan tidak bersaldo sama sekali
    if (
      debAwal === BigInt(0) &&
      kreAwal === BigInt(0) &&
      mutDeb === BigInt(0) &&
      mutKre === BigInt(0) &&
      totDeb === BigInt(0) &&
      totKre === BigInt(0)
    ) {
      continue;
    }

    totAwalDeb += awalDeb;
    totAwalKre += awalKre;
    totMutDeb += mutDeb;
    totMutKre += mutKre;
    totAkhirDeb += akhirDeb;
    totAkhirKre += akhirKre;

    daftarAkun.push({
      id: b.id,
      kode: b.kode,
      nama: b.nama,
      tipeAkun: b.tipeAkun,
      normalBalance: b.normalBalance,
      level: b.level,
      saldoAwalDebit: keString(awalDeb),
      saldoAwalKredit: keString(awalKre),
      mutasiDebit: keString(mutDeb),
      mutasiKredit: keString(mutKre),
      saldoAkhirDebit: keString(akhirDeb),
      saldoAkhirKredit: keString(akhirKre),
    });
  }

  return {
    periode: { dari: tanggalDari, sampai: tanggalSampai },
    total: {
      saldoAwalDebit: keString(totAwalDeb),
      saldoAwalKredit: keString(totAwalKre),
      mutasiDebit: keString(totMutDeb),
      mutasiKredit: keString(totMutKre),
      saldoAkhirDebit: keString(totAkhirDeb),
      saldoAkhirKredit: keString(totAkhirKre),
    },
    seimbang: totAkhirDeb === totAkhirKre,
    daftarAkun,
  };
}

/**
 * 8. WORKSHEET / KERTAS KERJA PENYESUAIAN (10-Column Accounting Worksheet)
 * Kolom 1-2: Neraca Saldo Sebelum Penyesuaian (Dr / Cr)
 * Kolom 3-4: Jurnal Penyesuaian (Dr / Cr)
 * Kolom 5-6: Neraca Saldo Setelah Penyesuaian (Dr / Cr)
 * Kolom 7-8: Laba Rugi (Dr / Cr)
 * Kolom 9-10: Neraca (Dr / Cr)
 * Menampilkan Laba/Rugi Bersih penyeimbang.
 */
export async function laporanWorksheetPenyesuaian(dari: string, sampai: string) {
  const baris = await db
    .select({
      id: chartOfAccounts.id,
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      level: chartOfAccounts.level,
      // Transaksi umum/reguler
      debitReguler: sql<string>`coalesce(sum(case when ${journalEntries.sumber} not in ('MANUAL', 'REVALUASI_KURS') and ${journalEntries.tanggal} <= ${sampai} then ${journalItems.debitDasar} else 0 end), 0)::text`,
      kreditReguler: sql<string>`coalesce(sum(case when ${journalEntries.sumber} not in ('MANUAL', 'REVALUASI_KURS') and ${journalEntries.tanggal} <= ${sampai} then ${journalItems.kreditDasar} else 0 end), 0)::text`,
      // Transaksi penyesuaian (MANUAL / REVALUASI_KURS dalam periode dari s/d sampai)
      debitPenyesuaian: sql<string>`coalesce(sum(case when ${journalEntries.sumber} in ('MANUAL', 'REVALUASI_KURS') and ${journalEntries.tanggal} >= ${dari} and ${journalEntries.tanggal} <= ${sampai} then ${journalItems.debitDasar} else 0 end), 0)::text`,
      kreditPenyesuaian: sql<string>`coalesce(sum(case when ${journalEntries.sumber} in ('MANUAL', 'REVALUASI_KURS') and ${journalEntries.tanggal} >= ${dari} and ${journalEntries.tanggal} <= ${sampai} then ${journalItems.kreditDasar} else 0 end), 0)::text`,
    })
    .from(chartOfAccounts)
    .leftJoin(journalItems, eq(journalItems.akunId, chartOfAccounts.id))
    .leftJoin(
      journalEntries,
      and(
        eq(journalItems.jurnalId, journalEntries.id),
        eq(journalEntries.status, "POSTED"),
      ),
    )
    .where(eq(chartOfAccounts.aktif, true))
    .groupBy(
      chartOfAccounts.id,
      chartOfAccounts.kode,
      chartOfAccounts.nama,
      chartOfAccounts.tipeAkun,
      chartOfAccounts.normalBalance,
      chartOfAccounts.level,
    )
    .orderBy(asc(chartOfAccounts.kode));

  let totRegDeb = BigInt(0), totRegKre = BigInt(0);
  let totAdjDeb = BigInt(0), totAdjKre = BigInt(0);
  let totAdjTB_Deb = BigInt(0), totAdjTB_Kre = BigInt(0);
  let totLR_Deb = BigInt(0), totLR_Kre = BigInt(0);
  let totNeraca_Deb = BigInt(0), totNeraca_Kre = BigInt(0);

  const daftarBaris = [];

  for (const b of baris) {
    const dReg = keBigInt(b.debitReguler);
    const kReg = keBigInt(b.kreditReguler);
    const dAdj = keBigInt(b.debitPenyesuaian);
    const kAdj = keBigInt(b.kreditPenyesuaian);

    if (dReg === BigInt(0) && kReg === BigInt(0) && dAdj === BigInt(0) && kAdj === BigInt(0)) {
      continue;
    }

    // 1-2. Sebelum penyesuaian
    const netReg = b.normalBalance === "DEBIT" ? dReg - kReg : kReg - dReg;
    const regDeb = b.normalBalance === "DEBIT" ? (netReg >= BigInt(0) ? netReg : BigInt(0)) : (netReg < BigInt(0) ? -netReg : BigInt(0));
    const regKre = b.normalBalance === "KREDIT" ? (netReg >= BigInt(0) ? netReg : BigInt(0)) : (netReg < BigInt(0) ? -netReg : BigInt(0));

    // 3-4. Penyesuaian
    const adjDeb = dAdj;
    const adjKre = kAdj;

    // 5-6. Setelah penyesuaian (Total debit vs kredit)
    const totDeb = dReg + dAdj;
    const totKre = kReg + kAdj;
    const netAdjTB = b.normalBalance === "DEBIT" ? totDeb - totKre : totKre - totDeb;
    const adjTbDeb = b.normalBalance === "DEBIT" ? (netAdjTB >= BigInt(0) ? netAdjTB : BigInt(0)) : (netAdjTB < BigInt(0) ? -netAdjTB : BigInt(0));
    const adjTbKre = b.normalBalance === "KREDIT" ? (netAdjTB >= BigInt(0) ? netAdjTB : BigInt(0)) : (netAdjTB < BigInt(0) ? -netAdjTB : BigInt(0));

    // 7-8. Laba Rugi (Pendapatan & Beban)
    // 9-10. Neraca (Aset, Kewajiban, Ekuitas)
    const adalahLabaRugi = b.tipeAkun === "PENDAPATAN" || b.tipeAkun === "BEBAN";
    const lrDeb = adalahLabaRugi ? adjTbDeb : BigInt(0);
    const lrKre = adalahLabaRugi ? adjTbKre : BigInt(0);
    const neracaDeb = !adalahLabaRugi ? adjTbDeb : BigInt(0);
    const neracaKre = !adalahLabaRugi ? adjTbKre : BigInt(0);

    totRegDeb += regDeb;
    totRegKre += regKre;
    totAdjDeb += adjDeb;
    totAdjKre += adjKre;
    totAdjTB_Deb += adjTbDeb;
    totAdjTB_Kre += adjTbKre;
    totLR_Deb += lrDeb;
    totLR_Kre += lrKre;
    totNeraca_Deb += neracaDeb;
    totNeraca_Kre += neracaKre;

    daftarBaris.push({
      id: b.id,
      kode: b.kode,
      nama: b.nama,
      tipeAkun: b.tipeAkun,
      sebelumPenyesuaian: { debit: keString(regDeb), kredit: keString(regKre) },
      penyesuaian: { debit: keString(adjDeb), kredit: keString(adjKre) },
      setelahPenyesuaian: { debit: keString(adjTbDeb), kredit: keString(adjTbKre) },
      labaRugi: { debit: keString(lrDeb), kredit: keString(lrKre) },
      neraca: { debit: keString(neracaDeb), kredit: keString(neracaKre) },
    });
  }

  // Laba / Rugi Bersih = Kredit Laba Rugi (Pendapatan) - Debit Laba Rugi (Beban)
  const labaBersihBig = totLR_Kre - totLR_Deb;

  return {
    periode: { dari, sampai },
    daftarBaris,
    total: {
      sebelumPenyesuaian: { debit: keString(totRegDeb), kredit: keString(totRegKre) },
      penyesuaian: { debit: keString(totAdjDeb), kredit: keString(totAdjKre) },
      setelahPenyesuaian: { debit: keString(totAdjTB_Deb), kredit: keString(totAdjTB_Kre) },
      labaRugi: { debit: keString(totLR_Deb), kredit: keString(totLR_Kre) },
      neraca: { debit: keString(totNeraca_Deb), kredit: keString(totNeraca_Kre) },
    },
    labaBersih: keString(labaBersihBig),
    statusLaba: labaBersihBig >= BigInt(0) ? ("LABA" as const) : ("RUGI" as const),
  };
}

// ==========================================
// 11. BUKU BESAR PEMBANTU PIUTANG (AR SUBLEDGER)
// ==========================================

export async function bukuBesarPembantuPiutang(query: {
  kontakId?: string;
  dari: string;
  sampai: string;
}) {
  // Ambil akun piutang usaha (kode 1130 atau peran PIUTANG_USAHA)
  const [akunPiutang] = await db
    .select({ id: chartOfAccounts.id, kode: chartOfAccounts.kode, nama: chartOfAccounts.nama })
    .from(chartOfAccounts)
    .where(or(eq(chartOfAccounts.kode, "1130"), eq(chartOfAccounts.peranSistem, "PIUTANG_USAHA")))
    .limit(1);

  if (!akunPiutang) throw galat.aturanBisnis("Akun Piutang Usaha (1130) tidak ditemukan.");

  // Ambil daftar pelanggan yang bertransaksi
  const partnerConds = [eq(partners.adalahPelanggan, true)];
  if (query.kontakId) partnerConds.push(eq(partners.id, query.kontakId));

  const listPelanggan = await db
    .select({ id: partners.id, kode: partners.kode, nama: partners.nama })
    .from(partners)
    .where(and(...partnerConds))
    .orderBy(partners.kode);

  const hasilPelanggan = [];
  let grandTotalAwal = BigInt(0);
  let grandTotalDebit = BigInt(0);
  let grandTotalKredit = BigInt(0);
  let grandTotalAkhir = BigInt(0);

  for (const pel of listPelanggan) {
    // 1. Saldo Awal (sebelum tanggal 'dari')
    const [rowAwal] = await db
      .select({
        debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
        kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
      })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
      .where(
        and(
          eq(journalEntries.status, "POSTED"),
          eq(journalItems.akunId, akunPiutang.id),
          eq(journalItems.kontakId, pel.id),
          lt(journalEntries.tanggal, query.dari),
        ),
      );

    const saldoAwalBig = keBigInt(rowAwal?.debit ?? "0") - keBigInt(rowAwal?.kredit ?? "0");

    // 2. Mutasi transaksi dalam rentang tanggal
    const mutasiRows = await db
      .select({
        tanggal: journalEntries.tanggal,
        nomorJurnal: journalEntries.nomor,
        referensi: journalEntries.referensi,
        deskripsi: journalItems.deskripsi,
        debit: journalItems.debitDasar,
        kredit: journalItems.kreditDasar,
      })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
      .where(
        and(
          eq(journalEntries.status, "POSTED"),
          eq(journalItems.akunId, akunPiutang.id),
          eq(journalItems.kontakId, pel.id),
          gte(journalEntries.tanggal, query.dari),
          lte(journalEntries.tanggal, query.sampai),
        ),
      )
      .orderBy(asc(journalEntries.tanggal), asc(journalEntries.nomor));

    let totalDebitBig = BigInt(0);
    let totalKreditBig = BigInt(0);
    let saldoBerjalan = saldoAwalBig;

    const transaksiDenganSaldo = mutasiRows.map((r) => {
      const d = keBigInt(r.debit);
      const k = keBigInt(r.kredit);
      totalDebitBig += d;
      totalKreditBig += k;
      saldoBerjalan = saldoBerjalan + d - k;
      return {
        tanggal: r.tanggal,
        nomorJurnal: r.nomorJurnal,
        referensi: r.referensi,
        deskripsi: r.deskripsi,
        debit: r.debit,
        kredit: r.kredit,
        saldo: keString(saldoBerjalan),
      };
    });

    const saldoAkhirBig = saldoAwalBig + totalDebitBig - totalKreditBig;

    // Masukkan jika memiliki saldo atau ada mutasi
    if (saldoAwalBig !== BigInt(0) || mutasiRows.length > 0) {
      grandTotalAwal += saldoAwalBig;
      grandTotalDebit += totalDebitBig;
      grandTotalKredit += totalKreditBig;
      grandTotalAkhir += saldoAkhirBig;

      hasilPelanggan.push({
        pelanggan: pel,
        saldoAwal: keString(saldoAwalBig),
        totalDebit: keString(totalDebitBig),
        totalKredit: keString(totalKreditBig),
        saldoAkhir: keString(saldoAkhirBig),
        transaksi: transaksiDenganSaldo,
      });
    }
  }

  return {
    akun: akunPiutang,
    periode: { dari: query.dari, sampai: query.sampai },
    ringkasan: {
      totalSaldoAwal: keString(grandTotalAwal),
      totalDebit: keString(grandTotalDebit),
      totalKredit: keString(grandTotalKredit),
      totalSaldoAkhir: keString(grandTotalAkhir),
    },
    daftarPelanggan: hasilPelanggan,
  };
}

// ==========================================
// 12. BUKU BESAR PEMBANTU HUTANG (AP SUBLEDGER)
// ==========================================

export async function bukuBesarPembantuHutang(query: {
  kontakId?: string;
  dari: string;
  sampai: string;
}) {
  // Ambil akun hutang usaha (kode 2110 atau peran HUTANG_USAHA)
  const [akunHutang] = await db
    .select({ id: chartOfAccounts.id, kode: chartOfAccounts.kode, nama: chartOfAccounts.nama })
    .from(chartOfAccounts)
    .where(or(eq(chartOfAccounts.kode, "2110"), eq(chartOfAccounts.peranSistem, "HUTANG_USAHA")))
    .limit(1);

  if (!akunHutang) throw galat.aturanBisnis("Akun Hutang Usaha (2110) tidak ditemukan.");

  const partnerConds = [eq(partners.adalahPemasok, true)];
  if (query.kontakId) partnerConds.push(eq(partners.id, query.kontakId));

  const listPemasok = await db
    .select({ id: partners.id, kode: partners.kode, nama: partners.nama })
    .from(partners)
    .where(and(...partnerConds))
    .orderBy(partners.kode);

  const hasilPemasok = [];
  let grandTotalAwal = BigInt(0);
  let grandTotalDebit = BigInt(0);
  let grandTotalKredit = BigInt(0);
  let grandTotalAkhir = BigInt(0);

  for (const pem of listPemasok) {
    // 1. Saldo Awal Kredit (Hutang saldo normal Kredit = Kredit - Debit)
    const [rowAwal] = await db
      .select({
        debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
        kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
      })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
      .where(
        and(
          eq(journalEntries.status, "POSTED"),
          eq(journalItems.akunId, akunHutang.id),
          eq(journalItems.kontakId, pem.id),
          lt(journalEntries.tanggal, query.dari),
        ),
      );

    const saldoAwalBig = keBigInt(rowAwal?.kredit ?? "0") - keBigInt(rowAwal?.debit ?? "0");

    // 2. Mutasi transaksi
    const mutasiRows = await db
      .select({
        tanggal: journalEntries.tanggal,
        nomorJurnal: journalEntries.nomor,
        referensi: journalEntries.referensi,
        deskripsi: journalItems.deskripsi,
        debit: journalItems.debitDasar,
        kredit: journalItems.kreditDasar,
      })
      .from(journalItems)
      .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
      .where(
        and(
          eq(journalEntries.status, "POSTED"),
          eq(journalItems.akunId, akunHutang.id),
          eq(journalItems.kontakId, pem.id),
          gte(journalEntries.tanggal, query.dari),
          lte(journalEntries.tanggal, query.sampai),
        ),
      )
      .orderBy(asc(journalEntries.tanggal), asc(journalEntries.nomor));

    let totalDebitBig = BigInt(0);
    let totalKreditBig = BigInt(0);
    let saldoBerjalan = saldoAwalBig;

    const transaksiDenganSaldo = mutasiRows.map((r) => {
      const d = keBigInt(r.debit);
      const k = keBigInt(r.kredit);
      totalDebitBig += d;
      totalKreditBig += k;
      saldoBerjalan = saldoBerjalan + k - d;
      return {
        tanggal: r.tanggal,
        nomorJurnal: r.nomorJurnal,
        referensi: r.referensi,
        deskripsi: r.deskripsi,
        debit: r.debit,
        kredit: r.kredit,
        saldo: keString(saldoBerjalan),
      };
    });

    const saldoAkhirBig = saldoAwalBig + totalKreditBig - totalDebitBig;

    if (saldoAwalBig !== BigInt(0) || mutasiRows.length > 0) {
      grandTotalAwal += saldoAwalBig;
      grandTotalDebit += totalDebitBig;
      grandTotalKredit += totalKreditBig;
      grandTotalAkhir += saldoAkhirBig;

      hasilPemasok.push({
        pemasok: pem,
        saldoAwal: keString(saldoAwalBig),
        totalDebit: keString(totalDebitBig),
        totalKredit: keString(totalKreditBig),
        saldoAkhir: keString(saldoAkhirBig),
        transaksi: transaksiDenganSaldo,
      });
    }
  }

  return {
    akun: akunHutang,
    periode: { dari: query.dari, sampai: query.sampai },
    ringkasan: {
      totalSaldoAwal: keString(grandTotalAwal),
      totalDebit: keString(grandTotalDebit),
      totalKredit: keString(grandTotalKredit),
      totalSaldoAkhir: keString(grandTotalAkhir),
    },
    daftarPemasok: hasilPemasok,
  };
}

// ==========================================
// 13. LAPORAN UMUR PIUTANG (AR AGING REPORT)
// ==========================================

export async function laporanAgingPiutang(query: { perTanggal: string; kontakId?: string }) {
  const conditions = [
    eq(salesInvoices.status, "POSTED"),
    lte(salesInvoices.tanggal, query.perTanggal),
    gt(salesInvoices.sisaTagihan, "0"),
  ];
  if (query.kontakId) conditions.push(eq(salesInvoices.pelangganId, query.kontakId));

  const invoices = await db
    .select({
      id: salesInvoices.id,
      nomor: salesInvoices.nomor,
      tanggal: salesInvoices.tanggal,
      tanggalJatuhTempo: salesInvoices.tanggalJatuhTempo,
      total: salesInvoices.total,
      sisaTagihan: salesInvoices.sisaTagihan,
      pelangganId: salesInvoices.pelangganId,
      pelangganKode: partners.kode,
      pelangganNama: partners.nama,
    })
    .from(salesInvoices)
    .innerJoin(partners, eq(salesInvoices.pelangganId, partners.id))
    .where(and(...conditions))
    .orderBy(partners.nama, salesInvoices.tanggalJatuhTempo);

  const tRef = new Date(query.perTanggal).getTime();
  const MS_PER_DAY = 1000 * 3600 * 24;

  type Bucket = {
    current: bigint;
    hari1_30: bigint;
    hari31_60: bigint;
    hari61_90: bigint;
    hari90Plus: bigint;
    total: bigint;
  };

  const peta = new Map<
    string,
    {
      pelangganId: string;
      pelangganKode: string;
      pelangganNama: string;
      bucket: Bucket;
      rincianFaktur: Array<Record<string, unknown>>;
    }
  >();

  const grandTotal: Bucket = {
    current: BigInt(0),
    hari1_30: BigInt(0),
    hari31_60: BigInt(0),
    hari61_90: BigInt(0),
    hari90Plus: BigInt(0),
    total: BigInt(0),
  };

  for (const inv of invoices) {
    const sisaBig = keBigInt(inv.sisaTagihan);
    const tJt = new Date(inv.tanggalJatuhTempo).getTime();
    const hariLewat = Math.floor((tRef - tJt) / MS_PER_DAY);

    let k: keyof Bucket = "current";
    if (hariLewat <= 0) k = "current";
    else if (hariLewat <= 30) k = "hari1_30";
    else if (hariLewat <= 60) k = "hari31_60";
    else if (hariLewat <= 90) k = "hari61_90";
    else k = "hari90Plus";

    grandTotal[k] += sisaBig;
    grandTotal.total += sisaBig;

    const cur = peta.get(inv.pelangganId) ?? {
      pelangganId: inv.pelangganId,
      pelangganKode: inv.pelangganKode,
      pelangganNama: inv.pelangganNama,
      bucket: {
        current: BigInt(0),
        hari1_30: BigInt(0),
        hari31_60: BigInt(0),
        hari61_90: BigInt(0),
        hari90Plus: BigInt(0),
        total: BigInt(0),
      },
      rincianFaktur: [],
    };

    cur.bucket[k] += sisaBig;
    cur.bucket.total += sisaBig;
    cur.rincianFaktur.push({
      fakturId: inv.id,
      nomorFaktur: inv.nomor,
      tanggal: inv.tanggal,
      tanggalJatuhTempo: inv.tanggalJatuhTempo,
      hariLewat: hariLewat > 0 ? hariLewat : 0,
      totalTagihan: inv.total,
      sisaTagihan: inv.sisaTagihan,
      kategori: k,
    });

    peta.set(inv.pelangganId, cur);
  }

  const formatBucket = (b: Bucket) => ({
    current: keString(b.current),
    hari1_30: keString(b.hari1_30),
    hari31_60: keString(b.hari31_60),
    hari61_90: keString(b.hari61_90),
    hari90Plus: keString(b.hari90Plus),
    total: keString(b.total),
  });

  return {
    perTanggal: query.perTanggal,
    ringkasan: formatBucket(grandTotal),
    daftarPelanggan: Array.from(peta.values()).map((p) => ({
      pelangganId: p.pelangganId,
      pelangganKode: p.pelangganKode,
      pelangganNama: p.pelangganNama,
      aging: formatBucket(p.bucket),
      rincianFaktur: p.rincianFaktur,
    })),
  };
}

// ==========================================
// 14. LAPORAN UMUR HUTANG (AP AGING REPORT)
// ==========================================

export async function laporanAgingHutang(query: { perTanggal: string; kontakId?: string }) {
  const conditions = [
    eq(purchaseInvoices.status, "POSTED"),
    lte(purchaseInvoices.tanggal, query.perTanggal),
    gt(purchaseInvoices.sisaTagihan, "0"),
  ];
  if (query.kontakId) conditions.push(eq(purchaseInvoices.pemasokId, query.kontakId));

  const bills = await db
    .select({
      id: purchaseInvoices.id,
      nomor: purchaseInvoices.nomor,
      tanggal: purchaseInvoices.tanggal,
      tanggalJatuhTempo: purchaseInvoices.tanggalJatuhTempo,
      total: purchaseInvoices.total,
      sisaTagihan: purchaseInvoices.sisaTagihan,
      pemasokId: purchaseInvoices.pemasokId,
      pemasokKode: partners.kode,
      pemasokNama: partners.nama,
    })
    .from(purchaseInvoices)
    .innerJoin(partners, eq(purchaseInvoices.pemasokId, partners.id))
    .where(and(...conditions))
    .orderBy(partners.nama, purchaseInvoices.tanggalJatuhTempo);

  const tRef = new Date(query.perTanggal).getTime();
  const MS_PER_DAY = 1000 * 3600 * 24;

  type Bucket = {
    current: bigint;
    hari1_30: bigint;
    hari31_60: bigint;
    hari61_90: bigint;
    hari90Plus: bigint;
    total: bigint;
  };

  const peta = new Map<
    string,
    {
      pemasokId: string;
      pemasokKode: string;
      pemasokNama: string;
      bucket: Bucket;
      rincianFaktur: Array<Record<string, unknown>>;
    }
  >();

  const grandTotal: Bucket = {
    current: BigInt(0),
    hari1_30: BigInt(0),
    hari31_60: BigInt(0),
    hari61_90: BigInt(0),
    hari90Plus: BigInt(0),
    total: BigInt(0),
  };

  for (const b of bills) {
    const sisaBig = keBigInt(b.sisaTagihan);
    const tJt = new Date(b.tanggalJatuhTempo).getTime();
    const hariLewat = Math.floor((tRef - tJt) / MS_PER_DAY);

    let k: keyof Bucket = "current";
    if (hariLewat <= 0) k = "current";
    else if (hariLewat <= 30) k = "hari1_30";
    else if (hariLewat <= 60) k = "hari31_60";
    else if (hariLewat <= 90) k = "hari61_90";
    else k = "hari90Plus";

    grandTotal[k] += sisaBig;
    grandTotal.total += sisaBig;

    const cur = peta.get(b.pemasokId) ?? {
      pemasokId: b.pemasokId,
      pemasokKode: b.pemasokKode,
      pemasokNama: b.pemasokNama,
      bucket: {
        current: BigInt(0),
        hari1_30: BigInt(0),
        hari31_60: BigInt(0),
        hari61_90: BigInt(0),
        hari90Plus: BigInt(0),
        total: BigInt(0),
      },
      rincianFaktur: [],
    };

    cur.bucket[k] += sisaBig;
    cur.bucket.total += sisaBig;
    cur.rincianFaktur.push({
      fakturId: b.id,
      nomorFaktur: b.nomor,
      tanggal: b.tanggal,
      tanggalJatuhTempo: b.tanggalJatuhTempo,
      hariLewat: hariLewat > 0 ? hariLewat : 0,
      totalTagihan: b.total,
      sisaTagihan: b.sisaTagihan,
      kategori: k,
    });

    peta.set(b.pemasokId, cur);
  }

  const formatBucket = (b: Bucket) => ({
    current: keString(b.current),
    hari1_30: keString(b.hari1_30),
    hari31_60: keString(b.hari31_60),
    hari61_90: keString(b.hari61_90),
    hari90Plus: keString(b.hari90Plus),
    total: keString(b.total),
  });

  return {
    perTanggal: query.perTanggal,
    ringkasan: formatBucket(grandTotal),
    daftarPemasok: Array.from(peta.values()).map((p) => ({
      pemasokId: p.pemasokId,
      pemasokKode: p.pemasokKode,
      pemasokNama: p.pemasokNama,
      aging: formatBucket(p.bucket),
      rincianFaktur: p.rincianFaktur,
    })),
  };
}

// ==========================================
// 15. LAPORAN PENJUALAN & PEMBELIAN
// ==========================================

export async function laporanPenjualanPelanggan(query: {
  dari: string;
  sampai: string;
  kontakId?: string;
}) {
  const conditions = [
    eq(salesInvoices.status, "POSTED"),
    gte(salesInvoices.tanggal, query.dari),
    lte(salesInvoices.tanggal, query.sampai),
  ];
  if (query.kontakId) conditions.push(eq(salesInvoices.pelangganId, query.kontakId));

  const rows = await db
    .select({
      pelangganId: salesInvoices.pelangganId,
      pelangganKode: partners.kode,
      pelangganNama: partners.nama,
      subtotal: salesInvoices.subtotal,
      pajak: salesInvoices.ppn,
      diskon: salesInvoices.diskonNominal,
      total: salesInvoices.total,
      hpp: salesInvoices.totalHpp,
    })
    .from(salesInvoices)
    .innerJoin(partners, eq(salesInvoices.pelangganId, partners.id))
    .where(and(...conditions));

  const peta = new Map<
    string,
    {
      pelangganId: string;
      pelangganKode: string;
      pelangganNama: string;
      jumlahFaktur: number;
      subtotal: bigint;
      pajak: bigint;
      diskon: bigint;
      total: bigint;
      hpp: bigint;
    }
  >();

  let grandTotal = BigInt(0);
  let grandHpp = BigInt(0);

  for (const r of rows) {
    const t = keBigInt(r.total);
    const h = keBigInt(r.hpp ?? "0");
    grandTotal += t;
    grandHpp += h;

    const cur = peta.get(r.pelangganId) ?? {
      pelangganId: r.pelangganId,
      pelangganKode: r.pelangganKode,
      pelangganNama: r.pelangganNama,
      jumlahFaktur: 0,
      subtotal: BigInt(0),
      pajak: BigInt(0),
      diskon: BigInt(0),
      total: BigInt(0),
      hpp: BigInt(0),
    };
    cur.jumlahFaktur += 1;
    cur.subtotal += keBigInt(r.subtotal);
    cur.pajak += keBigInt(r.pajak);
    cur.diskon += keBigInt(r.diskon);
    cur.total += t;
    cur.hpp += h;
    peta.set(r.pelangganId, cur);
  }

  const labaKotorGrand = grandTotal - grandHpp;

  return {
    periode: { dari: query.dari, sampai: query.sampai },
    ringkasan: {
      totalPenjualan: keString(grandTotal),
      totalHpp: keString(grandHpp),
      labaKotor: keString(labaKotorGrand),
      marginLabaPersen:
        grandTotal > BigInt(0)
          ? (Number((labaKotorGrand * BigInt(10000)) / grandTotal) / 100).toFixed(2)
          : "0.00",
    },
    daftarPelanggan: Array.from(peta.values()).map((p) => {
      const laba = p.total - p.hpp;
      return {
        pelangganId: p.pelangganId,
        pelangganKode: p.pelangganKode,
        pelangganNama: p.pelangganNama,
        jumlahFaktur: p.jumlahFaktur,
        subtotal: keString(p.subtotal),
        pajak: keString(p.pajak),
        diskon: keString(p.diskon),
        total: keString(p.total),
        labaKotor: keString(laba),
      };
    }),
  };
}

export async function laporanPenjualanItem(query: { dari: string; sampai: string; itemId?: string }) {
  const conditions = [
    eq(salesInvoices.status, "POSTED"),
    gte(salesInvoices.tanggal, query.dari),
    lte(salesInvoices.tanggal, query.sampai),
  ];
  if (query.itemId) conditions.push(eq(salesInvoiceItems.itemId, query.itemId));

  const rows = await db
    .select({
      itemId: salesInvoiceItems.itemId,
      itemKode: items.sku,
      itemNama: items.nama,
      kuantitas: salesInvoiceItems.kuantitas,
      total: salesInvoiceItems.subtotal,
      hpp: salesInvoiceItems.hpp,
    })
    .from(salesInvoiceItems)
    .innerJoin(salesInvoices, eq(salesInvoiceItems.fakturId, salesInvoices.id))
    .innerJoin(items, eq(salesInvoiceItems.itemId, items.id))
    .where(and(...conditions));

  const peta = new Map<
    string,
    {
      itemId: string;
      itemKode: string;
      itemNama: string;
      kuantitas: bigint;
      total: bigint;
      hpp: bigint;
    }
  >();

  let grandKuantitas = BigInt(0);
  let grandTotal = BigInt(0);

  for (const r of rows) {
    if (!r.itemId) continue;
    const qty = keBigInt(r.kuantitas);
    const tot = keBigInt(r.total);
    const hp = keBigInt(r.hpp ?? "0");

    grandKuantitas += qty;
    grandTotal += tot;

    const cur = peta.get(r.itemId) ?? {
      itemId: r.itemId,
      itemKode: r.itemKode,
      itemNama: r.itemNama,
      kuantitas: BigInt(0),
      total: BigInt(0),
      hpp: BigInt(0),
    };
    cur.kuantitas += qty;
    cur.total += tot;
    cur.hpp += hp;
    peta.set(r.itemId, cur);
  }

  return {
    periode: { dari: query.dari, sampai: query.sampai },
    ringkasan: {
      totalKuantitasTerjual: keString(grandKuantitas),
      totalNilaiPenjualan: keString(grandTotal),
    },
    daftarItem: Array.from(peta.values()).map((it) => {
      const rataRataHarga =
        it.kuantitas > BigInt(0) ? keString((it.total * BigInt(10000)) / it.kuantitas) : "0.0000";
      return {
        itemId: it.itemId,
        itemKode: it.itemKode,
        itemNama: it.itemNama,
        kuantitas: keString(it.kuantitas),
        totalPenjualan: keString(it.total),
        rataRataHargaJual: rataRataHarga,
      };
    }),
  };
}

export async function laporanPembelianPemasok(query: {
  dari: string;
  sampai: string;
  kontakId?: string;
}) {
  const conditions = [
    eq(purchaseInvoices.status, "POSTED"),
    gte(purchaseInvoices.tanggal, query.dari),
    lte(purchaseInvoices.tanggal, query.sampai),
  ];
  if (query.kontakId) conditions.push(eq(purchaseInvoices.pemasokId, query.kontakId));

  const rows = await db
    .select({
      pemasokId: purchaseInvoices.pemasokId,
      pemasokKode: partners.kode,
      pemasokNama: partners.nama,
      subtotal: purchaseInvoices.subtotal,
      pajak: purchaseInvoices.ppn,
      total: purchaseInvoices.total,
    })
    .from(purchaseInvoices)
    .innerJoin(partners, eq(purchaseInvoices.pemasokId, partners.id))
    .where(and(...conditions));

  const peta = new Map<
    string,
    {
      pemasokId: string;
      pemasokKode: string;
      pemasokNama: string;
      jumlahFaktur: number;
      subtotal: bigint;
      pajak: bigint;
      total: bigint;
    }
  >();

  let grandTotal = BigInt(0);

  for (const r of rows) {
    const tot = keBigInt(r.total);
    grandTotal += tot;

    const cur = peta.get(r.pemasokId) ?? {
      pemasokId: r.pemasokId,
      pemasokKode: r.pemasokKode,
      pemasokNama: r.pemasokNama,
      jumlahFaktur: 0,
      subtotal: BigInt(0),
      pajak: BigInt(0),
      total: BigInt(0),
    };
    cur.jumlahFaktur += 1;
    cur.subtotal += keBigInt(r.subtotal);
    cur.pajak += keBigInt(r.pajak);
    cur.total += tot;
    peta.set(r.pemasokId, cur);
  }

  return {
    periode: { dari: query.dari, sampai: query.sampai },
    ringkasan: {
      totalPembelian: keString(grandTotal),
    },
    daftarPemasok: Array.from(peta.values()).map((p) => ({
      pemasokId: p.pemasokId,
      pemasokKode: p.pemasokKode,
      pemasokNama: p.pemasokNama,
      jumlahFaktur: p.jumlahFaktur,
      subtotal: keString(p.subtotal),
      pajak: keString(p.pajak),
      total: keString(p.total),
    })),
  };
}

export async function laporanPembelianItem(query: { dari: string; sampai: string; itemId?: string }) {
  const conditions = [
    eq(purchaseInvoices.status, "POSTED"),
    gte(purchaseInvoices.tanggal, query.dari),
    lte(purchaseInvoices.tanggal, query.sampai),
  ];
  if (query.itemId) conditions.push(eq(purchaseInvoiceItems.itemId, query.itemId));

  const rows = await db
    .select({
      itemId: purchaseInvoiceItems.itemId,
      itemKode: items.sku,
      itemNama: items.nama,
      kuantitas: purchaseInvoiceItems.kuantitas,
      total: purchaseInvoiceItems.subtotal,
    })
    .from(purchaseInvoiceItems)
    .innerJoin(purchaseInvoices, eq(purchaseInvoiceItems.fakturId, purchaseInvoices.id))
    .innerJoin(items, eq(purchaseInvoiceItems.itemId, items.id))
    .where(and(...conditions));

  const peta = new Map<
    string,
    {
      itemId: string;
      itemKode: string;
      itemNama: string;
      kuantitas: bigint;
      total: bigint;
    }
  >();

  let grandKuantitas = BigInt(0);
  let grandTotal = BigInt(0);

  for (const r of rows) {
    if (!r.itemId) continue;
    const qty = keBigInt(r.kuantitas);
    const tot = keBigInt(r.total);

    grandKuantitas += qty;
    grandTotal += tot;

    const cur = peta.get(r.itemId) ?? {
      itemId: r.itemId,
      itemKode: r.itemKode,
      itemNama: r.itemNama,
      kuantitas: BigInt(0),
      total: BigInt(0),
    };
    cur.kuantitas += qty;
    cur.total += tot;
    peta.set(r.itemId, cur);
  }

  return {
    periode: { dari: query.dari, sampai: query.sampai },
    ringkasan: {
      totalKuantitasDibeli: keString(grandKuantitas),
      totalNilaiPembelian: keString(grandTotal),
    },
    daftarItem: Array.from(peta.values()).map((it) => {
      const rataRataHarga =
        it.kuantitas > BigInt(0) ? keString((it.total * BigInt(10000)) / it.kuantitas) : "0.0000";
      return {
        itemId: it.itemId,
        itemKode: it.itemKode,
        itemNama: it.itemNama,
        kuantitas: keString(it.kuantitas),
        totalPembelian: keString(it.total),
        rataRataHargaBeli: rataRataHarga,
      };
    }),
  };
}

// ==========================================
// 16. LAPORAN PERBANDINGAN (KOMPARATIF)
// ==========================================

export async function laporanLabaRugiKomparatif(query: {
  periode1Dari: string;
  periode1Sampai: string;
  periode2Dari: string;
  periode2Sampai: string;
}) {
  const [rep1, rep2] = await Promise.all([
    laporanLabaRugi(query.periode1Dari, query.periode1Sampai),
    laporanLabaRugi(query.periode2Dari, query.periode2Sampai),
  ]);

  const p1Rev = keBigInt(String(rep1.pendapatan.total));
  const p2Rev = keBigInt(String(rep2.pendapatan.total));
  const revDiff = p2Rev - p1Rev;

  const p1Exp = keBigInt(String(rep1.hargaPokokPenjualan.total)) + keBigInt(String(rep1.bebanOperasional.total));
  const p2Exp = keBigInt(String(rep2.hargaPokokPenjualan.total)) + keBigInt(String(rep2.bebanOperasional.total));
  const expDiff = p2Exp - p1Exp;

  const p1Net = keBigInt(String(rep1.labaBersih));
  const p2Net = keBigInt(String(rep2.labaBersih));
  const netDiff = p2Net - p1Net;

  const persenUbah = (sekarang: bigint, sebelumnya: bigint) => {
    if (sebelumnya === BigInt(0)) return "0.00";
    return (Number(((sekarang - sebelumnya) * BigInt(10000)) / (sebelumnya > BigInt(0) ? sebelumnya : -sebelumnya)) / 100).toFixed(2);
  };

  return {
    periode1: { dari: query.periode1Dari, sampai: query.periode1Sampai },
    periode2: { dari: query.periode2Dari, sampai: query.periode2Sampai },
    komparasi: {
      pendapatan: {
        periode1: keString(p1Rev),
        periode2: keString(p2Rev),
        selisih: keString(revDiff),
        persenUbah: persenUbah(p2Rev, p1Rev),
      },
      beban: {
        periode1: keString(p1Exp),
        periode2: keString(p2Exp),
        selisih: keString(expDiff),
        persenUbah: persenUbah(p2Exp, p1Exp),
      },
      labaBersih: {
        periode1: keString(p1Net),
        periode2: keString(p2Net),
        selisih: keString(netDiff),
        persenUbah: persenUbah(p2Net, p1Net),
      },
    },
  };
}

// ==========================================
// 17. LAPORAN KONSOLIDASI MULTI-PERUSAHAAN
// ==========================================

export async function laporanKonsolidasiHolding(query: { holdingId: string; perTanggal: string }) {
  const [holding] = await db.select().from(companies).where(eq(companies.id, query.holdingId));
  if (!holding) throw galat.tidakDitemukan(`Perusahaan holding ID ${query.holdingId}`);

  // Ambil anak perusahaan di bawah holding
  const anakPerusahaan = await db
    .select({ id: companies.id, kode: companies.kode, nama: companies.nama })
    .from(companies)
    .where(eq(companies.indukId, query.holdingId));

  // Ambil neraca dan laba rugi gabungan
  const awalTahun = `${query.perTanggal.slice(0, 4)}-01-01`;
  const [neraca, labaRugi] = await Promise.all([
    laporanNeraca(query.perTanggal),
    laporanLabaRugi(awalTahun, query.perTanggal),
  ]);

  const totalBeban = keBigInt(labaRugi.hargaPokokPenjualan.total) + keBigInt(labaRugi.bebanOperasional.total);

  return {
    holding: {
      id: holding.id,
      kode: holding.kode,
      nama: holding.nama,
    },
    jumlahEntitasKonsolidasi: 1 + anakPerusahaan.length,
    daftarAnakPerusahaan: anakPerusahaan,
    perTanggal: query.perTanggal,
    konsolidasiNeraca: {
      totalAset: neraca.aset.total,
      totalKewajiban: neraca.kewajiban.total,
      totalEkuitas: neraca.ekuitas.total,
      totalKewajibanDanEkuitas: neraca.totalLiabilitasDanEkuitas,
      seimbang: neraca.seimbang,
    },
    konsolidasiLabaRugiYtd: {
      totalPendapatan: labaRugi.pendapatan.total,
      totalBeban: keString(totalBeban),
      labaBersih: labaRugi.labaBersih,
    },
  };
}

// ==========================================
// 18. CETAK DOKUMEN TRANSAKSI (PRINTABLE / PDF-READY VIEW)
// ==========================================

export async function cetakDokumenTransaksi(jenisDokumen: string, dokumenId: string) {
  let docHeader: Record<string, unknown> | undefined;
  let itemsList: Array<Record<string, unknown>> = [];
  let partnerNama = "";
  let judulDokumen = "";

  if (jenisDokumen === "FAKTUR_PENJUALAN") {
    judulDokumen = "FAKTUR PENJUALAN (SALES INVOICE)";
    const [inv] = await db
      .select({
        id: salesInvoices.id,
        nomor: salesInvoices.nomor,
        tanggal: salesInvoices.tanggal,
        tanggalJatuhTempo: salesInvoices.tanggalJatuhTempo,
        catatan: salesInvoices.catatan,
        subtotal: salesInvoices.subtotal,
        pajak: salesInvoices.ppn,
        diskonNominal: salesInvoices.diskonNominal,
        ongkir: salesInvoices.ongkir,
        total: salesInvoices.total,
        sisaTagihan: salesInvoices.sisaTagihan,
        status: salesInvoices.status,
        pelangganNama: partners.nama,
        pelangganAlamat: partners.npwp,
      })
      .from(salesInvoices)
      .innerJoin(partners, eq(salesInvoices.pelangganId, partners.id))
      .where(eq(salesInvoices.id, dokumenId));

    if (!inv) throw galat.tidakDitemukan("Faktur Penjualan");
    docHeader = inv;
    partnerNama = inv.pelangganNama;

    const itms = await db
      .select({
        deskripsi: salesInvoiceItems.deskripsi,
        kuantitas: salesInvoiceItems.kuantitas,
        hargaSatuan: salesInvoiceItems.hargaSatuan,
        persenDiskon: salesInvoiceItems.persenDiskon,
        subtotal: salesInvoiceItems.subtotal,
        itemKode: items.sku,
        itemNama: items.nama,
      })
      .from(salesInvoiceItems)
      .innerJoin(items, eq(salesInvoiceItems.itemId, items.id))
      .where(eq(salesInvoiceItems.fakturId, dokumenId));
    itemsList = itms;
  } else if (jenisDokumen === "FAKTUR_PEMBELIAN") {
    judulDokumen = "FAKTUR PEMBELIAN (PURCHASE BILL)";
    const [bill] = await db
      .select({
        id: purchaseInvoices.id,
        nomor: purchaseInvoices.nomor,
        tanggal: purchaseInvoices.tanggal,
        tanggalJatuhTempo: purchaseInvoices.tanggalJatuhTempo,
        catatan: purchaseInvoices.catatan,
        subtotal: purchaseInvoices.subtotal,
        pajak: purchaseInvoices.ppn,
        diskonNominal: purchaseInvoices.diskonNominal,
        ongkir: purchaseInvoices.ongkir,
        total: purchaseInvoices.total,
        sisaTagihan: purchaseInvoices.sisaTagihan,
        status: purchaseInvoices.status,
        pemasokNama: partners.nama,
      })
      .from(purchaseInvoices)
      .innerJoin(partners, eq(purchaseInvoices.pemasokId, partners.id))
      .where(eq(purchaseInvoices.id, dokumenId));

    if (!bill) throw galat.tidakDitemukan("Faktur Pembelian");
    docHeader = bill;
    partnerNama = bill.pemasokNama;

    const itms = await db
      .select({
        deskripsi: purchaseInvoiceItems.deskripsi,
        kuantitas: purchaseInvoiceItems.kuantitas,
        hargaSatuan: purchaseInvoiceItems.hargaSatuan,
        persenDiskon: purchaseInvoiceItems.persenDiskon,
        subtotal: purchaseInvoiceItems.subtotal,
        itemKode: items.sku,
        itemNama: items.nama,
      })
      .from(purchaseInvoiceItems)
      .innerJoin(items, eq(purchaseInvoiceItems.itemId, items.id))
      .where(eq(purchaseInvoiceItems.fakturId, dokumenId));
    itemsList = itms;
  } else {
    throw galat.aturanBisnis(`Jenis dokumen '${jenisDokumen}' belum didukung untuk cetak.`);
  }

  // Bangun layout HTML profesional untuk cetak / PDF
  const rowsHtml = itemsList
    .map(
      (it, idx) => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${idx + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;"><b>[${it.itemKode}]</b> ${it.itemNama || it.deskripsi}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${Number(it.kuantitas).toLocaleString("id-ID")}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Rp ${Number(it.hargaSatuan).toLocaleString("id-ID")}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Rp ${Number(it.total).toLocaleString("id-ID")}</td>
    </tr>
  `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${judulDokumen} - ${docHeader.nomor}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1e293b; margin: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; color: #0f172a; }
        .meta-table td { padding: 4px 10px; }
        .content-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        .content-table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
        .totals-table { width: 350px; margin-left: auto; margin-top: 20px; border-collapse: collapse; }
        .totals-table td { padding: 6px 12px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
        .sign-box { width: 200px; text-align: center; border-top: 1px solid #475569; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">${judulDokumen}</div>
          <p style="margin: 4px 0;"><b>No:</b> ${docHeader.nomor}</p>
          <p style="margin: 4px 0;"><b>Status:</b> ${docHeader.status}</p>
        </div>
        <div>
          <table class="meta-table">
            <tr><td><b>Tanggal:</b></td><td>${docHeader.tanggal}</td></tr>
            <tr><td><b>Jatuh Tempo:</b></td><td>${docHeader.tanggalJatuhTempo}</td></tr>
            <tr><td><b>Kepada:</b></td><td><b>${partnerNama}</b></td></tr>
          </table>
        </div>
      </div>

      <table class="content-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">No</th>
            <th>Item / Keterangan</th>
            <th style="width: 80px; text-align: right;">Qty</th>
            <th style="width: 130px; text-align: right;">Harga Satuan</th>
            <th style="width: 140px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <table class="totals-table">
        <tr><td>Subtotal</td><td style="text-align: right;">Rp ${Number(docHeader.subtotal).toLocaleString("id-ID")}</td></tr>
        <tr><td>Pajak (PPN)</td><td style="text-align: right;">Rp ${Number(docHeader.pajak).toLocaleString("id-ID")}</td></tr>
        ${Number(docHeader.diskonNominal) > 0 ? `<tr><td>Diskon</td><td style="text-align: right;">- Rp ${Number(docHeader.diskonNominal).toLocaleString("id-ID")}</td></tr>` : ""}
        <tr style="font-size: 15px; font-weight: bold; border-top: 2px solid #0f172a;">
          <td>Total Tagihan</td><td style="text-align: right;">Rp ${Number(docHeader.total).toLocaleString("id-ID")}</td>
        </tr>
      </table>

      <div class="signatures">
        <div class="sign-box">Penerima / Klien</div>
        <div class="sign-box">Bagian Keuangan</div>
      </div>
    </body>
    </html>
  `;

  return {
    jenisDokumen,
    nomorDokumen: String(docHeader.nomor),
    judul: judulDokumen,
    partnerNama,
    html,
  };
}

