import { Elysia } from "elysia";
import type { Izin } from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";
import { dapatkanSesi, type SesiPengguna } from "./context";
import { muatAksesPengguna, type AksesPengguna } from "./rbac";

export type SesiAkses = SesiPengguna & AksesPengguna;

/**
 * Plugin dasar setiap grup rute keuangan: wajib login + memuat izin RBAC ke `sesi`.
 * Penanganan error ada di plugin global `plugins/error-handler.ts`.
 */
export const dasarKeuangan = new Elysia({ name: "keuangan.dasar" }).derive(
  { as: "scoped" },
  async ({ request }) => {
    const pengguna = await dapatkanSesi(request.headers);
    if (!pengguna) throw galat.belumLogin();
    const akses = await muatAksesPengguna(pengguna.penggunaId);
    const sesi: SesiAkses = { ...pengguna, ...akses };
    return { sesi };
  },
);

export const punyaIzin = (sesi: SesiAkses, izin: Izin) => sesi.aksesPenuh || sesi.izin.has(izin);

/** Melempar 403 bila pengguna tidak memiliki SEMUA izin yang diminta. */
export function pastikanIzin(sesi: SesiAkses, ...izin: Izin[]) {
  const kurang = izin.filter((i) => !punyaIzin(sesi, i));
  if (kurang.length > 0) {
    throw galat.tidakBerwenang(
      `Anda tidak memiliki hak akses untuk tindakan ini (dibutuhkan izin: ${kurang.join(", ")}).`,
      { izinDibutuhkan: kurang },
    );
  }
}

/** Hook `beforeHandle` per rute:  .post("/", h, { beforeHandle: wajibIzin("jurnal.kelola") }) */
export const wajibIzin =
  (...izin: Izin[]) =>
  ({ sesi }: { sesi: SesiAkses }) => {
    pastikanIzin(sesi, ...izin);
  };

/**
 * Hook grup rute berdasarkan metode HTTP:
 * GET/HEAD membutuhkan `<modul>.baca`, metode lain `<modul>.kelola`.
 */
export const izinPerMetode =
  (
    modul:
      | "master_data"
      | "persediaan"
      | "jurnal"
      | "biaya"
      | "pembelian"
      | "penjualan"
      | "pembayaran"
      | "kas_bank"
      | "pajak"
      | "aset_tetap"
      | "dimensi"
      | "anggaran"
      | "periode"
      | "rbac"
      | "perusahaan"
      | "otomasi"
      | "integrasi",
  ) =>
  ({ sesi, request }: { sesi: SesiAkses; request: Request }) => {
    const baca = request.method === "GET" || request.method === "HEAD";
    pastikanIzin(sesi, `${modul}.${baca ? "baca" : "kelola"}` as Izin);
  };
