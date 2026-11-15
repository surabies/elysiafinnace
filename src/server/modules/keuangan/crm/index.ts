import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import {
  skemaPindahStageDeal,
  skemaQueryAktivitas,
  skemaQueryDeal,
  skemaQueryLead,
  skemaSimpanAktivitas,
  skemaSimpanDeal,
  skemaSimpanLead,
  skemaUbahDeal,
  skemaUbahLead,
} from "./model";
import {
  ambilDeal,
  ambilLead,
  daftarAktivitas,
  daftarDeals,
  daftarLeads,
  konversiLeadKeKontak,
  pindahStageDeal,
  simpanAktivitas,
  simpanDeal,
  simpanLead,
  ubahDeal,
  ubahLead,
} from "./service";

export const rutaCrm = new Elysia({ prefix: "/crm", name: "keuangan.crm" })
  .use(dasarKeuangan)

  // 1. Prospek / Leads
  .get("/lead", ({ query }) => daftarLeads(query), {
    query: skemaQueryLead,
    beforeHandle: wajibIzin("crm.baca"),
    detail: { summary: "Daftar prospek / leads CRM", tags: ["CRM (Customer Relationship)"] },
  })
  .get("/lead/:id", ({ params }) => ambilLead(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("crm.baca"),
    detail: { summary: "Detail prospek / lead CRM", tags: ["CRM (Customer Relationship)"] },
  })
  .post("/lead", ({ body, sesi }) => simpanLead(body, sesi.penggunaId), {
    body: skemaSimpanLead,
    beforeHandle: wajibIzin("crm.kelola"),
    detail: { summary: "Menambahkan prospek / lead baru", tags: ["CRM (Customer Relationship)"] },
  })
  .put("/lead/:id", ({ params, body, sesi }) => ubahLead(params.id, body, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaUbahLead,
    beforeHandle: wajibIzin("crm.kelola"),
    detail: { summary: "Memperbarui data lead prospek", tags: ["CRM (Customer Relationship)"] },
  })
  .post("/lead/:id/konversi", ({ params, sesi }) => konversiLeadKeKontak(params.id, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("crm.kelola"),
    detail: { summary: "Konversi prospek lead menjadi kontak pelanggan master", tags: ["CRM (Customer Relationship)"] },
  })

  // 2. Pipeline Peluang / Deals
  .get("/deal", ({ query }) => daftarDeals(query), {
    query: skemaQueryDeal,
    beforeHandle: wajibIzin("crm.baca"),
    detail: { summary: "Daftar peluang penjualan / deals CRM", tags: ["CRM (Customer Relationship)"] },
  })
  .get("/deal/:id", ({ params }) => ambilDeal(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("crm.baca"),
    detail: { summary: "Detail peluang penjualan / deal CRM", tags: ["CRM (Customer Relationship)"] },
  })
  .post("/deal", ({ body, sesi }) => simpanDeal(body, sesi.penggunaId), {
    body: skemaSimpanDeal,
    beforeHandle: wajibIzin("crm.kelola"),
    detail: { summary: "Menambahkan deal penjualan baru", tags: ["CRM (Customer Relationship)"] },
  })
  .put("/deal/:id", ({ params, body, sesi }) => ubahDeal(params.id, body, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaUbahDeal,
    beforeHandle: wajibIzin("crm.kelola"),
    detail: { summary: "Memperbarui deal penjualan", tags: ["CRM (Customer Relationship)"] },
  })
  .patch("/deal/:id/stage", ({ params, body, sesi }) => pindahStageDeal(params.id, body.stage, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaPindahStageDeal,
    beforeHandle: wajibIzin("crm.kelola"),
    detail: { summary: "Memindahkan stage deal (Pipeline drag & drop)", tags: ["CRM (Customer Relationship)"] },
  })

  // 3. Aktivitas Interaksi CRM
  .get("/aktivitas", ({ query }) => daftarAktivitas(query), {
    query: skemaQueryAktivitas,
    beforeHandle: wajibIzin("crm.baca"),
    detail: { summary: "Riwayat log aktivitas komunikasi CRM", tags: ["CRM (Customer Relationship)"] },
  })
  .post("/aktivitas", ({ body, sesi }) => simpanAktivitas(body, sesi.penggunaId), {
    body: skemaSimpanAktivitas,
    beforeHandle: wajibIzin("crm.kelola"),
    detail: { summary: "Mencatat panggilan, rapat, atau task CRM baru", tags: ["CRM (Customer Relationship)"] },
  });
