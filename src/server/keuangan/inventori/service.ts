import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import {
  chartOfAccounts,
  items,
  productCategories,
  unitsOfMeasurement,
} from "@/db/schema/keuangan";
import { db } from "../_deps";
import { akunByPeran, pastikanAkunDetail } from "../akun/service";
import { escapeLike, galat, nullJikaKosong } from "../_umum";
import { ambilMataUang, ambilMataUangDasar } from "../mata-uang/service";
import type {
  InputBuatItem,
  InputBuatKategori,
  InputBuatSatuan,
  InputUbahItem,
  InputUbahKategori,
  InputUbahSatuan,
} from "./skema";

/* ----------------------------- Kategori ----------------------------- */

export async function daftarKategori(opsi: { aktif?: boolean } = {}) {
  return db
    .select()
    .from(productCategories)
    .where(opsi.aktif === undefined ? undefined : eq(productCategories.aktif, opsi.aktif))
    .orderBy(asc(productCategories.kode));
}

export async function ambilKategori(id: string) {
  const [baris] = await db.select().from(productCategories).where(eq(productCategories.id, id));
  if (!baris) throw galat.tidakDitemukan("Kategori produk");
  return baris;
}

export async function buatKategori(input: InputBuatKategori, oleh: string) {
  if (input.indukId) await ambilKategori(input.indukId);
  const [baru] = await db
    .insert(productCategories)
    .values({
      kode: input.kode.trim(),
      nama: input.nama.trim(),
      indukId: input.indukId ?? null,
      keterangan: nullJikaKosong(input.keterangan),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahKategori(id: string, input: InputUbahKategori, oleh: string) {
  await ambilKategori(id);
  const set: Partial<typeof productCategories.$inferInsert> = {};
  if (input.kode !== undefined) set.kode = input.kode.trim();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.keterangan !== undefined) set.keterangan = nullJikaKosong(input.keterangan);
  if (input.aktif !== undefined) set.aktif = input.aktif;
  if (input.indukId !== undefined) {
    if (input.indukId !== null) {
      // Cegah siklus: telusuri rantai induk dari calon induk baru; tidak boleh bertemu kategori ini.
      let saat: string | null = input.indukId;
      const dilihat = new Set<string>();
      while (saat) {
        if (saat === id) throw galat.aturanBisnis("Kategori tidak boleh dipindah ke bawah dirinya sendiri atau turunannya.");
        if (dilihat.has(saat)) break;
        dilihat.add(saat);
        saat = (await ambilKategori(saat)).indukId;
      }
    }
    set.indukId = input.indukId;
  }
  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  const [baru] = await db
    .update(productCategories)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(productCategories.id, id))
    .returning();
  return baru!;
}

/* ------------------------------ Satuan ------------------------------ */

export async function daftarSatuan(opsi: { aktif?: boolean } = {}) {
  return db
    .select()
    .from(unitsOfMeasurement)
    .where(opsi.aktif === undefined ? undefined : eq(unitsOfMeasurement.aktif, opsi.aktif))
    .orderBy(asc(unitsOfMeasurement.kode));
}

export async function ambilSatuan(id: string) {
  const [baris] = await db.select().from(unitsOfMeasurement).where(eq(unitsOfMeasurement.id, id));
  if (!baris) throw galat.tidakDitemukan("Satuan");
  return baris;
}

export async function buatSatuan(input: InputBuatSatuan, oleh: string) {
  const [baru] = await db
    .insert(unitsOfMeasurement)
    .values({ kode: input.kode.trim().toUpperCase(), nama: input.nama.trim(), dibuatOleh: oleh, diubahOleh: oleh })
    .returning();
  return baru!;
}

export async function ubahSatuan(id: string, input: InputUbahSatuan, oleh: string) {
  await ambilSatuan(id);
  const set: Partial<typeof unitsOfMeasurement.$inferInsert> = {};
  if (input.kode !== undefined) set.kode = input.kode.trim().toUpperCase();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.aktif !== undefined) set.aktif = input.aktif;
  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  const [baru] = await db
    .update(unitsOfMeasurement)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(unitsOfMeasurement.id, id))
    .returning();
  return baru!;
}

