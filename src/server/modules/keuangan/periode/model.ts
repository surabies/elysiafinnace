import { t } from "elysia";

export const skemaQueryPeriode = t.Object({
  tahun: t.Optional(t.Numeric({ minimum: 2000, maximum: 2100 })),
});

export const skemaSiapkanPeriode = t.Object({
  tahun: t.Numeric({ minimum: 2000, maximum: 2100 }),
});

export const skemaTutupBukuTahunan = t.Object({
  tahun: t.Numeric({ minimum: 2000, maximum: 2100 }),
  keterangan: t.Optional(t.String({ maxLength: 500 })),
});

export const skemaParamTahun = t.Object({
  tahun: t.Numeric({ minimum: 2000, maximum: 2100 }),
});
