import assert from "node:assert/strict";
import { cekKesehatanSistem } from "../src/server/modules/keuangan/produksi/health";
import { periksaIdempotency, simpanIdempotency } from "../src/server/modules/keuangan/produksi/idempotency";
import { logger } from "../src/server/core/logger";
import { db } from "../src/server/modules/keuangan/shared/context";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== Starting Milestone M14 (Kesiapan Produksi, Idempotensi & Observabilitas) Verification ===");
  const ts = Date.now();

  // ==========================================
  // 1. HEALTH CHECK & DATABASE LATENCY DIAGNOSTICS
  // ==========================================
  console.log("1. Testing health check diagnostics & database ping...");
  const health = await cekKesehatanSistem();
  assert.equal(health.status, "OK");
  assert.equal(health.database.status, "HEALTHY");
  assert.ok(health.database.latensiMs >= 0, "Latensi DB harus terukur");
  assert.ok(health.uptimeDetik >= 0);
  assert.ok(health.memori.heapUsedMb > 0);

  // ==========================================
  // 2. IDEMPOTENCY KEY ENGINE
  // ==========================================
  console.log("2. Testing idempotency key evaluation and replay...");
  const testKey = `idemp-key-test-${ts}`;
  const reqPath = "/api/keuangan/penjualan/faktur";
  const reqBody = { pelangganId: "cust-123", total: "15000000" };

  // Cek pertama kali: key belum pernah dipakai
  const cek1 = await periksaIdempotency(testKey, "POST", reqPath, reqBody);
  assert.equal(cek1.replay, false);
  assert.ok(cek1.requestHash, "Request hash harus dihasilkan");

  // Simpan respons simulasi
  const mockResponse = { id: `inv-${ts}`, nomor: "FP/2026/9999", total: "15000000" };
  await simpanIdempotency(
    testKey,
    "user-test-owner",
    "POST",
    reqPath,
    cek1.requestHash!,
    201,
    mockResponse,
  );

  // Cek kedua kali dengan key dan payload sama: harus replay respons tersimpan!
  const cek2 = await periksaIdempotency(testKey, "POST", reqPath, reqBody);
  assert.equal(cek2.replay, true);
  assert.equal(cek2.statusHttp, 201);
  assert.equal(cek2.responseBody.nomor, "FP/2026/9999");

  // Cek ketiga kali dengan key sama TAPI payload berbeda: harus melempar error konflik!
  console.log("3. Testing idempotency mismatch payload collision rejection...");
  let throwError = false;
  try {
    const bedaBody = { pelangganId: "cust-123", total: "99999999" };
    await periksaIdempotency(testKey, "POST", reqPath, bedaBody);
  } catch (err: unknown) {
    throwError = true;
    const errObj = err as { message: string };
    assert.ok(errObj.message.includes("hash payload tidak cocok"));
  }
  assert.ok(throwError, "Harus melempar error jika idempotency key dipakai ulang dengan payload berbeda");

  // ==========================================
  // 4. STRUCTURED LOGGER
  // ==========================================
  console.log("4. Testing structured JSON logger...");
  logger.info("Pengujian structured log info", {
    modul: "produksi",
    metode: "POST",
    path: "/api/keuangan/test",
    durasiMs: 12.5,
    statusHttp: 200,
  });

  logger.warn("Pengujian structured log warning", {
    modul: "otomasi",
    data: { retryCount: 2 },
  });

  // ==========================================
  // 5. PRODUCTION DATABASE INDEXES VERIFICATION
  // ==========================================
  console.log("5. Verifying production performance indexes in PostgreSQL...");
  const indexesRes = await db.execute<{ indexname: string }>(
    sql`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
  );
  const indexNames = (indexesRes.rows as unknown as { indexname: string }[]).map((r) => r.indexname);

  assert.ok(indexNames.includes("idx_idempotency_kunci"), "Indeks idx_idempotency_kunci harus ada");
  assert.ok(indexNames.includes("idx_journal_items_akun_jurnal"), "Indeks idx_journal_items_akun_jurnal harus ada");
  assert.ok(indexNames.includes("idx_sales_invoices_jatuh_tempo_sisa"), "Indeks idx_sales_invoices_jatuh_tempo_sisa harus ada");
  assert.ok(indexNames.includes("idx_purchase_invoices_jatuh_tempo_sisa"), "Indeks idx_purchase_invoices_jatuh_tempo_sisa harus ada");
  assert.ok(indexNames.includes("idx_audit_logs_waktu_entitas"), "Indeks idx_audit_logs_waktu_entitas harus ada");

  console.log("\n>>> ALL 5 TEST SCENARIOS FOR MILESTONE M14 PASSED PERFECTLY! <<<");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
