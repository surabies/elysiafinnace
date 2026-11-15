import { t } from "elysia";

export const skemaUbahPenomoran = t.Object({
  nilaiTerakhir: t.Numeric({
    minimum: 0,
    description: "Nomor urut counter terakhir (angka sebelum nomor berikutnya diterbitkan)",
  }),
  tahun: t.Optional(
    t.Numeric({
      minimum: 2000,
      maximum: 2100,
      description: "Tahun periode dokumen (default: tahun berjalan)",
    }),
  ),
});

export const skemaQueryPenomoran = t.Object({
  tahun: t.Optional(t.Numeric({ minimum: 2000, maximum: 2100 })),
});

export const skemaQueryNomorBerikutnya = t.Object({
  prefiks: t.String({ minLength: 1, maxLength: 20, description: "Prefiks dokumen (mis. CUST, SUPP, PRD, FJ)" }),
  tahun: t.Optional(t.Numeric({ minimum: 2000, maximum: 2100 })),
});

export type UbahPenomoranInput = typeof skemaUbahPenomoran.static;
export type QueryNomorBerikutnyaInput = typeof skemaQueryNomorBerikutnya.static;
