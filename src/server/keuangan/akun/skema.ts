import { t, type Static } from "elysia";
import { PERAN_SISTEM, SALDO_NORMAL, TIPE_AKUN } from "@/db/schema/keuangan";
import { skema } from "../_umum";

export const skemaBuatAkun = t.Object({
  kode: skema.kode("Kode akun", 20),
  nama: skema.teks("Nama akun", 150),
  tipeAkun: skema.pilihan("tipeAkun", TIPE_AKUN),
  /** Akun induk (harus akun header bertipe sama). Kosongkan untuk akun tingkat teratas. */
  indukId: skema.uuidOpsional("indukId"),
  /** false = akun header/grup yang tidak boleh menerima jurnal. Default: true. */
  bisaDiposting: t.Optional(skema.boolean("bisaDiposting")),
  /** Akun kontra (mis. Akumulasi Penyusutan) memiliki saldo normal kebalikan dari tipenya. */
  adalahAkunKontra: t.Optional(skema.boolean("adalahAkunKontra")),
  /** Opsional; bila dikirim harus cocok dengan tipe akun & kontra. Biasanya dikosongkan (diturunkan otomatis). */
  normalBalance: t.Optional(skema.pilihan("normalBalance", SALDO_NORMAL)),
  peranSistem: t.Optional(t.Union([skema.pilihan("peranSistem", PERAN_SISTEM), t.Null()])),
  mataUangId: skema.uuidOpsional("mataUangId"),
  keterangan: skema.teksOpsional("keterangan", 1000),
});
export type InputBuatAkun = Static<typeof skemaBuatAkun>;

/** Tipe akun, saldo normal, status header, kontra, dan peran sistem tidak dapat diubah setelah dibuat. */
export const skemaUbahAkun = t.Object({
  kode: t.Optional(skema.kode("Kode akun", 20)),
  nama: t.Optional(skema.teks("Nama akun", 150)),
  keterangan: skema.teksOpsional("keterangan", 1000),
  aktif: t.Optional(skema.boolean("aktif")),
  indukId: skema.uuidOpsional("indukId"),
  mataUangId: skema.uuidOpsional("mataUangId"),
});
export type InputUbahAkun = Static<typeof skemaUbahAkun>;

export const skemaQueryAkun = t.Object({
  tipeAkun: t.Optional(skema.pilihan("tipeAkun", TIPE_AKUN)),
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
  bisaDiposting: t.Optional(t.BooleanString({ error: "bisaDiposting harus true atau false." })),
  peranSistem: t.Optional(skema.pilihan("peranSistem", PERAN_SISTEM)),
  q: t.Optional(t.String({ maxLength: 100 })),
});

export const skemaQueryPohonAkun = t.Object({
  aktif: t.Optional(t.BooleanString({ error: "aktif harus true atau false." })),
});
