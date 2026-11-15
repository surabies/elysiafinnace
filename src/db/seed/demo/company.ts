import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import {
  branches,
  companies,
  companyUsers,
  currencies,
  departments,
  projects,
  roles,
  tags,
  warehouses,
} from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export interface HasilDemoCompany {
  perusahaanId: string;
  cabangPusatId: string;
  cabangSurabayaId: string;
  gudangUtamaId: string;
  gudangTransitId: string;
  departemenKeuanganId: string;
  proyekDemoId: string;
}

export async function seedDemoCompany(db: Db): Promise<HasilDemoCompany> {
  console.log("  [demo] Menyiapkan profil perusahaan, cabang, gudang, dan struktur organisasi...");

  // 1. Ambil Mata Uang Dasar (IDR)
  const [mataUangDasar] = await db
    .select({ id: currencies.id })
    .from(currencies)
    .where(eq(currencies.kode, "IDR"));

  if (!mataUangDasar) {
    throw new Error("[seed demo] Mata uang dasar IDR belum ditanam. Jalankan Layer 1 terlebih dahulu.");
  }

  // 2. Admin User Demo (Better Auth Account)
  const ADMIN_EMAIL = "admin@elysia.co.id";
  const ADMIN_PASS = "AdminElysia2026!";
  let demoUserId: string | undefined;

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL));

  if (existingUser) {
    demoUserId = existingUser.id;
  } else {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          name: "Administrator Elysia",
          email: ADMIN_EMAIL,
          password: ADMIN_PASS,
        },
      });
      demoUserId = res.user.id;
    } catch {
      const [u] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, ADMIN_EMAIL));
      demoUserId = u?.id;
    }
  }

  if (!demoUserId) {
    throw new Error("[seed demo] Gagal membuat atau mendapatkan akun Administrator Demo.");
  }

  // 3. Perusahaan Demo: PT Elysia Niaga Nusantara
  const [existingCompany] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.kode, "ENN"));

  let perusahaanId = existingCompany?.id;

  if (!perusahaanId) {
    const [inserted] = await db
      .insert(companies)
      .values({
        kode: "ENN",
        nama: "PT Elysia Niaga Nusantara",
        npwp: "01.234.567.8-012.000",
        alamat: "Jl. Jend. Sudirman Kav. 52-53, Kawasan SCBD, Senayan, Jakarta Selatan 12190",
        telepon: "021-5550192",
        email: "finance@elysia.co.id",
        mataUangDasarId: mataUangDasar.id,
        adalahHolding: false,
        aktif: true,
      })
      .returning({ id: companies.id });
    if (!inserted) throw new Error("Gagal membuat profil perusahaan demo.");
    perusahaanId = inserted.id;
  }

  // 4. Hubungkan Admin User ke Perusahaan dengan Role ADMIN
  const [adminRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.kode, "ADMIN"));

  if (adminRole) {
    await db
      .insert(companyUsers)
      .values({
        perusahaanId,
        penggunaId: demoUserId,
        peranId: adminRole.id,
        adalahUtama: true,
        aktif: true,
      })
      .onConflictDoNothing();
  }

  // 5. Cabang (Branches)
  await db
    .insert(branches)
    .values([
      {
        kode: "JKT-PST",
        nama: "Kantor Pusat Jakarta (SCBD)",
        alamat: "Equity Tower Lt. 28, SCBD Jakarta Selatan",
        telepon: "021-5550192",
        penanggungJawab: "Bambang Sudibyo, SE, Ak",
        pusat: true,
        aktif: true,
      },
      {
        kode: "SBY-CAB",
        nama: "Kantor Cabang Surabaya",
        alamat: "Jl. Basuki Rahmat No. 88, Embong Kaliasin, Surabaya",
        telepon: "031-7890123",
        penanggungJawab: "Surya Darmadi",
        pusat: false,
        aktif: true,
      },
    ])
    .onConflictDoNothing({ target: branches.kode });

  const [cabangPusat] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.kode, "JKT-PST"));

  const [cabangSurabaya] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.kode, "SBY-CAB"));

  // 6. Departemen (Cost Center)
  await db
    .insert(departments)
    .values([
      { kode: "KEU", nama: "Keuangan & Akuntansi", manajer: "Bambang Sudibyo", aktif: true },
      { kode: "OPS", nama: "Operasional & Gudang", manajer: "Hendra Wijaya", aktif: true },
      { kode: "MKT", nama: "Pemasaran & Penjualan", manajer: "Anita Rahmawati", aktif: true },
      { kode: "HRD", nama: "Sumber Daya Manusia & GA", manajer: "Dewi Lestari", aktif: true },
    ])
    .onConflictDoNothing({ target: departments.kode });

  const [deptKeuangan] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.kode, "KEU"));

  // 7. Gudang (Warehouses)
  await db
    .insert(warehouses)
    .values([
      {
        kode: "GUD-UTAMA",
        nama: "Gudang Utama Cakung Logistik",
        alamat: "Kawasan Industri Pulo Gadung / Cakung, Jakarta Timur",
        penanggungJawab: "Hendra Wijaya",
        adalahGudangUtama: true,
        keterangan: "Pusat distribusi utama wilayah Jawa Barat & Jabodetabek",
        aktif: true,
        dibuatOleh: "system",
        diubahOleh: "system",
      },
      {
        kode: "GUD-TRANSIT",
        nama: "Gudang Transit Rungkut Surabaya",
        alamat: "Kawasan SIER Rungkut Industri, Surabaya",
        penanggungJawab: "Surya Darmadi",
        adalahGudangUtama: false,
        keterangan: "Pusat transit & hub distribusi Jawa Timur & Indonesia Timur",
        aktif: true,
        dibuatOleh: "system",
        diubahOleh: "system",
      },
    ])
    .onConflictDoNothing({ target: warehouses.kode });

  const [gudangUtama] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(eq(warehouses.kode, "GUD-UTAMA"));

  const [gudangTransit] = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(eq(warehouses.kode, "GUD-TRANSIT"));

  // 8. Proyek Demo (Project Costing)
  await db
    .insert(projects)
    .values({
      kode: "PRJ-2026-001",
      nama: "Pengadaan & Distribusi Perangkat POS Retail Nasional",
      tanggalMulai: "2026-01-15",
      tanggalSelesai: "2026-12-31",
      nilaiKontrak: "1250000000",
      status: "BERJALAN",
      penanggungJawab: "Anita Rahmawati",
      keterangan: "Kontrak pengadaan terminal POS retail ke 50 gerai modern",
      aktif: true,
    })
    .onConflictDoNothing({ target: projects.kode });

  const [proyekDemo] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.kode, "PRJ-2026-001"));

  // 9. Tag Transaksi
  await db
    .insert(tags)
    .values([
      { nama: "Retail", warna: "#2563eb", keterangan: "Transaksi segmen ritel" },
      { nama: "Distribusi", warna: "#16a34a", keterangan: "Transaksi distributor grosir" },
      { nama: "CAPEX", warna: "#d97706", keterangan: "Belanja modal aset tetap" },
      { nama: "Audited", warna: "#7c3aed", keterangan: "Dokumen terverifikasi auditor" },
    ])
    .onConflictDoNothing({ target: tags.nama });

  if (!cabangPusat || !cabangSurabaya || !gudangUtama || !gudangTransit || !deptKeuangan || !proyekDemo) {
    throw new Error("[seed demo] Gagal mendapatkan entitas organisasi demo.");
  }

  return {
    perusahaanId,
    cabangPusatId: cabangPusat.id,
    cabangSurabayaId: cabangSurabaya.id,
    gudangUtamaId: gudangUtama.id,
    gudangTransitId: gudangTransit.id,
    departemenKeuanganId: deptKeuangan.id,
    proyekDemoId: proyekDemo.id,
  };
}
