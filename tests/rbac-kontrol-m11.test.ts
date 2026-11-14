import assert from "node:assert/strict";
import { db } from "../src/server/modules/keuangan/shared/context";
import {
  ambilPeran,
  buatPeran,
  ubahPeran,
  hapusPeran,
  daftarPeran,
  ambilKatalogIzin,
  tugaskanPeranPengguna,
  cabutPeranPengguna,
  ambilAksesPenggunaDetail,
} from "../src/server/modules/keuangan/rbac/service";
import {
  daftarPerusahaan,
  ambilPerusahaan,
  buatPerusahaan,
  buatUndangan,
  terimaUndangan,
  aturAksesCabangPengguna,
  ambilAksesCabangPengguna,
  aturAksesGudangPengguna,
  ambilAksesGudangPengguna,
  catatAuditLog,
  daftarAuditLog,
  ambilAuditLog,
  buatAturanPersetujuan,
  evaluasiDanAjukanPersetujuan,
  prosesAksiPersetujuan,
  ambilDetailPersetujuan,
  simpanKunciTransaksi,
  pastikanTransaksiTidakTerkunci,
} from "../src/server/modules/keuangan/kontrol/service";
import { buatCabang } from "../src/server/modules/keuangan/dimensi/service";
import { buatGudang } from "../src/server/modules/keuangan/inventori/service";
import { simpanJurnal } from "../src/server/modules/keuangan/jurnal/engine";
import {
  chartOfAccounts,
  currencies,
} from "../src/db/schema/keuangan";
import { user } from "../src/db/schema/auth";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Starting Milestone M11 (RBAC, Multi-Perusahaan, Kontrol) Verification ===");
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  const oleh = "test-runner-m11";

  // Ambil mata uang dasar IDR
  const [muDasar] = await db.select().from(currencies).where(eq(currencies.kode, "IDR"));
  assert.ok(muDasar, "Mata uang IDR harus ada");

  // Ambil akun Kas/Bank untuk pengujian jurnal
  const [akunKas] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.kode, "1111"));
  const [akunPendapatan] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.kode, "4100"));
  assert.ok(akunKas && akunPendapatan, "Akun kas dan pendapatan harus ada");

  // ==========================================
  // 1. RBAC ROLES & PERMISSIONS
  // ==========================================
  console.log("1. Verifying RBAC system roles and custom role management...");
  const listPeran = await daftarPeran({});
  assert.ok(listPeran.total >= 4, "Minimal 4 peran bawaan (ADMIN, AKUNTAN, KASIR, AUDITOR)");

  const [peranAdmin] = listPeran.items.filter((p) => p.kode === "ADMIN");
  const [peranAkuntan] = listPeran.items.filter((p) => p.kode === "AKUNTAN");
  assert.ok(peranAdmin?.adalahSistem, "Peran ADMIN harus bertanda adalahSistem");
  assert.ok(peranAdmin?.aksesPenuh, "Peran ADMIN harus memiliki aksesPenuh");
  assert.ok(peranAkuntan, "Peran AKUNTAN harus ada");

  // Pencegahan penghapusan peran sistem
  await assert.rejects(
    async () => {
      await hapusPeran(peranAdmin.id);
    },
    /Peran bawaan sistem.*tidak dapat dihapus/,
    "Peran sistem wajib dilindungi dari penghapusan",
  );

  // Buat peran kustom baru
  const peranKustom = await buatPeran(
    {
      kode: `SPV-${suffix}`,
      nama: `Supervisor Keuangan ${suffix}`,
      keterangan: "Peran supervisor pembelian dan biaya",
      aksesPenuh: false,
      izin: ["pembelian.baca", "pembelian.posting", "biaya.baca", "biaya.posting"],
    },
    oleh,
  );
  assert.equal(peranKustom.kode, `SPV-${suffix}`);

  const detailKustom = await ambilPeran(peranKustom.id);
  assert.equal(detailKustom.izin.length, 4);
  assert.ok(detailKustom.izin.includes("pembelian.posting"));

  // Perbarui peran kustom
  const peranUpdated = await ubahPeran(
    peranKustom.id,
    {
      nama: `Supervisor Keuangan Senior ${suffix}`,
      izin: ["pembelian.baca", "pembelian.posting", "biaya.baca", "biaya.posting", "laporan.baca"],
    },
    oleh,
  );
  assert.equal(peranUpdated?.nama, `Supervisor Keuangan Senior ${suffix}`);

  // Ambil katalog izin terstruktur
  const katalog = ambilKatalogIzin();
  assert.ok(katalog.total >= 30, "Katalog izin lengkap");
  assert.ok(katalog.berkelompok["pembelian"], "Katalog harus memiliki kelompok pembelian");

  // ==========================================
  // 2. PENUGASAN PERAN PENGGUNA (USER ROLES)
  // ==========================================
  console.log("2. Verifying user role assignment and effective access computation...");
  const testUserId = `usr_${suffix}`;
  const testUserEmail = `user.${suffix}@elysiafinance.co.id`;

  // Insert user dummy ke tabel Better-Auth
  await db
    .insert(user)
    .values({
      id: testUserId,
      name: `Staf Finansial ${suffix}`,
      email: testUserEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  // Tugaskan peran AKUNTAN dan peran kustom SPV
  await tugaskanPeranPengguna(
    {
      penggunaId: testUserId,
      peranIds: [peranAkuntan.id, peranKustom.id],
    },
    oleh,
  );

  const aksesDetail = await ambilAksesPenggunaDetail(testUserId);
  assert.equal(aksesDetail.akses.peran.length, 2);
  assert.ok(aksesDetail.akses.izin.includes("jurnal.baca"), "Akuntan memiliki izin jurnal.baca");
  assert.ok(aksesDetail.akses.izin.includes("pembelian.posting"), "SPV memiliki izin pembelian.posting");
  assert.ok(!aksesDetail.akses.aksesPenuh, "Bukan admin jadi aksesPenuh false");

  // Cabut satu peran dari pengguna
  await cabutPeranPengguna({
    penggunaId: testUserId,
    peranId: peranKustom.id,
  });

  const aksesSetelahCabut = await ambilAksesPenggunaDetail(testUserId);
  assert.equal(aksesSetelahCabut.akses.peran.length, 1);
  assert.equal(aksesSetelahCabut.akses.peran[0]?.kode, "AKUNTAN");

  // ==========================================
  // 3. MULTI-PERUSAHAAN (TENANT / COMPANIES)
  // ==========================================
  console.log("3. Verifying multi-company / tenant management and hierarchy...");
  const listCo = await daftarPerusahaan({});
  const [holding] = listCo.items.filter((c) => c.adalahHolding);
  assert.ok(holding, "Perusahaan holding bawaan PT-ELYSIA harus ada");

  // Buat anak perusahaan (subsidiary) baru
  const subsidiary = await buatPerusahaan(
    {
      kode: `SUB-${suffix}`,
      nama: `PT Digital Solusi Finansial ${suffix}`,
      npwp: "02.456.789.0-012.000",
      mataUangDasarId: muDasar.id,
      adalahHolding: false,
      indukId: holding.id,
      email: `finance@sub${suffix}.co.id`,
    },
    testUserId,
  );
  assert.equal(subsidiary.kode, `SUB-${suffix}`);
  assert.equal(subsidiary.indukId, holding.id);

  // Ambil detail holding dan verifikasi anak perusahaan terdaftar
  const detailHolding = await ambilPerusahaan(holding.id);
  const anakCo = detailHolding.anakPerusahaan.filter((a) => a.id === subsidiary.id);
  assert.equal(anakCo.length, 1, "Anak perusahaan harus terdaftar di bawah holding");

  // Buat undangan ke perusahaan anak
  const inviteEmail = `auditor.${suffix}@partner.com`;
  const [peranKasir] = listPeran.items.filter((p) => p.kode === "KASIR");
  assert.ok(peranKasir, "Peran KASIR harus ada");
  const undangan = await buatUndangan(
    {
      perusahaanId: subsidiary.id,
      email: inviteEmail,
      peranId: peranKasir.id,
    },
    testUserId,
  );
  assert.ok(undangan, "Undangan harus berhasil dibuat");
  assert.equal(undangan.status, "MENUNGGU");
  assert.ok(undangan.token.startsWith("inv_"));

  // Terima undangan
  const diterima = await terimaUndangan(undangan.token, testUserId);
  assert.ok(diterima, "Undangan harus berhasil diterima");
  assert.equal(diterima.status, "DITERIMA");

  // ==========================================
  // 4. PEMBATASAN AKSES CABANG & GUDANG
  // ==========================================
  console.log("4. Verifying user branch & warehouse access restriction...");
  const cabangBaru = await buatCabang(
    {
      kode: `CB-${suffix}`,
      nama: `Cabang Solo ${suffix}`,
      pusat: false,
    },
    oleh,
  );

  const gudangBaru = await buatGudang(
    {
      kode: `GD-${suffix}`,
      nama: `Gudang Transit Solo ${suffix}`,
    },
    oleh,
  );

  // Batasi akses cabang test user
  await aturAksesCabangPengguna(
    {
      penggunaId: testUserId,
      cabangIds: [cabangBaru.id],
    },
    oleh,
  );

  const aksesCabang = await ambilAksesCabangPengguna(testUserId);
  assert.ok(aksesCabang.terbatas);
  assert.equal(aksesCabang.daftarCabang.length, 1);
  assert.equal(aksesCabang.daftarCabang[0]?.cabangId, cabangBaru.id);

  // Batasi akses gudang test user
  await aturAksesGudangPengguna(
    {
      penggunaId: testUserId,
      gudangIds: [gudangBaru.id],
    },
    oleh,
  );

  const aksesGudang = await ambilAksesGudangPengguna(testUserId);
  assert.ok(aksesGudang.terbatas);
  assert.equal(aksesGudang.daftarGudang.length, 1);
  assert.equal(aksesGudang.daftarGudang[0]?.gudangId, gudangBaru.id);

  // ==========================================
  // 5. AUDIT LOG (JEJAK PERUBAHAN)
  // ==========================================
  console.log("5. Verifying audit logging system...");
  const logCreated = await catatAuditLog({
    perusahaanId: subsidiary.id,
    penggunaId: testUserId,
    penggunaNama: "Staf Finansial",
    aksi: "POSTING",
    entitas: "JURNAL",
    entitasId: `JU/2026/AUDIT-${suffix}`,
    nomorReferensi: `REF-${suffix}`,
    dataSebelum: { status: "DRAFT", total: "10000000.0000" },
    dataSesudah: { status: "POSTED", total: "10000000.0000" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 TestRunner",
  });
  assert.ok(logCreated?.id);

  const listLog = await daftarAuditLog({
    aksi: "POSTING",
    entitas: "JURNAL",
  });
  assert.ok(listLog.total >= 1);

  const detailLog = await ambilAuditLog(logCreated.id);
  assert.equal(detailLog.entitasId, `JU/2026/AUDIT-${suffix}`);
  assert.equal(detailLog.dataSebelumParsed?.status, "DRAFT");
  assert.equal(detailLog.dataSesudahParsed?.status, "POSTED");

  // ==========================================
  // 6. ALUR PERSETUJUAN BERTINGKAT (APPROVAL)
  // ==========================================
  console.log("6. Verifying multi-tier approval workflow...");
  // Buat 2 aturan persetujuan bertingkat untuk jenis BIAYA:
  // - Tingkat 1: nominal >= Rp 5.000.000 (disetujui oleh peran AKUNTAN)
  // - Tingkat 2: nominal >= Rp 20.000.000 (disetujui oleh peran ADMIN)
  await buatAturanPersetujuan(
    {
      perusahaanId: subsidiary.id,
      jenisDokumen: "BIAYA",
      nominalMin: "5000000.0000",
      tingkat: 1,
      peranId: peranAkuntan.id,
      keterangan: "Persetujuan biaya level 1 oleh Akuntan",
    },
    oleh,
  );

  await buatAturanPersetujuan(
    {
      perusahaanId: subsidiary.id,
      jenisDokumen: "BIAYA",
      nominalMin: "20000000.0000",
      tingkat: 2,
      peranId: peranAdmin.id,
      keterangan: "Persetujuan biaya level 2 oleh Direksi/Admin",
    },
    oleh,
  );

  // Dokumen 1: Nominal kecil Rp 2.000.000 (dibawah threshold 5jt) -> Langsung Disetujui Otomatis
  const eval1 = await evaluasiDanAjukanPersetujuan({
    perusahaanId: subsidiary.id,
    jenisDokumen: "BIAYA",
    dokumenId: `DOC-SMALL-${suffix}`,
    nomorDokumen: `BY/2026/001-${suffix}`,
    nominal: "2000000.0000",
    diajukanOleh: testUserId,
  });
  assert.equal(eval1.perluPersetujuan, false);
  assert.equal(eval1.status, "DISETUJUI");

  // Dokumen 2: Nominal besar Rp 25.000.000 (mencapai Tingkat 2) -> Butuh Persetujuan 2 Tingkat
  const eval2 = await evaluasiDanAjukanPersetujuan({
    perusahaanId: subsidiary.id,
    jenisDokumen: "BIAYA",
    dokumenId: `DOC-LARGE-${suffix}`,
    nomorDokumen: `BY/2026/002-${suffix}`,
    nominal: "25000000.0000",
    diajukanOleh: testUserId,
  });
  assert.equal(eval2.perluPersetujuan, true);
  assert.equal(eval2.status, "MENUNGGU");
  assert.equal(eval2.tingkatMaksimal, 2);
  assert.ok(eval2.persetujuanId);

  // Aksi 1: Tingkat 1 disetujui oleh Akuntan -> status masih MENUNGGU, tingkat naik ke 2
  const step1 = await prosesAksiPersetujuan(
    {
      persetujuanId: eval2.persetujuanId!,
      aksi: "DISETUJUI",
      catatan: "Biaya diverifikasi sesuai PO",
    },
    testUserId,
    "Akuntan Lapangan",
  );
  assert.ok(step1);
  assert.equal(step1.status, "MENUNGGU");
  assert.equal(step1.tingkatSaatIni, 2);

  // Aksi 2: Tingkat 2 disetujui oleh Admin -> status resmi DISETUJUI penuh
  const step2 = await prosesAksiPersetujuan(
    {
      persetujuanId: eval2.persetujuanId!,
      aksi: "DISETUJUI",
      catatan: "Disetujui direksi",
    },
    oleh,
    "Administrator Pusat",
  );
  assert.ok(step2);
  assert.equal(step2.status, "DISETUJUI");

  const detailAppr = await ambilDetailPersetujuan(eval2.persetujuanId!);
  assert.equal(detailAppr.status, "DISETUJUI");
  assert.equal(detailAppr.riwayatTindakan.length, 2);

  // Dokumen 3: Nominal Rp 10.000.000 yang ditolak
  const eval3 = await evaluasiDanAjukanPersetujuan({
    perusahaanId: subsidiary.id,
    jenisDokumen: "BIAYA",
    dokumenId: `DOC-REJECT-${suffix}`,
    nomorDokumen: `BY/2026/003-${suffix}`,
    nominal: "10000000.0000",
    diajukanOleh: testUserId,
  });
  assert.ok(eval3.persetujuanId);

  const stepReject = await prosesAksiPersetujuan(
    {
      persetujuanId: eval3.persetujuanId!,
      aksi: "DITOLAK",
      catatan: "Anggaran tidak mencukupi",
    },
    testUserId,
    "Reviewer Keuangan",
  );
  assert.ok(stepReject);
  assert.equal(stepReject.status, "DITOLAK");

  // ==========================================
  // 7. KUNCI TANGGAL TRANSAKSI (LOCK DATE)
  // ==========================================
  console.log("7. Verifying transaction lock date enforcement in accounting engine...");
  // Atur tanggal penguncian transaksi:
  // - kunciSemuaSebelum: 2026-01-31 (terkunci total termasuk admin)
  // - kunciNonAdminSebelum: 2026-02-15 (terkunci untuk non-admin)
  await simpanKunciTransaksi(
    {
      kunciSemuaSebelum: "2026-01-31",
      kunciNonAdminSebelum: "2026-02-15",
      catatan: "Buku Januari 2026 sudah tutup audit.",
    },
    oleh,
  );

  // Validasi 1: Tanggal sebelum kunciSemuaSebelum (mis. 2026-01-20) -> DITOLAK UNTUK SEMUA
  await assert.rejects(
    async () => {
      await pastikanTransaksiTidakTerkunci("2026-01-20", testUserId, true);
    },
    /Buku terkunci: transaksi bertanggal 2026-01-20 mendahului tanggal penguncian buku/,
    "Kunci semua sebelum wajib menolak admin sekalipun",
  );

  // Validasi 2: Tanggal antara kunciSemua dan kunciNonAdmin (mis. 2026-02-10)
  // - Non-admin -> DITOLAK
  await assert.rejects(
    async () => {
      await pastikanTransaksiTidakTerkunci("2026-02-10", testUserId, false);
    },
    /Transaksi terkunci untuk pengguna biasa/,
    "Kunci non-admin wajib menolak pengguna non-admin",
  );
  // - Admin (adalahAdmin = true) -> DIIZINKAN
  await pastikanTransaksiTidakTerkunci("2026-02-10", oleh, true);

  // Validasi 3: Tanggal setelah semua kunci (mis. 2026-03-01) -> DIIZINKAN UNTUK SEMUA
  await pastikanTransaksiTidakTerkunci("2026-03-01", testUserId, false);

  // Integrasi nyata ke Mesin Double-Entry:
  // Coba simpan jurnal berstatus POSTED bertanggal 2026-01-15 -> Harus gagal ditolak!
  await assert.rejects(
    async () => {
      await db.transaction(async (tx) => {
        await simpanJurnal(
          tx,
          {
            tanggal: "2026-01-15",
            deskripsi: "Jurnal terlarang di tanggal terkunci",
            sumber: "MANUAL",
            mataUangId: muDasar.id,
            kurs: "1.00000000",
            posting: true,
            baris: [
              { akunId: akunKas.id, debit: "100000.0000", kredit: "0.0000" },
              { akunId: akunPendapatan.id, debit: "0.0000", kredit: "100000.0000" },
            ],
          },
          oleh,
        );
      });
    },
    /Buku terkunci/,
    "Double-entry engine wajib menolak posting pada tanggal yang terkunci",
  );

  // Reset tanggal penguncian kembali agar tidak mengganggu transaksi masa depan
  await simpanKunciTransaksi(
    {
      kunciSemuaSebelum: undefined,
      kunciNonAdminSebelum: undefined,
      catatan: "Kunci dinonaktifkan pasca pengujian",
    },
    oleh,
  );

  console.log("=== All Milestone M11 (RBAC, Multi-Perusahaan, Kontrol) Verifications PASSED Successfully! ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
