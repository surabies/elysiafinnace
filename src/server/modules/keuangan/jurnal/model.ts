import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";

const baris = t.Object({
  akunId: skema.uuid("akunId"),
  debit: t.Optional(skema.uang("debit")),
  kredit: t.Optional(skema.uang("kredit")),
  deskripsi: skema.teksOpsional("deskripsi", 500),
  kontakId: skema.uuidOpsional("kontakId"),
});

export const skemaSimpanJurnal = t.Object({
  tanggal: skema.tanggal("tanggal"),
  deskripsi: skema.teks("deskripsi", 1000),
  referensi: skema.teksOpsional("referensi", 100),
  mataUangId: skema.uuidOpsional("mataUangId"),
  kurs: t.Optional(skema.kurs("kurs")),
  posting: t.Optional(skema.boolean("posting")),
  baris: t.Array(baris, { minItems: 2, error: "Jurnal minimal terdiri dari 2 baris." }),
});
export type InputSimpanJurnalManual = Static<typeof skemaSimpanJurnal>;

export const skemaUbahJurnal = t.Composite([
  t.Omit(skemaSimpanJurnal, ["posting"]),
]);
export type InputUbahJurnalManual = Static<typeof skemaUbahJurnal>;

export const skemaBalikJurnal = t.Object({
  tanggal: skema.tanggal("tanggal"),
  deskripsi: skema.teksOpsional("deskripsi", 1000),
});

export const skemaQueryJurnal = t.Object({
  status: t.Optional(t.Union([t.Literal("DRAFT"), t.Literal("POSTED"), t.Literal("DIBATALKAN")])),
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  q: skemaHalaman.q,
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});

export const skemaQueryBukuBesar = t.Object({
  akunId: t.Optional(skema.uuid("akunId")),
  dari: skema.tanggal("dari"),
  sampai: skema.tanggal("sampai"),
});
