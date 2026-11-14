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

/* --------------------------- Satuan Item ---------------------------- */

export const skemaItemSatuan = t.Object({
  satuanId: skema.uuid("satuanId"),
  konversi: skema.kuantitas("konversi"),
  barcode: skema.teksOpsional("barcode", 50),
  hargaJual: t.Optional(skema.uang("hargaJual")),
  hargaBeli: t.Optional(skema.uang("hargaBeli")),
  urutan: t.Optional(t.Integer({ minimum: 1, error: "urutan harus bilangan bulat positif." })),
});
export type InputItemSatuan = Static<typeof skemaItemSatuan>;

export const skemaUbahItemSatuan = t.Partial(skemaItemSatuan);
export type InputUbahItemSatuan = Static<typeof skemaUbahItemSatuan>;

/* --------------------------- Bundel Item ---------------------------- */

export const skemaItemBundelKomponen = t.Object({
  komponenItemId: skema.uuid("komponenItemId"),
  satuanId: skema.uuid("satuanId"),
  kuantitas: skema.kuantitas("kuantitas"),
});
export type InputItemBundelKomponen = Static<typeof skemaItemBundelKomponen>;

export const skemaAturItemBundel = t.Object({
  komponen: t.Array(skemaItemBundelKomponen),
});
export type InputAturItemBundel = Static<typeof skemaAturItemBundel>;

/* ------------------------------- Item ------------------------------- */

