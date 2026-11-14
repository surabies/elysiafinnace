import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import {
  chartOfAccounts,
  currencies,
  itemBatches,
  itemBundles,
  items,
  itemStocks,
  itemUnits,
  priceListItems,
  priceLists,
  productCategories,
  stockAdjustmentItems,
  stockAdjustments,
  stockMovements,
  type StatusDokumen,
  type StatusTransferGudang,
  unitsOfMeasurement,
  warehouses,
  warehouseTransferItems,
  warehouseTransfers,
} from "@/db/schema/keuangan";
import { db } from "../shared/context";
import { akunByPeran, pastikanAkunDetail } from "../akun/service";
import { balikJurnal, simpanJurnal, type BarisJurnalInput } from "../jurnal/engine";
import { escapeLike, nullJikaKosong } from "../shared/text";
import { parseCsvKeObjek } from "../shared/csv";
import { galat } from "@/server/core/errors";
import { ambilMataUang, ambilMataUangDasar } from "../mata-uang/service";
import { bagi, kali, keBigInt, keString } from "../shared/decimal";
import { bacaHalaman } from "../shared/pagination";
import { nomorBerikut, PREFIKS, type Tx } from "../shared/transaction";
import { balikMutasiDokumen, catatMutasiStok } from "./mutasi";
import type {
  InputAturItemBundel,
  InputBuatBatch,
  InputBuatDaftarHarga,
  InputBuatGudang,
  InputBuatItem,
  InputBuatKategori,
  InputBuatSatuan,
  InputItemBundelKomponen,
  InputItemSatuan,
  InputSimpanBarisDaftarHarga,
  InputSimpanPenyesuaianStok,
  InputSimpanTransferGudang,
  InputUbahDaftarHarga,
  InputUbahGudang,
  InputUbahItem,
  InputUbahItemSatuan,
  InputUbahKategori,
  InputUbahSatuan,
  QueryBatch,
  QueryGudang,
  QueryKartuStok,
  QueryNilaiPersediaan,
  QueryPenyesuaianStok,
  QueryTransferGudang,
} from "./model";

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
    db
      .select({
        item: items,
        satuanKode: unitsOfMeasurement.kode,
        satuanNama: unitsOfMeasurement.nama,
        kategoriNama: productCategories.nama,
        stokKuantitas: itemStocks.kuantitas,
        stokBiayaRataRata: itemStocks.biayaRataRata,
      })
      .from(items)
      .leftJoin(unitsOfMeasurement, eq(items.satuanId, unitsOfMeasurement.id))
      .leftJoin(productCategories, eq(items.kategoriId, productCategories.id))
      .leftJoin(itemStocks, eq(items.id, itemStocks.itemId))
      .where(kondisi)
      .orderBy(asc(items.nama))
      .limit(opsi.ukuran)
      .offset(opsi.offset),
    db.select({ total: sql<number>`count(*)::int` }).from(items).where(kondisi),
  ]);

  const hasil = data.map((d) => ({
    ...d.item,
    satuan: { kode: d.satuanKode, nama: d.satuanNama },
    kategori: d.kategoriNama ? { nama: d.kategoriNama } : null,
    stok: d.item.tipeBarang === "BARANG_PERSEDIAAN" ? {
      kuantitas: d.stokKuantitas ?? "0",
      biayaRataRata: d.stokBiayaRataRata ?? "0",
    } : null,
  }));

  return { data: hasil, total: hitung?.total ?? 0 };
}

export async function ambilItem(id: string) {
  const [baris] = await db.select().from(items).where(eq(items.id, id));
  if (!baris) throw galat.tidakDitemukan("Item");

  const [satuanDasar, daftarSatuan, daftarBundel, [stok]] = await Promise.all([
    ambilSatuan(baris.satuanId),
    db
      .select({
        id: itemUnits.id,
        satuanId: itemUnits.satuanId,
        satuanKode: unitsOfMeasurement.kode,
        satuanNama: unitsOfMeasurement.nama,
        konversi: itemUnits.konversi,
        barcode: itemUnits.barcode,
        hargaJual: itemUnits.hargaJual,
        hargaBeli: itemUnits.hargaBeli,
        urutan: itemUnits.urutan,
        aktif: itemUnits.aktif,
      })
      .from(itemUnits)
      .innerJoin(unitsOfMeasurement, eq(itemUnits.satuanId, unitsOfMeasurement.id))
      .where(eq(itemUnits.itemId, id))
      .orderBy(asc(itemUnits.urutan), asc(unitsOfMeasurement.kode)),
    baris.tipeBarang === "BUNDEL"
      ? db
          .select({
            id: itemBundles.id,
            komponenItemId: itemBundles.komponenItemId,
            komponenSku: items.sku,
            komponenNama: items.nama,
            satuanId: itemBundles.satuanId,
            satuanKode: unitsOfMeasurement.kode,
            kuantitas: itemBundles.kuantitas,
          })
          .from(itemBundles)
          .innerJoin(items, eq(itemBundles.komponenItemId, items.id))
          .innerJoin(unitsOfMeasurement, eq(itemBundles.satuanId, unitsOfMeasurement.id))
          .where(eq(itemBundles.bundleItemId, id))
      : Promise.resolve([]),
    db.select().from(itemStocks).where(eq(itemStocks.itemId, id)),
  ]);

  return {
    ...baris,
    satuanDasar,
    daftarSatuan,
    daftarBundel,
    stok: baris.tipeBarang === "BARANG_PERSEDIAAN" ? (stok ?? { kuantitas: "0", nilai: "0", biayaRataRata: "0" }) : null,
  };
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
  const adalahBundel = tipeBarang === "BUNDEL";

  await ambilSatuan(input.satuanId);
  if (input.kategoriId) await ambilKategori(input.kategoriId);
  const mataUangId = input.mataUangId ?? (await ambilMataUangDasar()).id;
  if (input.mataUangId) await ambilMataUang(input.mataUangId);

  // Akun persediaan: wajib untuk barang persediaan, terlarang untuk lainnya
  let akunPersediaanId: string | null = null;
  if (adalahPersediaan) {
    akunPersediaanId = input.akunPersediaanId ?? (await akunPersediaanBawaan());
    await pastikanAkunDetail(akunPersediaanId, { label: "Akun persediaan", tipe: "ASET", peran: "PERSEDIAAN" });
  } else if (input.akunPersediaanId) {
    throw galat.aturanBisnis("Hanya barang persediaan yang memiliki akun persediaan.");
  }

  // Akun HPP/beban: bertipe BEBAN
  let akunHppId: string | null = input.akunHppId ?? null;
  if (!akunHppId && adalahPersediaan) akunHppId = (await akunByPeran("HARGA_POKOK_PENJUALAN")).id;
  if (akunHppId) await pastikanAkunDetail(akunHppId, { label: "Akun HPP/beban", tipe: "BEBAN" });

  // Akun pendapatan: bertipe PENDAPATAN
  const akunPendapatanId = input.akunPendapatanId ?? (await akunByPeran("PENDAPATAN_PENJUALAN")).id;
  await pastikanAkunDetail(akunPendapatanId, { label: "Akun pendapatan", tipe: "PENDAPATAN" });

  return db.transaction(async (tx) => {
    const [baru] = await tx
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

    // Simpan multi-satuan awal bila diberikan
    if (input.daftarSatuan && input.daftarSatuan.length > 0) {
      for (const s of input.daftarSatuan) {
        if (s.satuanId === input.satuanId) {
          throw galat.aturanBisnis("Satuan konversi tidak boleh sama dengan satuan dasar item.");
        }
        await ambilSatuan(s.satuanId);
        await tx.insert(itemUnits).values({
          itemId: baru!.id,
          satuanId: s.satuanId,
          konversi: s.konversi,
          barcode: nullJikaKosong(s.barcode),
          hargaJual: s.hargaJual ?? null,
          hargaBeli: s.hargaBeli ?? null,
          urutan: s.urutan ?? 1,
          dibuatOleh: oleh,
          diubahOleh: oleh,
        });
      }
    }

    // Simpan komponen bundel awal bila tipe BUNDEL
    if (adalahBundel && input.daftarBundel && input.daftarBundel.length > 0) {
      for (const b of input.daftarBundel) {
        if (b.komponenItemId === baru!.id) {
          throw galat.aturanBisnis("Item bundel tidak boleh berisi komponen dirinya sendiri.");
        }
        await ambilItem(b.komponenItemId);
        await ambilSatuan(b.satuanId);
        await tx.insert(itemBundles).values({
          bundleItemId: baru!.id,
          komponenItemId: b.komponenItemId,
          satuanId: b.satuanId,
          kuantitas: b.kuantitas,
          dibuatOleh: oleh,
          diubahOleh: oleh,
        });
      }
    }

    return baru!;
  });
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

  if (Object.keys(set).length === 0 && !input.daftarSatuan && !input.daftarBundel) {
    throw galat.aturanBisnis("Tidak ada data yang diubah.");
  }

  return db.transaction(async (tx) => {
    let baru = ada;
    if (Object.keys(set).length > 0) {
      const [u] = await tx
        .update(items)
        .set({ ...set, diubahOleh: oleh })
        .where(eq(items.id, id))
        .returning();
      baru = u as typeof ada;
    }

    if (input.daftarSatuan) {
      await tx.delete(itemUnits).where(eq(itemUnits.itemId, id));
      for (const s of input.daftarSatuan) {
        if (s.satuanId === (set.satuanId ?? ada.satuanId)) {
          throw galat.aturanBisnis("Satuan konversi tidak boleh sama dengan satuan dasar item.");
        }
        await ambilSatuan(s.satuanId);
        await tx.insert(itemUnits).values({
          itemId: id,
          satuanId: s.satuanId,
          konversi: s.konversi,
          barcode: nullJikaKosong(s.barcode),
          hargaJual: s.hargaJual ?? null,
          hargaBeli: s.hargaBeli ?? null,
          urutan: s.urutan ?? 1,
          dibuatOleh: oleh,
          diubahOleh: oleh,
        });
      }
    }

    if (ada.tipeBarang === "BUNDEL" && input.daftarBundel) {
      await tx.delete(itemBundles).where(eq(itemBundles.bundleItemId, id));
      for (const b of input.daftarBundel) {
        if (b.komponenItemId === id) {
          throw galat.aturanBisnis("Item bundel tidak boleh berisi komponen dirinya sendiri.");
        }
        await ambilItem(b.komponenItemId);
        await ambilSatuan(b.satuanId);
        await tx.insert(itemBundles).values({
          bundleItemId: id,
          komponenItemId: b.komponenItemId,
          satuanId: b.satuanId,
          kuantitas: b.kuantitas,
          dibuatOleh: oleh,
          diubahOleh: oleh,
        });
      }
    }

    return baru;
  });
}

