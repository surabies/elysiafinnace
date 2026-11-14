import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  buatItem,
  buatSatuan,
  buatGudang,
  daftarGudang,
  buatTransferGudang,
  postingTransferGudang,
  batalkanTransferGudang,
  ambilTransferGudang,
  buatPenyesuaianStok,
  postingPenyesuaianStok,
  buatBatch,
  daftarBatch,
  ambilKartuStok,
  ambilNilaiPersediaan,
} from "../src/server/modules/keuangan/inventori/service";
import {
  buatFakturPembelian,
  postingFakturPembelian,
} from "../src/server/modules/keuangan/pembelian/service";
import { buatKontak } from "../src/server/modules/keuangan/kontak/service";
import { chartOfAccounts, itemStocks, journalItems } from "@/db/schema/keuangan";
import { and, eq } from "drizzle-orm";

async function main() {
  console.log("=== Starting Milestone M7 (Inventori Lanjutan / Multi-Warehouse) Verification ===");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const ts = Date.now();
  const oleh = "test-runner-m7";

  // 1. Setup Master Data (Satuan, Item, Gudang, Pemasok)
  console.log("1. Setting up master data...");
  const satuan = await buatSatuan({ kode: `U${suffix}`, nama: "Unit Box" }, oleh);

  const [akunPersediaan] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.kode, "1130"), eq(chartOfAccounts.aktif, true)));
  assert.ok(akunPersediaan, "Akun persediaan 1130 harus ada");

  const [akunPendapatanLain] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.kode, "4910"), eq(chartOfAccounts.aktif, true))); // atau akun pendapatan lain
  const [akunBebanLain] = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.kode, "6400"), eq(chartOfAccounts.aktif, true)));
  const akunPenyesuaianId = akunPendapatanLain?.id ?? akunBebanLain!.id;

  const itemA = await buatItem(
    {
      sku: `PROD-M7-${ts}`,
      nama: `Barang Multi Gudang ${ts}`,
      satuanId: satuan.id,
      tipeBarang: "BARANG_PERSEDIAAN",
      akunPersediaanId: akunPersediaan.id,
      hargaBeliStandar: "100000",
      hargaJualStandar: "160000",
    },
    oleh,
  );
  assert.ok(itemA.id);

  // Ambil atau verifikasi Gudang Utama
  const daftarGd = await daftarGudang();
  let gudangUtama = daftarGd.find((g) => g.adalahGudangUtama);
  if (!gudangUtama) {
    gudangUtama = await buatGudang(
      {
        kode: `WH-U-${suffix}`,
        nama: "Gudang Pusat Jakarta",
        adalahGudangUtama: true,
      },
      oleh,
    );
  }

  // Buat Gudang Cabang Surabaya & Bandung
  const gudangSurabaya = await buatGudang(
    {
      kode: `WH-SBY-${suffix}`,
      nama: "Gudang Cabang Surabaya",
      alamat: "Jl. Rungkut Industri No. 12, Surabaya",
      penanggungJawab: "Budi Santoso",
      adalahGudangUtama: false,
    },
    oleh,
  );
  assert.equal(gudangSurabaya.kode, `WH-SBY-${suffix}`);

  const gudangBandung = await buatGudang(
    {
      kode: `WH-BDG-${suffix}`,
      nama: "Gudang Cabang Bandung",
      alamat: "Jl. Soekarno Hatta No. 45, Bandung",
      penanggungJawab: "Asep Sunandar",
      adalahGudangUtama: false,
    },
    oleh,
  );
  assert.equal(gudangBandung.kode, `WH-BDG-${suffix}`);
  console.log("   Warehouses created successfully: Utama, Surabaya, Bandung.");

  // 2. Pembelian Barang masuk ke Gudang Utama (100 pcs @ 100.000 = 10.000.000)
  console.log("\n2. Inbound Stock via Purchase Invoice to Gudang Utama...");
  const pemasok = await buatKontak(
    {
      kode: `VEND-M7-${ts}`,
      nama: `Distributor Elektronik ${ts}`,
      adalahPemasok: true,
      adalahPelanggan: false,
    },
    oleh,
  );

  const bill = await buatFakturPembelian(
    {
      pemasokId: pemasok.id,
      nomorFakturPemasok: `SUPP-INV-${ts}`,
      tanggal: "2026-11-14",
      baris: [
        {
          itemId: itemA.id,
          gudangId: gudangUtama.id,
          deskripsi: "Stok Awal Pembelian",
          kuantitas: "100",
          hargaSatuan: "100000",
        },
      ],
    },
    oleh,
  );
  await postingFakturPembelian(bill.id, oleh);

  // Verifikasi stok di Gudang Utama = 100 unit
  const [stokUtamaAwal] = await db
    .select()
    .from(itemStocks)
    .where(and(eq(itemStocks.itemId, itemA.id), eq(itemStocks.gudangId, gudangUtama.id)));
  assert.ok(stokUtamaAwal);
  assert.equal(stokUtamaAwal.kuantitas, "100.0000", "Stok Gudang Utama harus 100");
  assert.equal(stokUtamaAwal.biayaRataRata, "100000.0000", "Biaya rata-rata harus 100,000");
  console.log("   Stock verified in Gudang Utama: 100 units @ 100,000 IDR");

  // 3. Transfer Antar Gudang: 40 unit dari Gudang Utama ke Gudang Surabaya
  console.log("\n3. Testing Warehouse Transfer (40 units: Utama -> Surabaya)...");
  const transfer = await buatTransferGudang(
    {
      tanggal: "2026-11-14",
      gudangAsalId: gudangUtama.id,
      gudangTujuanId: gudangSurabaya.id,
      keterangan: "Pengiriman stok ke cabang Surabaya",
      baris: [
        {
          itemId: itemA.id,
          kuantitas: "40",
          keterangan: "Alokasi toko cabang",
        },
      ],
    },
    oleh,
  );
  assert.equal(transfer.status, "DRAFT");
  assert.equal(transfer.baris.length, 1);

  // Posting Transfer
  const transferPosted = await postingTransferGudang(transfer.id, oleh);
  assert.equal(transferPosted.status, "POSTED");
  assert.equal(transferPosted.totalNilai, "4000000.0000", "Total nilai transfer harus 4,000,000 IDR");

  // Verifikasi stok Gudang Utama berkurang menjadi 60 unit
  const [stokUtamaSetelahTransfer] = await db
    .select()
    .from(itemStocks)
    .where(and(eq(itemStocks.itemId, itemA.id), eq(itemStocks.gudangId, gudangUtama.id)));
  assert.equal(stokUtamaSetelahTransfer!.kuantitas, "60.0000", "Stok Gudang Utama harus 60");

  // Verifikasi stok Gudang Surabaya bertambah menjadi 40 unit
  const [stokSbySetelahTransfer] = await db
    .select()
    .from(itemStocks)
    .where(and(eq(itemStocks.itemId, itemA.id), eq(itemStocks.gudangId, gudangSurabaya.id)));
  assert.ok(stokSbySetelahTransfer);
  assert.equal(stokSbySetelahTransfer.kuantitas, "40.0000", "Stok Gudang Surabaya harus 40");
  assert.equal(stokSbySetelahTransfer.nilai, "4000000.0000", "Nilai stok Gudang Surabaya harus 4,000,000");
  console.log("   Transfer successfully executed! Utama: 60 units, Surabaya: 40 units.");

  // 4. Penyesuaian Stok (Stok Opname) di Gudang Surabaya (+5 unit fisik lebih banyak)
  console.log("\n4. Testing Stock Adjustment / Opname at Gudang Surabaya (+5 units found)...");
  const adj = await buatPenyesuaianStok(
    {
      tanggal: "2026-11-14",
      gudangId: gudangSurabaya.id,
      akunPenyesuaianId,
      keterangan: "Hasil opname fisik akhir pekan (ditemukan 45 unit, tercatat 40)",
      baris: [
        {
          itemId: itemA.id,
          kuantitasFisik: "45", // tercatat 40 -> selisih +5
          biayaSatuan: "100000",
          keterangan: "Kelebihan fisik 5 unit",
        },
      ],
    },
    oleh,
  );
  assert.equal(adj.status, "DRAFT");
  assert.equal(adj.baris[0]!.kuantitasSelisih, "5.0000");

  // Posting Penyesuaian Stok
  const adjPosted = await postingPenyesuaianStok(adj.id, oleh);
  assert.equal(adjPosted.status, "POSTED");
  assert.ok(adjPosted.jurnalId, "Jurnal penyesuaian harus dibuat");

  // Verifikasi stok Gudang Surabaya menjadi 45 unit
  const [stokSbySetelahAdj] = await db
    .select()
    .from(itemStocks)
    .where(and(eq(itemStocks.itemId, itemA.id), eq(itemStocks.gudangId, gudangSurabaya.id)));
  assert.equal(stokSbySetelahAdj!.kuantitas, "45.0000", "Stok Gudang Surabaya harus 45 setelah opname");

  // Verifikasi Jurnal Penyesuaian Seimbang
  const barisJurnalAdj = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, adjPosted.jurnalId!));
  const debitAdj = barisJurnalAdj.reduce((s, b) => s + BigInt(b.debitDasar.replace(".", "")), BigInt(0));
  const kreditAdj = barisJurnalAdj.reduce((s, b) => s + BigInt(b.kreditDasar.replace(".", "")), BigInt(0));
  assert.equal(debitAdj, kreditAdj, "Jurnal penyesuaian opname harus seimbang Debit === Kredit");
  console.log("   Stock adjustment verified! Balanced debit/credit:", debitAdj.toString());

  // 5. Nomor Batch & Kedaluwarsa
  console.log("\n5. Testing Item Batch & Expiry tracking...");
  const batch = await buatBatch(
    {
      itemId: itemA.id,
      gudangId: gudangSurabaya.id,
      nomorBatch: `BATCH-${ts}`,
      tanggalKedaluwarsa: "2027-12-31",
      kuantitas: "45",
    },
    oleh,
  );
  assert.equal(batch.nomorBatch, `BATCH-${ts}`);

  const daftarB = await daftarBatch({ itemId: itemA.id, gudangId: gudangSurabaya.id });
  assert.ok(daftarB.length >= 1);
  console.log("   Batch created and tracked successfully with expiry 2027-12-31.");

  // 6. Laporan: Kartu Stok & Nilai Persediaan Multi-Gudang
  console.log("\n6. Testing Stock Card & Warehouse Inventory Valuation Report...");
  const kartuStokUtama = await ambilKartuStok({ itemId: itemA.id, gudangId: gudangUtama.id });
  assert.ok(kartuStokUtama.length >= 2, "Harus ada mutasi Masuk (PO) dan Keluar (Transfer)");

  const kartuStokSby = await ambilKartuStok({ itemId: itemA.id, gudangId: gudangSurabaya.id });
  assert.ok(kartuStokSby.length >= 2, "Harus ada mutasi Masuk (Transfer) dan Masuk (Opname)");

  const nilaiLap = await ambilNilaiPersediaan({ q: itemA.sku });
  assert.ok(nilaiLap.items.length >= 2, "Harus ada baris stok di Gudang Utama dan Surabaya");
  assert.equal(nilaiLap.ringkasan.totalKuantitas, "105.0000", "Total stok perusahaan = 60 + 45 = 105");
  assert.equal(nilaiLap.ringkasan.totalNilai, "10500000.0000", "Total nilai persediaan = 10,500,000 IDR");
  console.log("   Inventory valuation report verified: Total 105 units, Total Value 10,500,000 IDR.");

  // 7. Pembatalan Transfer (Void & Restore Balances)
  console.log("\n7. Testing Transfer Cancellation & Balance Reversal...");
  const transfer2 = await buatTransferGudang(
    {
      tanggal: "2026-11-14",
      gudangAsalId: gudangUtama.id,
      gudangTujuanId: gudangBandung.id,
      baris: [
        {
          itemId: itemA.id,
          kuantitas: "10",
        },
      ],
    },
    oleh,
  );
  await postingTransferGudang(transfer2.id, oleh);

  // Verifikasi stok Gudang Utama = 50, Bandung = 10
  const [stokBdg1] = await db
    .select()
    .from(itemStocks)
    .where(and(eq(itemStocks.itemId, itemA.id), eq(itemStocks.gudangId, gudangBandung.id)));
  assert.equal(stokBdg1!.kuantitas, "10.0000");

  // Batalkan transfer2
  await batalkanTransferGudang(transfer2.id, oleh);
  const transfer2Batal = await ambilTransferGudang(transfer2.id);
  assert.equal(transfer2Batal.status, "DIBATALKAN");

  // Verifikasi pemulihan stok: Gudang Utama kembali ke 60, Bandung kembali ke 0
  const [stokUtamaPulih] = await db
    .select()
    .from(itemStocks)
    .where(and(eq(itemStocks.itemId, itemA.id), eq(itemStocks.gudangId, gudangUtama.id)));
  assert.equal(stokUtamaPulih!.kuantitas, "60.0000", "Stok Gudang Utama harus pulih menjadi 60");

  const [stokBdgPulih] = await db
    .select()
    .from(itemStocks)
    .where(and(eq(itemStocks.itemId, itemA.id), eq(itemStocks.gudangId, gudangBandung.id)));
  assert.equal(stokBdgPulih!.kuantitas, "0.0000", "Stok Gudang Bandung harus pulih menjadi 0");
  console.log("   Transfer cancellation & stock reversal verified successfully!");

  console.log("\n=== ALL MILESTONE M7 (INVENTORI LANJUTAN) TESTS PASSED! ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
