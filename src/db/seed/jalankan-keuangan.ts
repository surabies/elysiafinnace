/**
 * Runner seed keuangan.  Jalankan:  bun run src/db/seed/jalankan-keuangan.ts
 * (Bun otomatis membaca .env, sama seperti saat menjalankan aplikasi.)
 */
import { db } from "@/db";
import { jalankanSeedKeuangan } from "./keuangan";

try {
  await jalankanSeedKeuangan(db);
  process.exit(0);
} catch (galat) {
  console.error("[seed keuangan] Seed gagal:", galat);
  process.exit(1);
}
