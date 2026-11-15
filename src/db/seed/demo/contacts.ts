import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  currencies,
  partnerAddresses,
  partnerContacts,
  partners,
  paymentTerms,
} from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export interface HasilDemoKontak {
  pelangganMegaId: string;
  pelangganBerkahId: string;
  pelangganGlobalId: string;
  pemasokIndofoodId: string;
  pemasokPrimaId: string;
  pemasokUtilitasId: string;
}

export async function seedDemoContacts(db: Db): Promise<HasilDemoKontak> {
  console.log("  [demo] Menyiapkan master Kontak (Pelanggan & Pemasok)...");

  const [idr] = await db
    .select({ id: currencies.id })
    .from(currencies)
    .where(eq(currencies.kode, "IDR"));

  if (!idr) throw new Error("Mata uang IDR tidak ditemukan.");

  const termNet30 = await db
    .select({ id: paymentTerms.id })
    .from(paymentTerms)
    .where(eq(paymentTerms.kode, "NET-30"))
    .then((r) => r[0]);

  const termNet14 = await db
    .select({ id: paymentTerms.id })
    .from(paymentTerms)
    .where(eq(paymentTerms.kode, "NET-14"))
    .then((r) => r[0]);

  const termTunai = await db
    .select({ id: paymentTerms.id })
    .from(paymentTerms)
    .where(eq(paymentTerms.kode, "TUNAI"))
    .then((r) => r[0]);

  const termDiskon = await db
    .select({ id: paymentTerms.id })
    .from(paymentTerms)
    .where(eq(paymentTerms.kode, "2/10-NET-30"))
    .then((r) => r[0]);

  const DAFTAR_KONTAK = [
    // Pelanggan
    {
      kode: "CUST-001",
      nama: "PT Mega Retailindo Mandiri",
      adalahPelanggan: true,
      adalahPemasok: false,
      npwp: "01.111.222.3-031.000",
      adalahPkp: true,
      grup: "Modern Trade / Supermarket",
      namaKontak: "Siti Rahma (Procurement)",
      email: "procurement@megaretailindo.co.id",
      telepon: "021-4567890",
      alamat: "Jl. Hayam Wuruk No. 108, Glodok",
      kota: "Jakarta Barat",
      provinsi: "DKI Jakarta",
      kodePos: "11180",
      terminPembayaranId: termNet30?.id,
      mataUangId: idr.id,
      batasKredit: "500000000",
      catatan: "Pelanggan VIP jaringan retail modern nasional",
    },
    {
      kode: "CUST-002",
      nama: "Toko Grosir Berkah Sejahtera",
      adalahPelanggan: true,
      adalahPemasok: false,
      npwp: null,
      adalahPkp: false,
      grup: "Traditional Trade",
      namaKontak: "H. Ridwan",
      email: "tokoberkah.bandung@gmail.com",
      telepon: "022-7201928",
      alamat: "Pasar Baru Trade Center Lt. Dasar Blok B No. 12",
      kota: "Bandung",
      provinsi: "Jawa Barat",
      kodePos: "40181",
      terminPembayaranId: termTunai?.id,
      mataUangId: idr.id,
      batasKredit: "50000000",
      catatan: "Pelanggan grosir pasar tradisional Bandung",
    },
    {
      kode: "CUST-003",
      nama: "PT Global Distribusi Sentosa",
      adalahPelanggan: true,
      adalahPemasok: false,
      npwp: "02.333.444.5-042.000",
      adalahPkp: true,
      grup: "Distributor Regional",
      namaKontak: "Rudi Hartono (Finance)",
      email: "finance@globaldistribusi.com",
      telepon: "031-8419200",
      alamat: "Kompleks Pergudangan Margomulyo Permai Blok C-15",
      kota: "Surabaya",
      provinsi: "Jawa Timur",
      kodePos: "60186",
      terminPembayaranId: termDiskon?.id,
      mataUangId: idr.id,
      batasKredit: "1000000000",
      catatan: "Distributor utama Jawa Timur & Bali",
    },

    // Pemasok
    {
      kode: "VEND-001",
      nama: "PT Indofood Sukses Makmur Tbk",
      adalahPelanggan: false,
      adalahPemasok: true,
      npwp: "01.999.888.7-051.000",
      adalahPkp: true,
      grup: "Pemasok Utama",
      namaKontak: "Andi Wijaya (Key Account)",
      email: "order@indofood.co.id",
      telepon: "021-57958822",
      alamat: "Sudirman Plaza, Indofood Tower Lt. 27",
      kota: "Jakarta Selatan",
      provinsi: "DKI Jakarta",
      kodePos: "12910",
      terminPembayaranId: termNet30?.id,
      mataUangId: idr.id,
      batasKredit: "2000000000",
      catatan: "Principal FMCG Tier-1",
    },
    {
      kode: "VEND-002",
      nama: "CV Prima Kemasan Nusantara",
      adalahPelanggan: false,
      adalahPemasok: true,
      npwp: "03.777.666.5-062.000",
      adalahPkp: true,
      grup: "Pemasok Kemasan",
      namaKontak: "Hendra Kurniawan",
      email: "sales@primakemasan.co.id",
      telepon: "021-5901234",
      alamat: "Jl. Raya Serang Km 12, Cikupa",
      kota: "Tangerang",
      provinsi: "Banten",
      kodePos: "15710",
      terminPembayaranId: termNet14?.id,
      mataUangId: idr.id,
      batasKredit: "150000000",
      catatan: "Pemasok karton box, kemasan, lakban, dan bubble wrap",
    },
    {
      kode: "VEND-003",
      nama: "PT Telekomunikasi Indonesia Tbk & PLN",
      adalahPelanggan: false,
      adalahPemasok: true,
      npwp: "01.555.444.3-071.000",
      adalahPkp: true,
      grup: "Utilitas & Kantor",
      namaKontak: "Customer Corporate Service",
      email: "billing@telkom.co.id",
      telepon: "147",
      alamat: "Gedung Telkom Landmark Tower, Jl. Gatot Subroto",
      kota: "Jakarta Selatan",
      provinsi: "DKI Jakarta",
      kodePos: "12710",
      terminPembayaranId: termTunai?.id,
      mataUangId: idr.id,
      batasKredit: "0",
      catatan: "Penyedia internet fiber optic & utilitas listrik kantor",
    },
  ];

  for (const k of DAFTAR_KONTAK) {
    await db.insert(partners).values(k).onConflictDoNothing({ target: partners.kode });
  }

  const [pMega] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-001"));
  const [pBerkah] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-002"));
  const [pGlobal] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "CUST-003"));
  const [vIndo] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "VEND-001"));
  const [vPrima] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "VEND-002"));
  const [vUtil] = await db.select({ id: partners.id }).from(partners).where(eq(partners.kode, "VEND-003"));

  // Tambahkan detail alamat pengiriman untuk PT Mega Retailindo
  if (pMega) {
    await db
      .insert(partnerAddresses)
      .values({
        kontakId: pMega.id,
        judul: "Pusat Distribusi Cibitung",
        jenis: "PENGIRIMAN",
        alamat: "Kawasan Industri MM2100 Blok DD-3, Cikarang Barat",
        kota: "Bekasi",
        provinsi: "Jawa Barat",
        kodePos: "17530",
        adalahUtama: false,
      })
      .onConflictDoNothing();

    await db
      .insert(partnerContacts)
      .values({
        kontakId: pMega.id,
        nama: "Dewi Anggraini",
        jabatan: "Finance & AP Lead",
        email: "ap@megaretailindo.co.id",
        ponsel: "081234567890",
      })
      .onConflictDoNothing();
  }

  if (!pMega || !pBerkah || !pGlobal || !vIndo || !vPrima || !vUtil) {
    throw new Error("[seed demo] Gagal mendapatkan kontak demo.");
  }

  return {
    pelangganMegaId: pMega.id,
    pelangganBerkahId: pBerkah.id,
    pelangganGlobalId: pGlobal.id,
    pemasokIndofoodId: vIndo.id,
    pemasokPrimaId: vPrima.id,
    pemasokUtilitasId: vUtil.id,
  };
}
