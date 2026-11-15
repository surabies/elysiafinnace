import { Elysia, t } from "elysia";
import { dasarKeuangan, wajibIzin } from "../shared/access";
import {
  skemaBukaShift,
  skemaQueryShift,
  skemaSimpanOrderPos,
  skemaSimpanRegister,
  skemaTutupShift,
} from "./model";
import {
  ambilDetailOrderPos,
  ambilShiftAktif,
  bukaShift,
  daftarRegister,
  daftarShift,
  prosesTransaksiPos,
  simpanRegister,
  tutupShift,
} from "./service";

export const rutaPos = new Elysia({ prefix: "/pos", name: "keuangan.pos" })
  .use(dasarKeuangan)

  // 1. Master Data Mesin Kasir / Register
  .get("/register", () => daftarRegister(), {
    beforeHandle: wajibIzin("pos.kasir"),
    detail: { summary: "Daftar terminal register kasir", tags: ["Point of Sale (POS)"] },
  })
  .post("/register", ({ body, sesi }) => simpanRegister(body, sesi.penggunaId), {
    body: skemaSimpanRegister,
    beforeHandle: wajibIzin("pos.kelola"),
    detail: { summary: "Mendaftarkan terminal kasir baru", tags: ["Point of Sale (POS)"] },
  })

  // 2. Manajemen Shift Kasir
  .get("/shift/aktif/:registerId", ({ params }) => ambilShiftAktif(params.registerId), {
    params: t.Object({ registerId: t.String() }),
    beforeHandle: wajibIzin("pos.kasir"),
    detail: { summary: "Mengecek status shift aktif pada register kasir", tags: ["Point of Sale (POS)"] },
  })
  .post("/shift/buka", ({ body, sesi }) => bukaShift(body, sesi.penggunaId, sesi.nama || "Kasir"), {
    body: skemaBukaShift,
    beforeHandle: wajibIzin("pos.kasir"),
    detail: { summary: "Membuka shift kerja kasir dengan modal awal kas", tags: ["Point of Sale (POS)"] },
  })
  .post("/shift/tutup", ({ body }) => tutupShift(body), {
    body: skemaTutupShift,
    beforeHandle: wajibIzin("pos.kasir"),
    detail: { summary: "Menutup shift kasir dan rekonsiliasi kas fisik", tags: ["Point of Sale (POS)"] },
  })
  .get("/shift", ({ query }) => daftarShift(query), {
    query: skemaQueryShift,
    beforeHandle: wajibIzin("pos.kelola"),
    detail: { summary: "Riwayat seluruh shift kasir & audit selisih kas", tags: ["Point of Sale (POS)"] },
  })

  // 3. Checkout & Pemrosesan Order Kasir
  .post("/order", ({ body, sesi }) => prosesTransaksiPos(body, sesi.penggunaId, sesi.nama || "Kasir"), {
    body: skemaSimpanOrderPos,
    beforeHandle: wajibIzin("pos.kasir"),
    detail: { summary: "Memproses transaksi penjualan kasir (Checkout, kurangi stok gudang, auto-jurnal)", tags: ["Point of Sale (POS)"] },
  })
  .get("/order/:id", ({ params }) => ambilDetailOrderPos(params.id), {
    params: t.Object({ id: t.String() }),
    beforeHandle: wajibIzin("pos.kasir"),
    detail: { summary: "Ambil detail struk dan item transaksi POS", tags: ["Point of Sale (POS)"] },
  });
