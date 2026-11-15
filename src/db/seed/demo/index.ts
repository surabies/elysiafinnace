import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { seedDemoBankAccounts } from "./bank-accounts";
import { seedDemoBudgets } from "./budgets";
import { seedDemoCompany } from "./company";
import { seedDemoContacts } from "./contacts";
import { seedDemoFixedAssets } from "./fixed-assets";
import { seedDemoInvoices } from "./invoices";
import { seedDemoPeriods } from "./periods";
import { seedDemoProducts } from "./products";
import { seedDemoStock } from "./stock";
import { seedDemoTransactions } from "./transactions";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/**
 * Menanamkan seluruh Layer 3: Dataset Demo Realistis Komprehensif.
 * Menyentuh seluruh modul ERP: Keuangan, Akuntansi, Penjualan, Pembelian,
 * Kas Bank, Inventori, Aset Tetap, Anggaran, Pajak, dan Kalender Periode.
 */
export async function seedDemoData(db: Db) {
  console.log("\n--- [LAYER 3] Menanamkan Dataset Demo Realistis Komprehensif ---");

  // 1. Kalender Periode Fiskal (14 Bulan: 2025-11 s/d 2026-12)
  await seedDemoPeriods(db);

  // 2. Organisasi, Cabang, Gudang, & Admin User
  const company = await seedDemoCompany(db);

  // 3. Rekening Kas & Bank
  const bank = await seedDemoBankAccounts(db);

  // 4. Mitra Bisnis (Pelanggan & Pemasok)
  const contacts = await seedDemoContacts(db);

  // 5. Katalog Produk, Multi-satuan, & Price List
  const products = await seedDemoProducts(db);

  // 6. Saldo Awal Persediaan Fisik & Kartu Stok Multi-Gudang
  await seedDemoStock(db);

  // 7. Aset Tetap & Jadwal Penyusutan Fiskal
  await seedDemoFixedAssets(db);

  // 8. Rencana Kerja & Anggaran Perusahaan (RKAP) 2026 Bulanan
  await seedDemoBudgets(db);

  // 9. Faktur Penjualan, Pembelian & Pembayaran (Untuk Analitik Aging AR/AP)
  await seedDemoInvoices(db);

  // 10. Jurnal Umum Multi-Bulan (12 Bulan Historis + Harian/Mingguan)
  const trx = await seedDemoTransactions(db);

  console.log("--- [LAYER 3 SELESAI] Dataset Demo Siap Digunakan ---");
  console.log(`    Perusahaan : PT Elysia Niaga Nusantara (ID: ${company.perusahaanId})`);
  console.log(`    Transaksi  : ${trx.totalJurnal} Jurnal Umum Seimbang (Status POSTED)\n`);

  return { company, bank, contacts, products, trx };
}

export * from "./periods";
export * from "./company";
export * from "./bank-accounts";
export * from "./contacts";
export * from "./products";
export * from "./stock";
export * from "./fixed-assets";
export * from "./budgets";
export * from "./invoices";
export * from "./transactions";
