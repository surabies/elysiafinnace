import { and, eq } from "drizzle-orm";
import { itemStocks, stockMovements } from "@/db/schema/keuangan";
import { bagi, keBigInt, keString, kali } from "../shared/decimal";
import { galat } from "@/server/core/errors";
import type { Tx } from "../shared/transaction";

export type HasilMutasiStok = {
  nilai: bigint;
  biayaSatuan: bigint;
  saldoKuantitas: bigint;
  biayaRataRata: bigint;
};

async function kunciSaldo(tx: Tx, itemId: string) {
  await tx.insert(itemStocks).values({ itemId }).onConflictDoNothing();
  const [stok] = await tx.select().from(itemStocks).where(eq(itemStocks.itemId, itemId)).for("update");
  if (!stok) throw galat.aturanBisnis("Saldo stok gagal dikunci.");
  return stok;
}

/**
 * Mutasi stok metode biaya rata-rata (Average Cost). Nilai selalu dalam mata uang dasar.
 * Baris saldo dikunci FOR UPDATE agar dua mutasi bersamaan tidak saling menimpa.
 */
export async function catatMutasiStok(
  tx: Tx,
  input: {
    tanggal: string;
    itemId: string;
    jenis: "MASUK" | "KELUAR";
    kuantitas: string;
    /** Wajib untuk MASUK. Diabaikan untuk KELUAR (memakai biaya rata-rata berjalan). */
    biayaSatuan?: string;
    sumber: string;
    sumberId: string;
    keterangan?: string | null;
    jurnalId?: string | null;
    oleh: string;
  },
): Promise<HasilMutasiStok> {
  const qty = keBigInt(input.kuantitas);
  if (qty <= BigInt(0)) throw galat.aturanBisnis("Kuantitas mutasi stok harus lebih dari 0.");
  const stok = await kunciSaldo(tx, input.itemId);
  const qtyLama = keBigInt(stok.kuantitas);
  const nilaiLama = keBigInt(stok.nilai);

  let nilai: bigint;
  let biaya: bigint;
  let qtyBaru: bigint;
  let nilaiBaru: bigint;

  if (input.jenis === "MASUK") {
    if (input.biayaSatuan === undefined) throw galat.aturanBisnis("Biaya satuan wajib diisi untuk stok masuk.");
    biaya = keBigInt(input.biayaSatuan);
    if (biaya < BigInt(0)) throw galat.aturanBisnis("Biaya satuan tidak boleh negatif.");
    nilai = kali(qty, biaya);
    qtyBaru = qtyLama + qty;
    nilaiBaru = nilaiLama + nilai;
  } else {
    if (qty > qtyLama) {
      throw galat.aturanBisnis("Stok tidak mencukupi untuk pengeluaran barang.", {
        tersedia: keString(qtyLama),
        diminta: keString(qty),
      });
    }
    biaya = qtyLama === BigInt(0) ? BigInt(0) : bagi(nilaiLama, qtyLama);
    nilai = kali(qty, biaya);
    qtyBaru = qtyLama - qty;
    nilaiBaru = nilaiLama - nilai;
    if (qtyBaru === BigInt(0)) {
      nilai = nilaiLama;
      nilaiBaru = BigInt(0);
      biaya = qty === BigInt(0) ? BigInt(0) : bagi(nilai, qty);
    }
  }

  const rata = qtyBaru === BigInt(0) ? BigInt(0) : bagi(nilaiBaru, qtyBaru);
  await tx
    .update(itemStocks)
    .set({
      kuantitas: keString(qtyBaru),
      nilai: keString(nilaiBaru),
      biayaRataRata: keString(rata),
      diubahPada: new Date(),
    })
    .where(eq(itemStocks.itemId, input.itemId));
  await tx.insert(stockMovements).values({
    tanggal: input.tanggal,
    itemId: input.itemId,
    jenis: input.jenis,
    kuantitas: keString(qty),
    biayaSatuan: keString(biaya),
    nilai: keString(nilai),
    saldoKuantitas: keString(qtyBaru),
    saldoNilai: keString(nilaiBaru),
    biayaRataRata: keString(rata),
    sumber: input.sumber,
    sumberId: input.sumberId,
    keterangan: input.keterangan ?? null,
    jurnalId: input.jurnalId ?? null,
    dibuatOleh: input.oleh,
  });
  return { nilai, biayaSatuan: biaya, saldoKuantitas: qtyBaru, biayaRataRata: rata };
}

/** Membalik seluruh mutasi sebuah dokumen dengan nilai asli (bukan rata-rata baru). */
export async function balikMutasiDokumen(tx: Tx, sumber: string, sumberId: string, tanggal: string, oleh: string) {
  const daftar = await tx
    .select()
    .from(stockMovements)
    .where(and(eq(stockMovements.sumber, sumber), eq(stockMovements.sumberId, sumberId)));
  for (const m of daftar) {
    const stok = await kunciSaldo(tx, m.itemId);
    const qty = keBigInt(m.kuantitas);
    const nilai = keBigInt(m.nilai);
    const qtyLama = keBigInt(stok.kuantitas);
    const nilaiLama = keBigInt(stok.nilai);
    const masuk = m.jenis === "MASUK";
    const qtyBaru = masuk ? qtyLama - qty : qtyLama + qty;
    const nilaiBaru = masuk ? nilaiLama - nilai : nilaiLama + nilai;
    if (qtyBaru < BigInt(0) || nilaiBaru < BigInt(0) || (qtyBaru === BigInt(0) && nilaiBaru !== BigInt(0))) {
      throw galat.aturanBisnis(
        "Pembatalan stok ditolak karena barang sudah tercampur dengan mutasi lain. Lakukan penyesuaian stok bila nilai perlu dikoreksi.",
      );
    }
    const rata = qtyBaru === BigInt(0) ? BigInt(0) : bagi(nilaiBaru, qtyBaru);
    await tx
      .update(itemStocks)
      .set({
        kuantitas: keString(qtyBaru),
        nilai: keString(nilaiBaru),
        biayaRataRata: keString(rata),
        diubahPada: new Date(),
      })
      .where(eq(itemStocks.itemId, m.itemId));
    await tx.insert(stockMovements).values({
      tanggal,
      itemId: m.itemId,
      jenis: masuk ? "KELUAR" : "MASUK",
      kuantitas: m.kuantitas,
      biayaSatuan: m.biayaSatuan,
      nilai: m.nilai,
      saldoKuantitas: keString(qtyBaru),
      saldoNilai: keString(nilaiBaru),
      biayaRataRata: keString(rata),
      sumber: "PEMBALIKAN",
      sumberId: m.id,
      keterangan: `Pembalikan mutasi ${m.id}`,
      dibuatOleh: oleh,
    });
  }
}
