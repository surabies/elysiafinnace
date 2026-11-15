import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { productCategories, unitsOfMeasurement } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export const DAFTAR_SATUAN = [
  { kode: "PCS", nama: "Pieces (Buah)" },
  { kode: "UNIT", nama: "Unit" },
  { kode: "BOX", nama: "Box (Kotak)" },
  { kode: "DUS", nama: "Kardus / Karton" },
  { kode: "PACK", nama: "Pack / Bungkus" },
  { kode: "KG", nama: "Kilogram" },
  { kode: "GRAM", nama: "Gram" },
  { kode: "LITER", nama: "Liter" },
  { kode: "M", nama: "Meter" },
  { kode: "M2", nama: "Meter Persegi" },
  { kode: "M3", nama: "Meter Kubik" },
  { kode: "RIM", nama: "Rim (Kertas)" },
  { kode: "SET", nama: "Set" },
  { kode: "JAM", nama: "Jam (Jasa)" },
  { kode: "HARI", nama: "Hari (Sewa/Jasa)" },
  { kode: "BULAN", nama: "Bulan (Langganan)" },
];

export const DAFTAR_KATEGORI_PRODUK = [
  { kode: "UMUM", nama: "Barang Dagang Umum" },
  { kode: "ELEKTRONIK", nama: "Peralatan Elektronik & IT" },
  { kode: "FMCG", nama: "Barang Konsumsi / Makanan & Minuman" },
  { kode: "ATK", nama: "Alat Tulis Kantor & Kertas" },
  { kode: "JASA", nama: "Layanan Jasa & Konsultasi" },
];

export async function seedUomAndCategories(db: Db) {
  console.log("  [system] Menanamkan satuan pengukuran (UOM) & kategori produk dasar...");
  await db.insert(unitsOfMeasurement).values(DAFTAR_SATUAN).onConflictDoNothing();
  await db.insert(productCategories).values(DAFTAR_KATEGORI_PRODUK).onConflictDoNothing();
}
