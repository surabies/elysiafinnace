import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  DAFTAR_IZIN,
  SALDO_NORMAL_BAWAAN,
  chartOfAccounts,
  currencies,
  paymentTerms,
  productCategories,
  rolePermissions,
  roles,
  unitsOfMeasurement,
  type KategoriArusKas,
  type PeranSistem,
  type SaldoNormal,
  type TipeAkun,
} from "../schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, any>;

/**
 * Seed data dasar modul keuangan (Phase 1). Aman dijalankan berulang kali:
 * setiap baris memakai kode unik dan onConflictDoNothing, sehingga data yang
 * sudah ada atau sudah Anda ubah tidak ditimpa.
 */

const DAFTAR_MATA_UANG = [
  { kode: "IDR", nama: "Rupiah Indonesia", simbol: "Rp", jumlahDesimal: 2, adalahMataUangDasar: true },
  { kode: "USD", nama: "Dolar Amerika Serikat", simbol: "$", jumlahDesimal: 2, adalahMataUangDasar: false },
  { kode: "EUR", nama: "Euro", simbol: "€", jumlahDesimal: 2, adalahMataUangDasar: false },
  { kode: "SGD", nama: "Dolar Singapura", simbol: "S$", jumlahDesimal: 2, adalahMataUangDasar: false },
];

const DAFTAR_TERMIN = [
  { kode: "TUNAI", nama: "Tunai", jumlahHari: 0, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-14", nama: "Net 14 Hari", jumlahHari: 14, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-30", nama: "Net 30 Hari", jumlahHari: 30, persenDiskon: "0", hariDiskon: 0 },
  { kode: "NET-45", nama: "Net 45 Hari", jumlahHari: 45, persenDiskon: "0", hariDiskon: 0 },
  { kode: "2/10-NET-30", nama: "Diskon 2% jika dibayar 10 hari, jatuh tempo 30 hari", jumlahHari: 30, persenDiskon: "2", hariDiskon: 10 },
];

const DAFTAR_SATUAN = [
  { kode: "PCS", nama: "Pieces" },
  { kode: "UNIT", nama: "Unit" },
  { kode: "BOX", nama: "Box" },
  { kode: "KG", nama: "Kilogram" },
  { kode: "LITER", nama: "Liter" },
  { kode: "M", nama: "Meter" },
  { kode: "M3", nama: "Meter Kubik" },
  { kode: "JAM", nama: "Jam" },
];

const DAFTAR_KATEGORI = [
  { kode: "UMUM", nama: "Umum" },
  { kode: "JASA", nama: "Jasa" },
];

type DefinisiAkun = {
  kode: string;
  nama: string;
  tipe: TipeAkun;
  induk?: string;
  header?: boolean;
  kontra?: boolean;
  peran?: PeranSistem;
  arusKas?: KategoriArusKas;
};

