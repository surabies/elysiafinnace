import { t, type Static } from "elysia";
import { TIPE_BARANG } from "@/db/schema/keuangan";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";

/* ----------------------------- Kategori ----------------------------- */

export const skemaBuatKategori = t.Object({
  kode: skema.kode("Kode kategori", 30),
  nama: skema.teks("Nama kategori", 150),
  indukId: skema.uuidOpsional("indukId"),
  keterangan: skema.teksOpsional("keterangan", 1000),
});
export type InputBuatKategori = Static<typeof skemaBuatKategori>;

export const skemaUbahKategori = t.Composite([
  t.Partial(skemaBuatKategori),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahKategori = Static<typeof skemaUbahKategori>;

/* ------------------------------ Satuan ------------------------------ */

export const skemaBuatSatuan = t.Object({
  kode: skema.kode("Kode satuan", 10),
  nama: skema.teks("Nama satuan", 100),
});
export type InputBuatSatuan = Static<typeof skemaBuatSatuan>;

export const skemaUbahSatuan = t.Composite([
  t.Partial(skemaBuatSatuan),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahSatuan = Static<typeof skemaUbahSatuan>;

export const skemaQueryAktif = t.Object({
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
});

/* ------------------------------- Item ------------------------------- */

export const skemaBuatItem = t.Object({
  sku: skema.kode("SKU", 50),
  barcode: skema.teksOpsional("barcode", 50),
  nama: skema.teks("Nama item", 200),
  deskripsi: skema.teksOpsional("deskripsi", 2000),
  /** Default: BARANG_PERSEDIAAN. Tidak dapat diubah setelah item dibuat. */
  tipeBarang: t.Optional(skema.pilihan("tipeBarang", TIPE_BARANG)),
  kategoriId: skema.uuidOpsional("kategoriId"),
  satuanId: skema.uuid("satuanId"),
  /** Default: mata uang dasar. */
  mataUangId: t.Optional(skema.uuid("mataUangId")),
  hargaBeliStandar: t.Optional(skema.uang("hargaBeliStandar")),
  hargaJualStandar: t.Optional(skema.uang("hargaJualStandar")),
  stokMinimum: t.Optional(skema.uang("stokMinimum")),
  /** Barang persediaan: akun persediaan (peran PERSEDIAAN). Bila kosong dan hanya ada satu, dipakai otomatis. */
  akunPersediaanId: skema.uuidOpsional("akunPersediaanId"),
  /** Akun HPP/beban bertipe BEBAN. Default untuk barang persediaan: akun berperan HARGA_POKOK_PENJUALAN. */
  akunHppId: skema.uuidOpsional("akunHppId"),
  /** Akun bertipe PENDAPATAN. Default: akun berperan PENDAPATAN_PENJUALAN (bukan Laba Ditahan). */
  akunPendapatanId: skema.uuidOpsional("akunPendapatanId"),
});
export type InputBuatItem = Static<typeof skemaBuatItem>;

export const skemaUbahItem = t.Composite([
  t.Partial(t.Omit(skemaBuatItem, ["tipeBarang"])),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahItem = Static<typeof skemaUbahItem>;

export const skemaQueryItem = t.Object({
  tipeBarang: t.Optional(skema.pilihan("tipeBarang", TIPE_BARANG)),
  kategoriId: t.Optional(skema.uuid("kategoriId")),
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
  q: skemaHalaman.q,
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});
