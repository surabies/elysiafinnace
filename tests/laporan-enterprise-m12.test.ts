import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  bukuBesarPembantuPiutang,
  bukuBesarPembantuHutang,
  laporanAgingPiutang,
  laporanAgingHutang,
  laporanPenjualanPelanggan,
  laporanPenjualanItem,
  laporanPembelianPemasok,
  laporanPembelianItem,
  laporanLabaRugiKomparatif,
  laporanKonsolidasiHolding,
  cetakDokumenTransaksi,
} from "../src/server/modules/keuangan/laporan/service";
import { buatCsv } from "../src/server/modules/keuangan/shared/csv";
import { buatKontak } from "../src/server/modules/keuangan/kontak/service";
import { buatItem, buatSatuan } from "../src/server/modules/keuangan/inventori/service";
import {
  buatPesananPembelian,
  setujuiPesananPembelian,
  buatFakturPembelian,
  postingFakturPembelian,
} from "../src/server/modules/keuangan/pembelian/service";
import {
  buatPesananPenjualan,
  setujuiPesananPenjualan,
  buatFakturPenjualan,
  postingFakturPenjualan,
} from "../src/server/modules/keuangan/penjualan/service";
import { companies } from "@/db/schema/keuangan";
import { ambilMataUangDasar } from "../src/server/modules/keuangan/mata-uang/service";
import { keBigInt } from "../src/server/modules/keuangan/shared/decimal";

