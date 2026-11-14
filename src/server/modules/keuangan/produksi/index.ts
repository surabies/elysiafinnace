import { Elysia, t } from "elysia";
import { ok } from "@/server/core/response";
import { cekKesehatanSistem } from "./health";
import { periksaIdempotency, simpanIdempotency } from "./idempotency";

export const rutaProduksi = new Elysia({ prefix: "/produksi", name: "keuangan.produksi" })
  .get(
    "/health",
    async () => ok(await cekKesehatanSistem()),
    {
      detail: { summary: "Health Check Sistem & Latensi Database", tags: ["Produksi"] },
    },
  )
  .post(
    "/idempotency/cek",
    async ({ body }) => {
      const res = await periksaIdempotency(body.kunci, body.metode, body.path, body.body);
      return ok(res);
    },
    {
      body: t.Object({
        kunci: t.String({ minLength: 8, maxLength: 128 }),
        metode: t.String(),
        path: t.String(),
        body: t.Any(),
      }),
      detail: { summary: "Cek Status Kunci Idempotensi", tags: ["Produksi"] },
    },
  )
  .post(
    "/idempotency/simpan",
    async ({ body }) => {
      await simpanIdempotency(
        body.kunci,
        body.penggunaId ?? null,
        body.metode,
        body.path,
        body.requestHash,
        body.statusHttp,
        body.responseBody,
      );
      return ok({ disimpan: true, kunci: body.kunci });
    },
    {
      body: t.Object({
        kunci: t.String({ minLength: 8, maxLength: 128 }),
        penggunaId: t.Optional(t.String()),
        metode: t.String(),
        path: t.String(),
        requestHash: t.String(),
        statusHttp: t.Integer(),
        responseBody: t.Any(),
      }),
      detail: { summary: "Simpan Respons Kunci Idempotensi", tags: ["Produksi"] },
    },
  );
