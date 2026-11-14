import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  chartOfAccounts,
  fiscalPeriods,
  journalEntries,
  journalItems,
  yearEndClosings,
  type Periode,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { galat } from "@/server/core/errors";
import type { Tx } from "../shared/transaction";
import { akunByPeran } from "../akun/service";
import { ambilMataUangDasar } from "../mata-uang/service";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import { keBigInt, keString } from "../shared/decimal";
import { nullJikaKosong } from "../shared/text";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function rentangBulan(tahun: number, bulan: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  const akhir = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  return {
    kode: `${tahun}-${p(bulan)}`,
    tanggalMulai: `${tahun}-${p(bulan)}-01`,
    tanggalSelesai: `${tahun}-${p(bulan)}-${p(akhir)}`,
  };
}

export const namaPeriode = (p: Pick<Periode, "bulan" | "tahun">) => `${NAMA_BULAN[p.bulan - 1]} ${p.tahun}`;

/**
 * Memastikan periode untuk `tanggal` ada dan TERBUKA, lalu mengunci barisnya (FOR SHARE)
 * sehingga penutupan periode yang berjalan bersamaan harus menunggu posting ini selesai.
 * Periode dibuat otomatis bila belum ada.
 */
/** Menolak posting pada tahun yang sudah punya tutup buku aktif. */
export async function pastikanTahunBelumTutupBuku(tx: Tx, tanggal: string) {
  const tahun = Number(tanggal.slice(0, 4));
  const [ada] = await tx
    .select({ id: yearEndClosings.id })
    .from(yearEndClosings)
    .where(and(eq(yearEndClosings.tahun, tahun), eq(yearEndClosings.aktif, true)))
    .limit(1);
  if (ada) {
    throw galat.aturanBisnis(
      `Tahun ${tahun} sudah tutup buku. Batalkan tutup buku terlebih dahulu bila masih ada koreksi.`,
    );
  }
}

export async function tahunSudahTutupBuku(tahun: number) {
  const [ada] = await db
    .select({ id: yearEndClosings.id })
    .from(yearEndClosings)
    .where(and(eq(yearEndClosings.tahun, tahun), eq(yearEndClosings.aktif, true)))
    .limit(1);
  return Boolean(ada);
}

export async function pastikanPeriodeTerbuka(tx: Tx, tanggal: string): Promise<Periode> {
  const tahun = Number(tanggal.slice(0, 4));
  const bulan = Number(tanggal.slice(5, 7));
  const r = rentangBulan(tahun, bulan);
  await tx.insert(fiscalPeriods).values({ ...r, tahun, bulan }).onConflictDoNothing();
  const [periode] = await tx
    .select()
    .from(fiscalPeriods)
    .where(and(eq(fiscalPeriods.tahun, tahun), eq(fiscalPeriods.bulan, bulan)))
    .for("share");
  if (!periode) throw galat.aturanBisnis(`Periode ${r.kode} gagal disiapkan.`);
  if (periode.status !== "TERBUKA") {
    throw galat.aturanBisnis(
      `Periode ${namaPeriode(periode)} sudah DITUTUP. Transaksi bertanggal ${tanggal} tidak dapat diposting/dibatalkan.`,
    );
  }
  return periode;
}

export async function daftarPeriode(opsi: { tahun?: number }) {
  return db
    .select()
    .from(fiscalPeriods)
    .where(opsi.tahun ? eq(fiscalPeriods.tahun, opsi.tahun) : undefined)
    .orderBy(asc(fiscalPeriods.tahun), asc(fiscalPeriods.bulan));
}

/** Menyiapkan 12 periode bulanan untuk satu tahun (yang sudah ada tidak diubah). */
export async function siapkanPeriodeTahun(tahun: number, oleh: string) {
  const baris = Array.from({ length: 12 }, (_, i) => ({
    ...rentangBulan(tahun, i + 1),
    tahun,
    bulan: i + 1,
    dibuatOleh: oleh,
    diubahOleh: oleh,
  }));
  await db.insert(fiscalPeriods).values(baris).onConflictDoNothing();
  return daftarPeriode({ tahun });
}

