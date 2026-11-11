import { t } from "elysia";
import { skema } from "../_umum";

export const skemaQueryPeriode = t.Object({
  tahun: t.Optional(t.Numeric({ minimum: 2000, maximum: 2100 })),
});

export const skemaSiapkanPeriode = t.Object({
  tahun: t.Numeric({ minimum: 2000, maximum: 2100 }),
});
