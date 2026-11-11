import { eq } from "drizzle-orm";
import { items, partners, type Item } from "@/db/schema/keuangan";
import { keBigInt, keString, kali, persenDari } from "./_desimal";
import { galat } from "./_umum";
import type { Tx } from "./_tx";

export type BarisDagangInput = {
  itemId?: string | null;
  akunId?: string | null;
  deskripsi?: string | null;
  kuantitas: string;
  hargaSatuan: string;
  persenDiskon?: string | null;
  barisPesananId?: string | null;
};

const SERATUS = keBigInt("100");

/** Menghitung subtotal baris (kuantitas x harga - diskon) tanpa floating point. */
export function hitungBarisDagang(baris: BarisDagangInput[]) {
  if (baris.length === 0) throw galat.aturanBisnis("Dokumen wajib memiliki minimal satu baris.");
  return baris.map((b, i) => {
    const no = i + 1;
    const qty = keBigInt(b.kuantitas);
    const harga = keBigInt(b.hargaSatuan);
    const diskon = keBigInt(b.persenDiskon ?? "0");
    if (qty <= BigInt(0)) throw galat.aturanBisnis(`Baris ${no}: kuantitas harus lebih dari 0.`);
    if (harga < BigInt(0)) throw galat.aturanBisnis(`Baris ${no}: harga satuan tidak boleh negatif.`);
    if (diskon < BigInt(0) || diskon > SERATUS) {
      throw galat.aturanBisnis(`Baris ${no}: persen diskon harus di antara 0 dan 100.`);
    }
    const kotor = kali(qty, harga);
    const subtotal = kotor - persenDari(kotor, diskon);
    if (subtotal < BigInt(0)) throw galat.aturanBisnis(`Baris ${no}: subtotal tidak boleh negatif.`);
    return {
      urutan: no,
      itemId: b.itemId ?? null,
      akunId: b.akunId ?? null,
      deskripsi: b.deskripsi?.trim() || null,
      kuantitas: keString(qty),
      hargaSatuan: keString(harga),
      persenDiskon: keString(diskon),
      subtotal: keString(subtotal),
      subtotalInt: subtotal,
      barisPesananId: b.barisPesananId ?? null,
    };
  });
}

export function hitungTotalDagang(subtotalBaris: bigint[], persenPpn: string) {
  const persen = keBigInt(persenPpn);
  if (persen < BigInt(0) || persen > SERATUS) throw galat.aturanBisnis("Persen PPN harus di antara 0 dan 100.");
  const subtotal = subtotalBaris.reduce((a, b) => a + b, BigInt(0));
  const ppn = persenDari(subtotal, persen);
  return { subtotal: keString(subtotal), persenPpn: keString(persen), ppn: keString(ppn), total: keString(subtotal + ppn), totalInt: subtotal + ppn };
}

export async function kunciItem(tx: Tx, id: string): Promise<Item> {
  const [item] = await tx.select().from(items).where(eq(items.id, id));
  if (!item) throw galat.tidakDitemukan("Item");
  if (!item.aktif) throw galat.aturanBisnis(`Item ${item.sku} - ${item.nama} tidak aktif.`);
  return item;
}

export async function kunciKontak(tx: Tx, id: string, peran: "pelanggan" | "pemasok") {
  const [kontak] = await tx.select().from(partners).where(eq(partners.id, id));
  if (!kontak) throw galat.tidakDitemukan("Kontak");
  if (!kontak.aktif) throw galat.aturanBisnis(`Kontak ${kontak.kode} - ${kontak.nama} tidak aktif.`);
  if (peran === "pelanggan" && !kontak.adalahPelanggan) {
    throw galat.aturanBisnis(`Kontak ${kontak.kode} bukan pelanggan.`);
  }
  if (peran === "pemasok" && !kontak.adalahPemasok) {
    throw galat.aturanBisnis(`Kontak ${kontak.kode} bukan pemasok.`);
  }
  return kontak;
}