async function ambilPeriode(id: string) {
  const [p] = await db.select().from(fiscalPeriods).where(eq(fiscalPeriods.id, id));
  if (!p) throw galat.tidakDitemukan("Periode");
  return p;
}

/** Menutup (mengunci) periode bulanan. Periode sebelumnya harus sudah ditutup lebih dulu. */
export async function tutupPeriode(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(fiscalPeriods).where(eq(fiscalPeriods.id, id)).for("update");
    if (!p) throw galat.tidakDitemukan("Periode");
    if (p.status === "DITUTUP") throw galat.aturanBisnis(`Periode ${namaPeriode(p)} sudah ditutup.`);
    const [terbukaSebelumnya] = await tx
      .select({ kode: fiscalPeriods.kode })
      .from(fiscalPeriods)
      .where(and(eq(fiscalPeriods.status, "TERBUKA"), sql`${fiscalPeriods.tanggalMulai} < ${p.tanggalMulai}`))
      .limit(1);
    if (terbukaSebelumnya) {
      throw galat.aturanBisnis(`Tutup periode ${terbukaSebelumnya.kode} terlebih dahulu (penutupan harus berurutan).`);
    }
    const [hasil] = await tx
      .update(fiscalPeriods)
      .set({ status: "DITUTUP", ditutupOleh: oleh, ditutupPada: new Date(), diubahOleh: oleh })
      .where(eq(fiscalPeriods.id, id))
      .returning();
    console.info(`[keuangan] Periode ${p.kode} ditutup oleh ${oleh}.`);
    return hasil!;
  });
}

/** Membuka kembali periode. Ditolak bila tahunnya sudah tutup buku atau periode sesudahnya masih ditutup. */
export async function bukaPeriode(id: string, oleh: string, cekTutupBuku: (tahun: number) => Promise<boolean>) {
  const p = await ambilPeriode(id);
  if (p.status === "TERBUKA") throw galat.aturanBisnis(`Periode ${namaPeriode(p)} sudah terbuka.`);
  if (await cekTutupBuku(p.tahun)) {
    throw galat.aturanBisnis(`Tahun ${p.tahun} sudah tutup buku. Batalkan tutup buku terlebih dahulu.`);
  }
  const [ditutupSesudahnya] = await db
    .select({ kode: fiscalPeriods.kode })
    .from(fiscalPeriods)
    .where(and(eq(fiscalPeriods.status, "DITUTUP"), sql`${fiscalPeriods.tanggalMulai} > ${p.tanggalMulai}`))
    .limit(1);
  if (ditutupSesudahnya) {
    throw galat.aturanBisnis(`Buka periode ${ditutupSesudahnya.kode} terlebih dahulu (pembukaan harus berurutan mundur).`);
  }
  const [hasil] = await db
    .update(fiscalPeriods)
    .set({ status: "TERBUKA", ditutupOleh: null, ditutupPada: null, diubahOleh: oleh })
    .where(eq(fiscalPeriods.id, id))
    .returning();
  console.info(`[keuangan] Periode ${p.kode} dibuka kembali oleh ${oleh}.`);
  return hasil!;
}

/* ----------------------- Tutup Buku Akhir Tahun ----------------------- */

export async function daftarTutupBukuTahunan() {
  return db
    .select({
      id: yearEndClosings.id,
      tahun: yearEndClosings.tahun,
      jurnalId: yearEndClosings.jurnalId,
      jurnalNomor: journalEntries.nomor,
      jurnalTanggal: journalEntries.tanggal,
      labaBersih: yearEndClosings.labaBersih,
      aktif: yearEndClosings.aktif,
      dibuatOleh: yearEndClosings.dibuatOleh,
      dibuatPada: yearEndClosings.dibuatPada,
      dibatalkanOleh: yearEndClosings.dibatalkanOleh,
      dibatalkanPada: yearEndClosings.dibatalkanPada,
    })
    .from(yearEndClosings)
    .innerJoin(journalEntries, eq(yearEndClosings.jurnalId, journalEntries.id))
    .orderBy(desc(yearEndClosings.tahun));
}

