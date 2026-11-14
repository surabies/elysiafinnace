import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";

export const skemaPreviewRevaluasi = t.Object({
  tanggal: skema.tanggal("Tanggal revaluasi"),
  mataUangId: t.Optional(skema.uuid("mataUangId")),
});
export type InputPreviewRevaluasi = Static<typeof skemaPreviewRevaluasi>;

export const skemaEksekusiRevaluasi = t.Object({
  tanggal: skema.tanggal("Tanggal revaluasi"),
  mataUangId: t.Optional(skema.uuid("mataUangId")),
  keterangan: skema.teksOpsional("keterangan", 500),
  /** Buat jurnal balik otomatis pada hari pertama periode berikutnya (default: true). */
  balikOtomatis: t.Optional(skema.boolean("balikOtomatis")),
});
export type InputEksekusiRevaluasi = Static<typeof skemaEksekusiRevaluasi>;

export const skemaQueryRevaluasi = t.Object({
  dari: t.Optional(skema.tanggal("dari")),
  sampai: t.Optional(skema.tanggal("sampai")),
  halaman: skemaHalaman.halaman,
  ukuran: skemaHalaman.ukuran,
});
