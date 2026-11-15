import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  SALDO_NORMAL_BAWAAN,
  chartOfAccounts,
  type KategoriArusKas,
  type PeranSistem,
  type SaldoNormal,
  type TipeAkun,
} from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export interface DefinisiAkunSeed {
  kode: string;
  nama: string;
  tipe: TipeAkun;
  induk?: string;
  header?: boolean;
  kontra?: boolean;
  peran?: PeranSistem;
  arusKas?: KategoriArusKas;
}

export interface HasilSeedCoa {
  idByKode: Map<string, string>;
  idByPeran: Map<string, string>;
  totalInserted: number;
}

/**
 * Memasukkan daftar akun secara berurutan agar induk selalu dibuat sebelum anak.
 * Menghasilkan map idByKode dan idByPeran untuk referensi transaksi & modul berikutnya.
 */
export async function insertCoaTree(
  db: Db,
  daftarAkun: DefinisiAkunSeed[]
): Promise<HasilSeedCoa> {
  const petaNode = new Map<string, { id: string; level: number }>();
  const idByKode = new Map<string, string>();
  const idByPeran = new Map<string, string>();
  let count = 0;

  for (const a of daftarAkun) {
    const induk = a.induk ? petaNode.get(a.induk) : undefined;
    if (a.induk && !induk) {
      throw new Error(
        `[seed coa] Akun induk '${a.induk}' untuk akun '${a.kode} - ${a.nama}' belum terdaftar.`
      );
    }

    const normalBalance: SaldoNormal = a.kontra
      ? SALDO_NORMAL_BAWAAN[a.tipe] === "DEBIT"
        ? "KREDIT"
        : "DEBIT"
      : SALDO_NORMAL_BAWAAN[a.tipe];

    const level = (induk?.level ?? 0) + 1;

    await db
      .insert(chartOfAccounts)
      .values({
        kode: a.kode,
        nama: a.nama,
        tipeAkun: a.tipe,
        normalBalance,
        indukId: induk?.id ?? null,
        level,
        bisaDiposting: !a.header,
        adalahAkunKontra: a.kontra ?? false,
        peranSistem: a.peran ?? null,
        kategoriArusKas: a.arusKas ?? null,
      })
      .onConflictDoNothing({ target: chartOfAccounts.kode });

    const [saved] = await db
      .select({ id: chartOfAccounts.id, level: chartOfAccounts.level })
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.kode, a.kode));

    if (saved) {
      petaNode.set(a.kode, saved);
      idByKode.set(a.kode, saved.id);
      if (a.peran) {
        idByPeran.set(a.peran, saved.id);
      }
      count++;
    }
  }

  return {
    idByKode,
    idByPeran,
    totalInserted: count,
  };
}
