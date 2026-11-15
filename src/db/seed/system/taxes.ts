import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { taxes } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export async function seedTaxes(
  db: Db,
  coaIds: {
    ppnKeluaranId?: string;
    ppnMasukanId?: string;
    pphDibayarDimukaId?: string;
    hutangPphId?: string;
  }
) {
  console.log("  [system] Menanamkan master pajak Indonesia (PPN 11%, 12%, PPh 21, 23, 4(2))...");

  const DAFTAR_PAJAK = [
    {
      kode: "PPN11",
      nama: "PPN 11%",
      tipePajak: "PPN" as const,
      kategoriPajak: "PAJAK_KELUARAN" as const,
      persentaseTarif: "11.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: coaIds.ppnKeluaranId,
      akunPajakPembelianId: coaIds.ppnMasukanId,
      keterangan: "Pajak Pertambahan Nilai tarif umum UU HPP (11%)",
    },
    {
      kode: "PPN12",
      nama: "PPN 12%",
      tipePajak: "PPN" as const,
      kategoriPajak: "PAJAK_KELUARAN" as const,
      persentaseTarif: "12.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: coaIds.ppnKeluaranId,
      akunPajakPembelianId: coaIds.ppnMasukanId,
      keterangan: "Pajak Pertambahan Nilai tarif UU HPP (12%)",
    },
    {
      kode: "PPH21",
      nama: "PPh Pasal 21 (Pemotongan Tenaga Kerja/Gaji)",
      tipePajak: "PPH_21" as const,
      kategoriPajak: "PEMOTONGAN_PEMUNGUTAN" as const,
      persentaseTarif: "5.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: coaIds.pphDibayarDimukaId,
      akunPajakPembelianId: coaIds.hutangPphId,
      keterangan: "Pemotongan PPh 21 atas penghasilan orang pribadi",
    },
    {
      kode: "PPH23-JASA",
      nama: "PPh 23 - Jasa Manajemen/Teknik/Konsultan (2%)",
      tipePajak: "PPH_23" as const,
      kategoriPajak: "PEMOTONGAN_PEMUNGUTAN" as const,
      persentaseTarif: "2.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: coaIds.pphDibayarDimukaId,
      akunPajakPembelianId: coaIds.hutangPphId,
      keterangan: "PPh Pasal 23 atas Jasa Teknik/Manajemen/Konsultan",
    },
    {
      kode: "PPH42-SEWA",
      nama: "PPh 4(2) - Sewa Tanah/Bangunan (10%)",
      tipePajak: "PPH_4_AYAT_2" as const,
      kategoriPajak: "PEMOTONGAN_PEMUNGUTAN" as const,
      persentaseTarif: "10.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: coaIds.pphDibayarDimukaId,
      akunPajakPembelianId: coaIds.hutangPphId,
      keterangan: "PPh Pasal 4 ayat (2) Final atas Sewa Tanah/Bangunan",
    },
  ];

  for (const p of DAFTAR_PAJAK) {
    await db.insert(taxes).values(p).onConflictDoNothing({ target: taxes.kode });
  }
}
