import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import {
  skemaAksiPersetujuan,
  skemaAturAksesCabang,
  skemaAturAksesGudang,
  skemaQueryAturanPersetujuan,
  skemaQueryAuditLog,
  skemaQueryPersetujuan,
  skemaQueryPerusahaan,
  skemaSimpanAturanPersetujuan,
  skemaSimpanKunciTransaksi,
  skemaSimpanPerusahaan,
  skemaTerimaUndangan,
  skemaUbahAturanPersetujuan,
  skemaUbahPerusahaan,
  skemaUndangPengguna,
} from "./model";
import {
  ambilAksesCabangPengguna,
  ambilAksesGudangPengguna,
  ambilAuditLog,
  ambilDetailPersetujuan,
  ambilKunciTransaksi,
  ambilPerusahaan,
  aturAksesCabangPengguna,
  aturAksesGudangPengguna,
  batalkanUndangan,
  buatAturanPersetujuan,
  buatPerusahaan,
  buatUndangan,
  daftarAturanPersetujuan,
  daftarAuditLog,
  daftarPersetujuanDokumen,
  daftarPerusahaan,
  daftarUndangan,
  hapusAturanPersetujuan,
  prosesAksiPersetujuan,
  simpanKunciTransaksi,
  terimaUndangan,
  ubahAturanPersetujuan,
  ubahPerusahaan,
} from "./service";

