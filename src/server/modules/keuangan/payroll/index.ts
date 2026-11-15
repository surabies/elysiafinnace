import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import {
  skemaBayarPayroll,
  skemaProsesHitungPayroll,
  skemaQueryKaryawan,
  skemaQueryPayroll,
  skemaSimpanKaryawan,
  skemaSimpanKomponenGaji,
  skemaUbahKaryawan,
} from "./model";
import {
  ambilDetailPayroll,
  ambilKaryawan,
  bayarDanPostingPayroll,
  daftarKaryawan,
  daftarKomponenGaji,
  daftarPayroll,
  hapusKaryawan,
  prosesHitungPayroll,
  simpanKaryawan,
  simpanKomponenGaji,
  ubahKaryawan,
} from "./service";

export const rutaPayroll = new Elysia({ prefix: "/payroll", name: "keuangan.payroll" })
  .use(dasarKeuangan)

  // 1. Master Data Karyawan
  .get("/karyawan", ({ query }) => daftarKaryawan(query), {
    query: skemaQueryKaryawan,
    beforeHandle: wajibIzin("payroll.baca"),
    detail: { summary: "Daftar direktori karyawan", tags: ["Payroll & HR"] },
  })
  .post("/karyawan", ({ body, sesi }) => simpanKaryawan(body, sesi.penggunaId), {
    body: skemaSimpanKaryawan,
    beforeHandle: wajibIzin("payroll.kelola"),
    detail: { summary: "Mendaftarkan karyawan baru", tags: ["Payroll & HR"] },
  })
  .get("/karyawan/:id", ({ params }) => ambilKaryawan(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("payroll.baca"),
    detail: { summary: "Detail biodata dan gaji pokok karyawan", tags: ["Payroll & HR"] },
  })
  .put("/karyawan/:id", ({ params, body, sesi }) => ubahKaryawan(params.id, body, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaUbahKaryawan,
    beforeHandle: wajibIzin("payroll.kelola"),
    detail: { summary: "Memperbarui profil dan struktur gaji karyawan", tags: ["Payroll & HR"] },
  })
  .delete("/karyawan/:id", ({ params }) => hapusKaryawan(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("payroll.kelola"),
    detail: { summary: "Menghapus atau menonaktifkan karyawan", tags: ["Payroll & HR"] },
  })

  // 2. Master Komponen Gaji
  .get("/komponen", () => daftarKomponenGaji(), {
    beforeHandle: wajibIzin("payroll.baca"),
    detail: { summary: "Daftar komponen tunjangan dan potongan gaji", tags: ["Payroll & HR"] },
  })
  .post("/komponen", ({ body, sesi }) => simpanKomponenGaji(body, sesi.penggunaId), {
    body: skemaSimpanKomponenGaji,
    beforeHandle: wajibIzin("payroll.kelola"),
    detail: { summary: "Menambahkan atau memperbarui komponen gaji", tags: ["Payroll & HR"] },
  })

  // 3. Batch Proses Penggajian (Run Payroll)
  .get("/proses", ({ query }) => daftarPayroll(query), {
    query: skemaQueryPayroll,
    beforeHandle: wajibIzin("payroll.baca"),
    detail: { summary: "Daftar riwayat batch penggajian bulanan", tags: ["Payroll & HR"] },
  })
  .post("/proses/hitung", ({ body, sesi }) => prosesHitungPayroll(body, sesi.penggunaId), {
    body: skemaProsesHitungPayroll,
    beforeHandle: wajibIzin("payroll.kelola"),
    detail: { summary: "Menghitung batch payroll bulanan (Draft)", tags: ["Payroll & HR"] },
  })
  .get("/proses/:id", ({ params }) => ambilDetailPayroll(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("payroll.baca"),
    detail: { summary: "Detail payroll batch beserta slip gaji per karyawan", tags: ["Payroll & HR"] },
  })
  .post("/proses/bayar", ({ body, sesi }) => bayarDanPostingPayroll(body.payrollId, sesi.penggunaId), {
    body: skemaBayarPayroll,
    beforeHandle: wajibIzin("payroll.bayar"),
    detail: { summary: "Mengeksekusi pembayaran payroll dan memposting jurnal otomatis", tags: ["Payroll & HR"] },
  });
