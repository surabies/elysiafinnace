import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { itemStocks, items, stockMovements, warehouses } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export async function seedDemoStock(db: Db) {
  console.log("  [demo] Menanamkan saldo awal persediaan & kartu stok multi-gudang...");

  const [gudangUtama] = await db.select({ id: warehouses.id }).from(warehouses).where(eq(warehouses.kode, "GUD-UTAMA"));
  const [gudangTransit] = await db.select({ id: warehouses.id }).from(warehouses).where(eq(warehouses.kode, "GUD-TRANSIT"));

  const [laptop] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-LAP-001"));
  const [monitor] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-MON-002"));
  const [kertas] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-KRT-003"));

  if (!gudangUtama || !gudangTransit || !laptop || !monitor || !kertas) {
    throw new Error("[seed demo] Data gudang atau item belum lengkap untuk alokasi stok.");
  }

  const DAFTAR_SALDO_STOK = [
    // Gudang Cakung (Utama)
    {
      itemId: laptop.id,
      gudangId: gudangUtama.id,
      kuantitas: "45.0000",
      biayaRataRata: "8500000.0000",
      nilai: "382500000.0000",
    },
    {
      itemId: monitor.id,
      gudangId: gudangUtama.id,
      kuantitas: "120.0000",
      biayaRataRata: "1250000.0000",
      nilai: "150000000.0000",
    },
    {
      itemId: kertas.id,
      gudangId: gudangUtama.id,
      kuantitas: "300.0000",
      biayaRataRata: "42000.0000",
      nilai: "12600000.0000",
    },

    // Gudang Surabaya (Transit)
    {
      itemId: laptop.id,
      gudangId: gudangTransit.id,
      kuantitas: "15.0000",
      biayaRataRata: "8500000.0000",
      nilai: "127500000.0000",
    },
    {
      itemId: monitor.id,
      gudangId: gudangTransit.id,
      kuantitas: "40.0000",
      biayaRataRata: "1250000.0000",
      nilai: "50000000.0000",
    },
    {
      itemId: kertas.id,
      gudangId: gudangTransit.id,
      kuantitas: "100.0000",
      biayaRataRata: "42000.0000",
      nilai: "4200000.0000",
    },
  ];

  for (const s of DAFTAR_SALDO_STOK) {
    const [insertedStock] = await db
      .insert(itemStocks)
      .values(s)
      .onConflictDoNothing()
      .returning({ id: itemStocks.id });

    // Buat kartu stok awal jika baru diinsert
    if (insertedStock) {
      await db
        .insert(stockMovements)
        .values({
          tanggal: "2026-01-01",
          itemId: s.itemId,
          gudangId: s.gudangId,
          jenis: "MASUK",
          kuantitas: s.kuantitas,
          biayaSatuan: s.biayaRataRata,
          nilai: s.nilai,
          saldoKuantitas: s.kuantitas,
          saldoNilai: s.nilai,
          biayaRataRata: s.biayaRataRata,
          sumber: "SALDO_AWAL",
          sumberId: insertedStock.id,
          keterangan: "Saldo awal persediaan fisik gudang tahun buku 2026",
          dibuatOleh: "system",
        })
        .onConflictDoNothing();
    }
  }
}