export async function tutupBukuTahunan(tahun: number, keterangan: string | undefined, oleh: string) {
  // 1. Validasi: semua 12 bulan dalam tahun tsb harus berstatus DITUTUP
  const periodeTahun = await db.select().from(fiscalPeriods).where(eq(fiscalPeriods.tahun, tahun));
  if (periodeTahun.length < 12 || periodeTahun.some((p) => p.status !== "DITUTUP")) {
    throw galat.aturanBisnis(
      `Semua 12 periode bulanan tahun ${tahun} harus berstatus DITUTUP sebelum tutup buku tahunan dapat dijalankan.`,
    );
  }

  // 2. Validasi: tahun belum ditutup
  if (await tahunSudahTutupBuku(tahun)) {
    throw galat.aturanBisnis(`Tahun ${tahun} sudah tutup buku.`);
  }

  // 3. Validasi: tahun sebelumnya (bila ada) harus sudah tutup buku
  const [tahunSebelumnyaAda] = await db
    .select({ id: fiscalPeriods.id })
    .from(fiscalPeriods)
    .where(eq(fiscalPeriods.tahun, tahun - 1))
    .limit(1);
  if (tahunSebelumnyaAda && !(await tahunSudahTutupBuku(tahun - 1))) {
    throw galat.aturanBisnis(
      `Tutup buku tahun ${tahun - 1} terlebih dahulu sebelum menutup tahun ${tahun} (penutupan harus kronologis).`,
    );
  }

  const tanggalMulai = `${tahun}-01-01`;
  const tanggalSelesai = `${tahun}-12-31`;

  // 4. Query semua akun nominal (Pendapatan & Beban) yang memiliki saldo pada tahun tsb
  const akunNominal = await db
    .select({
      id: chartOfAccounts.id,
      kode: chartOfAccounts.kode,
      nama: chartOfAccounts.nama,
      tipeAkun: chartOfAccounts.tipeAkun,
      normalBalance: chartOfAccounts.normalBalance,
      totalDebit: sql<string>`coalesce(sum(${journalItems.debitDasar}), 0)::text`,
      totalKredit: sql<string>`coalesce(sum(${journalItems.kreditDasar}), 0)::text`,
    })
    .from(chartOfAccounts)
    .innerJoin(journalItems, eq(journalItems.akunId, chartOfAccounts.id))
    .innerJoin(journalEntries, eq(journalItems.jurnalId, journalEntries.id))
    .where(
      and(
        eq(journalEntries.status, "POSTED"),
        eq(chartOfAccounts.aktif, true),
        inArray(chartOfAccounts.tipeAkun, ["PENDAPATAN", "BEBAN"]),
        sql`${journalEntries.tanggal} >= ${tanggalMulai} AND ${journalEntries.tanggal} <= ${tanggalSelesai}`,
        sql`${journalEntries.sumber} <> 'TUTUP_BUKU'`,
      ),
    )
    .groupBy(
      chartOfAccounts.id,
      chartOfAccounts.kode,
      chartOfAccounts.nama,
      chartOfAccounts.tipeAkun,
      chartOfAccounts.normalBalance,
    );

  const mataUangDasar = await ambilMataUangDasar();
  const akunLabaDitahan = await akunByPeran("LABA_DITAHAN");

  let totalPendapatanBig = BigInt(0);
  let totalBebanBig = BigInt(0);
  const barisJurnal: BarisJurnalInput[] = [];

  for (const a of akunNominal) {
    const d = keBigInt(a.totalDebit);
    const k = keBigInt(a.totalKredit);

    if (a.tipeAkun === "PENDAPATAN") {
      // Normal Kredit: saldo = k - d. Menutup akun: Debit sebesar saldo bersih
      const saldo = k - d;
      if (saldo === BigInt(0)) continue;
      totalPendapatanBig += saldo;

      barisJurnal.push({
        akunId: a.id,
        debit: saldo > BigInt(0) ? keString(saldo) : undefined,
        kredit: saldo < BigInt(0) ? keString(-saldo) : undefined,
        deskripsi: `Penutupan pendapatan ${a.kode} - ${a.nama}`,
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
      });
    } else {
      // Normal Debit: saldo = d - k. Menutup akun: Kredit sebesar saldo bersih
      const saldo = d - k;
      if (saldo === BigInt(0)) continue;
      totalBebanBig += saldo;

      barisJurnal.push({
        akunId: a.id,
        debit: saldo < BigInt(0) ? keString(-saldo) : undefined,
        kredit: saldo > BigInt(0) ? keString(saldo) : undefined,
        deskripsi: `Penutupan beban ${a.kode} - ${a.nama}`,
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
      });
    }
  }

  // Laba bersih = Total Pendapatan - Total Beban
  const labaBersihBig = totalPendapatanBig - totalBebanBig;

  if (labaBersihBig !== BigInt(0) || barisJurnal.length > 0) {
    // Alokasi ke akun Laba Ditahan (Retained Earnings)
    if (labaBersihBig > BigInt(0)) {
      // Laba Bersih -> Kredit Laba Ditahan
      barisJurnal.push({
        akunId: akunLabaDitahan.id,
        kredit: keString(labaBersihBig),
        deskripsi: `Alokasi laba bersih tahun ${tahun} ke Laba Ditahan`,
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
      });
    } else if (labaBersihBig < BigInt(0)) {
      // Rugi Bersih -> Debit Laba Ditahan
      barisJurnal.push({
        akunId: akunLabaDitahan.id,
        debit: keString(-labaBersihBig),
        deskripsi: `Alokasi rugi bersih tahun ${tahun} ke Laba Ditahan`,
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
      });
    }
  }

  if (barisJurnal.length === 0) {
    throw galat.aturanBisnis(`Tidak ada saldo pendapatan atau beban untuk ditutup pada tahun ${tahun}.`);
  }

  return db.transaction(async (tx) => {
    // Post jurnal penutup tahunan
    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: tanggalSelesai,
        deskripsi: nullJikaKosong(keterangan) ?? `Jurnal penutup akhir tahun ${tahun} (Laba Ditahan)`,
        sumber: "TUTUP_BUKU",
        mataUangId: mataUangDasar.id,
        kurs: "1.00000000",
        baris: barisJurnal,
        posting: true,
      },
      oleh,
    );

    const [closing] = await tx
      .insert(yearEndClosings)
      .values({
        tahun,
        jurnalId: jurnal.id,
        labaBersih: keString(labaBersihBig),
        aktif: true,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    return {
      id: closing!.id,
      tahun,
      labaBersih: closing!.labaBersih,
      jurnal,
    };
  });
}

