import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { PERAN_SISTEM, type PeranSistem } from "@/db/schema/keuangan";
import { insertCoaTree, type HasilSeedCoa } from "./builder";
import { MANUFACTURING_COA } from "./manufacturing-coa";
import { MINIMAL_COA } from "./minimal-coa";
import { SERVICE_COA } from "./service-coa";
import { TRADING_COA } from "./trading-coa";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export type IndustryTemplate = "TRADING" | "SERVICE" | "MANUFACTURING" | "MINIMAL";

export const COA_TEMPLATES: Record<IndustryTemplate, typeof TRADING_COA> = {
  TRADING: TRADING_COA,
  SERVICE: SERVICE_COA,
  MANUFACTURING: MANUFACTURING_COA,
  MINIMAL: MINIMAL_COA,
};

/**
 * Menyuntikkan template Bagan Akun berdasarkan industri pilihan.
 * Memvalidasi kelengkapan peran sistem wajib untuk integritas operasional ERP.
 */
export async function seedCoaByIndustry(
  db: Db,
  template: IndustryTemplate = "TRADING"
): Promise<HasilSeedCoa> {
  const daftarAkun = COA_TEMPLATES[template];
  if (!daftarAkun) {
    throw new Error(`[seed coa] Template industri '${template}' tidak dikenal.`);
  }

  const hasil = await insertCoaTree(db, daftarAkun);

  // Validasi peran sistem
  const peranBelumAda: PeranSistem[] = [];
  for (const peran of PERAN_SISTEM) {
    if (!hasil.idByPeran.has(peran)) {
      peranBelumAda.push(peran);
    }
  }

  if (peranBelumAda.length > 0) {
    console.warn(
      `[seed coa: ${template}] PERINGATAN: Peran sistem berikut belum terpetakan ke akun:`,
      peranBelumAda.join(", ")
    );
  }

  return hasil;
}

export {
  insertCoaTree,
  MANUFACTURING_COA,
  MINIMAL_COA,
  SERVICE_COA,
  TRADING_COA,
  type HasilSeedCoa,
};