async function main() {
  console.log("=== Starting Milestone M12 (Laporan Enterprise & Print Engine) Verification ===");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const ts = Date.now();
  const oleh = "test-runner-m12";

  const muDasar = await ambilMataUangDasar();
  assert.ok(muDasar, "Mata uang dasar harus ada");

  // 1. Setup Master Data
  console.log("1. Setting up Master Data (Satuan, Item, Pelanggan, Pemasok)...");
  const satuan = await buatSatuan({ kode: `U${suffix}`, nama: "Unit" }, oleh);

  const itemX = await buatItem(
    {
      sku: `SKU-M12-${ts}`,
      nama: `Laptop Pro M12 ${ts}`,
      satuanId: satuan.id,
      tipeBarang: "BARANG_PERSEDIAAN",
      hargaBeliStandar: "5000000",
      hargaJualStandar: "8000000",
    },
    oleh,
  );

  const pelanggan = await buatKontak(
    {
      kode: `CUST-M12-${ts}`,
      nama: `PT Pelanggan Sejahtera M12 ${ts}`,
      adalahPelanggan: true,
      mataUangId: muDasar.id,
      npwp: "01.234.567.8-999.000",
    },
    oleh,
  );

  const pemasok = await buatKontak(
    {
      kode: `SUPP-M12-${ts}`,
      nama: `PT Pemasok Utama M12 ${ts}`,
      adalahPemasok: true,
      mataUangId: muDasar.id,
    },
    oleh,
  );

  // 2. Buat & Posting Faktur Pembelian (AP)
  console.log("2. Creating and posting Purchase Invoice (AP)...");
  const po = await buatPesananPembelian(
    {
      tanggal: "2026-03-01",
      pemasokId: pemasok.id,
      mataUangId: muDasar.id,
      kurs: "1",
      baris: [
        {
          itemId: itemX.id,
          deskripsi: "Pembelian Stok Uji M12",
          kuantitas: "5",
          hargaSatuan: "5000000",
          persenDiskon: "0",
        },
      ],
    },
    oleh,
  );
  await setujuiPesananPembelian(po.id, oleh);

  const fakturBeli = await buatFakturPembelian(
    {
      pesananId: po.id,
      tanggal: "2026-03-02",
      tanggalJatuhTempo: "2026-03-25",
      pemasokId: pemasok.id,
      mataUangId: muDasar.id,
      kurs: "1",
      baris: [
        {
          barisPesananId: po.baris[0]!.id,
          itemId: itemX.id,
          deskripsi: "Tagihan Pemasok Uji M12",
          kuantitas: "5",
          hargaSatuan: "5000000",
          persenDiskon: "0",
        },
      ],
    },
    oleh,
  );
  const fakturBeliPosted = await postingFakturPembelian(fakturBeli.id, oleh);
  assert.equal(fakturBeliPosted.status, "POSTED");

  // 3. Buat & Posting Faktur Penjualan (AR)
  console.log("3. Creating and posting Sales Invoice (AR)...");
  const so = await buatPesananPenjualan(
    {
      tanggal: "2026-03-05",
      pelangganId: pelanggan.id,
      mataUangId: muDasar.id,
      kurs: "1",
      baris: [
        {
          itemId: itemX.id,
          deskripsi: "Penjualan Barang Uji M12",
          kuantitas: "2",
          hargaSatuan: "8000000",
          persenDiskon: "0",
        },
      ],
    },
    oleh,
  );
  await setujuiPesananPenjualan(so.id, oleh);

  const fakturJual = await buatFakturPenjualan(
    {
      pesananId: so.id,
      tanggal: "2026-03-06",
      tanggalJatuhTempo: "2026-03-20",
      pelangganId: pelanggan.id,
      mataUangId: muDasar.id,
      kurs: "1",
      baris: [
        {
          barisPesananId: so.baris[0]!.id,
          itemId: itemX.id,
          deskripsi: "Faktur Barang Uji M12",
          kuantitas: "2",
          hargaSatuan: "8000000",
          persenDiskon: "0",
        },
      ],
    },
    oleh,
  );
  const fakturJualPosted = await postingFakturPenjualan(fakturJual.id, oleh);
  assert.equal(fakturJualPosted.status, "POSTED");

  // 4. Test Buku Besar Pembantu Piutang (AR Subledger)
  console.log("4. Verifying AR Subledger (Buku Besar Pembantu Piutang)...");
  const subledgerAR = await bukuBesarPembantuPiutang({
    kontakId: pelanggan.id,
    dari: "2026-03-01",
    sampai: "2026-03-31",
  });
  assert.equal(subledgerAR.daftarPelanggan.length, 1);
  const dataAR = subledgerAR.daftarPelanggan[0]!;
  assert.equal(dataAR.pelanggan.id, pelanggan.id);
  assert.ok(dataAR.transaksi.length >= 1, "Harus ada mutasi penjualan");
  assert.ok(keBigInt(dataAR.saldoAkhir) > BigInt(0), "Saldo akhir piutang harus positif");

  // 5. Test Buku Besar Pembantu Hutang (AP Subledger)
  console.log("5. Verifying AP Subledger (Buku Besar Pembantu Hutang)...");
  const subledgerAP = await bukuBesarPembantuHutang({
    kontakId: pemasok.id,
    dari: "2026-03-01",
    sampai: "2026-03-31",
  });
  assert.equal(subledgerAP.daftarPemasok.length, 1);
  const dataAP = subledgerAP.daftarPemasok[0]!;
  assert.equal(dataAP.pemasok.id, pemasok.id);
  assert.ok(dataAP.transaksi.length >= 1, "Harus ada mutasi pembelian");
  assert.ok(keBigInt(dataAP.saldoAkhir) > BigInt(0), "Saldo akhir hutang harus positif");

  // 6. Test Aging Piutang (AR Aging)
  console.log("6. Verifying AR Aging Report (Laporan Aging Piutang)...");
  // Per 2026-03-10: Faktur jatuh tempo 2026-03-20 -> belum jatuh tempo (current)
  const agingARCurrent = await laporanAgingPiutang({ perTanggal: "2026-03-10" });
  const arItem = agingARCurrent.daftarPelanggan.find((p) => p.pelangganId === pelanggan.id);
  assert.ok(arItem, "Pelanggan harus ada di laporan aging");
  assert.ok(keBigInt(arItem.aging.current) > BigInt(0), "Faktur belum jatuh tempo harus masuk bucket current");

  // Per 2026-04-05: Jatuh tempo 2026-03-20 -> terlambat 16 hari -> bucket hari1_30
  const agingAROverdue = await laporanAgingPiutang({ perTanggal: "2026-04-05" });
  const arItemOverdue = agingAROverdue.daftarPelanggan.find((p) => p.pelangganId === pelanggan.id);
  assert.ok(arItemOverdue, "Pelanggan harus ada di laporan overdue");
  assert.ok(keBigInt(arItemOverdue.aging.hari1_30) > BigInt(0), "Faktur telat 16 hari harus masuk bucket hari1_30");

  // 7. Test Aging Hutang (AP Aging)
  console.log("7. Verifying AP Aging Report (Laporan Aging Hutang)...");
  const agingAPCurrent = await laporanAgingHutang({ perTanggal: "2026-03-10" });
  const apItem = agingAPCurrent.daftarPemasok.find((h) => h.pemasokId === pemasok.id);
  assert.ok(apItem, "Pemasok harus ada di laporan aging hutang");
  assert.ok(keBigInt(apItem.aging.current) > BigInt(0), "Hutang belum jatuh tempo harus masuk bucket current");

  // 8. Test Laporan Penjualan per Pelanggan & per Item
  console.log("8. Verifying Sales Reports (per Pelanggan & per Item)...");
  const lapJualCust = await laporanPenjualanPelanggan({
    dari: "2026-03-01",
    sampai: "2026-03-31",
    kontakId: pelanggan.id,
  });
  assert.ok(lapJualCust.daftarPelanggan.length === 1);
  assert.equal(lapJualCust.daftarPelanggan[0]!.pelangganId, pelanggan.id);
  assert.equal(lapJualCust.daftarPelanggan[0]!.jumlahFaktur, 1);
  assert.equal(keBigInt(lapJualCust.daftarPelanggan[0]!.total), keBigInt("16000000")); // 2 x 8.000.000

  const lapJualItem = await laporanPenjualanItem({
    dari: "2026-03-01",
    sampai: "2026-03-31",
    itemId: itemX.id,
  });
  assert.ok(lapJualItem.daftarItem.length === 1);
  assert.equal(lapJualItem.daftarItem[0]!.itemId, itemX.id);
  assert.equal(keBigInt(lapJualItem.daftarItem[0]!.kuantitas), keBigInt("2"));
  assert.equal(keBigInt(lapJualItem.daftarItem[0]!.totalPenjualan), keBigInt("16000000"));

  // 9. Test Laporan Pembelian per Pemasok & per Item
  console.log("9. Verifying Purchase Reports (per Pemasok & per Item)...");
  const lapBeliSupp = await laporanPembelianPemasok({
    dari: "2026-03-01",
    sampai: "2026-03-31",
    kontakId: pemasok.id,
  });
  assert.ok(lapBeliSupp.daftarPemasok.length === 1);
  assert.equal(lapBeliSupp.daftarPemasok[0]!.pemasokId, pemasok.id);
  assert.equal(keBigInt(lapBeliSupp.daftarPemasok[0]!.total), keBigInt("25000000")); // 5 x 5.000.000

  const lapBeliItem = await laporanPembelianItem({
    dari: "2026-03-01",
    sampai: "2026-03-31",
    itemId: itemX.id,
  });
  assert.ok(lapBeliItem.daftarItem.length === 1);
  assert.equal(lapBeliItem.daftarItem[0]!.itemId, itemX.id);
  assert.equal(keBigInt(lapBeliItem.daftarItem[0]!.kuantitas), keBigInt("5"));
  assert.equal(keBigInt(lapBeliItem.daftarItem[0]!.totalPembelian), keBigInt("25000000"));

  // 10. Test Laporan Laba Rugi Komparatif
  console.log("10. Verifying Comparative Income Statement (Laporan Laba Rugi Komparatif)...");
  const lapKomparatif = await laporanLabaRugiKomparatif({
    periode1Dari: "2026-01-01",
    periode1Sampai: "2026-01-31",
    periode2Dari: "2026-03-01",
    periode2Sampai: "2026-03-31",
  });
  assert.ok(lapKomparatif.komparasi.pendapatan.periode1 !== undefined);
  assert.ok(lapKomparatif.komparasi.pendapatan.periode2 !== undefined);
  assert.ok(lapKomparatif.komparasi.pendapatan.selisih !== undefined);
  assert.ok(lapKomparatif.komparasi.labaBersih.persenUbah !== undefined);

  // 11. Test Laporan Konsolidasi Holding
  console.log("11. Verifying Holding Multi-Company Consolidation Report...");
  const [holdingCo] = await db.select().from(companies).limit(1);
  assert.ok(holdingCo, "Perusahaan holding harus ada");

  const lapKonsolidasi = await laporanKonsolidasiHolding({
    holdingId: holdingCo.id,
    perTanggal: "2026-03-31",
  });
  assert.equal(lapKonsolidasi.holding.id, holdingCo.id);
  assert.ok(lapKonsolidasi.jumlahEntitasKonsolidasi >= 1);
  assert.ok(lapKonsolidasi.konsolidasiNeraca.totalAset !== undefined);
  assert.ok(lapKonsolidasi.konsolidasiLabaRugiYtd.totalPendapatan !== undefined);

  // 12. Test Cetak Dokumen Transaksi (Printable / PDF Ready)
  console.log("12. Verifying Transaction Document Printing Engine...");
  const cetakSales = await cetakDokumenTransaksi("FAKTUR_PENJUALAN", fakturJualPosted.id);
  assert.equal(cetakSales.jenisDokumen, "FAKTUR_PENJUALAN");
  assert.equal(cetakSales.judul, "FAKTUR PENJUALAN (SALES INVOICE)");
  assert.equal(cetakSales.partnerNama, pelanggan.nama);
  assert.ok(cetakSales.html.includes("FAKTUR PENJUALAN"));
  assert.ok(cetakSales.html.includes(fakturJualPosted.nomor));
  assert.ok(cetakSales.html.includes(itemX.sku));

  const cetakPurchase = await cetakDokumenTransaksi("FAKTUR_PEMBELIAN", fakturBeliPosted.id);
  assert.equal(cetakPurchase.jenisDokumen, "FAKTUR_PEMBELIAN");
  assert.equal(cetakPurchase.judul, "FAKTUR PEMBELIAN (PURCHASE BILL)");
  assert.equal(cetakPurchase.partnerNama, pemasok.nama);
  assert.ok(cetakPurchase.html.includes("FAKTUR PEMBELIAN"));
  assert.ok(cetakPurchase.html.includes(fakturBeliPosted.nomor));

  // 13. Test CSV RFC-4180 Exporter
  console.log("13. Verifying CSV RFC-4180 Export Generator...");
  const csvOutput = buatCsv(
    ["Kode Item", "Nama Item", "Harga Satuan"],
    [
      ["SKU-001", 'Monitor "Curved" 27, Ultra', "3500000"],
      ["SKU-002", "Keyboard Mechanical\nRGB", "750000"],
    ],
  );
  assert.ok(csvOutput.includes("Kode Item,Nama Item,Harga Satuan"));
  assert.ok(csvOutput.includes('SKU-001,"Monitor ""Curved"" 27, Ultra",3500000'));
  assert.ok(csvOutput.includes('SKU-002,"Keyboard Mechanical\nRGB",750000'));

  console.log("\n>>> ALL 13 TEST SCENARIOS FOR MILESTONE M12 PASSED PERFECTLY! <<<");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