/* ----------------------- Sub-Resource Multi-Satuan ----------------------- */

export async function daftarItemSatuan(itemId: string) {
  await ambilItem(itemId);
  return db
    .select({
      id: itemUnits.id,
      itemId: itemUnits.itemId,
      satuanId: itemUnits.satuanId,
      satuanKode: unitsOfMeasurement.kode,
      satuanNama: unitsOfMeasurement.nama,
      konversi: itemUnits.konversi,
      barcode: itemUnits.barcode,
      hargaJual: itemUnits.hargaJual,
      hargaBeli: itemUnits.hargaBeli,
      urutan: itemUnits.urutan,
      aktif: itemUnits.aktif,
    })
    .from(itemUnits)
    .innerJoin(unitsOfMeasurement, eq(itemUnits.satuanId, unitsOfMeasurement.id))
    .where(eq(itemUnits.itemId, itemId))
    .orderBy(asc(itemUnits.urutan), asc(unitsOfMeasurement.kode));
}

export async function tambahItemSatuan(itemId: string, input: InputItemSatuan, oleh: string) {
  const item = await ambilItem(itemId);
  if (input.satuanId === item.satuanId) {
    throw galat.aturanBisnis("Satuan konversi tidak boleh sama dengan satuan dasar item.");
  }
  await ambilSatuan(input.satuanId);

  const [baru] = await db
    .insert(itemUnits)
    .values({
      itemId,
      satuanId: input.satuanId,
      konversi: input.konversi,
      barcode: nullJikaKosong(input.barcode),
      hargaJual: input.hargaJual ?? null,
      hargaBeli: input.hargaBeli ?? null,
      urutan: input.urutan ?? 1,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahItemSatuan(id: string, input: InputUbahItemSatuan, oleh: string) {
  const [ada] = await db.select().from(itemUnits).where(eq(itemUnits.id, id));
  if (!ada) throw galat.tidakDitemukan("Satuan item");

  const set: Partial<typeof itemUnits.$inferInsert> = {};
  if (input.konversi !== undefined) set.konversi = input.konversi;
  if (input.barcode !== undefined) set.barcode = nullJikaKosong(input.barcode);
  if (input.hargaJual !== undefined) set.hargaJual = input.hargaJual;
  if (input.hargaBeli !== undefined) set.hargaBeli = input.hargaBeli;
  if (input.urutan !== undefined) set.urutan = input.urutan;

  if (input.satuanId !== undefined) {
    const item = await ambilItem(ada.itemId);
    if (input.satuanId === item.satuanId) {
      throw galat.aturanBisnis("Satuan konversi tidak boleh sama dengan satuan dasar item.");
    }
    await ambilSatuan(input.satuanId);
    set.satuanId = input.satuanId;
  }

  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  const [baru] = await db
    .update(itemUnits)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(itemUnits.id, id))
    .returning();
  return baru!;
}

export async function hapusItemSatuan(id: string) {
  const [dihapus] = await db.delete(itemUnits).where(eq(itemUnits.id, id)).returning();
  if (!dihapus) throw galat.tidakDitemukan("Satuan item");
  return { id };
}

/* ------------------------ Sub-Resource Item Bundel ------------------------ */

export async function daftarItemBundel(bundleItemId: string) {
  const item = await ambilItem(bundleItemId);
  if (item.tipeBarang !== "BUNDEL") throw galat.aturanBisnis("Item ini bukan bertipe BUNDEL.");

  return db
    .select({
      id: itemBundles.id,
      bundleItemId: itemBundles.bundleItemId,
      komponenItemId: itemBundles.komponenItemId,
      komponenSku: items.sku,
      komponenNama: items.nama,
      satuanId: itemBundles.satuanId,
      satuanKode: unitsOfMeasurement.kode,
      satuanNama: unitsOfMeasurement.nama,
      kuantitas: itemBundles.kuantitas,
    })
    .from(itemBundles)
    .innerJoin(items, eq(itemBundles.komponenItemId, items.id))
    .innerJoin(unitsOfMeasurement, eq(itemBundles.satuanId, unitsOfMeasurement.id))
    .where(eq(itemBundles.bundleItemId, bundleItemId))
    .orderBy(asc(items.nama));
}

export async function aturItemBundel(bundleItemId: string, input: InputAturItemBundel, oleh: string) {
  const item = await ambilItem(bundleItemId);
  if (item.tipeBarang !== "BUNDEL") throw galat.aturanBisnis("Item ini bukan bertipe BUNDEL.");

  return db.transaction(async (tx) => {
    await tx.delete(itemBundles).where(eq(itemBundles.bundleItemId, bundleItemId));
    for (const b of input.komponen) {
      if (b.komponenItemId === bundleItemId) {
        throw galat.aturanBisnis("Item bundel tidak boleh berisi komponen dirinya sendiri.");
      }
      await ambilItem(b.komponenItemId);
      await ambilSatuan(b.satuanId);
      await tx.insert(itemBundles).values({
        bundleItemId,
        komponenItemId: b.komponenItemId,
        satuanId: b.satuanId,
        kuantitas: b.kuantitas,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      });
    }
    return daftarItemBundel(bundleItemId);
  });
}

export async function tambahItemBundel(bundleItemId: string, input: InputItemBundelKomponen, oleh: string) {
  const item = await ambilItem(bundleItemId);
  if (item.tipeBarang !== "BUNDEL") throw galat.aturanBisnis("Item ini bukan bertipe BUNDEL.");
  if (input.komponenItemId === bundleItemId) {
    throw galat.aturanBisnis("Item bundel tidak boleh berisi komponen dirinya sendiri.");
  }
  await ambilItem(input.komponenItemId);
  await ambilSatuan(input.satuanId);

  const [baru] = await db
    .insert(itemBundles)
    .values({
      bundleItemId,
      komponenItemId: input.komponenItemId,
      satuanId: input.satuanId,
      kuantitas: input.kuantitas,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function hapusItemBundel(id: string) {
  const [dihapus] = await db.delete(itemBundles).where(eq(itemBundles.id, id)).returning();
  if (!dihapus) throw galat.tidakDitemukan("Komponen bundel");
  return { id };
}

/* ---------------------------- Price List ---------------------------- */

export async function daftarDaftarHarga(opsi: { aktif?: boolean; q?: string; offset: number; ukuran: number }) {
  const q = opsi.q?.trim();
  const kondisi = and(
    opsi.aktif === undefined ? undefined : eq(priceLists.aktif, opsi.aktif),
    q ? or(ilike(priceLists.kode, `${escapeLike(q)}%`), ilike(priceLists.nama, `%${escapeLike(q)}%`)) : undefined,
  );

  const [data, [hitung]] = await Promise.all([
    db
      .select({
        daftarHarga: priceLists,
        mataUangKode: currencies.kode,
        mataUangNama: currencies.nama,
      })
      .from(priceLists)
      .innerJoin(currencies, eq(priceLists.mataUangId, currencies.id))
      .where(kondisi)
      .orderBy(asc(priceLists.nama))
      .limit(opsi.ukuran)
      .offset(opsi.offset),
    db.select({ total: sql<number>`count(*)::int` }).from(priceLists).where(kondisi),
  ]);

  const hasil = data.map((d) => ({
    ...d.daftarHarga,
    mataUang: { kode: d.mataUangKode, nama: d.mataUangNama },
  }));

  return { data: hasil, total: hitung?.total ?? 0 };
}

export async function ambilDaftarHarga(id: string) {
  const [baris] = await db.select().from(priceLists).where(eq(priceLists.id, id));
  if (!baris) throw galat.tidakDitemukan("Daftar harga");

  const [mataUang, itemsList] = await Promise.all([
    ambilMataUang(baris.mataUangId),
    db
      .select({
        id: priceListItems.id,
        itemId: priceListItems.itemId,
        itemSku: items.sku,
        itemNama: items.nama,
        satuanId: priceListItems.satuanId,
        satuanKode: unitsOfMeasurement.kode,
        minKuantitas: priceListItems.minKuantitas,
        harga: priceListItems.harga,
      })
      .from(priceListItems)
      .innerJoin(items, eq(priceListItems.itemId, items.id))
      .leftJoin(unitsOfMeasurement, eq(priceListItems.satuanId, unitsOfMeasurement.id))
      .where(eq(priceListItems.priceListId, id))
      .orderBy(asc(items.nama), asc(priceListItems.minKuantitas)),
  ]);

  return {
    ...baris,
    mataUang,
    daftarItem: itemsList,
  };
}

export async function buatDaftarHarga(input: InputBuatDaftarHarga, oleh: string) {
  const mataUangId = input.mataUangId ?? (await ambilMataUangDasar()).id;
  await ambilMataUang(mataUangId);

  const [baru] = await db
    .insert(priceLists)
    .values({
      kode: input.kode.trim().toUpperCase(),
      nama: input.nama.trim(),
      mataUangId,
      keterangan: nullJikaKosong(input.keterangan),
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function ubahDaftarHarga(id: string, input: InputUbahDaftarHarga, oleh: string) {
  await ambilDaftarHarga(id);
  const set: Partial<typeof priceLists.$inferInsert> = {};

  if (input.kode !== undefined) set.kode = input.kode.trim().toUpperCase();
  if (input.nama !== undefined) set.nama = input.nama.trim();
  if (input.keterangan !== undefined) set.keterangan = nullJikaKosong(input.keterangan);
  if (input.aktif !== undefined) set.aktif = input.aktif;
  if (input.mataUangId !== undefined) {
    await ambilMataUang(input.mataUangId);
    set.mataUangId = input.mataUangId;
  }

  if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

  const [baru] = await db
    .update(priceLists)
    .set({ ...set, diubahOleh: oleh })
    .where(eq(priceLists.id, id))
    .returning();
  return baru!;
}

export async function hapusDaftarHarga(id: string) {
  const [dihapus] = await db.delete(priceLists).where(eq(priceLists.id, id)).returning();
  if (!dihapus) throw galat.tidakDitemukan("Daftar harga");
  return { id };
}

export async function simpanBarisDaftarHarga(priceListId: string, input: InputSimpanBarisDaftarHarga, oleh: string) {
  await ambilDaftarHarga(priceListId);
  await ambilItem(input.itemId);
  if (input.satuanId) await ambilSatuan(input.satuanId);

  const minKuantitas = input.minKuantitas ?? "1";

  // Upsert: bila kombinasi (priceListId, itemId, satuanId, minKuantitas) sudah ada, update harga
  const kondisiSatuan = input.satuanId ? eq(priceListItems.satuanId, input.satuanId) : sql`${priceListItems.satuanId} IS NULL`;
  const [ada] = await db
    .select()
    .from(priceListItems)
    .where(
      and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.itemId, input.itemId),
        kondisiSatuan,
        eq(priceListItems.minKuantitas, minKuantitas),
      ),
    );

  if (ada) {
    const [diubah] = await db
      .update(priceListItems)
      .set({ harga: input.harga, diubahOleh: oleh })
      .where(eq(priceListItems.id, ada.id))
      .returning();
    return diubah!;
  }

  const [baru] = await db
    .insert(priceListItems)
    .values({
      priceListId,
      itemId: input.itemId,
      satuanId: input.satuanId ?? null,
      minKuantitas,
      harga: input.harga,
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();
  return baru!;
}

export async function hapusBarisDaftarHarga(id: string) {
  const [dihapus] = await db.delete(priceListItems).where(eq(priceListItems.id, id)).returning();
  if (!dihapus) throw galat.tidakDitemukan("Baris daftar harga");
  return { id };
}

/* ---------------------- Helper Konversi & Cari Harga ---------------------- */

/**
 * Mengonversi kuantitas dari satu satuan ke satuan lain untuk suatu item.
 * Satuan dasar selalu memiliki rasio konversi 1.
 */
export async function konversiKuantitas(
  itemId: string,
  dariSatuanId: string,
  keSatuanId: string,
  kuantitas: string,
): Promise<string> {
  if (dariSatuanId === keSatuanId) return kuantitas;

  const item = await ambilItem(itemId);
  const qty = keBigInt(kuantitas);

  // Ambil faktor konversi satuan 'dari' (relatif terhadap satuan dasar)
  let faktorDari = BigInt(10000); // 1.0000 berskala 4
  if (dariSatuanId !== item.satuanId) {
    const [uDari] = await db
      .select({ konversi: itemUnits.konversi })
      .from(itemUnits)
      .where(and(eq(itemUnits.itemId, itemId), eq(itemUnits.satuanId, dariSatuanId)));
    if (!uDari) throw galat.aturanBisnis("Satuan asal tidak terdaftar untuk item ini.");
    faktorDari = keBigInt(uDari.konversi);
  }

  // Ambil faktor konversi satuan 'ke' (relatif terhadap satuan dasar)
  let faktorKe = BigInt(10000);
  if (keSatuanId !== item.satuanId) {
    const [uKe] = await db
      .select({ konversi: itemUnits.konversi })
      .from(itemUnits)
      .where(and(eq(itemUnits.itemId, itemId), eq(itemUnits.satuanId, keSatuanId)));
    if (!uKe) throw galat.aturanBisnis("Satuan tujuan tidak terdaftar untuk item ini.");
    faktorKe = keBigInt(uKe.konversi);
  }

  // qtyDalamSatuanDasar = (qty * faktorDari)
  // qtyDalamSatuanTujuan = qtyDalamSatuanDasar / faktorKe
  const qtyDasar = kali(qty, faktorDari);
  const hasil = bagi(qtyDasar, faktorKe);
  return keString(hasil);
}

/**
 * Mencari harga jual item berdasarkan konteks transaksi:
 * 1. Daftar harga khusus (tiering volume discount).
 * 2. Harga spesifik pada satuan kemasan (itemUnits.hargaJual).
 * 3. Harga standar item (dikalikan faktor konversi bila bukan satuan dasar).
 */
export async function cariHargaItem(
  itemId: string,
  opsi: {
    satuanId?: string | null;
    daftarHargaId?: string | null;
    kuantitas?: string | null;
  } = {},
) {
  const item = await ambilItem(itemId);
  const satuanId = opsi.satuanId ? opsi.satuanId : item.satuanId;
  const qty = opsi.kuantitas ? keBigInt(opsi.kuantitas) : keBigInt("1");

  // 1. Cek pada daftar harga (Price List) bila diberikan
  if (opsi.daftarHargaId) {
    const barisHarga = await db
      .select()
      .from(priceListItems)
      .where(
        and(
          eq(priceListItems.priceListId, opsi.daftarHargaId),
          eq(priceListItems.itemId, itemId),
          or(eq(priceListItems.satuanId, satuanId), sql`${priceListItems.satuanId} IS NULL`),
          lte(priceListItems.minKuantitas, keString(qty)),
        ),
      )
      .orderBy(desc(priceListItems.minKuantitas));

    if (barisHarga.length > 0) {
      // Prioritaskan yang cocok spesifik satuannya
      const spesifik = barisHarga.find((b) => b.satuanId === satuanId);
      const terpilih = spesifik ?? barisHarga[0]!;
      return {
        harga: terpilih.harga,
        sumber: "DAFTAR_HARGA" as const,
        minKuantitas: terpilih.minKuantitas,
        satuanId,
      };
    }
  }

  // 2. Cek harga khusus pada multi-satuan
  if (satuanId !== item.satuanId) {
    const [u] = await db
      .select()
      .from(itemUnits)
      .where(and(eq(itemUnits.itemId, itemId), eq(itemUnits.satuanId, satuanId)));
    if (u?.hargaJual) {
      return {
        harga: u.hargaJual,
        sumber: "SATUAN" as const,
        satuanId,
      };
    }
    // Bila tidak ada hargaJual khusus di satuan kemasan, hitung dari harga standar item * konversi
    if (u) {
      const konv = keBigInt(u.konversi);
      const hrgStandar = keBigInt(item.hargaJualStandar);
      return {
        harga: keString(kali(hrgStandar, konv)),
        sumber: "STANDAR" as const,
        satuanId,
      };
    }
  }

  // 3. Fallback: harga jual standar item
  return {
    harga: item.hargaJualStandar,
    sumber: "STANDAR" as const,
    satuanId: item.satuanId,
  };
}

export async function importItem(csv: string, oleh: string) {
  const baris = parseCsvKeObjek(csv);
  if (baris.length === 0) throw galat.aturanBisnis("CSV kosong atau format tidak sesuai.");

  const hasil = [];
  const semuaSatuan = await db
    .select({ id: unitsOfMeasurement.id, kode: unitsOfMeasurement.kode })
    .from(unitsOfMeasurement);
  const petaSatuan = new Map(semuaSatuan.map((s) => [s.kode.toUpperCase(), s.id]));

  const semuaKategori = await db
    .select({ id: productCategories.id, kode: productCategories.kode })
    .from(productCategories);
  const petaKategori = new Map(semuaKategori.map((k) => [k.kode.toUpperCase(), k.id]));

  for (const row of baris) {
    const sku = (row.sku || row.kode || "").trim();
    const nama = (row.nama || row.nama_item || "").trim();
    const kodeSatuan = (row.satuan || row.satuan_kode || "").trim().toUpperCase();
    if (!sku || !nama || !kodeSatuan) continue;

    const satuanId = petaSatuan.get(kodeSatuan);
    if (!satuanId) throw galat.aturanBisnis(`Satuan "${kodeSatuan}" tidak ditemukan. Buat satuan terlebih dahulu.`);

    const kodeKategori = (row.kategori || row.kategori_kode || "").trim().toUpperCase();
    const kategoriId = kodeKategori ? petaKategori.get(kodeKategori) ?? null : null;

    const tipeBarang = (row.tipe_barang || row.tipe || "BARANG_PERSEDIAAN").trim().toUpperCase() as InputBuatItem["tipeBarang"];

    const baru = await buatItem(
      {
        sku,
        nama,
        barcode: row.barcode?.trim() || undefined,
        deskripsi: row.deskripsi?.trim() || undefined,
        satuanId,
        kategoriId: kategoriId ?? undefined,
        tipeBarang,
        hargaBeliStandar: row.harga_beli?.trim() || undefined,
        hargaJualStandar: row.harga_jual?.trim() || undefined,
        stokMinimum: row.stok_minimum?.trim() || undefined,
      },
      oleh,
    );

    hasil.push(baru);
  }

  return { totalDiimpor: hasil.length, data: hasil };
}

/* ================================================================== */
/* MULTI-GUDANG (WAREHOUSES)                                          */
/* ================================================================== */

export async function daftarGudang(opsi: QueryGudang = {}) {
  const q = opsi.q?.trim();
  return db
    .select()
    .from(warehouses)
    .where(
      and(
        opsi.aktif === undefined ? undefined : eq(warehouses.aktif, String(opsi.aktif) === "true"),
        q
          ? or(
              ilike(warehouses.kode, `${escapeLike(q)}%`),
              ilike(warehouses.nama, `%${escapeLike(q)}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(warehouses.adalahGudangUtama), asc(warehouses.kode));
}

export async function ambilGudang(id: string, koneksi: Tx | typeof db = db) {
  const [baris] = await koneksi.select().from(warehouses).where(eq(warehouses.id, id));
  if (!baris) throw galat.tidakDitemukan("Gudang");
  return baris;
}

export async function buatGudang(input: InputBuatGudang, oleh: string) {
  const kode = input.kode.trim().toUpperCase();
  const [ada] = await db.select().from(warehouses).where(eq(warehouses.kode, kode));
  if (ada) throw galat.sudahAda(`Gudang dengan kode ${kode} sudah terdaftar.`);

  return db.transaction(async (tx) => {
    if (input.adalahGudangUtama) {
      await tx.update(warehouses).set({ adalahGudangUtama: false });
    }

    const [baru] = await tx
      .insert(warehouses)
      .values({
        kode,
        nama: input.nama.trim(),
        alamat: nullJikaKosong(input.alamat),
        penanggungJawab: nullJikaKosong(input.penanggungJawab),
        adalahGudangUtama: input.adalahGudangUtama ?? false,
        keterangan: nullJikaKosong(input.keterangan),
        aktif: true,
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    return baru!;
  });
}

export async function ubahGudang(id: string, input: InputUbahGudang, oleh: string) {
  const ada = await ambilGudang(id);

  return db.transaction(async (tx) => {
    if (input.adalahGudangUtama) {
      await tx.update(warehouses).set({ adalahGudangUtama: false });
    }

    const set: Partial<typeof warehouses.$inferInsert> = {};
    if (input.kode !== undefined) {
      const kode = input.kode.trim().toUpperCase();
      if (kode !== ada.kode) {
        const [duplikat] = await tx.select().from(warehouses).where(eq(warehouses.kode, kode));
        if (duplikat) throw galat.sudahAda(`Gudang dengan kode ${kode} sudah terdaftar.`);
        set.kode = kode;
      }
    }
    if (input.nama !== undefined) set.nama = input.nama.trim();
    if (input.alamat !== undefined) set.alamat = nullJikaKosong(input.alamat);
    if (input.penanggungJawab !== undefined) set.penanggungJawab = nullJikaKosong(input.penanggungJawab);
    if (input.adalahGudangUtama !== undefined) set.adalahGudangUtama = input.adalahGudangUtama;
    if (input.keterangan !== undefined) set.keterangan = nullJikaKosong(input.keterangan);
    if (input.aktif !== undefined) set.aktif = input.aktif;

    if (Object.keys(set).length === 0) throw galat.aturanBisnis("Tidak ada data yang diubah.");

    const [baru] = await tx
      .update(warehouses)
      .set({ ...set, diubahOleh: oleh })
      .where(eq(warehouses.id, id))
      .returning();

    return baru!;
  });
}

export async function hapusGudang(id: string) {
  const ada = await ambilGudang(id);
  if (ada.adalahGudangUtama) throw galat.aturanBisnis("Gudang utama tidak boleh dihapus.");

  const [adaStok] = await db
    .select({ kuantitas: itemStocks.kuantitas })
    .from(itemStocks)
    .where(and(eq(itemStocks.gudangId, id), sql`${itemStocks.kuantitas} > 0`))
    .limit(1);
  if (adaStok) throw galat.aturanBisnis("Gudang masih memiliki stok aktif dan tidak dapat dihapus.");

  await db.update(warehouses).set({ aktif: false }).where(eq(warehouses.id, id));
  return { id, aktif: false };
}

/* ================================================================== */
/* TRANSFER STOK ANTAR GUDANG                                         */
/* ================================================================== */

export async function ambilTransferGudang(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      transfer: warehouseTransfers,
      gudangAsalKode: sql<string>`w_asal.kode`,
      gudangAsalNama: sql<string>`w_asal.nama`,
      gudangTujuanKode: sql<string>`w_tujuan.kode`,
      gudangTujuanNama: sql<string>`w_tujuan.nama`,
    })
    .from(warehouseTransfers)
    .innerJoin(sql`warehouses as w_asal`, sql`w_asal.id = ${warehouseTransfers.gudangAsalId}`)
    .innerJoin(sql`warehouses as w_tujuan`, sql`w_tujuan.id = ${warehouseTransfers.gudangTujuanId}`)
    .where(eq(warehouseTransfers.id, id));

  if (!header) throw galat.tidakDitemukan("Transfer gudang");

  const baris = await koneksi
    .select({
      itemTransfer: warehouseTransferItems,
      itemSku: items.sku,
      itemNama: items.nama,
      satuanKode: unitsOfMeasurement.kode,
    })
    .from(warehouseTransferItems)
    .innerJoin(items, eq(items.id, warehouseTransferItems.itemId))
    .innerJoin(unitsOfMeasurement, eq(unitsOfMeasurement.id, items.satuanId))
    .where(eq(warehouseTransferItems.transferId, id))
    .orderBy(asc(warehouseTransferItems.urutan));

  return {
    ...header.transfer,
    gudangAsal: { id: header.transfer.gudangAsalId, kode: header.gudangAsalKode, nama: header.gudangAsalNama },
    gudangTujuan: { id: header.transfer.gudangTujuanId, kode: header.gudangTujuanKode, nama: header.gudangTujuanNama },
    baris: baris.map((b) => ({
      ...b.itemTransfer,
      sku: b.itemSku,
      nama: b.itemNama,
      satuan: b.satuanKode,
    })),
  };
}

export async function daftarTransferGudang(opsi: QueryTransferGudang) {
  const page = bacaHalaman(opsi);
  const where = and(
    opsi.status ? eq(warehouseTransfers.status, opsi.status as StatusTransferGudang) : undefined,
    opsi.gudangAsalId ? eq(warehouseTransfers.gudangAsalId, opsi.gudangAsalId) : undefined,
    opsi.gudangTujuanId ? eq(warehouseTransfers.gudangTujuanId, opsi.gudangTujuanId) : undefined,
    opsi.dari ? gte(warehouseTransfers.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(warehouseTransfers.tanggal, opsi.sampai) : undefined,
  );

  const [total] = await db.select({ hitung: sql<number>`count(*)::int` }).from(warehouseTransfers).where(where);
  const data = await db
    .select({
      transfer: warehouseTransfers,
      gudangAsalKode: sql<string>`w_asal.kode`,
      gudangAsalNama: sql<string>`w_asal.nama`,
      gudangTujuanKode: sql<string>`w_tujuan.kode`,
      gudangTujuanNama: sql<string>`w_tujuan.nama`,
    })
    .from(warehouseTransfers)
    .innerJoin(sql`warehouses as w_asal`, sql`w_asal.id = ${warehouseTransfers.gudangAsalId}`)
    .innerJoin(sql`warehouses as w_tujuan`, sql`w_tujuan.id = ${warehouseTransfers.gudangTujuanId}`)
    .where(where)
    .orderBy(desc(warehouseTransfers.tanggal), desc(warehouseTransfers.nomor))
    .limit(page.ukuran)
    .offset(page.offset);

  return {
    items: data.map((d) => ({
      ...d.transfer,
      gudangAsal: { id: d.transfer.gudangAsalId, kode: d.gudangAsalKode, nama: d.gudangAsalNama },
      gudangTujuan: { id: d.transfer.gudangTujuanId, kode: d.gudangTujuanKode, nama: d.gudangTujuanNama },
    })),
    total: total?.hitung ?? 0,
    halaman: page.halaman,
    ukuran: page.ukuran,
  };
}

export async function buatTransferGudang(input: InputSimpanTransferGudang, oleh: string) {
  if (input.gudangAsalId === input.gudangTujuanId) {
    throw galat.aturanBisnis("Gudang asal dan gudang tujuan tidak boleh sama.");
  }
  await ambilGudang(input.gudangAsalId);
  await ambilGudang(input.gudangTujuanId);

  return db.transaction(async (tx) => {
    const nomor = input.nomor ?? (await nomorBerikut(tx, PREFIKS.TRANSFER_GUDANG, input.tanggal));

    const [transfer] = await tx
      .insert(warehouseTransfers)
      .values({
        nomor,
        tanggal: input.tanggal,
        gudangAsalId: input.gudangAsalId,
        gudangTujuanId: input.gudangTujuanId,
        status: "DRAFT",
        keterangan: nullJikaKosong(input.keterangan),
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    for (let i = 0; i < input.baris.length; i++) {
      const b = input.baris[i]!;
      await ambilItem(b.itemId);
      await tx.insert(warehouseTransferItems).values({
        transferId: transfer!.id,
        urutan: i + 1,
        itemId: b.itemId,
        kuantitas: b.kuantitas,
        biayaSatuan: "0",
        nilai: "0",
        keterangan: nullJikaKosong(b.keterangan),
      });
    }

    return ambilTransferGudang(transfer!.id, tx);
  });
}

export async function postingTransferGudang(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const transfer = await ambilTransferGudang(id, tx);
    if (transfer.status !== "DRAFT") {
      throw galat.aturanBisnis(`Transfer ${transfer.nomor} berstatus ${transfer.status} dan tidak dapat diposting.`);
    }

    let totalNilaiInt = BigInt(0);

    for (const b of transfer.baris) {
      // 1. Mutasi KELUAR dari gudang asal (memakai biaya rata-rata gudang asal)
      const mutasiKeluar = await catatMutasiStok(tx, {
        tanggal: transfer.tanggal,
        itemId: b.itemId,
        gudangId: transfer.gudangAsalId,
        jenis: "KELUAR",
        kuantitas: b.kuantitas,
        sumber: "TRANSFER_GUDANG",
        sumberId: transfer.id,
        keterangan: `Transfer keluar ke ${transfer.gudangTujuan.nama} (${transfer.nomor})`,
        oleh,
      });

      // 2. Mutasi MASUK ke gudang tujuan dengan biaya yang sama persis
      await catatMutasiStok(tx, {
        tanggal: transfer.tanggal,
        itemId: b.itemId,
        gudangId: transfer.gudangTujuanId,
        jenis: "MASUK",
        kuantitas: b.kuantitas,
        biayaSatuan: keString(mutasiKeluar.biayaSatuan),
        sumber: "TRANSFER_GUDANG",
        sumberId: transfer.id,
        keterangan: `Transfer masuk dari ${transfer.gudangAsal.nama} (${transfer.nomor})`,
        oleh,
      });

      totalNilaiInt += mutasiKeluar.nilai;

      // Update nilai pada baris transfer
      await tx
        .update(warehouseTransferItems)
        .set({
          biayaSatuan: keString(mutasiKeluar.biayaSatuan),
          nilai: keString(mutasiKeluar.nilai),
        })
        .where(eq(warehouseTransferItems.id, b.id));
    }

    await tx
      .update(warehouseTransfers)
      .set({
        status: "POSTED",
        totalNilai: keString(totalNilaiInt),
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(warehouseTransfers.id, id));

    return ambilTransferGudang(id, tx);
  });
}

export async function batalkanTransferGudang(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const transfer = await ambilTransferGudang(id, tx);
    if (transfer.status !== "POSTED") {
      throw galat.aturanBisnis(`Transfer ${transfer.nomor} berstatus ${transfer.status} dan tidak dapat dibatalkan.`);
    }

    // Balik mutasi stok kedua gudang
    await balikMutasiDokumen(tx, "TRANSFER_GUDANG", transfer.id, transfer.tanggal, oleh);

    await tx
      .update(warehouseTransfers)
      .set({
        status: "DIBATALKAN",
        dibatalkanOleh: oleh,
        dibatalkanPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(warehouseTransfers.id, id));

    return ambilTransferGudang(id, tx);
  });
}

/* ================================================================== */
/* PENYESUAIAN STOK & STOK OPNAME                                     */
/* ================================================================== */

export async function ambilPenyesuaianStok(id: string, koneksi: Tx | typeof db = db) {
  const [header] = await koneksi
    .select({
      penyesuaian: stockAdjustments,
      gudangKode: warehouses.kode,
      gudangNama: warehouses.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(stockAdjustments)
    .innerJoin(warehouses, eq(warehouses.id, stockAdjustments.gudangId))
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, stockAdjustments.akunPenyesuaianId))
    .where(eq(stockAdjustments.id, id));

  if (!header) throw galat.tidakDitemukan("Penyesuaian stok");

  const baris = await koneksi
    .select({
      itemAdj: stockAdjustmentItems,
      sku: items.sku,
      nama: items.nama,
      satuan: unitsOfMeasurement.kode,
      akunPersediaanId: items.akunPersediaanId,
    })
    .from(stockAdjustmentItems)
    .innerJoin(items, eq(items.id, stockAdjustmentItems.itemId))
    .innerJoin(unitsOfMeasurement, eq(unitsOfMeasurement.id, items.satuanId))
    .where(eq(stockAdjustmentItems.penyesuaianId, id))
    .orderBy(asc(stockAdjustmentItems.urutan));

  return {
    ...header.penyesuaian,
    gudang: { id: header.penyesuaian.gudangId, kode: header.gudangKode, nama: header.gudangNama },
    akunPenyesuaian: { id: header.penyesuaian.akunPenyesuaianId, kode: header.akunKode, nama: header.akunNama },
    baris: baris.map((b) => ({
      ...b.itemAdj,
      sku: b.sku,
      nama: b.nama,
      satuan: b.satuan,
      akunPersediaanId: b.akunPersediaanId,
    })),
  };
}

export async function daftarPenyesuaianStok(opsi: QueryPenyesuaianStok) {
  const page = bacaHalaman(opsi);
  const where = and(
    opsi.status ? eq(stockAdjustments.status, opsi.status as StatusDokumen) : undefined,
    opsi.gudangId ? eq(stockAdjustments.gudangId, opsi.gudangId) : undefined,
    opsi.dari ? gte(stockAdjustments.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(stockAdjustments.tanggal, opsi.sampai) : undefined,
  );

  const [total] = await db.select({ hitung: sql<number>`count(*)::int` }).from(stockAdjustments).where(where);
  const data = await db
    .select({
      penyesuaian: stockAdjustments,
      gudangKode: warehouses.kode,
      gudangNama: warehouses.nama,
      akunKode: chartOfAccounts.kode,
      akunNama: chartOfAccounts.nama,
    })
    .from(stockAdjustments)
    .innerJoin(warehouses, eq(warehouses.id, stockAdjustments.gudangId))
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, stockAdjustments.akunPenyesuaianId))
    .where(where)
    .orderBy(desc(stockAdjustments.tanggal), desc(stockAdjustments.nomor))
    .limit(page.ukuran)
    .offset(page.offset);

  return {
    items: data.map((d) => ({
      ...d.penyesuaian,
      gudang: { id: d.penyesuaian.gudangId, kode: d.gudangKode, nama: d.gudangNama },
      akunPenyesuaian: { id: d.penyesuaian.akunPenyesuaianId, kode: d.akunKode, nama: d.akunNama },
    })),
    total: total?.hitung ?? 0,
    halaman: page.halaman,
    ukuran: page.ukuran,
  };
}

export async function buatPenyesuaianStok(input: InputSimpanPenyesuaianStok, oleh: string) {
  await ambilGudang(input.gudangId);
  await pastikanAkunDetail(input.akunPenyesuaianId, { label: "Akun penyesuaian stok" });

  return db.transaction(async (tx) => {
    const nomor = input.nomor ?? (await nomorBerikut(tx, PREFIKS.PENYESUAIAN_STOK, input.tanggal));

    const [adj] = await tx
      .insert(stockAdjustments)
      .values({
        nomor,
        tanggal: input.tanggal,
        gudangId: input.gudangId,
        akunPenyesuaianId: input.akunPenyesuaianId,
        status: "DRAFT",
        keterangan: input.keterangan.trim(),
        totalNilai: "0",
        dibuatOleh: oleh,
        diubahOleh: oleh,
      })
      .returning();

    for (let i = 0; i < input.baris.length; i++) {
      const b = input.baris[i]!;
      await ambilItem(b.itemId);

      // Cek saldo tercatat di gudang saat ini
      const [stokSaatIni] = await tx
        .select()
        .from(itemStocks)
        .where(and(eq(itemStocks.itemId, b.itemId), eq(itemStocks.gudangId, input.gudangId)));

      const qtyTercatat = stokSaatIni?.kuantitas ?? "0";
      const selisihInt = keBigInt(b.kuantitasFisik) - keBigInt(qtyTercatat);
      if (selisihInt === BigInt(0)) {
        throw galat.aturanBisnis(
          `Baris ${i + 1}: Kuantitas fisik (${b.kuantitasFisik}) sama dengan kuantitas sistem (${qtyTercatat}). Tidak ada selisih.`,
        );
      }

      await tx.insert(stockAdjustmentItems).values({
        penyesuaianId: adj!.id,
        urutan: i + 1,
        itemId: b.itemId,
        kuantitasTercatat: qtyTercatat,
        kuantitasFisik: b.kuantitasFisik,
        kuantitasSelisih: keString(selisihInt),
        biayaSatuan: b.biayaSatuan ?? stokSaatIni?.biayaRataRata ?? "0",
        nilai: "0",
        keterangan: nullJikaKosong(b.keterangan),
      });
    }

    return ambilPenyesuaianStok(adj!.id, tx);
  });
}

export async function postingPenyesuaianStok(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const adj = await ambilPenyesuaianStok(id, tx);
    if (adj.status !== "DRAFT") {
      throw galat.aturanBisnis(`Penyesuaian ${adj.nomor} berstatus ${adj.status} dan tidak dapat diposting.`);
    }

    const muDasar = await ambilMataUangDasar();
    const barisJurnal: BarisJurnalInput[] = [];
    let totalNilaiNettoInt = BigInt(0);

    for (const b of adj.baris) {
      const selisihInt = keBigInt(b.kuantitasSelisih);
      let akunPersediaanId = b.akunPersediaanId;
      if (!akunPersediaanId) {
        const [akunPersediaanDef] = await tx
          .select()
          .from(chartOfAccounts)
          .where(and(eq(chartOfAccounts.peranSistem, "PERSEDIAAN"), eq(chartOfAccounts.aktif, true)));
        if (!akunPersediaanDef) throw galat.aturanBisnis("Akun persediaan default tidak ditemukan.");
        akunPersediaanId = akunPersediaanDef.id;
      }

      if (selisihInt > BigInt(0)) {
        // SELISIH LEBIH: MASUK STOK
        const mutasi = await catatMutasiStok(tx, {
          tanggal: adj.tanggal,
          itemId: b.itemId,
          gudangId: adj.gudangId,
          jenis: "MASUK",
          kuantitas: keString(selisihInt),
          biayaSatuan: b.biayaSatuan,
          sumber: "PENYESUAIAN_STOK",
          sumberId: adj.id,
          keterangan: `Opname lebih (${adj.nomor})`,
          oleh,
        });

        totalNilaiNettoInt += mutasi.nilai;

        await tx
          .update(stockAdjustmentItems)
          .set({ nilai: keString(mutasi.nilai), biayaSatuan: keString(mutasi.biayaSatuan) })
          .where(eq(stockAdjustmentItems.id, b.id));

        // Jurnal: (Dr) Persediaan, (Cr) Akun Penyesuaian
        barisJurnal.push({
          akunId: akunPersediaanId,
          debit: keString(mutasi.nilai),
          deskripsi: `Penyesuaian persediaan lebih ${b.sku} (${adj.nomor})`,
        });
        barisJurnal.push({
          akunId: adj.akunPenyesuaianId,
          kredit: keString(mutasi.nilai),
          deskripsi: `Pendapatan/akun selisih stok ${adj.nomor}`,
        });
      } else {
        // SELISIH KURANG: KELUAR STOK
        const qtyKeluarInt = -selisihInt;
        const mutasi = await catatMutasiStok(tx, {
          tanggal: adj.tanggal,
          itemId: b.itemId,
          gudangId: adj.gudangId,
          jenis: "KELUAR",
          kuantitas: keString(qtyKeluarInt),
          sumber: "PENYESUAIAN_STOK",
          sumberId: adj.id,
          keterangan: `Opname kurang (${adj.nomor})`,
          oleh,
        });

        totalNilaiNettoInt -= mutasi.nilai;

        await tx
          .update(stockAdjustmentItems)
          .set({ nilai: keString(mutasi.nilai), biayaSatuan: keString(mutasi.biayaSatuan) })
          .where(eq(stockAdjustmentItems.id, b.id));

        // Jurnal: (Dr) Akun Penyesuaian (Beban), (Cr) Persediaan
        barisJurnal.push({
          akunId: adj.akunPenyesuaianId,
          debit: keString(mutasi.nilai),
          deskripsi: `Beban/akun selisih kurang stok ${adj.nomor}`,
        });
        barisJurnal.push({
          akunId: akunPersediaanId,
          kredit: keString(mutasi.nilai),
          deskripsi: `Penyesuaian persediaan berkurang ${b.sku} (${adj.nomor})`,
        });
      }
    }

    // Simpan Jurnal Double Entry
    const jurnal = await simpanJurnal(
      tx,
      {
        tanggal: adj.tanggal,
        deskripsi: `Penyesuaian Stok / Opname ${adj.nomor}: ${adj.keterangan}`,
        sumber: "PENYESUAIAN_STOK",
        sumberId: adj.id,
        mataUangId: muDasar.id,
        kurs: "1",
        posting: true,
        baris: barisJurnal,
      },
      oleh,
    );

    await tx
      .update(stockAdjustments)
      .set({
        status: "POSTED",
        totalNilai: keString(totalNilaiNettoInt >= BigInt(0) ? totalNilaiNettoInt : -totalNilaiNettoInt),
        jurnalId: jurnal.id,
        dipostingOleh: oleh,
        dipostingPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(stockAdjustments.id, id));

    return ambilPenyesuaianStok(id, tx);
  });
}

export async function batalkanPenyesuaianStok(id: string, oleh: string) {
  return db.transaction(async (tx) => {
    const adj = await ambilPenyesuaianStok(id, tx);
    if (adj.status !== "POSTED") {
      throw galat.aturanBisnis(`Penyesuaian ${adj.nomor} berstatus ${adj.status} dan tidak dapat dibatalkan.`);
    }

    if (adj.jurnalId) {
      await balikJurnal(
        tx,
        adj.jurnalId,
        {
          tanggal: adj.tanggal,
          deskripsi: `Pembalikan Penyesuaian Stok ${adj.nomor}`,
          sumber: "PENYESUAIAN_STOK",
        },
        oleh,
      );
    }

    await balikMutasiDokumen(tx, "PENYESUAIAN_STOK", adj.id, adj.tanggal, oleh);

    await tx
      .update(stockAdjustments)
      .set({
        status: "DIBATALKAN",
        dibatalkanOleh: oleh,
        dibatalkanPada: new Date(),
        diubahOleh: oleh,
      })
      .where(eq(stockAdjustments.id, id));

    return ambilPenyesuaianStok(id, tx);
  });
}

/* ================================================================== */
/* NOMOR BATCH / SERI & KEDALUWARSA                                   */
/* ================================================================== */

export async function daftarBatch(opsi: QueryBatch) {
  const q = opsi.q?.trim();
  return db
    .select({
      batch: itemBatches,
      itemSku: items.sku,
      itemNama: items.nama,
      gudangKode: warehouses.kode,
      gudangNama: warehouses.nama,
    })
    .from(itemBatches)
    .innerJoin(items, eq(items.id, itemBatches.itemId))
    .innerJoin(warehouses, eq(warehouses.id, itemBatches.gudangId))
    .where(
      and(
        opsi.itemId ? eq(itemBatches.itemId, opsi.itemId) : undefined,
        opsi.gudangId ? eq(itemBatches.gudangId, opsi.gudangId) : undefined,
        opsi.aktif !== undefined ? eq(itemBatches.aktif, String(opsi.aktif) === "true") : undefined,
        q ? ilike(itemBatches.nomorBatch, `%${escapeLike(q)}%`) : undefined,
      ),
    )
    .orderBy(asc(itemBatches.tanggalKedaluwarsa), asc(itemBatches.nomorBatch));
}

export async function buatBatch(input: InputBuatBatch, oleh: string) {
  await ambilItem(input.itemId);
  await ambilGudang(input.gudangId);

  const [baru] = await db
    .insert(itemBatches)
    .values({
      itemId: input.itemId,
      gudangId: input.gudangId,
      nomorBatch: input.nomorBatch.trim(),
      tanggalKedaluwarsa: input.tanggalKedaluwarsa ?? null,
      kuantitas: input.kuantitas ?? "0",
      dibuatOleh: oleh,
      diubahOleh: oleh,
    })
    .returning();

  return baru!;
}

/* ================================================================== */
/* LAPORAN: KARTU STOK & NILAI PERSEDIAAN GUDANG                      */
/* ================================================================== */

export async function ambilKartuStok(opsi: QueryKartuStok) {
  await ambilItem(opsi.itemId);

  const where = and(
    eq(stockMovements.itemId, opsi.itemId),
    opsi.gudangId ? eq(stockMovements.gudangId, opsi.gudangId) : undefined,
    opsi.dari ? gte(stockMovements.tanggal, opsi.dari) : undefined,
    opsi.sampai ? lte(stockMovements.tanggal, opsi.sampai) : undefined,
  );

  const movements = await db
    .select({
      movement: stockMovements,
      gudangKode: warehouses.kode,
      gudangNama: warehouses.nama,
    })
    .from(stockMovements)
    .leftJoin(warehouses, eq(warehouses.id, stockMovements.gudangId))
    .where(where)
    .orderBy(asc(stockMovements.tanggal), asc(stockMovements.dibuatPada));

  return movements.map((m) => ({
    ...m.movement,
    gudangKode: m.gudangKode ?? "WH-UTAMA",
    gudangNama: m.gudangNama ?? "Gudang Utama",
  }));
}

export async function ambilNilaiPersediaan(opsi: QueryNilaiPersediaan = {}) {
  const q = opsi.q?.trim();

  const where = and(
    opsi.gudangId ? eq(itemStocks.gudangId, opsi.gudangId) : undefined,
    opsi.kategoriId ? eq(items.kategoriId, opsi.kategoriId) : undefined,
    q
      ? or(
          ilike(items.sku, `${escapeLike(q)}%`),
          ilike(items.nama, `%${escapeLike(q)}%`),
        )
      : undefined,
  );

  const daftar = await db
    .select({
      itemId: itemStocks.itemId,
      sku: items.sku,
      nama: items.nama,
      gudangId: itemStocks.gudangId,
      gudangKode: warehouses.kode,
      gudangNama: warehouses.nama,
      satuan: unitsOfMeasurement.kode,
      kuantitas: itemStocks.kuantitas,
      nilai: itemStocks.nilai,
      biayaRataRata: itemStocks.biayaRataRata,
    })
    .from(itemStocks)
    .innerJoin(items, eq(items.id, itemStocks.itemId))
    .innerJoin(warehouses, eq(warehouses.id, itemStocks.gudangId))
    .innerJoin(unitsOfMeasurement, eq(unitsOfMeasurement.id, items.satuanId))
    .where(where)
    .orderBy(asc(warehouses.kode), asc(items.sku));

  let totalKuantitasInt = BigInt(0);
  let totalNilaiInt = BigInt(0);

  for (const d of daftar) {
    totalKuantitasInt += keBigInt(d.kuantitas);
    totalNilaiInt += keBigInt(d.nilai);
  }

  return {
    items: daftar,
    ringkasan: {
      totalItem: daftar.length,
      totalKuantitas: keString(totalKuantitasInt),
      totalNilai: keString(totalNilaiInt),
    },
  };
}
