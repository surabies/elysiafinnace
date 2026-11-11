import { t, type Static } from "elysia";
import { JENIS_REKENING } from "@/db/schema/keuangan";
import { skema, skemaHalaman } from "../_umum";

export const skemaBuatRekening = t.Object({
  kode: skema.kode("Kode rekening", 20),
  nama: skema.teks("Nama rekening", 150),
  /** Default: BANK. Rekening BANK wajib memiliki namaBank dan nomorRekening. Tidak dapat diubah setelah dibuat. */
  jenis: t.Optional(skema.pilihan("jenis", JENIS_REKENING)),
  namaBank: skema.teksOpsional("namaBank", 100),
  nomorRekening: skema.teksOpsional("nomorRekening", 50),
  atasNama: skema.teksOpsional("atasNama", 150),
  cabang: skema.teksOpsional("cabang", 100),
  /** Akun COA bertipe ASET berperan KAS_BANK yang menjadi buku besar rekening ini. Satu akun untuk satu rekening. */
  akunCoaId: skema.uuid("akunCoaId"),
  /** Default: mata uang akun COA, atau mata uang dasar. Tidak dapat diubah setelah dibuat. */
  mataUangId: t.Optional(skema.uuid("mataUangId")),
  keterangan: skema.teksOpsional("keterangan", 1000),
});
export type InputBuatRekening = Static<typeof skemaBuatRekening>;

/** Jenis, akun COA, dan mata uang dikunci setelah dibuat karena mutasi bank (Phase 2) akan merujuknya. */
export const skemaUbahRekening = t.Composite([
  t.Partial(t.Omit(skemaBuatRekening, ["jenis", "akunCoaId", "mataUangId"])),
  t.Object({ aktif: t.Optional(skema.boolean("aktif")) }),
]);
export type InputUbahRekening = Static<typeof skemaUbahRekening>;

export const skemaQueryRekening = t.Object({
  jenis: t.Optional(skema.pilihan("jenis", JENIS_REKENING)),
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
  q: skemaHalaman.q,
});
