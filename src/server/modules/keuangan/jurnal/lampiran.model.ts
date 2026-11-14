import { t, type Static } from "elysia";
import { skema } from "../shared/schema";

export const skemaSimpanLampiran = t.Object({
  namaFile: skema.teks("namaFile", 255),
  ukuranBytes: t.Optional(t.Integer({ minimum: 0, error: "ukuranBytes tidak boleh negatif." })),
  mimeType: skema.teks("mimeType", 100),
  url: skema.teks("url", 1000),
  keterangan: skema.teksOpsional("keterangan", 500),
});
export type InputSimpanLampiran = Static<typeof skemaSimpanLampiran>;
