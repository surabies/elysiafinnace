import { t } from "elysia";

export const skemaOnboarding = t.Object({
  namaPerusahaan: t.String({ minLength: 3, maxLength: 200 }),
  alamat: t.Optional(t.String()),
  telepon: t.Optional(t.String()),
  email: t.Optional(t.String()),
  npwp: t.Optional(t.String()),
  templateCoa: t.Union([
    t.Literal("TRADING"),
    t.Literal("SERVICE"),
    t.Literal("MANUFACTURING"),
    t.Literal("MINIMAL"),
  ]),
  rekeningAwal: t.Optional(
    t.Object({
      namaBank: t.String(),
      nomorRekening: t.String(),
      atasNama: t.Optional(t.String()),
      saldoAwal: t.Optional(t.String()),
    })
  ),
  muatDataDemo: t.Optional(t.Boolean()),
});

export type InputOnboarding = typeof skemaOnboarding.static;
