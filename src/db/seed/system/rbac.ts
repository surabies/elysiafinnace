import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { DAFTAR_IZIN, rolePermissions, roles, type Izin } from "@/db/schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export const DAFTAR_PERAN_SISTEM = [
  {
    kode: "ADMIN",
    nama: "Administrator Utama",
    keterangan: "Akses penuh dan tidak terbatas ke seluruh modul keuangan, sistem, dan hak akses.",
    aksesPenuh: true,
    adalahSistem: true,
  },
  {
    kode: "MANAJER_KEUANGAN",
    nama: "Manajer Keuangan",
    keterangan: "Akses otorisasi persetujuan, tutup buku, laporan eksekutif, dan pembukuan.",
    aksesPenuh: false,
    adalahSistem: true,
  },
  {
    kode: "AKUNTAN",
    nama: "Akuntan / Pembukuan",
    keterangan: "Akses jurnal umum, buku besar, rekonsiliasi, siklus dagang, dan laporan SAK.",
    aksesPenuh: false,
    adalahSistem: true,
  },
  {
    kode: "KASIR",
    nama: "Kasir Operasional",
    keterangan: "Pencatatan kas masuk, kas keluar, biaya operasional, dan penerimaan pembayaran.",
    aksesPenuh: false,
    adalahSistem: true,
  },
  {
    kode: "PEMBELIAN",
    nama: "Staf Pembelian / Pengadaan",
    keterangan: "Pesanan Pembelian (PO), Faktur Pembelian, dan Retur Pemasok.",
    aksesPenuh: false,
    adalahSistem: true,
  },
  {
    kode: "PENJUALAN",
    nama: "Staf Penjualan",
    keterangan: "Pesanan Penjualan (SO), Faktur Penjualan, dan Retur Pelanggan.",
    aksesPenuh: false,
    adalahSistem: true,
  },
  {
    kode: "GUDANG",
    nama: "Staf Gudang & Logistik",
    keterangan: "Mutasi persediaan, transfer antar-gudang, dan penyesuaian stok opname.",
    aksesPenuh: false,
    adalahSistem: true,
  },
  {
    kode: "AUDITOR",
    nama: "Auditor Eksternal / Internal",
    keterangan: "Hak akses lihat saja (Read-Only) untuk seluruh modul keuangan dan jejak audit log.",
    aksesPenuh: false,
    adalahSistem: true,
  },
];

export async function seedRbac(db: Db) {
  console.log("  [system] Menanamkan katalog peran & matriks izin RBAC...");

  await db.insert(roles).values(DAFTAR_PERAN_SISTEM).onConflictDoNothing();

  const daftarPeran = await db.select({ id: roles.id, kode: roles.kode }).from(roles);
  const idPeran = new Map(daftarPeran.map((p) => [p.kode, p.id]));

  // Pemetaan izin spesifik per peran
  const izinManajer = DAFTAR_IZIN.filter((izin) => izin !== "rbac.kelola");
  const izinAkuntan = DAFTAR_IZIN.filter((izin) => !izin.startsWith("rbac.") && !izin.startsWith("kontrol."));
  const izinKasir: Izin[] = [
    "master_data.baca",
    "kas_bank.baca",
    "kas_bank.kelola",
    "biaya.baca",
    "biaya.kelola",
    "biaya.posting",
    "pembayaran.baca",
    "pembayaran.kelola",
  ];
  const izinPembelian: Izin[] = [
    "master_data.baca",
    "pembelian.baca",
    "pembelian.kelola",
    "pembelian.posting",
  ];
  const izinPenjualan: Izin[] = [
    "master_data.baca",
    "penjualan.baca",
    "penjualan.kelola",
    "penjualan.posting",
  ];
  const izinGudang: Izin[] = [
    "master_data.baca",
    "persediaan.baca",
    "persediaan.kelola",
  ];
  const izinAuditor = DAFTAR_IZIN.filter((izin) => izin.endsWith(".baca"));

  const barisIzin: Array<{ peranId: string; izin: Izin }> = [];

  const tambahIzin = (kodePeran: string, daftar: readonly Izin[]) => {
    const peranId = idPeran.get(kodePeran);
    if (!peranId) return;
    for (const izin of daftar) {
      barisIzin.push({ peranId, izin });
    }
  };

  tambahIzin("MANAJER_KEUANGAN", izinManajer);
  tambahIzin("AKUNTAN", izinAkuntan);
  tambahIzin("KASIR", izinKasir);
  tambahIzin("PEMBELIAN", izinPembelian);
  tambahIzin("PENJUALAN", izinPenjualan);
  tambahIzin("GUDANG", izinGudang);
  tambahIzin("AUDITOR", izinAuditor);

  if (barisIzin.length > 0) {
    await db.insert(rolePermissions).values(barisIzin).onConflictDoNothing();
  }
}
