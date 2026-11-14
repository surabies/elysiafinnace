import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  buatFakturPenjualan,
  postingFakturPenjualan,
  ambilFakturPenjualan,
} from "../src/server/modules/keuangan/penjualan/service";
import {
  buatFakturPembelian,
  postingFakturPembelian,
  ambilFakturPembelian,
} from "../src/server/modules/keuangan/pembelian/service";
import {
  buatBiaya,
  postingBiaya,
  ambilBiaya,
} from "../src/server/modules/keuangan/biaya/service";
import {
  buatPembayaran,
  postingPembayaran,
  batalkanPembayaran,
} from "../src/server/modules/keuangan/pembayaran/service";
import { buatKontak } from "../src/server/modules/keuangan/kontak/service";
import { buatItem, buatSatuan } from "../src/server/modules/keuangan/inventori/service";
import { buatRekening } from "../src/server/modules/keuangan/bank/service";
import { buatAkun } from "../src/server/modules/keuangan/akun/service";
import { ambilMataUangDasar, buatMataUang } from "../src/server/modules/keuangan/mata-uang/service";
import { chartOfAccounts, journalItems, paymentAllocations } from "@/db/schema/keuangan";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Starting Milestone M6 (Pembayaran / Payments) Verification ===");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const ts = Date.now();
  const oleh = "test-runner-m6";

  const muDasar = await ambilMataUangDasar();
  assert.ok(muDasar, "Mata uang dasar (IDR) harus ada");

  // 1. Setup Master Data
  console.log("1. Setting up master data (Item, Contacts, Bank Accounts)...");
  const satuan = await buatSatuan({ kode: `P${suffix}`, nama: "Pieces" }, oleh);

  const [akunBeban] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "6300"));
  assert.ok(akunBeban, "Akun beban operasional harus ada");

  const itemBarang = await buatItem(
    {
      sku: `ITEM-M6-${ts}`,
      nama: `Barang Dagang M6 ${ts}`,
      satuanId: satuan.id,
      tipeBarang: "JASA",
      akunHppId: akunBeban.id,
      hargaBeliStandar: "100000",
      hargaJualStandar: "150000",
    },
    oleh,
  );

  const pelanggan = await buatKontak(
    {
      kode: `CUST-M6-${ts}`,
      nama: `Pelanggan M6 ${ts}`,
      adalahPelanggan: true,
      adalahPemasok: false,
    },
    oleh,
  );

  const pemasok = await buatKontak(
    {
      kode: `SUPP-M6-${ts}`,
      nama: `Pemasok M6 ${ts}`,
      adalahPelanggan: false,
      adalahPemasok: true,
    },
    oleh,
  );

  // Cari akun induk Kas dan Setara Kas (1110)
  const [indukKas] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1110"));

  // Buat COA khusus untuk rekening bank IDR pengujian
  const akunBankIdr = await buatAkun(
    {
      kode: `1115-${suffix}`,
      nama: `Bank Mandiri IDR ${suffix}`,
      tipeAkun: "ASET",
      indukId: indukKas?.id,
      peranSistem: "KAS_BANK",
      mataUangId: muDasar.id,
    },
    oleh,
  );

  const rekeningIdr = await buatRekening(
    {
      kode: `BANK-IDR-${suffix}`,
      nama: `Bank Mandiri IDR ${suffix}`,
      jenis: "BANK",
      namaBank: "Bank Mandiri IDR",
      nomorRekening: `IDR-${suffix}`,
      atasNama: "PT Usaha Makmur",
      mataUangId: muDasar.id,
      akunCoaId: akunBankIdr.id,
    },
    oleh,
  );

  /* ================================================================== */
  /* SKENARIO 1: PENERIMAAN PEMBAYARAN PELANGGAN (CUSTOMER RECEIPT)     */
  /* Multi-invoice allocation, partial payment & settlement discount   */
  /* ================================================================== */
  console.log("\n2. Skenario 1: Customer Receipt (PENERIMAAN) IDR...");

  // Buat Faktur Penjualan 1: Total 1,000,000
  const fp1 = await buatFakturPenjualan(
    {
      pelangganId: pelanggan.id,
      tanggal: "2026-11-14",
      baris: [
        {
          itemId: itemBarang.id,
          deskripsi: "Penjualan Barang 1",
          kuantitas: "10",
          hargaSatuan: "100000",
        },
      ],
    },
    oleh,
  );
  await postingFakturPenjualan(fp1.id, oleh);
  const fp1Posted = await ambilFakturPenjualan(fp1.id);
  assert.equal(fp1Posted.status, "POSTED");
  assert.equal(fp1Posted.sisaTagihan, "1000000.0000");

  // Buat Faktur Penjualan 2: Total 2,000,000
  const fp2 = await buatFakturPenjualan(
    {
      pelangganId: pelanggan.id,
      tanggal: "2026-11-14",
      baris: [
        {
          itemId: itemBarang.id,
          deskripsi: "Penjualan Barang 2",
          kuantitas: "20",
          hargaSatuan: "100000",
        },
      ],
    },
    oleh,
  );
  await postingFakturPenjualan(fp2.id, oleh);
  const fp2Posted = await ambilFakturPenjualan(fp2.id);
  assert.equal(fp2Posted.status, "POSTED");
  assert.equal(fp2Posted.sisaTagihan, "2000000.0000");

  // Buat Pembayaran:
  // - FP1 lunas dengan kas 950,000 + potongan 50,000 (total dilunasi 1,000,000)
  // - FP2 bayar sebagian (partial) kas 500,000 tanpa potongan
  // Total kas masuk: 1,450,000
  const bayarReceipt = await buatPembayaran(
    {
      referensi: `CR-${ts}`,
      kontakId: pelanggan.id,
      rekeningBankId: rekeningIdr.id,
      jenis: "PENERIMAAN",
      tanggal: "2026-11-14",
      jumlah: "1450000",
      catatan: "Penerimaan pelunasan FP1 dan cicilan FP2",
      alokasi: [
        {
          fakturPenjualanId: fp1.id,
          jumlah: "950000",
          potongan: "50000",
        },
        {
          fakturPenjualanId: fp2.id,
          jumlah: "500000",
          potongan: "0",
        },
      ],
    },
    oleh,
  );
  assert.equal(bayarReceipt.status, "DRAFT");
  assert.equal(bayarReceipt.jumlah, "1450000.0000");
  assert.equal(bayarReceipt.alokasi.length, 2);

  // Posting Pembayaran Penerimaan
  console.log("   Posting Customer Receipt...");
  const receiptPosted = await postingPembayaran(bayarReceipt.id, oleh);
  assert.equal(receiptPosted.status, "POSTED");
  assert.ok(receiptPosted.jurnalId, "Jurnal penerimaan harus dibuat");

  // Verifikasi sisa tagihan pada faktur-faktur
  const fp1SetelahBayar = await ambilFakturPenjualan(fp1.id);
  assert.equal(fp1SetelahBayar.sisaTagihan, "0.0000", "FP1 harus lunas (sisa tagihan = 0)");

  const fp2SetelahBayar = await ambilFakturPenjualan(fp2.id);
  assert.equal(
    fp2SetelahBayar.sisaTagihan,
    "1500000.0000",
    "FP2 harus berkurang 500,000 menjadi 1,500,000",
  );

  // Verifikasi Jurnal Penerimaan Seimbang
  const barisJurnalReceipt = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, receiptPosted.jurnalId!));

  const totalDebitReceipt = barisJurnalReceipt.reduce(
    (s, b) => s + BigInt(b.debitDasar.replace(".", "")),
    BigInt(0),
  );
  const totalKreditReceipt = barisJurnalReceipt.reduce(
    (s, b) => s + BigInt(b.kreditDasar.replace(".", "")),
    BigInt(0),
  );

  assert.equal(
    totalDebitReceipt,
    totalKreditReceipt,
    "Jurnal penerimaan harus seimbang Debit === Kredit",
  );
  console.log("   Customer Receipt verified successfully! Balanced debit/credit:", totalDebitReceipt.toString());

  /* ================================================================== */
  /* SKENARIO 2: MULTI-CURRENCY & SELISIH KURS TEREALISASI (REALIZED FX)*/
  /* ================================================================== */
  console.log("\n3. Skenario 2: Multi-Currency & Realized FX Gain/Loss...");

  // Setup Mata Uang USD dan Kurs
  let muUsd;
  try {
    muUsd = await buatMataUang({ kode: `USD`, nama: "US Dollar", simbol: "$" }, oleh);
  } catch {
    const { daftarMataUang } = await import("../src/server/modules/keuangan/mata-uang/service");
    const daftar = await daftarMataUang();
    muUsd = daftar.find((m) => m.kode === "USD")!;
  }

  // Rekening Bank USD dengan akun COA USD khusus
  const akunBankUsd = await buatAkun(
    {
      kode: `1116-${suffix}`,
      nama: `Bank USD ${suffix}`,
      tipeAkun: "ASET",
      indukId: indukKas?.id,
      peranSistem: "KAS_BANK",
      mataUangId: muUsd.id,
    },
    oleh,
  );

  const rekeningUsd = await buatRekening(
    {
      kode: `BANK-USD-${suffix}`,
      nama: `Bank Mandiri USD ${suffix}`,
      jenis: "BANK",
      namaBank: "Bank Mandiri USD",
      nomorRekening: `USD-${suffix}`,
      atasNama: "PT Usaha Makmur USD",
      mataUangId: muUsd.id,
      akunCoaId: akunBankUsd.id,
    },
    oleh,
  );

  // Kurs faktur: 1 USD = 15,000 IDR
  // Buat Faktur Penjualan USD: 100 USD @ kurs 15,000
  const fpUsd = await buatFakturPenjualan(
    {
      pelangganId: pelanggan.id,
      mataUangId: muUsd.id,
      kurs: "15000",
      tanggal: "2026-11-01",
      baris: [
        {
          itemId: itemBarang.id,
          deskripsi: "Barang Ekspor USD",
          kuantitas: "1",
          hargaSatuan: "100",
        },
      ],
    },
    oleh,
  );
  await postingFakturPenjualan(fpUsd.id, oleh);
  const fpUsdPosted = await ambilFakturPenjualan(fpUsd.id);
  assert.equal(fpUsdPosted.total, "100.0000");
  assert.equal(fpUsdPosted.sisaTagihan, "100.0000");

  // Sekarang pelunasan saat kurs menguat menjadi 16,000 IDR
  // Kurs bayar: 16,000. Laba selisih kurs = (16,000 - 15,000) * 100 = 100,000 IDR
  console.log("   Creating foreign currency receipt with kurs 16,000 (FX Gain expected)...");
  const bayarUsd = await buatPembayaran(
    {
      referensi: `CR-USD-${ts}`,
      kontakId: pelanggan.id,
      rekeningBankId: rekeningUsd.id,
      jenis: "PENERIMAAN",
      tanggal: "2026-11-14",
      mataUangId: muUsd.id,
      kurs: "16000",
      jumlah: "100",
      alokasi: [
        {
          fakturPenjualanId: fpUsd.id,
          jumlah: "100",
          potongan: "0",
        },
      ],
    },
    oleh,
  );

  const bayarUsdPosted = await postingPembayaran(bayarUsd.id, oleh);
  assert.equal(bayarUsdPosted.status, "POSTED");

  // Verifikasi selisih kurs di paymentAllocations
  const alokasiUsd = await db
    .select()
    .from(paymentAllocations)
    .where(eq(paymentAllocations.pembayaranId, bayarUsd.id));
  assert.equal(alokasiUsd.length, 1);
  assert.equal(alokasiUsd[0]!.selisihKurs, "100000.0000", "Laba selisih kurs harus 100,000 IDR");

  // Verifikasi Jurnal USD Seimbang Debit === Kredit dalam IDR
  const barisJurnalUsd = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, bayarUsdPosted.jurnalId!));

  const totalDebitUsd = barisJurnalUsd.reduce(
    (s, b) => s + BigInt(b.debitDasar.replace(".", "")),
    BigInt(0),
  );
  const totalKreditUsd = barisJurnalUsd.reduce(
    (s, b) => s + BigInt(b.kreditDasar.replace(".", "")),
    BigInt(0),
  );
  assert.equal(
    totalDebitUsd,
    totalKreditUsd,
    "Jurnal pelunasan USD harus seimbang Debit === Kredit dalam IDR",
  );
  console.log("   Multi-Currency FX Gain verified! Balanced debit/credit:", totalDebitUsd.toString());

  /* ================================================================== */
  /* SKENARIO 3: PENGELUARAN PEMBAYARAN PEMASOK & BIAYA (VENDOR PAYMENT)*/
  /* ================================================================== */
  console.log("\n4. Skenario 3: Vendor Payment (PENGELUARAN) allocating Bill & Expense...");

  // Buat Faktur Pembelian (Bill): 800,000
  const bill = await buatFakturPembelian(
    {
      pemasokId: pemasok.id,
      nomorFakturPemasok: `SUPP-INV-${ts}`,
      tanggal: "2026-11-14",
      baris: [
        {
          itemId: itemBarang.id,
          deskripsi: "Beli Persediaan Uji",
          kuantitas: "8",
          hargaSatuan: "100000",
        },
      ],
    },
    oleh,
  );
  await postingFakturPembelian(bill.id, oleh);
  const billPosted = await ambilFakturPembelian(bill.id);
  assert.equal(billPosted.sisaTagihan, "800000.0000");

  // Buat Biaya Operasional (Hutang Biaya): 200,000
  const biayaHutang = await buatBiaya(
    {
      tanggal: "2026-11-14",
      kontakId: pemasok.id,
      metodeBayar: "HUTANG",
      tanggalJatuhTempo: "2026-11-30",
      deskripsi: "Tagihan beban jasa subkontraktor",
      baris: [
        {
          akunBebanId: akunBeban.id,
          deskripsi: "Biaya Subkontraktor / Jasa Pemasok",
          jumlah: "200000",
        },
      ],
    },
    oleh,
  );
  await postingBiaya(biayaHutang.id, oleh);
  const biayaPosted = await ambilBiaya(biayaHutang.id);
  assert.equal(biayaPosted.status, "POSTED");
  assert.equal(biayaPosted.sisaTagihan, "200000.0000");

  // Bayar Pemasok (PENGELUARAN):
  // - Bill 800,000: bayar 780,000 + potongan penyelesaian 20,000
  // - Biaya 200,000: bayar 200,000 tanpa potongan
  // Total kas keluar: 980,000
  const bayarVendor = await buatPembayaran(
    {
      referensi: `VP-${ts}`,
      kontakId: pemasok.id,
      rekeningBankId: rekeningIdr.id,
      jenis: "PENGELUARAN",
      tanggal: "2026-11-14",
      jumlah: "980000",
      catatan: "Pelunasan tagihan barang dan biaya jasa pemasok",
      alokasi: [
        {
          fakturPembelianId: bill.id,
          jumlah: "780000",
          potongan: "20000",
        },
        {
          biayaId: biayaHutang.id,
          jumlah: "200000",
          potongan: "0",
        },
      ],
    },
    oleh,
  );

  console.log("   Posting Vendor Payment...");
  const vendorPaymentPosted = await postingPembayaran(bayarVendor.id, oleh);
  assert.equal(vendorPaymentPosted.status, "POSTED");

  // Verifikasi sisa tagihan bill & biaya menjadi 0
  const billSetelahBayar = await ambilFakturPembelian(bill.id);
  assert.equal(billSetelahBayar.sisaTagihan, "0.0000", "Faktur pembelian harus lunas");

  const biayaSetelahBayar = await ambilBiaya(biayaHutang.id);
  assert.equal(biayaSetelahBayar.sisaTagihan, "0.0000", "Biaya hutang harus lunas");

  // Verifikasi Jurnal Pengeluaran Seimbang
  const barisJurnalVendor = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, vendorPaymentPosted.jurnalId!));

  const totalDebitVendor = barisJurnalVendor.reduce(
    (s, b) => s + BigInt(b.debitDasar.replace(".", "")),
    BigInt(0),
  );
  const totalKreditVendor = barisJurnalVendor.reduce(
    (s, b) => s + BigInt(b.kreditDasar.replace(".", "")),
    BigInt(0),
  );
  assert.equal(
    totalDebitVendor,
    totalKreditVendor,
    "Jurnal pengeluaran harus seimbang Debit === Kredit",
  );
  console.log("   Vendor Payment verified successfully! Balanced debit/credit:", totalDebitVendor.toString());

  /* ================================================================== */
  /* SKENARIO 4: PEMBATALAN PEMBAYARAN (VOID / REVERSAL)                */
  /* ================================================================== */
  console.log("\n5. Skenario 4: Voiding / Canceling Payment & Reversing Balances...");

  const bayarBatal = await batalkanPembayaran(
    bayarVendor.id,
    { tanggal: "2026-11-14", deskripsi: "Salah transfer rekening tujuan" },
    oleh,
  );
  assert.equal(bayarBatal.status, "DIBATALKAN", "Status pembayaran setelah dibatalkan menjadi DIBATALKAN");

  // Verifikasi pemulihan sisa tagihan pada dokumen terkait
  const billSetelahBatal = await ambilFakturPembelian(bill.id);
  assert.equal(
    billSetelahBatal.sisaTagihan,
    "800000.0000",
    "Sisa tagihan bill harus pulih kembali menjadi 800,000",
  );

  const biayaSetelahBatal = await ambilBiaya(biayaHutang.id);
  assert.equal(
    biayaSetelahBatal.sisaTagihan,
    "200000.0000",
    "Sisa tagihan biaya hutang harus pulih kembali menjadi 200,000",
  );
  console.log("   Payment Cancellation & Sisa Tagihan restoration verified!");

  console.log("\n=== ALL MILESTONE M6 TESTS PASSED SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