export async function batalkanTutupBukuTahunan(tahun: number, oleh: string) {
  const [closing] = await db
    .select()
    .from(yearEndClosings)
    .where(and(eq(yearEndClosings.tahun, tahun), eq(yearEndClosings.aktif, true)))
    .limit(1);

  if (!closing) {
    throw galat.aturanBisnis(`Tutup buku tahun ${tahun} tidak ditemukan atau sudah tidak aktif.`);
  }

  // Cek apakah tahun sesudahnya masih tutup buku (harus dibatalkan mundur dari tahun terbaru)
  const [tutupSesudahnya] = await db
    .select({ tahun: yearEndClosings.tahun })
    .from(yearEndClosings)
    .where(and(eq(yearEndClosings.aktif, true), sql`${yearEndClosings.tahun} > ${tahun}`))
    .limit(1);
  if (tutupSesudahnya) {
    throw galat.aturanBisnis(
      `Batalkan tutup buku tahun ${tutupSesudahnya.tahun} terlebih dahulu (pembatalan harus kronologis mundur).`,
    );
  }

  return db.transaction(async (tx) => {
    // Balik jurnal penutup
    const tanggalBalik = `${tahun + 1}-01-01`;
    await balikJurnal(
      tx,
      closing.jurnalId,
      {
        tanggal: tanggalBalik,
        deskripsi: `Pembatalan tutup buku akhir tahun ${tahun}`,
        sumber: "PEMBALIK",
      },
      oleh,
    );

    const [hasil] = await tx
      .update(yearEndClosings)
      .set({
        aktif: false,
        dibatalkanOleh: oleh,
        dibatalkanPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(yearEndClosings.id, closing.id))
      .returning();

    return hasil!;
  });
}
