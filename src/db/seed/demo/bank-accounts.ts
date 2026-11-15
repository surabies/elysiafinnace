import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { bankAccounts, chartOfAccounts, currencies } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export interface HasilDemoBank {
  kasKecilId: string;
  bankBcaId: string;
  bankMandiriId: string;
}

export async function seedDemoBankAccounts(db: Db): Promise<HasilDemoBank> {
  console.log("  [demo] Menyiapkan rekening Kas & Bank...");

  const [idr] = await db
    .select({ id: currencies.id })
    .from(currencies)
    .where(eq(currencies.kode, "IDR"));

  if (!idr) throw new Error("Mata uang IDR tidak ditemukan.");

  // Ambil akun COA pendukung
  const akunKasKecil = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1111"))
    .then((r) => r[0]);

  const akunBankUtama = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1112"))
    .then((r) => r[0]);

  const akunBankGiro = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1113"))
    .then((r) => r[0]);

  if (!akunKasKecil || !akunBankUtama || !akunBankGiro) {
    throw new Error("[seed demo] Akun kas/bank (1111, 1112, 1113) belum ada di Bagan Akun.");
  }

  await db
    .insert(bankAccounts)
    .values([
      {
        kode: "KAS-KECIL",
        nama: "Kas Kecil Kantor Pusat (SCBD)",
        jenis: "KAS",
        namaBank: null,
        nomorRekening: null,
        atasNama: "Bambang Sudibyo (Custodian)",
        cabang: "SCBD Jakarta",
        akunCoaId: akunKasKecil.id,
        mataUangId: idr.id,
        keterangan: "Dana kas kecil operasional kantor (imprest fund system)",
        aktif: true,
      },
      {
        kode: "BCA-OPS",
        nama: "BCA Giro Operasional IDR",
        jenis: "BANK",
        namaBank: "PT Bank Central Asia Tbk",
        nomorRekening: "8001234567",
        atasNama: "PT Elysia Niaga Nusantara",
        cabang: "KCU SCBD Sudirman",
        akunCoaId: akunBankUtama.id,
        mataUangId: idr.id,
        keterangan: "Rekening utama penerimaan penjualan & pembayaran operasional",
        aktif: true,
      },
      {
        kode: "MDR-PAY",
        nama: "Bank Mandiri Giro Payroll & Kliring",
        jenis: "BANK",
        namaBank: "PT Bank Mandiri (Persero) Tbk",
        nomorRekening: "1200098765432",
        atasNama: "PT Elysia Niaga Nusantara",
        cabang: "KC Jakarta Plaza Mandiri",
        akunCoaId: akunBankGiro.id,
        mataUangId: idr.id,
        keterangan: "Rekening khusus payroll karyawan & kliring giro pemasok",
        aktif: true,
      },
    ])
    .onConflictDoNothing({ target: bankAccounts.kode });

  const [kasKecil] = await db.select({ id: bankAccounts.id }).from(bankAccounts).where(eq(bankAccounts.kode, "KAS-KECIL"));
  const [bca] = await db.select({ id: bankAccounts.id }).from(bankAccounts).where(eq(bankAccounts.kode, "BCA-OPS"));
  const [mandiri] = await db.select({ id: bankAccounts.id }).from(bankAccounts).where(eq(bankAccounts.kode, "MDR-PAY"));

  if (!kasKecil || !bca || !mandiri) {
    throw new Error("[seed demo] Gagal mendapatkan ID rekening kas/bank setelah insert.");
  }

  return {
    kasKecilId: kasKecil.id,
    bankBcaId: bca.id,
    bankMandiriId: mandiri.id,
  };
}
