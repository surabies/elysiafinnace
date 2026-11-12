import { sql } from "drizzle-orm";
import { documentSequences } from "@/db/schema/keuangan";
import { db } from "./context";

/** Transaksi Drizzle. Seluruh proses posting berjalan di dalam satu transaksi DB. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Prefiks penomoran dokumen. */
export const PREFIKS = {
  JURNAL: "JU",
  BIAYA: "BY",
  MUTASI_BANK: "MB",
  PENYESUAIAN_STOK: "PS",
  PESANAN_PEMBELIAN: "PO",
  FAKTUR_PEMBELIAN: "FB",
  PESANAN_PENJUALAN: "SO",
  FAKTUR_PENJUALAN: "FJ",
  PENERIMAAN: "PM",
  PENGELUARAN: "PK",
} as const;

/**
 * Nomor dokumen berikutnya, mis. "FJ/2026/00042". Atomik (INSERT ... ON CONFLICT DO UPDATE),
 * aman dipanggil bersamaan. Bila transaksi gagal, nomor ikut di-rollback (tidak ada lompatan).
 */
export async function nomorBerikut(tx: Tx, prefiks: string, tanggal: string): Promise<string> {
  const tahun = Number(tanggal.slice(0, 4));
  const [baris] = await tx
    .insert(documentSequences)
    .values({ prefiks, tahun, nilaiTerakhir: 1 })
    .onConflictDoUpdate({
      target: [documentSequences.prefiks, documentSequences.tahun],
      set: { nilaiTerakhir: sql`${documentSequences.nilaiTerakhir} + 1` },
    })
    .returning({ nilai: documentSequences.nilaiTerakhir });
  return `${prefiks}/${tahun}/${String(baris!.nilai).padStart(5, "0")}`;
}

/** Tanggal hari ini (YYYY-MM-DD) zona waktu server. */
export const hariIni = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Menambah `hari` ke tanggal YYYY-MM-DD (UTC, tanpa efek zona waktu). */
export function tambahHari(tanggal: string, hari: number) {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + hari);
  return d.toISOString().slice(0, 10);
}