/* ------------------------------- Item ------------------------------- */

export async function daftarItem(opsi: {
  tipeBarang?: (typeof items.$inferSelect)["tipeBarang"];
  kategoriId?: string;
  aktif?: boolean;
  q?: string;
  offset: number;
  ukuran: number;
}) {
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.tipeBarang ? eq(items.tipeBarang, opsi.tipeBarang) : undefined,
    opsi.kategoriId ? eq(items.kategoriId, opsi.kategoriId) : undefined,
    opsi.aktif === undefined ? undefined : eq(items.aktif, opsi.aktif),
    q
      ? or(
          ilike(items.sku, `${escapeLike(q)}%`),
          ilike(items.nama, `%${escapeLike(q)}%`),
          ilike(items.barcode, `${escapeLike(q)}%`),
        )
      : undefined,
  );
  const [data, [hitung]] = await Promise.all([
    db.select().from(items).where(kondisi).orderBy(asc(items.nama)).limit(opsi.ukuran).offset(opsi.offset),
    db.select({ total: sql<number>`count(*)::int` }).from(items).where(kondisi),
  ]);
  return { data, total: hitung?.total ?? 0 };
}

export async function ambilItem(id: string) {
  const [baris] = await db.select().from(items).where(eq(items.id, id));
  if (!baris) throw galat.tidakDitemukan("Item");
  return baris;
}

/** Akun persediaan bawaan: dipakai otomatis hanya jika hanya ada satu akun berperan PERSEDIAAN. */
async function akunPersediaanBawaan() {
  const kandidat = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.peranSistem, "PERSEDIAAN"),
        eq(chartOfAccounts.aktif, true),
        eq(chartOfAccounts.bisaDiposting, true),
      ),
    );
  if (kandidat.length === 1) return kandidat[0]!.id;
  throw galat.aturanBisnis(
    kandidat.length === 0
      ? "Belum ada akun berperan PERSEDIAAN di Bagan Akun. Buat akunnya terlebih dahulu."
      : "Terdapat lebih dari satu akun persediaan. Tentukan akunPersediaanId untuk item ini.",
  );
}

