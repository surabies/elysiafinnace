import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { resetDatabase } from "./reset";
import {
  seedAssetCategories,
  seedSystemFoundation,
  seedTaxes,
} from "./system";
import {
  seedCoaByIndustry,
  type IndustryTemplate,
  type HasilSeedCoa,
} from "./coa";
import { seedDemoData } from "./demo";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export interface SeedOptions {
  clean?: boolean;
  demo?: boolean;
  template?: IndustryTemplate;
  keepAuth?: boolean;
}

export interface HasilMasterSeed {
  durationMs: number;
  template: IndustryTemplate;
  totalAkun: number;
  demoLoaded: boolean;
  coa: HasilSeedCoa;
}

/**
 * Master Seed Orchestrator.
 * Menjalankan pipeline seeding terstruktur 3-Tier:
 * Tier 1: System Foundation
 * Tier 2: Chart of Accounts & Tax/Asset linkage
 * Tier 3: Realistic Demo Fixtures (Opsional)
 */
export async function runMasterSeed(
  db: Db,
  options: SeedOptions = {}
): Promise<HasilMasterSeed> {
  const startTime = Date.now();
  const template = options.template ?? "TRADING";
  const withDemo = options.demo ?? false;

  console.log("\n=======================================================");
  console.log("       ELYSIA FINANCE - MASTER SEED ENGINE");
  console.log("=======================================================");
  console.log(` Template Industri : ${template}`);
  console.log(` Mode Demo         : ${withDemo ? "YA (Fixtures Realistis)" : "TIDAK (Produksi Bersih)"}`);
  console.log(` Reset Database    : ${options.clean ? "YA (TRUNCATE CASCADE)" : "TIDAK (Idempotent Insert)"}`);
  console.log("-------------------------------------------------------");

  // 0. Reset Database bila diminta
  if (options.clean) {
    await resetDatabase({ keepAuth: options.keepAuth });
  }

  // 1. Layer 1: Data Sistem Wajib (Universal)
  await seedSystemFoundation(db);

  // 2. Layer 2: Bagan Akun (COA) Industri Pilihan
  console.log(`\n--- [LAYER 2] Menanamkan Bagan Akun Industri: ${template} ---`);
  const coa = await seedCoaByIndustry(db, template);
  console.log(`--- [LAYER 2 SELESAI] ${coa.totalInserted} Akun Berhasil Ditanam ---\n`);

  // 2b. Master Pajak Indonesia (Tergantung COA PPN & PPh)
  await seedTaxes(db, {
    ppnKeluaranId: coa.idByPeran.get("PPN_KELUARAN"),
    ppnMasukanId: coa.idByPeran.get("PPN_MASUKAN"),
    pphDibayarDimukaId: coa.idByPeran.get("PAJAK_DIBAYAR_DIMUKA"),
    hutangPphId: coa.idByPeran.get("HUTANG_PAJAK"),
  });

  // 2c. Master Kategori Aset Fiskal DJP (Tergantung Akun Peralatan 1210 & Akumulasi 1219)
  await seedAssetCategories(db, {
    peralatanId: coa.idByKode.get("1210"),
    akumPenyusutanPeralatanId: coa.idByKode.get("1219"),
    bebanPenyusutanId: coa.idByKode.get("6600"),
  });

  // 3. Layer 3: Demo Dataset (Opsional)
  if (withDemo) {
    await seedDemoData(db);
  }

  const durationMs = Date.now() - startTime;
  console.log("=======================================================");
  console.log(` SEED SELESAI DALAM ${durationMs}ms`);
  console.log("=======================================================\n");

  return {
    durationMs,
    template,
    totalAkun: coa.totalInserted,
    demoLoaded: withDemo,
    coa,
  };
}

export * from "./system";
export * from "./coa";
export * from "./demo";
export * from "./reset";
