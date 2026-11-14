import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  daftarPajak,
  buatPajak,
  ubahPajak,
  ambilPajak,
  buatAlokasiNsfp,
  ambilNomorNsfpBerikutnya,
  daftarAlokasiNsfp,
  buatFakturPajakManual,
  generateFakturDariPenjualan,
  buatBuktiPotong,
  daftarBuktiPotong,
  ubahStatusBuktiPotong,
  eksporEfakturCsv,
  eksporCoretax,
  rekapSptMasaPpn,
} from "../src/server/modules/keuangan/pajak/service";
import { buatKontak } from "../src/server/modules/keuangan/kontak/service";
import { buatItem, buatSatuan } from "../src/server/modules/keuangan/inventori/service";
import {
  buatFakturPenjualan,
  postingFakturPenjualan,
} from "../src/server/modules/keuangan/penjualan/service";
import { chartOfAccounts, taxInvoiceRanges } from "@/db/schema/keuangan";
import { eq } from "drizzle-orm";
import { keBigInt, keString } from "../src/server/modules/keuangan/shared/decimal";

async function main() {
  console.log("=== Starting Milestone M8 (Pajak Indonesia) Verification ===");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const ts = Date.now();
  const oleh = "test-runner-m8";
  const tahunUji = 2026;
  const masaUji = 11;

  // 1. Verifikasi Master Pajak Bawaan & Pembuatan Kustom
  console.log("1. Verifying default seeded taxes and custom tax creation...");
  const listPajakAwal = await daftarPajak({ page: 1, limit: 10 });
  assert.ok(listPajakAwal.total >= 4, "Minimal 4 pajak default hasil seed (PPN11, PPN12, PPh 23, PPh 4(2)) harus ada");

  const [ppn11] = listPajakAwal.items.filter((p) => p.kode === "PPN11");
  assert.ok(ppn11, "Pajak PPN11 harus ada");
  assert.equal(ppn11.persentaseTarif, "11.0000", "Tarif PPN 11% harus tepat");
  assert.equal(ppn11.tipePajak, "PPN");

  // Buat pajak kustom (PPh 22 Impor/Bendaharawan)
  const [akunPajakUangMuka] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1160"));
  const [akunHutangPajak] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "2150"));

  const pajakKustom = await buatPajak(
    {
      kode: `PPH22-${suffix}`,
      nama: `PPh 22 Pengadaan Barang ${suffix}`,
      tipePajak: "PPH_22",
      kategoriPajak: "PEMOTONGAN_PEMUNGUTAN",
      persentaseTarif: "1.5000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: akunPajakUangMuka?.id,
      akunPajakPembelianId: akunHutangPajak?.id,
      keterangan: "Pajak Penghasilan Pasal 22 Bendaharawan",
      aktif: true,
    },
    oleh,
  );
  assert.equal(pajakKustom.persentaseTarif, "1.5000");

  const detailPajak = await ambilPajak(pajakKustom.id);
  assert.equal(detailPajak.nama, pajakKustom.nama);

  await ubahPajak(pajakKustom.id, { keterangan: "Keterangan diperbarui" }, oleh);
  const detailPajakUpdated = await ambilPajak(pajakKustom.id);
  assert.equal(detailPajakUpdated.keterangan, "Keterangan diperbarui");

  // 2. Alokasi NSFP (Nomor Seri Faktur Pajak) & Auto-Assignment
  console.log("2. Testing NSFP allocation and sequential numbering...");
  await db.update(taxInvoiceRanges).set({ aktif: false }).where(eq(taxInvoiceRanges.tahun, tahunUji));

  const nomorAwal = `010.000-${String(tahunUji).slice(2)}.${String(suffix).padStart(8, "0")}`;
  const nomorAkhir = `010.000-${String(tahunUji).slice(2)}.${String(suffix + 10).padStart(8, "0")}`;

  const alokasi = await buatAlokasiNsfp(
    {
      nomorAwal,
      nomorAkhir,
      tanggalSurat: `${tahunUji}-01-15`,
      tahun: tahunUji,
      keterangan: `Alokasi NSFP Batch ${suffix}`,
      aktif: true,
    },
    oleh,
  );
  assert.equal(alokasi.nomorBerikutnya, nomorAwal);

  const daftarNsfp = await daftarAlokasiNsfp({ tahun: tahunUji });
  assert.ok(daftarNsfp.length > 0, "Daftar alokasi NSFP harus berisi data");

  // Ambil nomor berikutnya secara atomic
  const noSeri1 = await ambilNomorNsfpBerikutnya(tahunUji, oleh);
  assert.equal(noSeri1, nomorAwal, "Nomor NSFP pertama harus sama dengan nomor awal");

  const noSeri2 = await ambilNomorNsfpBerikutnya(tahunUji, oleh);
  assert.notEqual(noSeri2, noSeri1, "Nomor NSFP kedua harus berbeda dan terurut");
  console.log(`   NSFP generated: ${noSeri1} -> ${noSeri2}`);

  // 3. Faktur Penjualan & Pembuatan Faktur Pajak Elektronik Otomatis
  console.log("3. Testing sales invoice integration and auto e-Faktur creation...");
  const pelanggan = await buatKontak(
    {
      kode: `CUST-TAX-${suffix}`,
      nama: `PT Pelanggan Pajak Sejahtera ${suffix}`,
      adalahPelanggan: true,
      adalahPemasok: false,
      npwp: "01.234.567.8-012.000",
      nik: "3171012345670001",
      alamat: "Gedung Bursa Efek Indonesia Tower 2 Lt. 15, Jakarta",
      email: `tax-cust-${suffix}@example.com`,
    },
    oleh,
  );

  const satuan = await buatSatuan({ kode: `U${suffix}`, nama: "Unit" }, oleh);
  const [akunPendapatan] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "4100"));

  const itemJual = await buatItem(
    {
      sku: `SKU-TAX-${ts}`,
      nama: `Layanan Konsultasi ERP ${suffix}`,
      satuanId: satuan.id,
      tipeBarang: "JASA",
      akunPendapatanId: akunPendapatan?.id,
      hargaJualStandar: "10000000",
    },
    oleh,
  );

  // Buat faktur penjualan dengan PPN 11%: Subtotal 10.000.000, PPN 1.100.000, Total 11.100.000
  const fakturJual = await buatFakturPenjualan(
    {
      tanggal: `${tahunUji}-${String(masaUji).padStart(2, "0")}-10`,
      tanggalJatuhTempo: `${tahunUji}-${String(masaUji).padStart(2, "0")}-25`,
      pelangganId: pelanggan.id,
      catatan: "Penjualan kena PPN 11%",
      baris: [
        {
          itemId: itemJual.id,
          kuantitas: "1",
          hargaSatuan: "10000000",
          persenDiskon: "0",
        },
      ],
      diskonNominal: "0",
      ongkir: "0",
      persenPpn: "11",
      uangMuka: "0",
    },
    oleh,
  );

  await postingFakturPenjualan(fakturJual.id, oleh);

  // Generate faktur pajak elektronik otomatis dari sales invoice
  const fakturPajakKeluaran = await generateFakturDariPenjualan(
    {
      fakturPenjualanId: fakturJual.id,
    },
    oleh,
  );

  assert.equal(fakturPajakKeluaran.jenis, "KELUARAN");
  assert.equal(fakturPajakKeluaran.masaPajak, masaUji);
  assert.equal(fakturPajakKeluaran.tahunPajak, tahunUji);
  assert.equal(fakturPajakKeluaran.jumlahDpp, "10000000.0000");
  assert.equal(fakturPajakKeluaran.jumlahPpn, "1100000.0000");
  assert.equal(fakturPajakKeluaran.statusFaktur, "DISETUJUI_DJP");
  assert.equal(fakturPajakKeluaran.namaLawanTransaksi, pelanggan.nama);
  assert.equal(fakturPajakKeluaran.npwpLawanTransaksi, pelanggan.npwp);

  // Cegah pembuatan ganda
  await assert.rejects(
    async () => {
      await generateFakturDariPenjualan({ fakturPenjualanId: fakturJual.id }, oleh);
    },
    /sudah memiliki Faktur Pajak/,
    "Harus menolak pembuatan faktur pajak duplikat untuk sales invoice yang sama",
  );

  // 4. Perekaman Faktur Pajak Masukan (Dapat Dikreditkan & Tidak Dapat Dikreditkan)
  console.log("4. Testing vendor input tax invoices (creditable & non-creditable)...");
  const noFakturMasukan1 = `010.000-26.99${suffix}01`;
  const fpMasukanKredit = await buatFakturPajakManual(
    {
      nomorFakturPajak: noFakturMasukan1,
      jenis: "MASUKAN",
      tanggal: `${tahunUji}-${String(masaUji).padStart(2, "0")}-12`,
      masaPajak: masaUji,
      tahunPajak: tahunUji,
      namaLawanTransaksi: `PT Pemasok Utama ${suffix}`,
      npwpLawanTransaksi: "02.345.678.9-023.000",
      jumlahDpp: "5000000.0000",
      jumlahPpn: "550000.0000",
      jumlahPpnbm: "0.0000",
      statusFaktur: "DISETUJUI_DJP",
      dapatDikreditkan: true,
      referensiDokumen: `INV-VEND-${suffix}-1`,
    },
    oleh,
  );
  assert.equal(fpMasukanKredit.dapatDikreditkan, true);

  const noFakturMasukan2 = `010.000-26.99${suffix}02`;
  const fpMasukanNonKredit = await buatFakturPajakManual(
    {
      nomorFakturPajak: noFakturMasukan2,
      jenis: "MASUKAN",
      tanggal: `${tahunUji}-${String(masaUji).padStart(2, "0")}-14`,
      masaPajak: masaUji,
      tahunPajak: tahunUji,
      namaLawanTransaksi: `PT Restoran Mewah ${suffix}`,
      npwpLawanTransaksi: "03.456.789.0-034.000",
      jumlahDpp: "2000000.0000",
      jumlahPpn: "220000.0000",
      jumlahPpnbm: "0.0000",
      statusFaktur: "DISETUJUI_DJP",
      dapatDikreditkan: false,
      referensiDokumen: `INV-VEND-${suffix}-2`,
    },
    oleh,
  );
  assert.equal(fpMasukanNonKredit.dapatDikreditkan, false);

  // 5. Bukti Potong PPh (e-Bupot Unifikasi)
  console.log("5. Testing withholding tax slips (e-Bupot PPh 23 & PPh 4(2))...");
  const noBupot23 = `BP-23-${ts}`;
  const bupotPPh23 = await buatBuktiPotong(
    {
      nomorBuktiPotong: noBupot23,
      jenisBupot: "BP_PASAL_23",
      tanggal: `${tahunUji}-${String(masaUji).padStart(2, "0")}-15`,
      masaPajak: masaUji,
      tahunPajak: tahunUji,
      namaWajibPajak: `CV Konsultan IT ${suffix}`,
      npwpWajibPajak: "04.567.890.1-045.000",
      kodeObjekPajak: "24-104-01",
      jumlahBruto: "20000000.0000",
      tarif: "2.0000",
      jumlahPph: "400000.0000",
      dokumenReferensi: `KONTRAK-${suffix}`,
      status: "DRAFT",
    },
    oleh,
  );
  assert.equal(bupotPPh23.jumlahPph, "400000.0000");

  const bupotTerbit = await ubahStatusBuktiPotong(bupotPPh23.id, "TERBIT", oleh);
  assert.equal(bupotTerbit.status, "TERBIT");

  const bupotPPh42 = await buatBuktiPotong(
    {
      nomorBuktiPotong: `BP-42-${ts}`,
      jenisBupot: "BP_PASAL_4_2",
      tanggal: `${tahunUji}-${String(masaUji).padStart(2, "0")}-18`,
      masaPajak: masaUji,
      tahunPajak: tahunUji,
      namaWajibPajak: `PT Pengelola Gedung ${suffix}`,
      npwpWajibPajak: "05.678.901.2-056.000",
      kodeObjekPajak: "28-403-01",
      jumlahBruto: "50000000.0000",
      tarif: "10.0000",
      jumlahPph: "5000000.0000",
      dokumenReferensi: `SEWA-${suffix}`,
      status: "TERBIT",
    },
    oleh,
  );
  assert.equal(bupotPPh42.jumlahPph, "5000000.0000");

  const listBupot = await daftarBuktiPotong({ masaPajak: masaUji, tahunPajak: tahunUji });
  assert.ok(listBupot.total >= 2, "Harus menemukan minimal 2 bukti potong");

  // 6. Ekspor e-Faktur CSV DJP
  console.log("6. Testing e-Faktur CSV export formatting...");
  const csvKeluaran = await eksporEfakturCsv({
    masaPajak: masaUji,
    tahunPajak: tahunUji,
    jenis: "KELUARAN",
  });
  assert.ok(csvKeluaran.startsWith("FK,KD_JENIS_TRANSAKSI,"), "Header CSV Keluaran harus FK");
  assert.ok(csvKeluaran.includes("PT Pelanggan Pajak Sejahtera"), "CSV harus memuat nama pelanggan");
  assert.ok(csvKeluaran.includes("10000000"), "CSV harus memuat DPP 10.000.000");
  assert.ok(csvKeluaran.includes("1100000"), "CSV harus memuat PPN 1.100.000");

  const csvMasukan = await eksporEfakturCsv({
    masaPajak: masaUji,
    tahunPajak: tahunUji,
    jenis: "MASUKAN",
  });
  assert.ok(csvMasukan.startsWith("FM,KD_JENIS_TRANSAKSI,"), "Header CSV Masukan harus FM");
  assert.ok(csvMasukan.includes("PT Pemasok Utama"), "CSV harus memuat nama pemasok kredit");
  assert.ok(csvMasukan.includes(",1"), "CSV harus memuat flag kredit = 1");
  assert.ok(csvMasukan.includes(",0"), "CSV harus memuat flag non-kredit = 0");

  // 7. Ekspor Coretax
  console.log("7. Testing Coretax DJP payload generator...");
  const coretaxData = await eksporCoretax({
    masaPajak: masaUji,
    tahunPajak: tahunUji,
  });
  assert.equal(coretaxData.coretaxVersion, "1.0");
  assert.equal(coretaxData.taxPeriod.month, masaUji);
  assert.equal(coretaxData.taxPeriod.year, tahunUji);
  assert.ok(coretaxData.invoices.length >= 3, "Minimal ada 3 faktur pajak (1 keluaran, 2 masukan)");
  assert.ok(coretaxData.withholdings.length >= 2, "Minimal ada 2 bukti potong PPh");

  // 8. Laporan Rekap SPT Masa PPN (Formulir 1111)
  console.log("8. Testing SPT Masa PPN 1111 calculation & summary...");
  const sptPpn = await rekapSptMasaPpn({
    masaPajak: masaUji,
    tahunPajak: tahunUji,
  });

  console.log("   Rekap SPT PPN:", JSON.stringify(sptPpn, null, 2));

  // Verifikasi kebenaran formula SPT Masa PPN 1111: Selisih = PK - PM (Dapat Dikreditkan)
  const pk = keBigInt(sptPpn.pajakKeluaran.totalPpn);
  const pm = keBigInt(sptPpn.pajakMasukanDapatDikreditkan.totalPpn);
  const selisihDiharapkan = pk - pm;

  assert.ok(pk >= BigInt(11000000000), "PPN Keluaran minimal Rp 1.100.000");
  assert.ok(pm >= BigInt(5500000000), "PPN Masukan Kredit minimal Rp 550.000");
  assert.equal(sptPpn.rekapitulasi.selisihPpn, keString(selisihDiharapkan));
  assert.equal(sptPpn.rekapitulasi.statusSpt, selisihDiharapkan > BigInt(0) ? "KURANG_BAYAR" : "LEBIH_BAYAR");

  console.log("=== All Milestone M8 (Pajak Indonesia) Tests Passed Successfully! ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
