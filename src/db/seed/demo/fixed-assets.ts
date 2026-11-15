import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { assetCategories, fixedAssets } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export async function seedDemoFixedAssets(db: Db) {
  console.log("  [demo] Mendaftarkan aset tetap dan jadwal penyusutan fiskal...");

  const [gol1] = await db.select({ id: assetCategories.id }).from(assetCategories).where(eq(assetCategories.kode, "KAT-GOL1"));
  const [gol2] = await db.select({ id: assetCategories.id }).from(assetCategories).where(eq(assetCategories.kode, "KAT-GOL2"));

  if (!gol1 || !gol2) {
    console.warn("  [demo] Kategori aset belum tersedia, melewati pendaftaran aset tetap.");
    return;
  }

  const DAFTAR_ASET = [
    {
      kode: "AST-IT-001",
      nama: "Server Enterprise Dell PowerEdge R750 (Database Host)",
      kategoriId: gol1.id,
      tanggalPerolehan: "2024-01-15",
      tanggalMulaiPenyusutan: "2024-02-01",
      nilaiPerolehan: "85000000.0000",
      nilaiResidu: "5000000.0000",
      masaManfaatBulan: 48,
      metodePenyusutan: "GARIS_LURUS" as const,
      lokasi: "Server Room Lt. 28 SCBD Jakarta",
      penanggungJawab: "Bambang Sudibyo",
      nomorSeri: "DELL-PE-750-X992",
      status: "AKTIF" as const,
      akumulasiPenyusutan: "48333333.3333", // ~29 bulan berjalan
      nilaiBuku: "36666666.6667",
      sisaManfaatBulan: 19,
      keterangan: "Server database utama ERP Elysia & storage backup",
    },
    {
      kode: "AST-VH-001",
      nama: "Truk Box Isuzu Giga FVR 240PS Logistik Cakung",
      kategoriId: gol2.id,
      tanggalPerolehan: "2024-06-10",
      tanggalMulaiPenyusutan: "2024-07-01",
      nilaiPerolehan: "480000000.0000",
      nilaiResidu: "50000000.0000",
      masaManfaatBulan: 96,
      metodePenyusutan: "GARIS_LURUS" as const,
      lokasi: "Pool Armada Gudang Cakung",
      penanggungJawab: "Hendra Wijaya",
      nomorSeri: "B-9123-UXX / VIN-ISZ-88210",
      status: "AKTIF" as const,
      akumulasiPenyusutan: "125000000.0000",
      nilaiBuku: "355000000.0000",
      sisaManfaatBulan: 68,
      keterangan: "Armada angkut distribusi barang dagang Jabodetabek",
    },
    {
      kode: "AST-OF-001",
      nama: "Workstation Ergonomis & Furnitur Kantor SCBD",
      kategoriId: gol1.id,
      tanggalPerolehan: "2025-01-10",
      tanggalMulaiPenyusutan: "2025-02-01",
      nilaiPerolehan: "60000000.0000",
      nilaiResidu: "0.0000",
      masaManfaatBulan: 48,
      metodePenyusutan: "GARIS_LURUS" as const,
      lokasi: "Equity Tower Lt. 28 SCBD",
      penanggungJawab: "Dewi Lestari",
      nomorSeri: "FURN-SCBD-2025",
      status: "AKTIF" as const,
      akumulasiPenyusutan: "26250000.0000",
      nilaiBuku: "33750000.0000",
      sisaManfaatBulan: 27,
      keterangan: "20 set meja, kursi ergonomis, dan partisi akustik kantor",
    },
  ];

  for (const a of DAFTAR_ASET) {
    await db.insert(fixedAssets).values(a).onConflictDoNothing({ target: fixedAssets.kode });
  }
}
