import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import {
  skemaCabutPeran,
  skemaQueryPenggunaPeran,
  skemaQueryPeran,
  skemaSimpanPeran,
  skemaTugaskanPeran,
  skemaUbahPeran,
} from "./model";
import {
  ambilAksesPenggunaDetail,
  ambilKatalogIzin,
  ambilPeran,
  buatPeran,
  cabutPeranPengguna,
  daftarPenggunaDanPeran,
  daftarPeran,
  hapusPeran,
  tugaskanPeranPengguna,
  ubahPeran,
} from "./service";

export const rutaRbac = new Elysia({ prefix: "/rbac", name: "keuangan.rbac" })
  .use(dasarKeuangan)

  // 1. Master Peran
  .get("/peran", ({ query }) => daftarPeran(query), {
    query: skemaQueryPeran,
    beforeHandle: wajibIzin("rbac.baca"),
    detail: { summary: "Daftar seluruh peran RBAC", tags: ["RBAC"] },
  })
  .post("/peran", ({ body, sesi }) => buatPeran(body, sesi.penggunaId), {
    body: skemaSimpanPeran,
    beforeHandle: wajibIzin("rbac.kelola"),
    detail: { summary: "Membuat peran kustom baru", tags: ["RBAC"] },
  })
  .get("/peran/:id", ({ params }) => ambilPeran(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("rbac.baca"),
    detail: { summary: "Detail peran beserta daftar izin", tags: ["RBAC"] },
  })
  .put("/peran/:id", ({ params, body, sesi }) => ubahPeran(params.id, body, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaUbahPeran,
    beforeHandle: wajibIzin("rbac.kelola"),
    detail: { summary: "Memperbarui data dan izin peran", tags: ["RBAC"] },
  })
  .delete("/peran/:id", ({ params }) => hapusPeran(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("rbac.kelola"),
    detail: { summary: "Menghapus peran kustom", tags: ["RBAC"] },
  })

  // 2. Katalog Izin
  .get("/katalog-izin", () => ambilKatalogIzin(), {
    beforeHandle: wajibIzin("rbac.baca"),
    detail: { summary: "Mengambil katalog seluruh izin sistem", tags: ["RBAC"] },
  })

  // 3. Penugasan Pengguna
  .get("/pengguna", ({ query }) => daftarPenggunaDanPeran(query), {
    query: skemaQueryPenggunaPeran,
    beforeHandle: wajibIzin("rbac.baca"),
    detail: { summary: "Daftar pengguna beserta peran aktif", tags: ["RBAC"] },
  })
  .post("/pengguna/peran", ({ body, sesi }) => tugaskanPeranPengguna(body, sesi.penggunaId), {
    body: skemaTugaskanPeran,
    beforeHandle: wajibIzin("rbac.kelola"),
    detail: { summary: "Menugaskan peran ke pengguna", tags: ["RBAC"] },
  })
  .delete("/pengguna/peran", ({ body }) => cabutPeranPengguna(body), {
    body: skemaCabutPeran,
    beforeHandle: wajibIzin("rbac.kelola"),
    detail: { summary: "Mencabut penugasan peran dari pengguna", tags: ["RBAC"] },
  })
  .get(
    "/pengguna/:id/akses",
    ({ params }) => ambilAksesPenggunaDetail(params.id),
    {
      params: t.Object({ id: t.String() }),
      beforeHandle: wajibIzin("rbac.baca"),
      detail: { summary: "Melihat izin dan peran efektif pengguna", tags: ["RBAC"] },
    },
  );