export const rutaKontrol = new Elysia({ prefix: "/kontrol", name: "keuangan.kontrol" })
  .use(dasarKeuangan)

  // 1. Perusahaan (Multi-Company / Tenant)
  .get("/perusahaan", ({ query }) => daftarPerusahaan(query), {
    query: skemaQueryPerusahaan,
    beforeHandle: wajibIzin("perusahaan.baca"),
    detail: { summary: "Daftar perusahaan dan grup holding", tags: ["Kontrol & Tata Kelola"] },
  })
  .post("/perusahaan", ({ body, sesi }) => buatPerusahaan(body, sesi.penggunaId), {
    body: skemaSimpanPerusahaan,
    beforeHandle: wajibIzin("perusahaan.kelola"),
    detail: { summary: "Mendaftarkan perusahaan atau entitas baru", tags: ["Kontrol & Tata Kelola"] },
  })
  .get("/perusahaan/:id", ({ params }) => ambilPerusahaan(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("perusahaan.baca"),
    detail: { summary: "Detail profil perusahaan dan anak perusahaan", tags: ["Kontrol & Tata Kelola"] },
  })
  .put("/perusahaan/:id", ({ params, body, sesi }) => ubahPerusahaan(params.id, body, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaUbahPerusahaan,
    beforeHandle: wajibIzin("perusahaan.kelola"),
    detail: { summary: "Memperbarui profil perusahaan", tags: ["Kontrol & Tata Kelola"] },
  })

  // 2. Undangan Pengguna ke Perusahaan
  .post("/undangan", ({ body, sesi }) => buatUndangan(body, sesi.penggunaId), {
    body: skemaUndangPengguna,
    beforeHandle: wajibIzin("perusahaan.kelola"),
    detail: { summary: "Mengundang pengguna baru ke perusahaan", tags: ["Kontrol & Tata Kelola"] },
  })
  .post("/undangan/terima", ({ body, sesi }) => terimaUndangan(body.token, sesi.penggunaId), {
    body: skemaTerimaUndangan,
    detail: { summary: "Menerima undangan keikutsertaan perusahaan", tags: ["Kontrol & Tata Kelola"] },
  })
  .delete("/undangan/:id", ({ params, sesi }) => batalkanUndangan(params.id, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("perusahaan.kelola"),
    detail: { summary: "Membatalkan undangan pengguna", tags: ["Kontrol & Tata Kelola"] },
  })
  .get("/undangan/:perusahaanId", ({ params }) => daftarUndangan(params.perusahaanId), {
    params: t.Object({ perusahaanId: t.String() }),
    beforeHandle: wajibIzin("perusahaan.baca"),
    detail: { summary: "Daftar status undangan perusahaan", tags: ["Kontrol & Tata Kelola"] },
  })

  // 3. Pembatasan Akses Cabang & Gudang
  .post("/akses-cabang", ({ body, sesi }) => aturAksesCabangPengguna(body, sesi.penggunaId), {
    body: skemaAturAksesCabang,
    beforeHandle: wajibIzin("perusahaan.kelola"),
    detail: { summary: "Mengatur pembatasan akses cabang per pengguna", tags: ["Kontrol & Tata Kelola"] },
  })
  .get("/akses-cabang/:penggunaId", ({ params }) => ambilAksesCabangPengguna(params.penggunaId), {
    params: t.Object({ penggunaId: t.String() }),
    beforeHandle: wajibIzin("perusahaan.baca"),
    detail: { summary: "Melihat cabang yang dapat diakses pengguna", tags: ["Kontrol & Tata Kelola"] },
  })
  .post("/akses-gudang", ({ body, sesi }) => aturAksesGudangPengguna(body, sesi.penggunaId), {
    body: skemaAturAksesGudang,
    beforeHandle: wajibIzin("perusahaan.kelola"),
    detail: { summary: "Mengatur pembatasan akses gudang per pengguna", tags: ["Kontrol & Tata Kelola"] },
  })
  .get("/akses-gudang/:penggunaId", ({ params }) => ambilAksesGudangPengguna(params.penggunaId), {
    params: t.Object({ penggunaId: t.String() }),
    beforeHandle: wajibIzin("perusahaan.baca"),
    detail: { summary: "Melihat gudang yang dapat diakses pengguna", tags: ["Kontrol & Tata Kelola"] },
  })

  // 4. Audit Log (Jejak Perubahan)
  .get("/audit", ({ query }) => daftarAuditLog(query), {
    query: skemaQueryAuditLog,
    beforeHandle: wajibIzin("audit.baca"),
    detail: { summary: "Riwayat jejak audit log aktivitas", tags: ["Audit Log"] },
  })
  .get("/audit/:id", ({ params }) => ambilAuditLog(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("audit.baca"),
    detail: { summary: "Detail audit log sebelum dan sesudah perubahan", tags: ["Audit Log"] },
  })

  // 5. Alur Persetujuan Bertingkat (Approval Workflow)
  .get("/persetujuan/aturan", ({ query }) => daftarAturanPersetujuan(query), {
    query: skemaQueryAturanPersetujuan,
    beforeHandle: wajibIzin("persetujuan.kelola"),
    detail: { summary: "Daftar konfigurasi aturan persetujuan", tags: ["Persetujuan"] },
  })
  .post("/persetujuan/aturan", ({ body, sesi }) => buatAturanPersetujuan(body, sesi.penggunaId), {
    body: skemaSimpanAturanPersetujuan,
    beforeHandle: wajibIzin("persetujuan.kelola"),
    detail: { summary: "Menambahkan aturan alur persetujuan baru", tags: ["Persetujuan"] },
  })
  .put("/persetujuan/aturan/:id", ({ params, body, sesi }) => ubahAturanPersetujuan(params.id, body, sesi.penggunaId), {
    params: t.Object({ id: t.String() }),
    body: skemaUbahAturanPersetujuan,
    beforeHandle: wajibIzin("persetujuan.kelola"),
    detail: { summary: "Memperbarui aturan persetujuan", tags: ["Persetujuan"] },
  })
  .delete("/persetujuan/aturan/:id", ({ params }) => hapusAturanPersetujuan(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("persetujuan.kelola"),
    detail: { summary: "Menghapus aturan persetujuan", tags: ["Persetujuan"] },
  })
  .get("/persetujuan/dokumen", ({ query }) => daftarPersetujuanDokumen(query), {
    query: skemaQueryPersetujuan,
    beforeHandle: wajibIzin("persetujuan.eksekusi"),
    detail: { summary: "Daftar pengajuan persetujuan dokumen", tags: ["Persetujuan"] },
  })
  .get("/persetujuan/dokumen/:id", ({ params }) => ambilDetailPersetujuan(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("persetujuan.eksekusi"),
    detail: { summary: "Detail dan riwayat aksi pengajuan persetujuan", tags: ["Persetujuan"] },
  })
  .post(
    "/persetujuan/aksi",
    ({ body, sesi }) => prosesAksiPersetujuan(body, sesi.penggunaId, sesi.nama),
    {
      body: skemaAksiPersetujuan,
      beforeHandle: wajibIzin("persetujuan.eksekusi"),
      detail: { summary: "Menyetujui atau menolak dokumen", tags: ["Persetujuan"] },
    },
  )

  // 6. Kunci Tanggal Transaksi (Lock Date)
  .get("/kunci-transaksi", ({ query }) => ambilKunciTransaksi(query.perusahaanId), {
    query: t.Object({ perusahaanId: t.Optional(t.String()) }),
    beforeHandle: wajibIzin("periode.baca"),
    detail: { summary: "Melihat konfigurasi tanggal kunci transaksi", tags: ["Kontrol & Tata Kelola"] },
  })
  .post("/kunci-transaksi", ({ body, sesi }) => simpanKunciTransaksi(body, sesi.penggunaId), {
    body: skemaSimpanKunciTransaksi,
    beforeHandle: wajibIzin("kunci_transaksi.kelola"),
    detail: { summary: "Menyimpan batas tanggal penguncian transaksi buku", tags: ["Kontrol & Tata Kelola"] },
  });
