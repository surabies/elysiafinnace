import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";

export const POSISI_JURNAL = ["DEBIT", "KREDIT"] as const;
export const FREKUENSI_RECURRING = ["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"] as const;

export const skemaItemTemplate = t.Object({
  akunId: skema.uuid("akunId"),
  posisi: skema.pilihan("posisi", POSISI_JURNAL),
  persentase: t.Optional(skema.persen("persentase")),
  nominalDefault: t.Optional(skema.uang("nominalDefault")),
  deskripsi: skema.teksOpsional("deskripsi", 500),
});
export type InputItemTemplate = Static<typeof skemaItemTemplate>;

export const skemaBuatTemplate = t.Object({
  kode: skema.kode("Kode template", 30),
  nama: skema.teks("Nama template", 150),
  deskripsi: skema.teksOpsional("deskripsi", 1000),
  daftarBaris: t.Array(skemaItemTemplate),
});
export type InputBuatTemplate = Static<typeof skemaBuatTemplate>;

export const skemaUbahTemplate = t.Composite([
  t.Partial(t.Omit(skemaBuatTemplate, ["daftarBaris"])),
  t.Object({
    aktif: t.Optional(skema.boolean("aktif")),
    daftarBaris: t.Optional(t.Array(skemaItemTemplate)),
  }),
]);
export type InputUbahTemplate = Static<typeof skemaUbahTemplate>;

export const skemaBuatJurnalBerulang = t.Object({
  deskripsi: skema.teks("deskripsi", 500),
  frekuensi: skema.pilihan("frekuensi", FREKUENSI_RECURRING),
  tanggalMulai: skema.tanggal("tanggalMulai"),
  tanggalSelesai: t.Optional(skema.tanggal("tanggalSelesai")),
  templateId: skema.uuidOpsional("templateId"),
  mataUangId: t.Optional(skema.uuid("mataUangId")),
  totalDebit: t.Optional(skema.uang("totalDebit")),
  totalKredit: t.Optional(skema.uang("totalKredit")),
});
export type InputBuatJurnalBerulang = Static<typeof skemaBuatJurnalBerulang>;

export const skemaQueryTemplate = t.Object({
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
  q: skemaHalaman.q,
});
