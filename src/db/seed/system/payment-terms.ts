import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { paymentTerms } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export const DAFTAR_TERMIN = [
  { kode: "TUNAI", nama: "Tunai / COD (Cash On Delivery)", jumlahHari: 0, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-7", nama: "Net 7 Hari", jumlahHari: 7, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-14", nama: "Net 14 Hari", jumlahHari: 14, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-30", nama: "Net 30 Hari", jumlahHari: 30, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-45", nama: "Net 45 Hari", jumlahHari: 45, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-60", nama: "Net 60 Hari", jumlahHari: 60, persenDiskon: "0", hariDiskon: 0 },
  { kode: "2/10-NET-30", nama: "Diskon 2% jika bayar <= 10 hari, jatuh tempo 30 hari", jumlahHari: 30, persenDiskon: "2", hariDiskon: 10 },
  { kode: "EOM", nama: "Akhir Bulan Berjalan (End of Month)", jumlahHari: 30, persenDiskon: "0", hariDiskon: 0 },
];

export async function seedPaymentTerms(db: Db) {
  console.log("  [system] Menanamkan termin pembayaran standar (COD, Net 30, Net 60, dll)...");
  await db.insert(paymentTerms).values(DAFTAR_TERMIN).onConflictDoNothing();
}
