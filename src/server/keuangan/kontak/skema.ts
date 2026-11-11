import { t, type Static } from "elysia";
import { skema, skemaHalaman } from "../_umum";

/* ------------------------- Termin pembayaran ------------------------- */

export const skemaBuatTermin = t.Object({
  kode: skema.kode("Kode termin", 20),
  nama: skema.teks("Nama termin", 100),
  jumlahHari: t.Optional(t.Integer({ minimum: 0, maximum: 3650, error: "jumlahHari harus bilangan bulat 0-3650." })),
  persenDiskon: t.Optional(skema.persen("persenDiskon")),
  hariDiskon: t.Optional(t.Integer({ minimum: 0, maximum: 3650, error: "hariDiskon harus bilangan bulat 0-3650." })),
  keterangan: skema.teksOpsional("keterangan", 1000),
});
export type InputBuatTermin = Static<typeof skemaBuatTermin>;

export const skemaUbahTermin = t.Composite([
  t.Partial(skemaBuatTermin),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahTermin = Static<typeof skemaUbahTermin>;

export const skemaQueryTermin = t.Object({
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
});

/* ------------------------------ Kontak ------------------------------ */

export const skemaBuatKontak = t.Object({
  kode: skema.kode("Kode kontak", 30),
  nama: skema.teks("Nama kontak", 200),
  adalahPelanggan: t.Optional(skema.boolean("adalahPelanggan")),
  adalahPemasok: t.Optional(skema.boolean("adalahPemasok")),
  npwp: skema.teksOpsional("npwp", 32),
  adalahPkp: t.Optional(skema.boolean("adalahPkp")),
  namaKontak: skema.teksOpsional("namaKontak", 150),
  email: skema.emailOpsional("email"),
  telepon: skema.teksOpsional("telepon", 30),
  alamat: skema.teksOpsional("alamat", 1000),
  kota: skema.teksOpsional("kota", 100),
  provinsi: skema.teksOpsional("provinsi", 100),
  kodePos: skema.teksOpsional("kodePos", 10),
  negara: t.Optional(skema.teks("negara", 100)),
  terminPembayaranId: skema.uuidOpsional("terminPembayaranId"),
  mataUangId: skema.uuidOpsional("mataUangId"),
  /** Batas kredit (string desimal, maks 4 desimal). */
  batasKredit: t.Optional(skema.uang("batasKredit")),
  catatan: skema.teksOpsional("catatan", 2000),
});
export type InputBuatKontak = Static<typeof skemaBuatKontak>;

export const skemaUbahKontak = t.Composite([
  t.Partial(skemaBuatKontak),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahKontak = Static<typeof skemaUbahKontak>;

export const skemaQueryKontak = t.Object({
  jenis: t.Optional(skema.pilihan("jenis", ["PELANGGAN", "PEMASOK"] as const)),
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
  q: skemaHalaman.q,
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});
