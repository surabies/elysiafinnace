import { t, type Static } from "elysia";
import { skema, skemaHalaman } from "../_umum";

export const skemaBuatMataUang = t.Object({
  kode: t.String({ pattern: "^[A-Za-z]{3}$", error: "Kode mata uang harus 3 huruf (ISO 4217), mis. USD." }),
  nama: skema.teks("Nama mata uang", 100),
  simbol: skema.teks("Simbol", 10),
  jumlahDesimal: t.Optional(t.Integer({ minimum: 0, maximum: 8, error: "Jumlah desimal harus bilangan bulat 0-8." })),
});
export type InputBuatMataUang = Static<typeof skemaBuatMataUang>;

export const skemaUbahMataUang = t.Object({
  nama: t.Optional(skema.teks("Nama mata uang", 100)),
  simbol: t.Optional(skema.teks("Simbol", 10)),
  jumlahDesimal: t.Optional(t.Integer({ minimum: 0, maximum: 8, error: "Jumlah desimal harus bilangan bulat 0-8." })),
  aktif: t.Optional(skema.boolean("aktif")),
});
export type InputUbahMataUang = Static<typeof skemaUbahMataUang>;

export const skemaQueryMataUang = t.Object({
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
});

export const skemaSimpanKurs = t.Object({
  mataUangId: skema.uuid("mataUangId"),
  tanggalBerlaku: skema.tanggal("tanggalBerlaku"),
  /** 1 satuan mata uang asing = kurs satuan mata uang dasar. Kirim sebagai string. */
  kurs: skema.kurs("kurs"),
  sumber: skema.teksOpsional("sumber", 100),
});
export type InputSimpanKurs = Static<typeof skemaSimpanKurs>;

export const skemaQueryKurs = t.Object({
  mataUangId: t.Optional(skema.uuid("mataUangId")),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});

export const skemaQueryKursBerlaku = t.Object({
  mataUangId: skema.uuid("mataUangId"),
  tanggal: skema.tanggal("tanggal"),
});