export const skemaBuatItem = t.Object({
  sku: skema.kode("SKU", 50),
  barcode: skema.teksOpsional("barcode", 50),
  nama: skema.teks("Nama item", 200),
  deskripsi: skema.teksOpsional("deskripsi", 2000),
  /** Default: BARANG_PERSEDIAAN. */
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
  /** Multi-satuan konversi opsional saat pembuatan */
  daftarSatuan: t.Optional(t.Array(skemaItemSatuan)),
  /** Daftar komponen bundel opsional jika tipeBarang = BUNDEL */
  daftarBundel: t.Optional(t.Array(skemaItemBundelKomponen)),
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

export const skemaQueryCariHarga = t.Object({
  satuanId: t.Optional(skema.uuid("satuanId")),
  daftarHargaId: t.Optional(skema.uuid("daftarHargaId")),
  kuantitas: t.Optional(skema.kuantitas("kuantitas")),
});

/* ---------------------------- Price List ---------------------------- */

export const skemaBuatDaftarHarga = t.Object({
  kode: skema.kode("Kode daftar harga", 30),
  nama: skema.teks("Nama daftar harga", 150),
  mataUangId: t.Optional(skema.uuid("mataUangId")),
  keterangan: skema.teksOpsional("keterangan", 1000),
});
export type InputBuatDaftarHarga = Static<typeof skemaBuatDaftarHarga>;

export const skemaUbahDaftarHarga = t.Composite([
  t.Partial(skemaBuatDaftarHarga),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahDaftarHarga = Static<typeof skemaUbahDaftarHarga>;

export const skemaQueryDaftarHarga = t.Object({
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
  q: skemaHalaman.q,
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});

export const skemaSimpanBarisDaftarHarga = t.Object({
  itemId: skema.uuid("itemId"),
  satuanId: skema.uuidOpsional("satuanId"),
  minKuantitas: t.Optional(skema.kuantitas("minKuantitas")),
  harga: skema.uang("harga"),
});
export type InputSimpanBarisDaftarHarga = Static<typeof skemaSimpanBarisDaftarHarga>;

/* ------------------------------- Gudang ------------------------------ */

export const skemaBuatGudang = t.Object({
  kode: skema.kode("Kode gudang", 30),
  nama: skema.teks("Nama gudang", 150),
  alamat: skema.teksOpsional("Alamat gudang", 1000),
  penanggungJawab: skema.teksOpsional("Penanggung jawab", 150),
  adalahGudangUtama: t.Optional(skema.boolean("adalahGudangUtama")),
  keterangan: skema.teksOpsional("keterangan", 1000),
});
export type InputBuatGudang = Static<typeof skemaBuatGudang>;

export const skemaUbahGudang = t.Composite([
  t.Partial(skemaBuatGudang),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahGudang = Static<typeof skemaUbahGudang>;

export const skemaQueryGudang = t.Object({
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
  q: skemaHalaman.q,
});
export type QueryGudang = Static<typeof skemaQueryGudang>;

/* -------------------------- Transfer Gudang -------------------------- */

export const skemaBarisTransferGudang = t.Object({
  itemId: skema.uuid("itemId"),
  kuantitas: skema.kuantitas("kuantitas"),
  keterangan: skema.teksOpsional("keterangan", 500),
});
export type InputBarisTransferGudang = Static<typeof skemaBarisTransferGudang>;

export const skemaSimpanTransferGudang = t.Object({
  nomor: t.Optional(skema.kode("Nomor transfer", 30)),
  tanggal: skema.tanggal("Tanggal transfer"),
  gudangAsalId: skema.uuid("gudangAsalId"),
  gudangTujuanId: skema.uuid("gudangTujuanId"),
  keterangan: skema.teksOpsional("keterangan", 1000),
  baris: t.Array(skemaBarisTransferGudang, {
    minItems: 1,
    error: "Transfer gudang wajib memiliki minimal satu baris item.",
  }),
});
export type InputSimpanTransferGudang = Static<typeof skemaSimpanTransferGudang>;

export const skemaQueryTransferGudang = t.Object({
  status: t.Optional(t.String()),
  gudangAsalId: t.Optional(skema.uuid("gudangAsalId")),
  gudangTujuanId: t.Optional(skema.uuid("gudangTujuanId")),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});
export type QueryTransferGudang = Static<typeof skemaQueryTransferGudang>;

/* --------------------- Penyesuaian Stok / Opname --------------------- */

export const skemaBarisPenyesuaianStok = t.Object({
  itemId: skema.uuid("itemId"),
  kuantitasFisik: skema.kuantitas("kuantitasFisik"),
  biayaSatuan: t.Optional(skema.uang("biayaSatuan")),
  keterangan: skema.teksOpsional("keterangan", 500),
});
export type InputBarisPenyesuaianStok = Static<typeof skemaBarisPenyesuaianStok>;

export const skemaSimpanPenyesuaianStok = t.Object({
  nomor: t.Optional(skema.kode("Nomor penyesuaian", 30)),
  tanggal: skema.tanggal("Tanggal penyesuaian"),
  gudangId: skema.uuid("gudangId"),
  akunPenyesuaianId: skema.uuid("akunPenyesuaianId"),
  keterangan: skema.teks("Keterangan opname/penyesuaian", 1000),
  baris: t.Array(skemaBarisPenyesuaianStok, {
    minItems: 1,
    error: "Penyesuaian stok wajib memiliki minimal satu baris item.",
  }),
});
export type InputSimpanPenyesuaianStok = Static<typeof skemaSimpanPenyesuaianStok>;

export const skemaQueryPenyesuaianStok = t.Object({
  status: t.Optional(t.String()),
  gudangId: t.Optional(skema.uuid("gudangId")),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});
export type QueryPenyesuaianStok = Static<typeof skemaQueryPenyesuaianStok>;

/* -------------------------- Nomor Batch / Seri ----------------------- */

export const skemaBuatBatch = t.Object({
  itemId: skema.uuid("itemId"),
  gudangId: skema.uuid("gudangId"),
  nomorBatch: skema.kode("Nomor batch", 50),
  tanggalKedaluwarsa: t.Optional(skema.tanggal("tanggalKedaluwarsa")),
  kuantitas: t.Optional(skema.kuantitas("kuantitas")),
});
export type InputBuatBatch = Static<typeof skemaBuatBatch>;

export const skemaQueryBatch = t.Object({
  itemId: t.Optional(skema.uuid("itemId")),
  gudangId: t.Optional(skema.uuid("gudangId")),
  aktif: t.Optional(t.BooleanString()),
  q: skemaHalaman.q,
});
export type QueryBatch = Static<typeof skemaQueryBatch>;

/* -------------------------- Laporan Stok ----------------------------- */

export const skemaQueryKartuStok = t.Object({
  itemId: skema.uuid("itemId"),
  gudangId: t.Optional(skema.uuid("gudangId")),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
});
export type QueryKartuStok = Static<typeof skemaQueryKartuStok>;

export const skemaQueryNilaiPersediaan = t.Object({
  gudangId: t.Optional(skema.uuid("gudangId")),
  kategoriId: t.Optional(skema.uuid("kategoriId")),
  q: skemaHalaman.q,
});
export type QueryNilaiPersediaan = Static<typeof skemaQueryNilaiPersediaan>;
