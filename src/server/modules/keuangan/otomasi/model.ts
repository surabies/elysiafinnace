import { t } from "elysia";

export const skemaInputJadwalBerulang = t.Object({
  nama: t.String({ minLength: 3, maxLength: 150 }),
  jenis: t.Union([
    t.Literal("JURNAL"),
    t.Literal("FAKTUR_PENJUALAN"),
    t.Literal("FAKTUR_PEMBELIAN"),
  ]),
  frekuensi: t.Union([
    t.Literal("HARIAN"),
    t.Literal("MINGGUAN"),
    t.Literal("BULANAN"),
    t.Literal("TAHUNAN"),
  ]),
  tanggalMulai: t.String({ minLength: 10, maxLength: 10 }), // YYYY-MM-DD
  tanggalSelesai: t.Optional(t.String({ minLength: 10, maxLength: 10 })),
  templatePayload: t.Any(),
  catatan: t.Optional(t.String()),
});

export const skemaUbahJadwalBerulang = t.Partial(
  t.Object({
    nama: t.String({ minLength: 3, maxLength: 150 }),
    frekuensi: t.Union([
      t.Literal("HARIAN"),
      t.Literal("MINGGUAN"),
      t.Literal("BULANAN"),
      t.Literal("TAHUNAN"),
    ]),
    tanggalSelesai: t.Optional(t.String()),
    aktif: t.Boolean(),
    catatan: t.Optional(t.String()),
  }),
);

export const skemaEksekusiBerulang = t.Object({
  perTanggal: t.Optional(t.String()),
  jadwalId: t.Optional(t.String()),
});

export const skemaProsesPengingat = t.Object({
  perTanggal: t.String(),
  offsetsHari: t.Optional(t.Array(t.Integer())),
});

export const skemaInputApiKey = t.Object({
  nama: t.String({ minLength: 3, maxLength: 100 }),
  scopes: t.Array(t.String()),
  kedaluwarsaHari: t.Optional(t.Integer({ minimum: 1, maximum: 365 })),
});

export const skemaInputWebhook = t.Object({
  nama: t.String({ minLength: 3, maxLength: 100 }),
  url: t.String({ minLength: 10 }),
  events: t.Array(t.String()),
});

export const skemaUbahWebhook = t.Partial(
  t.Object({
    nama: t.String({ minLength: 3, maxLength: 100 }),
    url: t.String({ minLength: 10 }),
    events: t.Array(t.String()),
    aktif: t.Boolean(),
  }),
);
