import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import {
  PERAN_SISTEM_BANYAK_AKUN,
  PERAN_SISTEM_KE_TIPE,
  SALDO_NORMAL_BAWAAN,
  chartOfAccounts,
  currencies,
  type Akun,
  type PeranSistem,
  type PeranTunggal,
  type SaldoNormal,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { escapeLike, nullJikaKosong } from "../shared/text";
import { galat } from "@/server/core/errors";
import type { InputBuatAkun, InputUbahAkun } from "./model";

const NAMA_OBJEK = "Akun";

export type NodeAkun = Akun & { anak: NodeAkun[] };

export async function daftarAkun(opsi: {
  tipeAkun?: Akun["tipeAkun"];
  aktif?: boolean;
  bisaDiposting?: boolean;
  peranSistem?: PeranSistem;
  q?: string;
}) {
  const q = opsi.q?.trim();
  return db
    .select()
    .from(chartOfAccounts)
    .where(
      and(
        opsi.tipeAkun ? eq(chartOfAccounts.tipeAkun, opsi.tipeAkun) : undefined,
        opsi.aktif === undefined ? undefined : eq(chartOfAccounts.aktif, opsi.aktif),
        opsi.bisaDiposting === undefined ? undefined : eq(chartOfAccounts.bisaDiposting, opsi.bisaDiposting),
        opsi.peranSistem ? eq(chartOfAccounts.peranSistem, opsi.peranSistem) : undefined,
        q
          ? or(
              ilike(chartOfAccounts.kode, `${escapeLike(q)}%`),
              ilike(chartOfAccounts.nama, `%${escapeLike(q)}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(chartOfAccounts.kode));
}

/** Bagan akun sebagai pohon induk -> anak, urut berdasarkan kode. */
export async function pohonAkun(opsi: { aktif?: boolean } = {}): Promise<NodeAkun[]> {
  const semua = await daftarAkun({ aktif: opsi.aktif });
  const peta = new Map<string, NodeAkun>(semua.map((a) => [a.id, { ...a, anak: [] }]));
  const akar: NodeAkun[] = [];
  for (const node of peta.values()) {
    const induk = node.indukId ? peta.get(node.indukId) : undefined;
    // Jika induk tersaring (mis. nonaktif) anak dianggap akar agar tidak hilang dari tampilan.
    (induk ? induk.anak : akar).push(node);
  }
  return akar;
}

export async function ambilAkun(id: string) {
  const [baris] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, id));
  if (!baris) throw galat.tidakDitemukan(NAMA_OBJEK);
  return baris;
}

/**
 * Mencari akun untuk peran sistem tunggal. Dipakai modul otomatis, misalnya
 * penjualan memakai akunByPeran("PENDAPATAN_PENJUALAN") sehingga penjualan
 * tidak pernah salah masuk ke Laba Ditahan.
 */
export async function akunByPeran(peran: PeranTunggal): Promise<Akun> {
  const [baris] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.peranSistem, peran), eq(chartOfAccounts.aktif, true)));
  if (!baris) {
    throw galat.aturanBisnis(`Akun dengan peran ${peran} belum ditetapkan di Bagan Akun (atau tidak aktif).`);
  }
  return baris;
}

async function pastikanMataUangAda(mataUangId: string | null | undefined) {
  if (!mataUangId) return;
  const [baris] = await db.select({ id: currencies.id }).from(currencies).where(eq(currencies.id, mataUangId));
  if (!baris) throw galat.tidakDitemukan("Mata uang");
}

/** Induk harus akun header aktif dengan tipe yang sama dengan anak. */
async function validasiInduk(indukId: string, tipeAnak: Akun["tipeAkun"]) {
  const induk = await ambilAkun(indukId).catch((e) => {
    throw e?.status === 404 ? galat.tidakDitemukan("Akun induk") : e;
  });
  if (induk.bisaDiposting) {
    throw galat.aturanBisnis(
      `Akun induk ${induk.kode} - ${induk.nama} adalah akun detail (bisa diposting). Induk harus berupa akun header.`,
    );
  }
  if (!induk.aktif) throw galat.aturanBisnis(`Akun induk ${induk.kode} tidak aktif.`);
  if (induk.tipeAkun !== tipeAnak) {
    throw galat.aturanBisnis(`Tipe akun harus sama dengan induknya (${induk.tipeAkun}), bukan ${tipeAnak}.`);
  }
  return induk;
}

export async function buatAkun(input: InputBuatAkun, oleh: string) {
  const bisaDiposting = input.bisaDiposting ?? true;
  const adalahAkunKontra = input.adalahAkunKontra ?? false;
  const peranSistem = input.peranSistem ?? null;

  // Saldo normal diturunkan dari tipe; akun kontra berkebalikan.
  const bawaan = SALDO_NORMAL_BAWAAN[input.tipeAkun];
  const normalBalance: SaldoNormal = adalahAkunKontra ? (bawaan === "DEBIT" ? "KREDIT" : "DEBIT") : bawaan;
  if (input.normalBalance && input.normalBalance !== normalBalance) {
    throw galat.aturanBisnis(
      `Akun bertipe ${input.tipeAkun} bersaldo normal ${normalBalance}` +
        (adalahAkunKontra ? " (akun kontra)" : "") +
        `. Gunakan adalahAkunKontra=true bila memang akun kontra.`,
    );
  }

  if (peranSistem) {
    if (!bisaDiposting) throw galat.aturanBisnis("Akun header tidak boleh memiliki peran sistem.");
    const tipeSeharusnya = PERAN_SISTEM_KE_TIPE[peranSistem];
    if (tipeSeharusnya !== input.tipeAkun) {
      throw galat.aturanBisnis(
        `Peran ${peranSistem} hanya boleh dimiliki akun bertipe ${tipeSeharusnya}, bukan ${input.tipeAkun}.`,
      );
    }
    if (!(PERAN_SISTEM_BANYAK_AKUN as readonly string[]).includes(peranSistem)) {
      const [sudah] = await db
        .select({ kode: chartOfAccounts.kode, nama: chartOfAccounts.nama })
        .from(chartOfAccounts)
        .where(eq(chartOfAccounts.peranSistem, peranSistem));
      if (sudah) {
        throw galat.sudahAda(`Peran ${peranSistem} sudah dimiliki akun ${sudah.kode} - ${sudah.nama}.`);
      }
    }
  }

  const induk = input.indukId ? await validasiInduk(input.indukId, input.tipeAkun) : null;
  await pastikanMataUangAda(input.mataUangId);

  const [baru] = await db
    .insert(chartOfAccounts)
    .values({
      kode: input.kode.trim(),
      nama: input.nama.trim(),
      tipeAkun: input.tipeAkun,
      normalBalance,
      indukId: induk?.id ?? null,
      level: (induk?.level ?? 0) + 1,
      bisaDiposting,
      adalahAkunKontra,
      peranSistem,
      mataUangId: input.mataUangId ?? null,
      keterangan: nullJikaKosong(input.keterangan),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahAkun(id: string, input: InputUbahAkun, oleh: string) {
  const akun = await ambilAkun(id);
  const set: Partial<typeof chartOfAccounts.$inferInsert> = {};

  if (input.kode !== undefined) set.kode = input.kode.trim();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.keterangan !== undefined) set.keterangan = nullJikaKosong(input.keterangan);
  if (input.mataUangId !== undefined) {
    await pastikanMataUangAda(input.mataUangId);
    set.mataUangId = input.mataUangId;
  }

  if (input.aktif !== undefined && input.aktif !== akun.aktif) {
    if (input.aktif === false) {
      if (akun.peranSistem) {
        throw galat.aturanBisnis(`Akun berperan ${akun.peranSistem} tidak boleh dinonaktifkan.`);
      }
      const [{ aktifAnak } = { aktifAnak: 0 }] = await db
        .select({ aktifAnak: sql<number>`count(*)::int` })
        .from(chartOfAccounts)
        .where(and(eq(chartOfAccounts.indukId, id), eq(chartOfAccounts.aktif, true)));
      if (aktifAnak > 0) {
        throw galat.aturanBisnis("Nonaktifkan seluruh akun turunan terlebih dahulu.");
      }
    } else if (akun.indukId) {
      const induk = await ambilAkun(akun.indukId);
      if (!induk.aktif) throw galat.aturanBisnis("Aktifkan akun induk terlebih dahulu.");
    }
    set.aktif = input.aktif;
  }

  // Pindah induk (reparent): validasi seluruhnya SEBELUM ada penulisan.
  let pindah: { indukBaru: string | null; levelBaru: number } | null = null;
  if (input.indukId !== undefined && input.indukId !== akun.indukId) {
    if (input.indukId === null) {
      pindah = { indukBaru: null, levelBaru: 1 };
    } else {
      if (input.indukId === id) throw galat.aturanBisnis("Akun tidak boleh menjadi induk bagi dirinya sendiri.");
      const induk = await validasiInduk(input.indukId, akun.tipeAkun);
      const semua = await db
        .select({ id: chartOfAccounts.id, indukId: chartOfAccounts.indukId })
        .from(chartOfAccounts);
      const keturunan = new Set<string>();
      const antrean = [id];
      while (antrean.length) {
        const saat = antrean.pop()!;
        for (const a of semua) {
          if (a.indukId === saat && !keturunan.has(a.id)) {
            keturunan.add(a.id);
            antrean.push(a.id);
          }
        }
      }
      if (keturunan.has(induk.id)) {
        throw galat.aturanBisnis("Akun tidak boleh dipindah ke bawah akun turunannya sendiri.");
      }
      pindah = { indukBaru: induk.id, levelBaru: induk.level + 1 };
    }
  }

  if (Object.keys(set).length === 0 && !pindah) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  if (Object.keys(set).length > 0) {
    await db
      .update(chartOfAccounts)
      .set({ ...set, diubahOleh: oleh })
      .where(eq(chartOfAccounts.id, id));
  }

  if (pindah) {
    // Satu pernyataan atomik: memindahkan induk dan menghitung ulang level seluruh sub-pohon.
    await db.execute(sql`
      WITH RECURSIVE pohon AS (
        SELECT id, ${pindah.levelBaru}::smallint AS level_baru
          FROM chart_of_accounts WHERE id = ${id}::uuid
        UNION ALL
        SELECT c.id, (p.level_baru + 1)::smallint
          FROM chart_of_accounts c JOIN pohon p ON c.induk_id = p.id
      )
      UPDATE chart_of_accounts a
         SET level = pohon.level_baru,
             induk_id = CASE WHEN a.id = ${id}::uuid THEN ${pindah.indukBaru}::uuid ELSE a.induk_id END,
             diubah_oleh = ${oleh},
             diubah_pada = now()
        FROM pohon
       WHERE a.id = pohon.id
    `);
  }

  return ambilAkun(id);
}

/**
 * Memastikan sebuah akun layak dipakai sebagai rujukan di modul lain:
 * aktif, akun detail (bisa diposting), bertipe tertentu, dan (opsional) berperan tertentu.
 * Dipakai master item, rekening bank, dan nanti modul transaksi.
 */
export async function pastikanAkunDetail(
  id: string,
  syarat: { label: string; tipe: Akun["tipeAkun"]; peran?: PeranSistem },
): Promise<Akun> {
  const [akun] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, id));
  if (!akun) throw galat.tidakDitemukan(syarat.label);
  const nama = `${syarat.label} ${akun.kode} - ${akun.nama}`;
  if (!akun.aktif) throw galat.aturanBisnis(`${nama} tidak aktif.`);
  if (!akun.bisaDiposting) throw galat.aturanBisnis(`${nama} adalah akun header dan tidak dapat dipakai untuk transaksi.`);
  if (akun.tipeAkun !== syarat.tipe) {
    throw galat.aturanBisnis(`${nama} bertipe ${akun.tipeAkun}; yang dibutuhkan bertipe ${syarat.tipe}.`);
  }
  if (syarat.peran && akun.peranSistem !== syarat.peran) {
    throw galat.aturanBisnis(`${nama} tidak berperan ${syarat.peran}.`);
  }
  return akun;
}
