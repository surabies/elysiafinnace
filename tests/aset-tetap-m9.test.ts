import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  daftarKategoriAset,
  ambilKategoriAset,
  buatKategoriAset,
  ubahKategoriAset,
  daftarAsetTetap,
  ambilAsetTetap,
  buatAsetTetap,
  ubahAsetTetap,
  postingPenyusutanTunggal,
  postingPenyusutanBatch,
  batalkanPenyusutan,
  lepasAsetTetap,
  laporanDaftarAset,
  laporanRekapPenyusutan,
  hitungPenyusutanBulanan,
} from "../src/server/modules/keuangan/aset-tetap/service";
import { chartOfAccounts, journalEntries, journalItems } from "@/db/schema/keuangan";
import { eq } from "drizzle-orm";
import { keBigInt } from "../src/server/modules/keuangan/shared/decimal";

async function main() {
  console.log("=== Starting Milestone M9 (Aset Tetap & Penyusutan) Verification ===");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const oleh = "test-runner-m9";

  // Ambil akun-akun COA yang relevan untuk pengujian
  const [akunPeralatan] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1210")); // Peralatan
  const [akunAkumPeralatan] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1219")); // Akum. Penyusutan Peralatan
  const [akunBebanSusut] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "6600")); // Beban Penyusutan
  const [akunKas] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1111")); // Kas Kecil
  const [akunLabaPelepasan] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "4920")); // Laba Pelepasan Aset Tetap
  const [akunRugiPelepasan] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "7110")); // Rugi Pelepasan Aset Tetap

  assert.ok(akunPeralatan, "Akun 1210 Peralatan harus ada");
  assert.ok(akunAkumPeralatan, "Akun 1219 Akumulasi Penyusutan harus ada");
  assert.ok(akunBebanSusut, "Akun 6600 Beban Penyusutan harus ada");
  assert.ok(akunKas, "Akun 1111 Kas harus ada");
  assert.ok(akunLabaPelepasan, "Akun 4920 Laba Pelepasan harus ada");
  assert.ok(akunRugiPelepasan, "Akun 7110 Rugi Pelepasan harus ada");

  // ==========================================
  // 1. MASTER KATEGORI ASET TETAP
  // ==========================================
  console.log("1. Verifying asset categories...");
  const katAwal = await daftarKategoriAset({ page: 1, limit: 10 });
  assert.ok(katAwal.total >= 2, "Default kategori aset (KAT-PERALATAN, KAT-KENDARAAN) harus ada");

  // Buat kategori kustom (Gedung & Bangunan)
  const kategoriBaru = await buatKategoriAset(
    {
      kode: `KAT-GEDUNG-${suffix}`,
      nama: `Gedung & Bangunan ${suffix}`,
      metodePenyusutan: "GARIS_LURUS",
      golonganFiskal: "BANGUNAN_PERMANEN",
      masaManfaatBulan: 240, // 20 tahun
      tarifTahunanPersen: "5.0000", // 5%
      akunAsetId: akunPeralatan.id,
      akunAkumulasiPenyusutanId: akunAkumPeralatan.id,
      akunBebanPenyusutanId: akunBebanSusut.id,
      keterangan: "Kategori pengujian gedung",
      aktif: true,
    },
    oleh,
  );
  assert.equal(kategoriBaru.masaManfaatBulan, 240);

  // Ambil detail & ubah kategori
  const detailKat = await ambilKategoriAset(kategoriBaru.id);
  assert.equal(detailKat.kode, `KAT-GEDUNG-${suffix}`);

  const updateKat = await ubahKategoriAset(
    kategoriBaru.id,
    { nama: `Gedung Kantor Pusat ${suffix}` },
    oleh,
  );
  assert.equal(updateKat.nama, `Gedung Kantor Pusat ${suffix}`);

  // ==========================================
  // 2. REGISTRASI ASET TETAP
  // ==========================================
  console.log("2. Registering fixed assets...");

  // Aset 1: Garis Lurus (Laptop MacBook Pro)
  // Perolehan: Rp 24.000.000, Residu: Rp 2.400.000, Masa manfaat: 24 bulan
  // Penyusutan per bulan = (24.000.000 - 2.400.000) / 24 = 21.600.000 / 24 = 900.000
  const [katPeralatan] = katAwal.items.filter((k) => k.kode === "KAT-PERALATAN");
  assert.ok(katPeralatan, "Kategori KAT-PERALATAN harus ada");

  const asetGarisLurus = await buatAsetTetap(
    {
      nama: `MacBook Pro M3 Test ${suffix}`,
      kategoriId: katPeralatan.id,
      tanggalPerolehan: "2026-01-05",
      tanggalMulaiPenyusutan: "2026-01-05",
      nilaiPerolehan: "24000000.0000",
      nilaiResidu: "2400000.0000",
      masaManfaatBulan: 24,
      metodePenyusutan: "GARIS_LURUS",
      lokasi: "Kantor Pusat Jakarta",
      penanggungJawab: "Tim IT Dev",
    },
    oleh,
  );

  assert.ok(asetGarisLurus.kode.startsWith("FA/2026/"), "Auto-numbering kode aset harus FA/YYYY/XXXXX");
  assert.equal(asetGarisLurus.nilaiBuku, "24000000.0000", "Nilai buku awal harus sama dengan nilai perolehan");
  assert.equal(asetGarisLurus.akumulasiPenyusutan, "0.0000", "Akumulasi penyusutan awal harus 0");
  assert.equal(asetGarisLurus.status, "AKTIF");

  // Aset 2: Saldo Menurun (Server Rack)
  // Perolehan: Rp 60.000.000, Residu: Rp 0, Masa manfaat: 48 bulan, Tarif: 25% setahun
  // Penyusutan bln 1 = 60.000.000 * 25% / 12 = 1.250.000
  const asetSaldoMenurun = await buatAsetTetap(
    {
      nama: `Server Rack Cluster ${suffix}`,
      kategoriId: katPeralatan.id,
      tanggalPerolehan: "2026-01-10",
      tanggalMulaiPenyusutan: "2026-01-10",
      nilaiPerolehan: "60000000.0000",
      nilaiResidu: "0.0000",
      masaManfaatBulan: 48,
      metodePenyusutan: "SALDO_MENURUN",
      lokasi: "Data Center Tier 3",
      penanggungJawab: "DevOps Lead",
    },
    oleh,
  );
  assert.equal(asetSaldoMenurun.nilaiBuku, "60000000.0000");

  // Verifikasi daftar aset tetap & ubah aset tetap
  const listAset = await daftarAsetTetap({ kategoriId: katPeralatan.id, page: 1, limit: 10 });
  assert.ok(listAset.total >= 2, "Minimal 2 aset pada kategori peralatan harus ditemukan");

  const asetUpdated = await ubahAsetTetap(
    asetGarisLurus.id,
    { lokasi: "Kantor Cabang Surabaya" },
    oleh,
  );
  assert.equal(asetUpdated.lokasi, "Kantor Cabang Surabaya");

  // Verifikasi hitung formula penyusutan bulanan
  const susutAset1Bulanan = hitungPenyusutanBulanan(asetGarisLurus, katPeralatan);
  assert.equal(
    susutAset1Bulanan,
    BigInt("9000000000"), // 900.000 x 10^4
    "Penyusutan garis lurus bulanan harus 900.000",
  );

  const susutAset2Bulanan = hitungPenyusutanBulanan(asetSaldoMenurun, katPeralatan);
  assert.equal(
    susutAset2Bulanan,
    BigInt("12500000000"), // 1.250.000 x 10^4
    "Penyusutan saldo menurun bulanan harus 1.250.000",
  );

  // ==========================================
  // 3. PENYUSUTAN TUNGGAL & DOUBLE-ENTRY AUTO JURNAL
  // ==========================================
  console.log("3. Posting single asset depreciation and verifying journal entries...");
  const depr1 = await postingPenyusutanTunggal(
    asetGarisLurus.id,
    { periode: "2026-01", tanggal: "2026-01-31" },
    oleh,
  );

  assert.ok(depr1, "Penyusutan tunggal harus berhasil dieksekusi");
  assert.equal(depr1.nilaiPenyusutan, "900000.0000");
  assert.equal(depr1.nilaiBukuAwal, "24000000.0000");
  assert.equal(depr1.nilaiBukuAkhir, "23100000.0000");
  assert.ok(depr1.jurnalId, "Harus menghasilkan ID jurnal akuntansi");

  // Verifikasi Jurnal Double-Entry Penyusutan
  const [jurnalDepr1] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, depr1.jurnalId!));
  assert.ok(jurnalDepr1, "Jurnal penyusutan harus tersimpan");
  assert.equal(jurnalDepr1.sumber, "PENYUSUTAN_ASET");

  const barisJurnalDepr1 = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, depr1.jurnalId!));
  assert.equal(barisJurnalDepr1.length, 2, "Harus ada 2 baris jurnal (Debit Beban & Kredit Akumulasi)");

  let totalDebitDepr = BigInt(0);
  let totalKreditDepr = BigInt(0);
  for (const b of barisJurnalDepr1) {
    totalDebitDepr += keBigInt(b.debit);
    totalKreditDepr += keBigInt(b.kredit);
  }
  assert.equal(totalDebitDepr, totalKreditDepr, "Jurnal penyusutan harus seimbang debit = kredit");
  assert.equal(totalDebitDepr, BigInt("9000000000"), "Nilai debit/kredit harus 900.000");

  // Periksa kondisi aset setelah disusutkan 1 bulan
  const aset1SetelahSusut = await ambilAsetTetap(asetGarisLurus.id);
  assert.equal(aset1SetelahSusut.akumulasiPenyusutan, "900000.0000");
  assert.equal(aset1SetelahSusut.nilaiBuku, "23100000.0000");
  assert.equal(aset1SetelahSusut.sisaManfaatBulan, 23);

  // Cegah double penyusutan pada periode yang sama
  await assert.rejects(
    async () => {
      await postingPenyusutanTunggal(
        asetGarisLurus.id,
        { periode: "2026-01" },
        oleh,
      );
    },
    /sudah disusutkan untuk periode 2026-01/,
    "Aset tidak boleh disusutkan dua kali pada periode yang sama",
  );

  // ==========================================
  // 4. PEMBATALAN PENYUSUTAN & PEMULIHAN SALDO
  // ==========================================
  console.log("4. Cancelling depreciation and verifying reversal...");
  const deprBatal = await batalkanPenyusutan(
    depr1.id,
    "Uji pembatalan penyusutan salah periode",
    oleh,
  );
  assert.ok(deprBatal);
  assert.equal(deprBatal.status, "DIBATALKAN");

  // Verifikasi saldo aset kembali pulih
  const aset1Pulih = await ambilAsetTetap(asetGarisLurus.id);
  assert.equal(aset1Pulih.akumulasiPenyusutan, "0.0000", "Akumulasi harus kembali ke 0");
  assert.equal(aset1Pulih.nilaiBuku, "24000000.0000", "Nilai buku harus kembali ke nilai perolehan");
  assert.equal(aset1Pulih.sisaManfaatBulan, 24, "Sisa masa manfaat harus kembali utuh");

  // Susutkan kembali untuk periode 2026-01 agar berlanjut ke batch test
  await postingPenyusutanTunggal(asetGarisLurus.id, { periode: "2026-01" }, oleh);

  // ==========================================
  // 5. PENYUSUTAN BATCH BULANAN
  // ==========================================
  console.log("5. Testing batch depreciation across multiple assets...");
  // Batch susutkan untuk periode 2026-02
  // Aset 1 (Garis Lurus): 900.000
  // Aset 2 (Saldo Menurun): 1.250.000
  const hasilBatchFeb = await postingPenyusutanBatch(
    { periode: "2026-02", tanggal: "2026-02-28" },
    oleh,
  );

  assert.ok(hasilBatchFeb.jumlahAsetDisusutkan >= 2, "Minimal 2 aset harus tersusutkan pada batch Februari");
  assert.equal(hasilBatchFeb.periode, "2026-02");

  // Jalankan lagi batch Februari: harus 0 aset yang disusutkan karena sudah tersusutkan
  const hasilBatchIdempotent = await postingPenyusutanBatch(
    { periode: "2026-02" },
    oleh,
  );
  assert.equal(hasilBatchIdempotent.jumlahAsetDisusutkan, 0, "Batch pada periode yang sama tidak boleh memproses ulang");

  // ==========================================
  // 6. PELEPASAN ASET TETAP DENGAN LABA (GAIN)
  // ==========================================
  console.log("6. Testing asset disposal with GAIN (profit on sale)...");
  // Aset 1 saat ini (setelah susut Jan 900rb & Feb 900rb):
  // Nilai Perolehan: 24.000.000
  // Akumulasi: 1.800.000
  // Nilai Buku: 22.200.000
  // Kita jual seharga: Rp 25.000.000 (Laba = 25.000.000 - 22.200.000 = 2.800.000)
  const lepasLaba = await lepasAsetTetap(
    asetGarisLurus.id,
    {
      tanggalPelepasan: "2026-03-15",
      nilaiPelepasan: "25000000.0000",
      akunKasPelepasanId: akunKas.id,
      akunLabaPelepasanId: akunLabaPelepasan.id,
      alasanPelepasan: "Penjualan laptop bekas direksi dengan harga pasar menguntungkan",
    },
    oleh,
  );

  assert.equal(lepasLaba.status, "DILEPAS");
  assert.ok(lepasLaba.jurnalPelepasanId, "Harus menghasilkan jurnal pelepasan aset");

  // Verifikasi Jurnal Pelepasan dengan Laba
  const barisJurnalLaba = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, lepasLaba.jurnalPelepasanId!));

  let debitLaba = BigInt(0);
  let kreditLaba = BigInt(0);
  for (const b of barisJurnalLaba) {
    debitLaba += keBigInt(b.debit);
    kreditLaba += keBigInt(b.kredit);
  }
  assert.equal(debitLaba, kreditLaba, "Jurnal pelepasan laba harus seimbang debit = kredit");
  // Debit: Kas 25 jt + Akumulasi 1.8 jt = 26.8 jt
  // Kredit: Laba 2.8 jt + Aset Perolehan 24 jt = 26.8 jt
  assert.equal(debitLaba, BigInt("268000000000"));

  // Pastikan tidak bisa dilepas dua kali
  await assert.rejects(
    async () => {
      await lepasAsetTetap(
        asetGarisLurus.id,
        {
          tanggalPelepasan: "2026-03-20",
          alasanPelepasan: "Coba lepas ulang",
        },
        oleh,
      );
    },
    /sudah berstatus DILEPAS/,
    "Aset yang sudah dilepas tidak boleh dilepas lagi",
  );

  // ==========================================
  // 7. PELEPASAN ASET TETAP DENGAN RUGI (LOSS / SCRAP)
  // ==========================================
  console.log("7. Testing asset disposal with LOSS (scrap/damaged)...");
  // Aset 2 (Server Rack) setelah susut Feb (1.250.000):
  // Nilai Perolehan: 60.000.000
  // Akumulasi: 1.250.000
  // Nilai Buku: 58.750.000
  // Kita jual/scrapped seharga: Rp 10.000.000 (Rugi = 58.750.000 - 10.000.000 = 48.750.000)
  const lepasRugi = await lepasAsetTetap(
    asetSaldoMenurun.id,
    {
      tanggalPelepasan: "2026-03-20",
      nilaiPelepasan: "10000000.0000",
      akunKasPelepasanId: akunKas.id,
      akunRugiPelepasanId: akunRugiPelepasan.id,
      alasanPelepasan: "Server korsleting listrik dan dilepas sebagai barang bekas",
    },
    oleh,
  );

  assert.equal(lepasRugi.status, "DILEPAS");
  assert.ok(lepasRugi.jurnalPelepasanId);

  // Verifikasi Jurnal Pelepasan dengan Rugi
  const barisJurnalRugi = await db
    .select()
    .from(journalItems)
    .where(eq(journalItems.jurnalId, lepasRugi.jurnalPelepasanId!));

  let debitRugi = BigInt(0);
  let kreditRugi = BigInt(0);
  for (const b of barisJurnalRugi) {
    debitRugi += keBigInt(b.debit);
    kreditRugi += keBigInt(b.kredit);
  }
  assert.equal(debitRugi, kreditRugi, "Jurnal pelepasan rugi harus seimbang debit = kredit");
  // Debit: Kas 10 jt + Akumulasi 1.25 jt + Rugi 48.75 jt = 60 jt
  // Kredit: Aset Perolehan 60 jt = 60 jt
  assert.equal(debitRugi, BigInt("600000000000"));

  // ==========================================
  // 8. LAPORAN ASET & REKAP PENYUSUTAN
  // ==========================================
  console.log("8. Verifying asset reports and depreciation schedule...");
  const lapAset = await laporanDaftarAset({});
  assert.ok(lapAset.ringkasan.jumlahAset >= 2, "Harus memuat ringkasan aset");
  assert.ok(lapAset.daftarAset.length >= 2, "Daftar aset harus terisi");

  const lapRekapFeb = await laporanRekapPenyusutan({ periode: "2026-02" });
  assert.equal(lapRekapFeb.periode, "2026-02");
  assert.ok(lapRekapFeb.jumlahAset >= 2, "Harus memuat minimal 2 penyusutan di Februari");

  console.log("=== All Milestone M9 (Aset Tetap & Penyusutan) Verifications PASSED Successfully! ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
