import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  daftarCabang,
  buatCabang,
  ubahCabang,
  daftarDepartemen,
  ambilDepartemen,
  buatDepartemen,
  ambilProyek,
  buatProyek,
  ubahProyek,
  daftarTag,
  buatTag,
} from "../src/server/modules/keuangan/dimensi/service";
import {
  ambilAnggaran,
  buatAnggaran,
  ubahAnggaran,
  setujuiAnggaran,
  tutupAnggaran,
  laporanAnggaranVsRealisasi,
  laporanLabaRugiProyek,
  laporanLabaRugiCabang,
} from "../src/server/modules/keuangan/anggaran/service";
import { simpanJurnal } from "../src/server/modules/keuangan/jurnal/engine";
import { chartOfAccounts, currencies } from "@/db/schema/keuangan";
import { eq } from "drizzle-orm";
import { buatKontak } from "../src/server/modules/keuangan/kontak/service";

async function main() {
  console.log("=== Starting Milestone M10 (Anggaran & Dimensi) Verification ===");
  const suffix = Math.floor(Math.random() * 89999 + 10000);
  const oleh = "test-runner-m10";

  // Ambil mata uang dasar
  const [muDasar] = await db
    .select()
    .from(currencies)
    .where(eq(currencies.adalahMataUangDasar, true));
  assert.ok(muDasar, "Mata uang dasar harus ada");

  // Ambil akun-akun COA untuk transaksi & anggaran
  const [akunBank] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "1112")); // Bank Operasional
  const [akunPendapatan] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "4100")); // Pendapatan Penjualan
  const [akunBebanGaji] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "6100")); // Beban Gaji dan Upah
  const [akunBebanSewa] = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.kode, "6200")); // Beban Sewa

  assert.ok(akunBank, "Akun 1112 Bank harus ada");
  assert.ok(akunPendapatan, "Akun 4100 Pendapatan harus ada");
  assert.ok(akunBebanGaji, "Akun 6100 Beban Gaji harus ada");
  assert.ok(akunBebanSewa, "Akun 6200 Beban Sewa harus ada");

  // ==========================================
  // 1. MASTER CABANG (BRANCHES)
  // ==========================================
  console.log("1. Verifying branches (multi-branch)...");
  const listCabang = await daftarCabang({ page: 1, limit: 10 });
  assert.ok(listCabang.total >= 2, "Default cabang HO dan SBY harus ada dari seed");

  const [cabangHO] = listCabang.items.filter((c) => c.kode === "HO");
  const [cabangSBY] = listCabang.items.filter((c) => c.kode === "SBY");
  assert.ok(cabangHO?.pusat, "Cabang HO harus ditandai sebagai kantor pusat");
  assert.ok(!cabangSBY?.pusat, "Cabang SBY bukan kantor pusat");

  // Buat cabang baru
  const cabangBaru = await buatCabang(
    {
      kode: `BDG-${suffix}`,
      nama: `Kantor Cabang Bandung ${suffix}`,
      alamat: "Jl. Asia Afrika No. 10, Bandung",
      telepon: "022-4200000",
      penanggungJawab: "Kepala Cabang Bandung",
      pusat: false,
    },
    oleh,
  );
  assert.equal(cabangBaru.kode, `BDG-${suffix}`);

  const updateCabang = await ubahCabang(
    cabangBaru.id,
    { penanggungJawab: "Bpk. Hendra Gunawan" },
    oleh,
  );
  assert.equal(updateCabang.penanggungJawab, "Bpk. Hendra Gunawan");

  // ==========================================
  // 2. MASTER DEPARTEMEN (DEPARTMENTS)
  // ==========================================
  console.log("2. Verifying departments...");
  const listDept = await daftarDepartemen({ page: 1, limit: 10 });
  assert.ok(listDept.total >= 4, "Minimal 4 departemen default (DIR, FIN, IT, OPS) harus ada");

  const [deptIT] = listDept.items.filter((d) => d.kode === "IT");
  assert.ok(deptIT, "Departemen IT harus ada");

  // Buat sub-departemen hierarki (IT Software Dev)
  const subDept = await buatDepartemen(
    {
      kode: `DEV-${suffix}`,
      nama: `Software Development ${suffix}`,
      indukId: deptIT.id,
      manajer: "Engineering Lead",
    },
    oleh,
  );
  assert.equal(subDept.indukId, deptIT.id);

  const detailDept = await ambilDepartemen(subDept.id);
  assert.equal(detailDept.kode, `DEV-${suffix}`);

  // ==========================================
  // 3. MASTER PROYEK (PROJECTS)
  // ==========================================
  console.log("3. Creating and managing projects...");
  // Buat kontak pelanggan klien proyek
  const klien = await buatKontak(
    {
      kode: `CUST-${suffix}`,
      nama: `PT Multi Solusi Proyek ${suffix}`,
      adalahPelanggan: true,
      npwp: "01.234.567.8-012.000",
    },
    oleh,
  );

  const proyek1 = await buatProyek(
    {
      nama: `Implementasi ERP Enterprise ${suffix}`,
      pelangganId: klien.id,
      tanggalMulai: "2026-01-15",
      tanggalSelesai: "2026-06-30",
      nilaiKontrak: "150000000.0000", // Rp 150.000.000
      status: "PERENCANAAN",
      penanggungJawab: "Senior Project Manager",
      keterangan: "Proyek rollout ERP Cloud ke anak perusahaan klien",
    },
    oleh,
  );

  assert.ok(proyek1.kode.startsWith("PRJ/2026/"), "Auto-numbering kode proyek harus PRJ/YYYY/XXXXX");
  assert.equal(proyek1.status, "PERENCANAAN");

  // Update status proyek menjadi BERJALAN
  const proyekAktif = await ubahProyek(proyek1.id, { status: "BERJALAN" }, oleh);
  assert.equal(proyekAktif.status, "BERJALAN");

  const detailProyek = await ambilProyek(proyek1.id);
  assert.equal(detailProyek.nama, `Implementasi ERP Enterprise ${suffix}`);

  // ==========================================
  // 4. MASTER TAG TRANSAKSI
  // ==========================================
  console.log("4. Creating transaction tags...");
  const tag1 = await buatTag(
    {
      nama: `q1-campaign-${suffix}`,
      warna: "#10b981",
      keterangan: "Tag pelacakan inisiatif Q1",
    },
    oleh,
  );
  assert.ok(tag1.nama.startsWith("#"), "Nama tag otomatis diawali hashtag #");

  const listTag = await daftarTag({ q: tag1.nama });
  assert.equal(listTag.total, 1);

  // ==========================================
  // 5. TRANSAKSI JURNAL DENGAN DIMENSI
  // ==========================================
  console.log("5. Posting journals with dimensions (branch, department, project, tag)...");

  // Transaksi 1: Penerimaan Pendapatan Proyek pada Cabang Baru
  // (Dr) Bank Operasional 1112: Rp 50.000.000
  // (Cr) Pendapatan Penjualan 4100: Rp 50.000.000 (Proyek 1, Cabang Baru)
  await db.transaction(async (tx) => {
    await simpanJurnal(
      tx,
      {
        tanggal: "2026-02-15",
        deskripsi: `Termin 1 Pembayaran Proyek ${proyek1.nama}`,
        referensi: proyek1.kode,
        sumber: "MANUAL",
        cabangId: cabangBaru.id,
        proyekId: proyek1.id,
        mataUangId: muDasar.id,
        kurs: "1.00000000",
        posting: true,
        baris: [
          {
            akunId: akunBank.id,
            debit: "50000000.0000",
            kredit: "0.0000",
            cabangId: cabangBaru.id,
            proyekId: proyek1.id,
            deskripsi: "Penerimaan termin 1 proyek",
          },
          {
            akunId: akunPendapatan.id,
            debit: "0.0000",
            kredit: "50000000.0000",
            cabangId: cabangBaru.id,
            proyekId: proyek1.id,
            tag: tag1.nama,
            deskripsi: "Pendapatan termin 1 proyek",
          },
        ],
      },
      oleh,
    );
  });

  // Transaksi 2: Beban Gaji Tim Pengembang Proyek (Cabang Baru, Dept IT, Proyek 1)
  // (Dr) Beban Gaji 6100: Rp 15.000.000
  // (Cr) Bank Operasional 1112: Rp 15.000.000
  await db.transaction(async (tx) => {
    await simpanJurnal(
      tx,
      {
        tanggal: "2026-02-28",
        deskripsi: `Gaji Tim Teknis Proyek ${proyek1.nama}`,
        referensi: proyek1.kode,
        sumber: "MANUAL",
        cabangId: cabangBaru.id,
        proyekId: proyek1.id,
        mataUangId: muDasar.id,
        kurs: "1.00000000",
        posting: true,
        baris: [
          {
            akunId: akunBebanGaji.id,
            debit: "15000000.0000",
            kredit: "0.0000",
            cabangId: cabangBaru.id,
            departemenId: deptIT.id,
            proyekId: proyek1.id,
            tag: tag1.nama,
            deskripsi: "Beban gaji programmer proyek",
          },
          {
            akunId: akunBank.id,
            debit: "0.0000",
            kredit: "15000000.0000",
            cabangId: cabangBaru.id,
            deskripsi: "Pembayaran gaji via bank operasional",
          },
        ],
      },
      oleh,
    );
  });

  // Transaksi 3: Beban Sewa Kantor Pusat Jakarta (Cabang HO, tanpa proyek)
  // (Dr) Beban Sewa 6200: Rp 20.000.000
  // (Cr) Bank Operasional 1112: Rp 20.000.000
  await db.transaction(async (tx) => {
    await simpanJurnal(
      tx,
      {
        tanggal: "2026-02-20",
        deskripsi: "Sewa Gedung Kantor Pusat Februari 2026",
        referensi: "SEWA-HO-02",
        sumber: "MANUAL",
        cabangId: cabangHO.id,
        mataUangId: muDasar.id,
        kurs: "1.00000000",
        posting: true,
        baris: [
          {
            akunId: akunBebanSewa.id,
            debit: "20000000.0000",
            kredit: "0.0000",
            cabangId: cabangHO.id,
            deskripsi: "Beban sewa kantor pusat",
          },
          {
            akunId: akunBank.id,
            debit: "0.0000",
            kredit: "20000000.0000",
            cabangId: cabangHO.id,
            deskripsi: "Pembayaran sewa gedung",
          },
        ],
      },
      oleh,
    );
  });

  // ==========================================
  // 6. ANGGARAN (BUDGETING CRUD & APPROVAL)
  // ==========================================
  console.log("6. Creating and approving annual budgets...");

  // Buat Anggaran Operasional Cabang 2026:
  // - Target Pendapatan (4100): Rp 60.000.000 (Februari 2026)
  // - Batas Beban Gaji (6100): Rp 18.000.000 (Februari 2026)
  // Total Anggaran = Rp 78.000.000
  const anggaranBaru = await buatAnggaran(
    {
      nama: `Anggaran Operasional Bandung ${suffix}`,
      tahun: 2026,
      cabangId: cabangBaru.id,
      keterangan: "Anggaran proyek dan operasional cabang baru",
      baris: [
        {
          akunId: akunPendapatan.id,
          periode: "2026-02",
          jumlah: "60000000.0000",
          keterangan: "Target pendapatan termin Februari",
        },
        {
          akunId: akunBebanGaji.id,
          periode: "2026-02",
          jumlah: "18000000.0000",
          keterangan: "Pagu batas beban gaji tim",
        },
      ],
    },
    oleh,
  );

  assert.ok(anggaranBaru.nomor.startsWith("BDG/2026/"), "Auto-numbering anggaran BDG/YYYY/XXXXX");
  assert.equal(anggaranBaru.status, "DRAFT");
  assert.equal(anggaranBaru.totalAnggaran, "78000000.0000");

  // Ubah anggaran saat masih DRAFT
  const anggaranUpdated = await ubahAnggaran(
    anggaranBaru.id,
    {
      nama: `Anggaran Operasional Bandung Final ${suffix}`,
      tahun: 2026,
      cabangId: cabangBaru.id,
      baris: [
        {
          akunId: akunPendapatan.id,
          periode: "2026-02",
          jumlah: "60000000.0000",
        },
        {
          akunId: akunBebanGaji.id,
          periode: "2026-02",
          jumlah: "20000000.0000", // dinaikkan ke 20jt
        },
      ],
    },
    oleh,
  );
  assert.equal(anggaranUpdated.totalAnggaran, "80000000.0000");

  // Setujui Anggaran
  const anggaranDisetujui = await setujuiAnggaran(anggaranBaru.id, oleh);
  assert.equal(anggaranDisetujui.status, "DISETUJUI");
  assert.ok(anggaranDisetujui.disetujuiPada);

  // Verifikasi ambil detail anggaran
  const detailAnggaran = await ambilAnggaran(anggaranBaru.id);
  assert.equal(detailAnggaran.baris.length, 2);

  // ==========================================
  // 7. LAPORAN ANGGARAN VS REALISASI
  // ==========================================
  console.log("7. Generating Budget vs Actual report...");
  const repRealisasi = await laporanAnggaranVsRealisasi({
    anggaranId: anggaranBaru.id,
    tahun: 2026,
    periode: "2026-02",
    cabangId: cabangBaru.id,
  });

  assert.ok(repRealisasi.daftarAkun.length >= 2, "Harus memuat baris perbandingan akun");

  const [rowPendapatan] = repRealisasi.daftarAkun.filter((a) => a.akunId === akunPendapatan.id);
  assert.ok(rowPendapatan, "Akun pendapatan harus terbandingkan");
  assert.equal(rowPendapatan.anggaran, "60000000.0000");
  assert.equal(rowPendapatan.realisasi, "50000000.0000"); // Dari Transaksi 1
  assert.equal(rowPendapatan.selisih, "-10000000.0000");
  assert.equal(rowPendapatan.persenRealisasi, "83.33");

  const [rowGaji] = repRealisasi.daftarAkun.filter((a) => a.akunId === akunBebanGaji.id);
  assert.ok(rowGaji, "Akun gaji harus terbandingkan");
  assert.equal(rowGaji.anggaran, "20000000.0000");
  assert.equal(rowGaji.realisasi, "15000000.0000"); // Dari Transaksi 2
  assert.equal(rowGaji.selisih, "-5000000.0000");
  assert.equal(rowGaji.statusVarian, "UNDER_BUDGET"); // Beban di bawah batas aman

  // ==========================================
  // 8. LAPORAN LABA RUGI PER PROYEK
  // ==========================================
  console.log("8. Generating Project Profit & Loss report...");
  const repProyek = await laporanLabaRugiProyek({
    proyekId: proyek1.id,
  });

  assert.equal(repProyek.ringkasan.totalPendapatan, "50000000.0000");
  assert.equal(repProyek.ringkasan.totalBeban, "15000000.0000");
  assert.equal(repProyek.ringkasan.labaBersih, "35000000.0000");
  assert.equal(repProyek.ringkasan.profitMarginPersen, "70.00"); // Laba 35jt / Pendapatan 50jt = 70%
  assert.equal(repProyek.rincianPendapatan.length, 1);
  assert.equal(repProyek.rincianBeban.length, 1);

  // ==========================================
  // 9. LAPORAN LABA RUGI PER CABANG
  // ==========================================
  console.log("9. Generating Branch Profit & Loss report (multi-branch segmentation)...");
  const repCabang = await laporanLabaRugiCabang({
    cabangId: cabangBaru.id,
  });

  // Konsolidasi cabang terpilih:
  // Total Pendapatan = 50.000.000 (Cabang Baru)
  // Total Beban = 15.000.000 (Cabang Baru Gaji)
  // Laba Bersih = 35.000.000
  assert.equal(repCabang.konsolidasi.totalPendapatan, "50000000.0000");
  assert.equal(repCabang.konsolidasi.totalBeban, "15000000.0000");
  assert.equal(repCabang.konsolidasi.labaBersih, "35000000.0000");

  const [cabReport] = repCabang.daftarCabang.filter((c) => c.cabangId === cabangBaru.id);
  assert.ok(cabReport, "Laporan cabang baru harus ada");
  assert.equal(cabReport.pendapatan, "50000000.0000");
  assert.equal(cabReport.beban, "15000000.0000");
  assert.equal(cabReport.labaBersih, "35000000.0000");

  // Periksa juga laporan seluruh cabang (multi-branch)
  const repSemuaCabang = await laporanLabaRugiCabang({});
  assert.ok(repSemuaCabang.daftarCabang.length >= 3, "Harus memuat HO, SBY, dan cabang baru");

  // Tutup anggaran di akhir pengujian
  const tutup = await tutupAnggaran(anggaranBaru.id, oleh);
  assert.equal(tutup.status, "DITUTUP");

  console.log("=== All Milestone M10 (Anggaran & Dimensi) Verifications PASSED Successfully! ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
