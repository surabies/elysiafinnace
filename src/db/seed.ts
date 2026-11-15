#!/usr/bin/env bun
/**
 * Master CLI Runner untuk Database Seeding Elysia Finance.
 *
 * Pemakaian:
 *   bun run db:seed                      (Menanam Layer 1 System + Layer 2 Trading COA)
 *   bun run db:seed --demo               (Menanam Layer 1 + Layer 2 + Layer 3 Demo Data)
 *   bun run db:seed --clean --demo       (Truncate seluruh tabel lalu tanam Layer 1-3)
 *   bun run db:seed --template=SERVICE   (Gunakan COA Jasa / Agensi / IT)
 *   bun run db:seed --template=MANUFACTURING --demo
 */
import { db } from "@/db";
import { runMasterSeed, type IndustryTemplate } from "./seed/index";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Elysia Finance - Database Seed Runner CLI
-----------------------------------------
Opsi yang tersedia:
  --clean                  Mengosongkan tabel (TRUNCATE) sebelum menanam data
  --demo                   Menyertakan dataset demo realistis (Perusahaan, Kontak, Stok, Jurnal)
  --template=<TIPE>        Pilihan Bagan Akun: TRADING, SERVICE, MANUFACTURING, MINIMAL (default: TRADING)
  --keep-auth              Saat menggunakan --clean, pertahankan tabel Better Auth
  --help, -h               Menampilkan petunjuk ini
`);
  process.exit(0);
}

const clean = args.includes("--clean");
const demo = args.includes("--demo");
const keepAuth = args.includes("--keep-auth");

let template: IndustryTemplate = "TRADING";
const templateArg = args.find((a) => a.startsWith("--template="));
if (templateArg) {
  const parsed = templateArg.split("=")[1]?.toUpperCase();
  if (parsed === "TRADING" || parsed === "SERVICE" || parsed === "MANUFACTURING" || parsed === "MINIMAL") {
    template = parsed;
  } else {
    console.error(`[db:seed] Galat: Template '${parsed}' tidak dikenal. Pilihan: TRADING, SERVICE, MANUFACTURING, MINIMAL`);
    process.exit(1);
  }
}

try {
  await runMasterSeed(db, {
    clean,
    demo,
    template,
    keepAuth,
  });
  process.exit(0);
} catch (galat) {
  console.error("\n[db:seed] PROSES SEED GAGAL:", galat);
  process.exit(1);
}
