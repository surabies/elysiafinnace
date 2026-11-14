import { t, type Static } from "elysia";
import { skema } from "../shared/schema";
import { skemaHalaman } from "../shared/pagination";

// ==========================================
// 1. SKEMA PERAN (ROLES)
// ==========================================

export const skemaQueryPeran = t.Object({
  ...skemaHalaman,
  aksesPenuh: t.Optional(t.BooleanString({ error: "aksesPenuh harus true/false." })),
  adalahSistem: t.Optional(t.BooleanString({ error: "adalahSistem harus true/false." })),
});
export type QueryPeranInput = Static<typeof skemaQueryPeran>;

export const skemaSimpanPeran = t.Object({
  kode: skema.kode("Kode Peran", 50),
  nama: skema.teks("Nama Peran", 100),
  keterangan: skema.teksOpsional("Keterangan", 500),
  aksesPenuh: t.Optional(skema.boolean("Akses Penuh")),
  izin: t.Array(t.String(), { description: "Daftar kode izin KATALOG_IZIN" }),
});
export type SimpanPeranInput = Static<typeof skemaSimpanPeran>;

export const skemaUbahPeran = t.Object({
  nama: skema.teks("Nama Peran", 100),
  keterangan: skema.teksOpsional("Keterangan", 500),
  aksesPenuh: t.Optional(skema.boolean("Akses Penuh")),
  izin: t.Optional(t.Array(t.String(), { description: "Daftar kode izin KATALOG_IZIN" })),
});
export type UbahPeranInput = Static<typeof skemaUbahPeran>;

// ==========================================
// 2. SKEMA PENUGASAN PERAN PENGGUNA (USER ROLES)
// ==========================================

export const skemaQueryPenggunaPeran = t.Object({
  ...skemaHalaman,
  peranId: t.Optional(t.String({ error: "peranId harus berupa UUID string." })),
});
export type QueryPenggunaPeranInput = Static<typeof skemaQueryPenggunaPeran>;

export const skemaTugaskanPeran = t.Object({
  penggunaId: skema.teks("ID Pengguna", 100),
  peranIds: t.Array(skema.uuid("ID Peran"), { minItems: 1 }),
});
export type TugaskanPeranInput = Static<typeof skemaTugaskanPeran>;

export const skemaCabutPeran = t.Object({
  penggunaId: skema.teks("ID Pengguna", 100),
  peranId: skema.uuid("ID Peran"),
});
export type CabutPeranInput = Static<typeof skemaCabutPeran>;
