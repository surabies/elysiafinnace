import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  chartOfAccounts,
  currencies,
  itemUnits,
  items,
  priceListItems,
  priceLists,
  productCategories,
  unitsOfMeasurement,
} from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export interface HasilDemoProduk {
  laptopId: string;
  monitorId: string;
  kertasHvsId: string;
  jasaKonsultasiId: string;
}

export async function seedDemoProducts(db: Db): Promise<HasilDemoProduk> {
  console.log("  [demo] Menyiapkan katalog Item / Produk dan Daftar Harga...");

  // Mata uang dasar
  const [idr] = await db
    .select({ id: currencies.id })
    .from(currencies)
    .where(eq(currencies.kode, "IDR"));

  // Satuan
  const satuanUnit = await db.select({ id: unitsOfMeasurement.id }).from(unitsOfMeasurement).where(eq(unitsOfMeasurement.kode, "UNIT")).then(r => r[0]);
  const satuanRim = await db.select({ id: unitsOfMeasurement.id }).from(unitsOfMeasurement).where(eq(unitsOfMeasurement.kode, "RIM")).then(r => r[0]);
  const satuanDus = await db.select({ id: unitsOfMeasurement.id }).from(unitsOfMeasurement).where(eq(unitsOfMeasurement.kode, "DUS")).then(r => r[0]);
  const satuanJam = await db.select({ id: unitsOfMeasurement.id }).from(unitsOfMeasurement).where(eq(unitsOfMeasurement.kode, "JAM")).then(r => r[0]);

  // Kategori
  const katElektronik = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.kode, "ELEKTRONIK")).then(r => r[0]);
  const katAtk = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.kode, "ATK")).then(r => r[0]);
  const katJasa = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.kode, "JASA")).then(r => r[0]);

  // Akun Akuntansi Bawaan
  const akunPersediaan = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(eq(chartOfAccounts.peranSistem, "PERSEDIAAN")).then(r => r[0]);
  const akunHpp = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(eq(chartOfAccounts.peranSistem, "HARGA_POKOK_PENJUALAN")).then(r => r[0]);
  const akunPenjualan = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(eq(chartOfAccounts.peranSistem, "PENDAPATAN_PENJUALAN")).then(r => r[0]);

  if (!akunPersediaan || !akunHpp || !akunPenjualan) {
    throw new Error("[seed demo] Akun persediaan/HPP/penjualan belum terdaftar di Bagan Akun.");
  }

  if (!idr || !satuanUnit || !satuanRim || !satuanJam) {
    throw new Error("[seed demo] Dependensi produk (IDR atau Satuan) belum lengkap.");
  }

  // 1. Master Items
  const DAFTAR_ITEM = [
    {
      sku: "SKU-LAP-001",
      barcode: "8991001001011",
      nama: "Laptop Bisnis Elysia Pro 14 (Core i7, 16GB, 512GB SSD)",
      deskripsi: "Laptop kerja enterprise dengan sertifikasi militer & baterai 14 jam",
      tipeBarang: "BARANG_PERSEDIAAN" as const,
      metodePenilaian: "RATA_RATA" as const,
      kategoriId: katElektronik?.id,
      satuanId: satuanUnit.id,
      mataUangId: idr.id,
      hargaBeliStandar: "8500000",
      hargaJualStandar: "12000000",
      stokMinimum: "5",
      akunPersediaanId: akunPersediaan.id,
      akunHppId: akunHpp.id,
      akunPendapatanId: akunPenjualan.id,
      aktif: true,
    },
    {
      sku: "SKU-MON-002",
      barcode: "8991001001028",
      nama: "Monitor LED UltraClear 24\" IPS Frameless FHD",
      deskripsi: "Monitor kerja resolusi Full HD dengan panel IPS anti-glare 75Hz",
      tipeBarang: "BARANG_PERSEDIAAN" as const,
      metodePenilaian: "RATA_RATA" as const,
      kategoriId: katElektronik?.id,
      satuanId: satuanUnit.id,
      mataUangId: idr.id,
      hargaBeliStandar: "1250000",
      hargaJualStandar: "1850000",
      stokMinimum: "10",
      akunPersediaanId: akunPersediaan.id,
      akunHppId: akunHpp.id,
      akunPendapatanId: akunPenjualan.id,
      aktif: true,
    },
    {
      sku: "SKU-KRT-003",
      barcode: "8991002001035",
      nama: "Kertas HVS Fotokopi A4 80gsm (Box isi 5 Rim)",
      deskripsi: "Kertas fotokopi putih bersih derajat keputihan 98% bebas macet",
      tipeBarang: "BARANG_PERSEDIAAN" as const,
      metodePenilaian: "RATA_RATA" as const,
      kategoriId: katAtk?.id,
      satuanId: satuanRim.id, // Satuan dasar = Rim
      mataUangId: idr.id,
      hargaBeliStandar: "42000",
      hargaJualStandar: "55000",
      stokMinimum: "50",
      akunPersediaanId: akunPersediaan.id,
      akunHppId: akunHpp.id,
      akunPendapatanId: akunPenjualan.id,
      aktif: true,
    },
    {
      sku: "SKU-SRV-001",
      barcode: null,
      nama: "Jasa Konsultasi Implementasi ERP & Pelatihan Akuntansi",
      deskripsi: "Layanan asistensi konfigurasi sistem ERP, migrasi data, & coaching staf keuangan",
      tipeBarang: "JASA" as const,
      metodePenilaian: "RATA_RATA" as const,
      kategoriId: katJasa?.id,
      satuanId: satuanJam.id,
      mataUangId: idr.id,
      hargaBeliStandar: "0",
      hargaJualStandar: "750000",
      stokMinimum: "0",
      akunPersediaanId: null,
      akunHppId: akunHpp.id,
      akunPendapatanId: akunPenjualan.id,
      aktif: true,
    },
  ];

  for (const item of DAFTAR_ITEM) {
    await db.insert(items).values(item).onConflictDoNothing({ target: items.sku });
  }

  const [laptop] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-LAP-001"));
  const [monitor] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-MON-002"));
  const [kertasHvs] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-KRT-003"));
  const [jasa] = await db.select({ id: items.id }).from(items).where(eq(items.sku, "SKU-SRV-001"));

  // 2. Multi-Satuan (Kertas HVS: Satuan Dasar = RIM, Satuan Kemasan = DUS isi 5 RIM)
  if (kertasHvs && satuanDus) {
    await db
      .insert(itemUnits)
      .values({
        itemId: kertasHvs.id,
        satuanId: satuanDus.id,
        konversi: "5",
        barcode: "8991002001042",
        hargaBeli: "205000",
        hargaJual: "265000",
        urutan: 2,
        aktif: true,
      })
      .onConflictDoNothing();
  }

  // 3. Price List Grosir / Distributor (Volume Pricing)
  await db
    .insert(priceLists)
    .values({
      kode: "PL-GROSIR",
      nama: "Daftar Harga Grosir / Rekanan B2B",
      mataUangId: idr.id,
      keterangan: "Harga khusus pembelian partai besar (minimum 10 unit)",
      aktif: true,
    })
    .onConflictDoNothing({ target: priceLists.kode });

  const [priceListGrosir] = await db
    .select({ id: priceLists.id })
    .from(priceLists)
    .where(eq(priceLists.kode, "PL-GROSIR"));

  if (priceListGrosir && laptop && monitor) {
    await db
      .insert(priceListItems)
      .values([
        {
          priceListId: priceListGrosir.id,
          itemId: laptop.id,
          satuanId: satuanUnit.id,
          minKuantitas: "5",
          harga: "11200000", // Diskon volume dari Rp 12.000.000 -> Rp 11.200.000
        },
        {
          priceListId: priceListGrosir.id,
          itemId: monitor.id,
          satuanId: satuanUnit.id,
          minKuantitas: "10",
          harga: "1650000", // Diskon volume dari Rp 1.850.000 -> Rp 1.650.000
        },
      ])
      .onConflictDoNothing();
  }

  if (!laptop || !monitor || !kertasHvs || !jasa) {
    throw new Error("[seed demo] Gagal mendapatkan produk demo.");
  }

  return {
    laptopId: laptop.id,
    monitorId: monitor.id,
    kertasHvsId: kertasHvs.id,
    jasaKonsultasiId: jasa.id,
  };
}
