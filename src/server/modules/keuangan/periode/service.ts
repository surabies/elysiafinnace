import { and, asc, eq, sql } from "drizzle-orm";
import { fiscalPeriods, yearEndClosings, type Periode } from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { galat } from "@/server/core/errors";
import type { Tx } from "../shared/transaction";

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
