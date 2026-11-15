import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { assetCategories } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export async function seedAssetCategories(
  db: Db,
  coaIds: {
    peralatanId?: string;
    akumPenyusutanPeralatanId?: string;
    bebanPenyusutanId?: string;
  }
) {
  if (!coaIds.peralatanId || !coaIds.akumPenyusutanPeralatanId || !coaIds.bebanPenyusutanId) {
    return;
  }

  console.log("  [system] Menanamkan kategori aset tetap fiskal DJP...");

  const DAFTAR_KATEGORI_ASET = [
    {
      kode: "KAT-GOL1",
      nama: "Peralatan Kantor, Komputer, & Gadget (Golongan 1)",
      metodePenyusutan: "GARIS_LURUS" as const,
      golonganFiskal: "GOLONGAN_1" as const,
      masaManfaatBulan: 48,
      tarifTahunanPersen: "25.0000",
      akunAsetId: coaIds.peralatanId,
      akunAkumulasiPenyusutanId: coaIds.akumPenyusutanPeralatanId,
      akunBebanPenyusutanId: coaIds.bebanPenyusutanId,
      keterangan: "Aset tetap bukan bangunan kelompok 1 fiskal (masa manfaat 4 tahun / 25% per tahun)",
    },
    {
      kode: "KAT-GOL2",
      nama: "Kendaraan Bermotor & Mesin Ringan (Golongan 2)",
      metodePenyusutan: "GARIS_LURUS" as const,
      golonganFiskal: "GOLONGAN_2" as const,
      masaManfaatBulan: 96,
      tarifTahunanPersen: "12.5000",
      akunAsetId: coaIds.peralatanId,
      akunAkumulasiPenyusutanId: coaIds.akumPenyusutanPeralatanId,
      akunBebanPenyusutanId: coaIds.bebanPenyusutanId,
      keterangan: "Aset tetap bukan bangunan kelompok 2 fiskal (masa manfaat 8 tahun / 12.5% per tahun)",
    },
  ];

  for (const k of DAFTAR_KATEGORI_ASET) {
    await db.insert(assetCategories).values(k).onConflictDoNothing({ target: assetCategories.kode });
  }
}