/** Bagan akun standar perusahaan dagang/jasa Indonesia. Urutan: induk selalu sebelum anak. */
const DAFTAR_AKUN: DefinisiAkun[] = [
  // ASET
  { kode: "1000", nama: "ASET", tipe: "ASET", header: true },
  { kode: "1100", nama: "Aset Lancar", tipe: "ASET", induk: "1000", header: true },
  { kode: "1110", nama: "Kas dan Setara Kas", tipe: "ASET", induk: "1100", header: true },
  { kode: "1111", nama: "Kas Kecil", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1112", nama: "Bank Operasional", tipe: "ASET", induk: "1110", peran: "KAS_BANK" },
  { kode: "1120", nama: "Piutang Usaha", tipe: "ASET", induk: "1100", peran: "PIUTANG_USAHA" },
  { kode: "1130", nama: "Persediaan Barang Dagang", tipe: "ASET", induk: "1100", peran: "PERSEDIAAN" },
  { kode: "1140", nama: "PPN Masukan", tipe: "ASET", induk: "1100", peran: "PPN_MASUKAN" },
  { kode: "1200", nama: "Aset Tetap", tipe: "ASET", induk: "1000", header: true },
  { kode: "1210", nama: "Peralatan", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1219", nama: "Akumulasi Penyusutan Peralatan", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  // KEWAJIBAN
  { kode: "2000", nama: "KEWAJIBAN", tipe: "KEWAJIBAN", header: true },
  { kode: "2100", nama: "Kewajiban Jangka Pendek", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2110", nama: "Hutang Usaha", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_USAHA" },
  { kode: "2120", nama: "PPN Keluaran", tipe: "KEWAJIBAN", induk: "2100", peran: "PPN_KELUARAN" },
  { kode: "2130", nama: "Hutang Gaji", tipe: "KEWAJIBAN", induk: "2100" },
  { kode: "2200", nama: "Kewajiban Jangka Panjang", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2210", nama: "Hutang Bank Jangka Panjang", tipe: "KEWAJIBAN", induk: "2200", arusKas: "PENDANAAN" },
  // EKUITAS
  { kode: "3000", nama: "EKUITAS", tipe: "EKUITAS", header: true },
  { kode: "3100", nama: "Modal Disetor", tipe: "EKUITAS", induk: "3000", peran: "MODAL_DISETOR", arusKas: "PENDANAAN" },
  { kode: "3200", nama: "Laba Ditahan", tipe: "EKUITAS", induk: "3000", peran: "LABA_DITAHAN", arusKas: "PENDANAAN" },
  // PENDAPATAN
  { kode: "4000", nama: "PENDAPATAN", tipe: "PENDAPATAN", header: true },
  { kode: "4100", nama: "Pendapatan Penjualan", tipe: "PENDAPATAN", induk: "4000", peran: "PENDAPATAN_PENJUALAN" },
  { kode: "4200", nama: "Retur dan Potongan Penjualan", tipe: "PENDAPATAN", induk: "4000", kontra: true },
  { kode: "4900", nama: "Pendapatan Lain-lain", tipe: "PENDAPATAN", induk: "4000", header: true },
  { kode: "4910", nama: "Laba Selisih Kurs", tipe: "PENDAPATAN", induk: "4900", peran: "LABA_SELISIH_KURS" },
  // BEBAN
  { kode: "5000", nama: "HARGA POKOK PENJUALAN", tipe: "BEBAN", header: true },
  { kode: "5100", nama: "Harga Pokok Penjualan", tipe: "BEBAN", induk: "5000", peran: "HARGA_POKOK_PENJUALAN" },
  { kode: "6000", nama: "BEBAN OPERASIONAL", tipe: "BEBAN", header: true },
  { kode: "6100", nama: "Beban Gaji dan Upah", tipe: "BEBAN", induk: "6000" },
  { kode: "6200", nama: "Beban Sewa", tipe: "BEBAN", induk: "6000" },
  { kode: "6300", nama: "Beban Listrik, Air, dan Telepon", tipe: "BEBAN", induk: "6000" },
  { kode: "6400", nama: "Beban Perlengkapan Kantor", tipe: "BEBAN", induk: "6000" },
  { kode: "6500", nama: "Beban Transportasi", tipe: "BEBAN", induk: "6000" },
  { kode: "6600", nama: "Beban Penyusutan", tipe: "BEBAN", induk: "6000" },
  { kode: "6900", nama: "Beban Operasional Lainnya", tipe: "BEBAN", induk: "6000" },
  { kode: "7000", nama: "BEBAN NON-OPERASIONAL", tipe: "BEBAN", header: true },
  { kode: "7100", nama: "Rugi Selisih Kurs", tipe: "BEBAN", induk: "7000", peran: "RUGI_SELISIH_KURS" },
  { kode: "7200", nama: "Beban Bunga dan Administrasi Bank", tipe: "BEBAN", induk: "7000" },
];

export async function jalankanSeedKeuangan(db: Db) {
  console.log("[seed keuangan] Memulai seed data dasar keuangan...");

  await db.insert(currencies).values(DAFTAR_MATA_UANG).onConflictDoNothing();
  await db.insert(paymentTerms).values(DAFTAR_TERMIN).onConflictDoNothing();
  await db.insert(unitsOfMeasurement).values(DAFTAR_SATUAN).onConflictDoNothing();
  await db.insert(productCategories).values(DAFTAR_KATEGORI).onConflictDoNothing();

  const [dasar] = await db
    .select({ id: currencies.id })
    .from(currencies)
    .where(eq(currencies.adalahMataUangDasar, true));
  if (!dasar) {
    throw new Error("[seed keuangan] Mata uang dasar belum ada. Seed mata uang gagal.");
  }

  // Akun dimasukkan berurutan agar induk sudah ada ketika anak dibuat.
  const petaId = new Map<string, { id: string; level: number }>();
  for (const a of DAFTAR_AKUN) {
    const induk = a.induk ? petaId.get(a.induk) : undefined;
    if (a.induk && !induk) {
      throw new Error(`[seed keuangan] Akun induk ${a.induk} untuk ${a.kode} tidak ditemukan.`);
    }
    const normalBalance: SaldoNormal = a.kontra
      ? SALDO_NORMAL_BAWAAN[a.tipe] === "DEBIT"
        ? "KREDIT"
        : "DEBIT"
      : SALDO_NORMAL_BAWAAN[a.tipe];

    await db
      .insert(chartOfAccounts)
      .values({
        kode: a.kode,
        nama: a.nama,
        tipeAkun: a.tipe,
        normalBalance,
        indukId: induk?.id ?? null,
        level: (induk?.level ?? 0) + 1,
        bisaDiposting: !a.header,
        adalahAkunKontra: a.kontra ?? false,
        peranSistem: a.peran ?? null,
        kategoriArusKas: a.arusKas ?? null,
      })
      .onConflictDoNothing({ target: chartOfAccounts.kode });

    const [baris] = await db
      .select({ id: chartOfAccounts.id, level: chartOfAccounts.level })
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.kode, a.kode));
    if (!baris) throw new Error(`[seed keuangan] Akun ${a.kode} gagal dibuat.`);
    petaId.set(a.kode, baris);
  }

  await db
    .insert(roles)
    .values([
      {
        kode: "ADMIN",
        nama: "Administrator",
        keterangan: "Akses penuh modul keuangan.",
        aksesPenuh: true,
        adalahSistem: true,
      },
      {
        kode: "AKUNTAN",
        nama: "Akuntan",
        keterangan: "Jurnal, laporan, dan siklus dagang. Tanpa kelola hak akses.",
        aksesPenuh: false,
        adalahSistem: true,
      },
      {
        kode: "KASIR",
        nama: "Kasir",
        keterangan: "Kas, bank, dan biaya.",
        aksesPenuh: false,
        adalahSistem: true,
      },
    ])
    .onConflictDoNothing();

  const daftarPeran = await db.select({ id: roles.id, kode: roles.kode }).from(roles);
  const idPeran = new Map(daftarPeran.map((p) => [p.kode, p.id]));
  const izinAkuntan = DAFTAR_IZIN.filter((izin) => izin !== "rbac.kelola");
  const izinKasir = [
    "master_data.baca",
    "kas_bank.baca",
    "kas_bank.kelola",
    "biaya.baca",
    "biaya.kelola",
    "biaya.posting",
    "pembayaran.baca",
    "pembayaran.kelola",
  ] as const;
  const barisIzin = [
    ...izinAkuntan.map((izin) => ({ peranId: idPeran.get("AKUNTAN")!, izin })),
    ...izinKasir.map((izin) => ({ peranId: idPeran.get("KASIR")!, izin })),
  ].filter((b) => b.peranId);
  if (barisIzin.length > 0) await db.insert(rolePermissions).values(barisIzin).onConflictDoNothing();

  console.log(
    `[seed keuangan] Selesai: ${DAFTAR_MATA_UANG.length} mata uang, ${DAFTAR_AKUN.length} akun COA, ` +
      `${DAFTAR_TERMIN.length} termin, ${DAFTAR_SATUAN.length} satuan, ${DAFTAR_KATEGORI.length} kategori.`,
  );
}
