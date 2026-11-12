import { t } from "elysia";
import { skema } from "../shared/schema";

export const skemaQueryNeraca = t.Object({
  perTanggal: skema.tanggal("perTanggal"),
});

export const skemaQueryRentang = t.Object({
  dari: skema.tanggal("dari"),
  sampai: skema.tanggal("sampai"),
});
