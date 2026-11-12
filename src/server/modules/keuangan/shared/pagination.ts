import { t } from "elysia";

/** Query string paginasi + pencarian standar untuk endpoint daftar. */
export const skemaHalaman = {
  halaman: t.Optional(t.Numeric({ minimum: 1, error: "halaman harus angka >= 1." })),
  ukuran: t.Optional(t.Numeric({ minimum: 1, maximum: 200, error: "ukuran harus angka 1-200." })),
  q: t.Optional(t.String({ maxLength: 100 })),
};

export function bacaHalaman(query: { halaman?: number; ukuran?: number }) {
  const halaman = query.halaman ?? 1;
  const ukuran = query.ukuran ?? 50;
  return { halaman, ukuran, offset: (halaman - 1) * ukuran };
}
