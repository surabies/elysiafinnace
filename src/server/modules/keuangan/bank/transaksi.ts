import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import { skema } from "../shared/schema";
import {
  skemaBatalTransaksiBank,
  skemaQueryTransaksiBank,
  skemaSimpanTransaksiBank,
} from "./transaksi.model";
import * as layanan from "./transaksi.service";

const parameterId = t.Object({ id: skema.uuid("id") });

export const rutaTransaksiBank = new Elysia({ prefix: "/transaksi-bank", name: "keuangan.transaksi-bank" })
  .use(dasarKeuangan)
  .get("/", async ({ query }) => ok(await layanan.daftarTransaksiBank(query)), {
    beforeHandle: wajibIzin("kas_bank.baca"),
    query: skemaQueryTransaksiBank,
  })
  .get("/:id", async ({ params }) => ok(await layanan.ambilTransaksiBank(params.id)), {
    beforeHandle: wajibIzin("kas_bank.baca"),
    params: parameterId,
  })
  .post(
    "/",
    async ({ body, sesi, set }) => {
      const hasil = await layanan.buatTransaksiBank(body, sesi.penggunaId);
      set.status = 201;
      return ok(hasil);
    },
    { beforeHandle: wajibIzin("kas_bank.kelola"), body: skemaSimpanTransaksiBank },
  )
  .patch(
    "/:id",
    async ({ params, body, sesi }) => ok(await layanan.ubahTransaksiBank(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.kelola"),
      params: parameterId,
      body: skemaSimpanTransaksiBank,
    },
  )
  .delete("/:id", async ({ params }) => ok(await layanan.hapusTransaksiBank(params.id)), {
    beforeHandle: wajibIzin("kas_bank.kelola"),
    params: parameterId,
  })
  .post(
    "/:id/posting",
    async ({ params, sesi }) => ok(await layanan.postingTransaksiBank(params.id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.kelola"),
      params: parameterId,
    },
  )
  .post(
    "/:id/batal",
    async ({ params, body, sesi }) => ok(await layanan.batalTransaksiBank(params.id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("kas_bank.kelola"),
      params: parameterId,
      body: skemaBatalTransaksiBank,
    },
  );