export async function buatItem(input: InputBuatItem, oleh: string) {
  const tipeBarang = input.tipeBarang ?? "BARANG_PERSEDIAAN";
  const adalahPersediaan = tipeBarang === "BARANG_PERSEDIAAN";

  await ambilSatuan(input.satuanId);
  if (input.kategoriId) await ambilKategori(input.kategoriId);
  const mataUangId = input.mataUangId ?? (await ambilMataUangDasar()).id;
  if (input.mataUangId) await ambilMataUang(input.mataUangId);

  // Akun persediaan: wajib untuk barang persediaan, terlarang untuk lainnya.
  let akunPersediaanId: string | null = null;
  if (adalahPersediaan) {
    akunPersediaanId = input.akunPersediaanId ?? (await akunPersediaanBawaan());
    await pastikanAkunDetail(akunPersediaanId, { label: "Akun persediaan", tipe: "ASET", peran: "PERSEDIAAN" });
  } else if (input.akunPersediaanId) {
    throw galat.aturanBisnis("Hanya barang persediaan yang memiliki akun persediaan.");
  }

  // Akun HPP/beban: bertipe BEBAN. Barang persediaan otomatis memakai akun berperan HARGA_POKOK_PENJUALAN.
  let akunHppId: string | null = input.akunHppId ?? null;
  if (!akunHppId && adalahPersediaan) akunHppId = (await akunByPeran("HARGA_POKOK_PENJUALAN")).id;
  if (akunHppId) await pastikanAkunDetail(akunHppId, { label: "Akun HPP/beban", tipe: "BEBAN" });

  // Akun pendapatan: bertipe PENDAPATAN, default Pendapatan Penjualan. Ekuitas (Laba Ditahan) otomatis ditolak.
  const akunPendapatanId = input.akunPendapatanId ?? (await akunByPeran("PENDAPATAN_PENJUALAN")).id;
  await pastikanAkunDetail(akunPendapatanId, { label: "Akun pendapatan", tipe: "PENDAPATAN" });

  const [baru] = await db
    .insert(items)
    .values({
      sku: input.sku.trim().toUpperCase(),
      barcode: nullJikaKosong(input.barcode),
      nama: input.nama.trim(),
      deskripsi: nullJikaKosong(input.deskripsi),
      tipeBarang,
      kategoriId: input.kategoriId ?? null,
      satuanId: input.satuanId,
      mataUangId,
      hargaBeliStandar: input.hargaBeliStandar ?? "0",
      hargaJualStandar: input.hargaJualStandar ?? "0",
      stokMinimum: input.stokMinimum ?? "0",
      akunPersediaanId,
      akunHppId,
      akunPendapatanId,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahItem(id: string, input: InputUbahItem, oleh: string) {
  const ada = await ambilItem(id);
  const adalahPersediaan = ada.tipeBarang === "BARANG_PERSEDIAAN";
  const set: Partial<typeof items.$inferInsert> = {};

  if (input.sku !== undefined) set.sku = input.sku.trim().toUpperCase();
  if (input.barcode !== undefined) set.barcode = nullJikaKosong(input.barcode);
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.deskripsi !== undefined) set.deskripsi = nullJikaKosong(input.deskripsi);
  if (input.hargaBeliStandar !== undefined) set.hargaBeliStandar = input.hargaBeliStandar;
  if (input.hargaJualStandar !== undefined) set.hargaJualStandar = input.hargaJualStandar;
  if (input.stokMinimum !== undefined) set.stokMinimum = input.stokMinimum;
  if (input.aktif !== undefined) set.aktif = input.aktif;

  if (input.satuanId !== undefined) {
    await ambilSatuan(input.satuanId);
    set.satuanId = input.satuanId;
  }
  if (input.kategoriId !== undefined) {
    if (input.kategoriId) await ambilKategori(input.kategoriId);
    set.kategoriId = input.kategoriId;
  }
  if (input.mataUangId !== undefined) {
    await ambilMataUang(input.mataUangId);
    set.mataUangId = input.mataUangId;
  }

  if (input.akunPersediaanId !== undefined) {
    if (adalahPersediaan) {
      if (!input.akunPersediaanId) throw galat.aturanBisnis("Barang persediaan wajib memiliki akun persediaan.");
      await pastikanAkunDetail(input.akunPersediaanId, { label: "Akun persediaan", tipe: "ASET", peran: "PERSEDIAAN" });
    } else if (input.akunPersediaanId) {
      throw galat.aturanBisnis("Hanya barang persediaan yang memiliki akun persediaan.");
    }
    set.akunPersediaanId = input.akunPersediaanId;
  }
  if (input.akunHppId !== undefined) {
    if (input.akunHppId) await pastikanAkunDetail(input.akunHppId, { label: "Akun HPP/beban", tipe: "BEBAN" });
    set.akunHppId = input.akunHppId;
  }
  if (input.akunPendapatanId !== undefined) {
    if (!input.akunPendapatanId) throw galat.aturanBisnis("Akun pendapatan tidak boleh dikosongkan.");
    await pastikanAkunDetail(input.akunPendapatanId, { label: "Akun pendapatan", tipe: "PENDAPATAN" });
    set.akunPendapatanId = input.akunPendapatanId;
  }

  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  const [baru] = await db
    .update(items)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(items.id, id))
    .returning();
  return baru!;
}
