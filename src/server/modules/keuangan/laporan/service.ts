import { and, asc, eq, lte, gte, sql } from "drizzle-orm";
import { chartOfAccounts, journalEntries, journalItems } from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { keBigInt, keString } from "../shared/decimal";
import { galat } from "@/server/core/errors";

/** Baris rincian laporan (akun + nilai terformat). */
type BarisLaporan = Record<string, string | number | null>;

function saldoNormal(debit: bigint, kredit: bigint, normal: "DEBIT" | "KREDIT") {
  return normal === "DEBIT" ? debit - kredit : kredit - debit;
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
      debit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
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

  // 1. Saldo Kas/Bank Awal
  const kasAwalRes = await db
    .select({
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
        sql`${journalEntries.tanggal} < ${dari}`,
      ),
    )
    .where(eq(chartOfAccounts.peranSistem, "KAS_BANK"));

  const dAwal = keBigInt(kasAwalRes[0]?.debit ?? "0");
  const kAwal = keBigInt(kasAwalRes[0]?.kredit ?? "0");
  const saldoKasAwal = dAwal - kAwal;

  // 2. Mutasi Kas/Bank periode ini yang berpasangan dengan akun lain
  // Klasifikasi berdasarkan kategoriArusKas akun lawan atau tipe akun lawan
  const mutasiKas = await db
    .select({
      lawanId: chartOfAccounts.id,
      lawanKode: chartOfAccounts.kode,
      lawanNama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      kategoriArusKas: chartOfAccounts.kategoriArusKas,
      debitKas: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)`,
      kreditKas: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)`,
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
    .where(eq(chartOfAccounts.peranSistem, "KAS_BANK"))
    .groupBy(chartOfAccounts.id);

  let arusOperasi = BigInt(0);
  let arusInvestasi = BigInt(0);
  let arusPendanaan = BigInt(0);

  // Ambil rincian mutasi kas masuk dan keluar
  const rincianOperasi: BarisLaporan[] = [];
  const rincianInvestasi: BarisLaporan[] = [];
  const rincianPendanaan: BarisLaporan[] = [];

  // Hitung total kas masuk dan kas keluar
  let totalKasMasuk = BigInt(0);
  let totalKasKeluar = BigInt(0);

  for (const m of mutasiKas) {
    const d = keBigInt(m.debitKas);
    const k = keBigInt(m.kreditKas);
    totalKasMasuk += d;
    totalKasKeluar += k;

    const netto = d - k;
    if (m.kategoriArusKas === "INVESTASI") {
      arusInvestasi += netto;
      rincianInvestasi.push({ kode: m.lawanKode, nama: m.lawanNama, jumlah: keString(netto) });
    } else if (m.kategoriArusKas === "PENDANAAN") {
      arusPendanaan += netto;
      rincianPendanaan.push({ kode: m.lawanKode, nama: m.lawanNama, jumlah: keString(netto) });
    } else {
      arusOperasi += netto;
      rincianOperasi.push({ kode: m.lawanKode, nama: m.lawanNama, jumlah: keString(netto) });
    }
  }

  const perubahanKasBersih = totalKasMasuk - totalKasKeluar;
  const saldoKasAkhir = saldoKasAwal + perubahanKasBersih;

  return {
    dari,
    sampai,
    saldoKasAwal: keString(saldoKasAwal),
    arusKasOperasi: { rincian: rincianOperasi, total: keString(arusOperasi) },
    arusKasInvestasi: { rincian: rincianInvestasi, total: keString(arusInvestasi) },
    arusKasPendanaan: { rincian: rincianPendanaan, total: keString(arusPendanaan) },
    kenaikanPenurunanKasBersih: keString(perubahanKasBersih),
    saldoKasAkhir: keString(saldoKasAkhir),
  };
}
