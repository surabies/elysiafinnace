import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import { ok } from "@/server/core/response";
import {
  skemaEksekusiBerulang,
  skemaInputApiKey,
  skemaInputJadwalBerulang,
  skemaInputWebhook,
  skemaProsesPengingat,
  skemaUbahJadwalBerulang,
  skemaUbahWebhook,
} from "./model";
import * as layanan from "./service";

export const rutaOtomasi = new Elysia({ prefix: "/otomasi", name: "keuangan.otomasi" })
  .use(dasarKeuangan)

  // 1. Transaksi Berulang (Recurring Transactions)
  .get(
    "/jadwal",
    async ({ query }) => {
      const aktifBool = query.aktif !== undefined ? query.aktif === "true" : undefined;
      return ok(await layanan.daftarJadwalTransaksiBerulang({ aktif: aktifBool }));
    },
    {
      beforeHandle: wajibIzin("otomasi.baca"),
      query: t.Object({ aktif: t.Optional(t.String()) }),
      detail: { summary: "Daftar Jadwal Transaksi Berulang", tags: ["Otomasi"] },
    },
  )
  .get(
    "/jadwal/:id",
    async ({ params: { id } }) => ok(await layanan.ambilJadwalTransaksiBerulang(id)),
    {
      beforeHandle: wajibIzin("otomasi.baca"),
      params: t.Object({ id: t.String() }),
      detail: { summary: "Detail Jadwal Transaksi Berulang", tags: ["Otomasi"] },
    },
  )
  .post(
    "/jadwal",
    async ({ body, sesi }) =>
      ok(await layanan.buatJadwalTransaksiBerulang(body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("otomasi.kelola"),
      body: skemaInputJadwalBerulang,
      detail: { summary: "Buat Jadwal Transaksi Berulang", tags: ["Otomasi"] },
    },
  )
  .put(
    "/jadwal/:id",
    async ({ params: { id }, body, sesi }) =>
      ok(await layanan.ubahJadwalTransaksiBerulang(id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("otomasi.kelola"),
      params: t.Object({ id: t.String() }),
      body: skemaUbahJadwalBerulang,
      detail: { summary: "Ubah Jadwal Transaksi Berulang", tags: ["Otomasi"] },
    },
  )
  .post(
    "/eksekusi",
    async ({ body, sesi }) =>
      ok(await layanan.eksekusiTransaksiBerulang(body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("otomasi.kelola"),
      body: skemaEksekusiBerulang,
      detail: { summary: "Eksekusi Batch Transaksi Berulang", tags: ["Otomasi"] },
    },
  )

  // 2. Pengingat Jatuh Tempo (Due Date Email Reminders)
  .post(
    "/pengingat/proses",
    async ({ body }) => ok(await layanan.prosesPengingatJatuhTempo(body)),
    {
      beforeHandle: wajibIzin("otomasi.kelola"),
      body: skemaProsesPengingat,
      detail: { summary: "Proses Pengiriman Email Pengingat Jatuh Tempo", tags: ["Otomasi"] },
    },
  )
  .get(
    "/pengingat/log",
    async ({ query }) => ok(await layanan.daftarLogPengingat(query.dokumenId)),
    {
      beforeHandle: wajibIzin("otomasi.baca"),
      query: t.Object({ dokumenId: t.Optional(t.String()) }),
      detail: { summary: "Daftar Riwayat Pengiriman Pengingat", tags: ["Otomasi"] },
    },
  )

  // 3. API Keys (Pihak Ketiga)
  .get(
    "/api-keys",
    async () => ok(await layanan.daftarApiKey()),
    {
      beforeHandle: wajibIzin("integrasi.kelola"),
      detail: { summary: "Daftar Kunci API Pihak Ketiga", tags: ["Integrasi"] },
    },
  )
  .post(
    "/api-keys",
    async ({ body, sesi }) => ok(await layanan.buatApiKey(body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("integrasi.kelola"),
      body: skemaInputApiKey,
      detail: { summary: "Buat Kunci API Baru", tags: ["Integrasi"] },
    },
  )
  .delete(
    "/api-keys/:id",
    async ({ params: { id }, sesi }) => ok(await layanan.cabutApiKey(id, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("integrasi.kelola"),
      params: t.Object({ id: t.String() }),
      detail: { summary: "Cabut / Nonaktifkan Kunci API", tags: ["Integrasi"] },
    },
  )

  // 4. Webhooks
  .get(
    "/webhooks",
    async () => ok(await layanan.daftarWebhook()),
    {
      beforeHandle: wajibIzin("integrasi.kelola"),
      detail: { summary: "Daftar Webhook Pihak Ketiga", tags: ["Integrasi"] },
    },
  )
  .post(
    "/webhooks",
    async ({ body, sesi }) => ok(await layanan.buatWebhook(body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("integrasi.kelola"),
      body: skemaInputWebhook,
      detail: { summary: "Daftarkan Webhook Baru", tags: ["Integrasi"] },
    },
  )
  .put(
    "/webhooks/:id",
    async ({ params: { id }, body, sesi }) =>
      ok(await layanan.ubahWebhook(id, body, sesi.penggunaId)),
    {
      beforeHandle: wajibIzin("integrasi.kelola"),
      params: t.Object({ id: t.String() }),
      body: skemaUbahWebhook,
      detail: { summary: "Ubah Konfigurasi Webhook", tags: ["Integrasi"] },
    },
  )
  .delete(
    "/webhooks/:id",
    async ({ params: { id } }) => ok(await layanan.hapusWebhook(id)),
    {
      beforeHandle: wajibIzin("integrasi.kelola"),
      params: t.Object({ id: t.String() }),
      detail: { summary: "Hapus Webhook", tags: ["Integrasi"] },
    },
  );
