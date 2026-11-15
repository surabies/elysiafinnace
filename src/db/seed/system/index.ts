import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { seedCurrencies } from "./currencies";
import { seedPaymentTerms } from "./payment-terms";
import { seedUomAndCategories } from "./uom";
import { seedRbac } from "./rbac";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/**
 * Menjalankan seed Layer 1: Data Sistem Wajib (Universal).
 * Bagian ini tidak memiliki dependensi ke perusahaan atau COA.
 */
export async function seedSystemFoundation(db: Db) {
  console.log("\n--- [LAYER 1] Menanamkan Data Sistem Wajib ---");
  await seedCurrencies(db);
  await seedPaymentTerms(db);
  await seedUomAndCategories(db);
  await seedRbac(db);
  console.log("--- [LAYER 1 SELESAI] Data Sistem Wajib Berhasil Ditanam ---\n");
}

export * from "./currencies";
export * from "./payment-terms";
export * from "./uom";
export * from "./rbac";
export * from "./taxes";
export * from "./asset-categories";
