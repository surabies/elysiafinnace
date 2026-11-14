import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  DAFTAR_IZIN,
  SALDO_NORMAL_BAWAAN,
  assetCategories,
  branches,
  chartOfAccounts,
  companies,
  currencies,
  departments,
  paymentTerms,
  productCategories,
  rolePermissions,
  roles,
  taxes,
  unitsOfMeasurement,
  type KategoriArusKas,
  type PeranSistem,
  type SaldoNormal,
  type TipeAkun,
} from "../schema/keuangan";

type Db = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

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
  { kode: "1150", nama: "Uang Muka Pembelian", tipe: "ASET", induk: "1100", peran: "UANG_MUKA_PEMASOK" },
  { kode: "1160", nama: "Pajak Dibayar Dimuka (PPh)", tipe: "ASET", induk: "1100", peran: "PAJAK_DIBAYAR_DIMUKA" },
  { kode: "1200", nama: "Aset Tetap", tipe: "ASET", induk: "1000", header: true },
  { kode: "1210", nama: "Peralatan", tipe: "ASET", induk: "1200", arusKas: "INVESTASI" },
  { kode: "1219", nama: "Akumulasi Penyusutan Peralatan", tipe: "ASET", induk: "1200", kontra: true, arusKas: "INVESTASI" },
  // KEWAJIBAN
  { kode: "2000", nama: "KEWAJIBAN", tipe: "KEWAJIBAN", header: true },
  { kode: "2100", nama: "Kewajiban Jangka Pendek", tipe: "KEWAJIBAN", induk: "2000", header: true },
  { kode: "2110", nama: "Hutang Usaha", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_USAHA" },
  { kode: "2120", nama: "PPN Keluaran", tipe: "KEWAJIBAN", induk: "2100", peran: "PPN_KELUARAN" },
  { kode: "2130", nama: "Hutang Gaji", tipe: "KEWAJIBAN", induk: "2100" },
  { kode: "2140", nama: "Uang Muka Penjualan", tipe: "KEWAJIBAN", induk: "2100", peran: "UANG_MUKA_PELANGGAN" },
  { kode: "2150", nama: "Hutang Pajak (PPh)", tipe: "KEWAJIBAN", induk: "2100", peran: "HUTANG_PAJAK" },
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
  { kode: "4920", nama: "Laba Pelepasan Aset Tetap", tipe: "PENDAPATAN", induk: "4900" },
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
  { kode: "7110", nama: "Rugi Pelepasan Aset Tetap", tipe: "BEBAN", induk: "7000" },
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
      {
        kode: "AUDITOR",
        nama: "Auditor",
        keterangan: "Akses lihat (read-only) untuk seluruh modul keuangan dan audit log.",
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
  const izinAuditor = DAFTAR_IZIN.filter((izin) => izin.endsWith(".baca"));
  const barisIzin = [
    ...izinAkuntan.map((izin) => ({ peranId: idPeran.get("AKUNTAN")!, izin })),
    ...izinKasir.map((izin) => ({ peranId: idPeran.get("KASIR")!, izin })),
    ...izinAuditor.map((izin) => ({ peranId: idPeran.get("AUDITOR")!, izin })),
  ].filter((b) => b.peranId);
  if (barisIzin.length > 0) await db.insert(rolePermissions).values(barisIzin).onConflictDoNothing();

  // Seed Pajak Indonesia Bawaan
  const akunPpnKeluaran = petaId.get("2120");
  const akunPpnMasukan = petaId.get("1140");
  const akunPphDibayarDimuka = petaId.get("1160");
  const akunHutangPph = petaId.get("2150");

  const DAFTAR_PAJAK = [
    {
      kode: "PPN11",
      nama: "PPN 11%",
      tipePajak: "PPN" as const,
      kategoriPajak: "PAJAK_KELUARAN" as const,
      persentaseTarif: "11.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: akunPpnKeluaran?.id,
      akunPajakPembelianId: akunPpnMasukan?.id,
      keterangan: "Pajak Pertambahan Nilai tarif umum UU HPP (11%)",
    },
    {
      kode: "PPN12",
      nama: "PPN 12%",
      tipePajak: "PPN" as const,
      kategoriPajak: "PAJAK_KELUARAN" as const,
      persentaseTarif: "12.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: akunPpnKeluaran?.id,
      akunPajakPembelianId: akunPpnMasukan?.id,
      keterangan: "Pajak Pertambahan Nilai UU HPP (12%)",
    },
    {
      kode: "PPH23-JASA",
      nama: "PPh 23 - Jasa (2%)",
      tipePajak: "PPH_23" as const,
      kategoriPajak: "PEMOTONGAN_PEMUNGUTAN" as const,
      persentaseTarif: "2.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: akunPphDibayarDimuka?.id,
      akunPajakPembelianId: akunHutangPph?.id,
      keterangan: "PPh Pasal 23 atas Jasa Teknik/Manajemen/Konsultan",
    },
    {
      kode: "PPH42-SEWA",
      nama: "PPh 4(2) - Sewa Tanah/Bangunan (10%)",
      tipePajak: "PPH_4_AYAT_2" as const,
      kategoriPajak: "PEMOTONGAN_PEMUNGUTAN" as const,
      persentaseTarif: "10.0000",
      dppNilaiLain: false,
      faktorDpp: "100.0000",
      akunPajakPenjualanId: akunPphDibayarDimuka?.id,
      akunPajakPembelianId: akunHutangPph?.id,
      keterangan: "PPh Pasal 4 ayat (2) Final atas Sewa Tanah/Bangunan",
    },
  ];

  for (const p of DAFTAR_PAJAK) {
    await db
      .insert(taxes)
      .values(p)
      .onConflictDoNothing({ target: taxes.kode });
  }

  // Seed Kategori Aset Tetap Bawaan
  const akunPeralatan = petaId.get("1210");
  const akunAkumPenyusutan = petaId.get("1219");
  const akunBebanPenyusutan = petaId.get("6600");

  if (akunPeralatan && akunAkumPenyusutan && akunBebanPenyusutan) {
    const DAFTAR_KATEGORI_ASET = [
      {
        kode: "KAT-PERALATAN",
        nama: "Peralatan Kantor & Komputer (Golongan 1)",
        metodePenyusutan: "GARIS_LURUS" as const,
        golonganFiskal: "GOLONGAN_1" as const,
        masaManfaatBulan: 48,
        tarifTahunanPersen: "25.0000",
        akunAsetId: akunPeralatan.id,
        akunAkumulasiPenyusutanId: akunAkumPenyusutan.id,
        akunBebanPenyusutanId: akunBebanPenyusutan.id,
        keterangan: "Aset tetap bukan bangunan kelompok 1 fiskal (masa manfaat 4 tahun)",
      },
      {
        kode: "KAT-KENDARAAN",
        nama: "Kendaraan Operasional (Golongan 2)",
        metodePenyusutan: "GARIS_LURUS" as const,
        golonganFiskal: "GOLONGAN_2" as const,
        masaManfaatBulan: 96,
        tarifTahunanPersen: "12.5000",
        akunAsetId: akunPeralatan.id,
        akunAkumulasiPenyusutanId: akunAkumPenyusutan.id,
        akunBebanPenyusutanId: akunBebanPenyusutan.id,
        keterangan: "Aset tetap bukan bangunan kelompok 2 fiskal (masa manfaat 8 tahun)",
      },
    ];

    for (const k of DAFTAR_KATEGORI_ASET) {
      await db
        .insert(assetCategories)
        .values(k)
        .onConflictDoNothing({ target: assetCategories.kode });
    }
  }

  // Seed Cabang Bawaan (Head Office & Branch)
  const DAFTAR_CABANG = [
    {
      kode: "HO",
      nama: "Kantor Pusat Jakarta",
      alamat: "Jl. Jendral Sudirman Kav. 52-53, Jakarta Selatan",
      telepon: "021-5150000",
      penanggungJawab: "Direktur Utama",
      pusat: true,
      aktif: true,
    },
    {
      kode: "SBY",
      nama: "Kantor Cabang Surabaya",
      alamat: "Jl. Basuki Rahmat No. 100, Surabaya",
      telepon: "031-5310000",
      penanggungJawab: "Kepala Cabang Surabaya",
      pusat: false,
      aktif: true,
    },
  ];

  for (const c of DAFTAR_CABANG) {
    await db
      .insert(branches)
      .values(c)
      .onConflictDoNothing({ target: branches.kode });
  }

  // Seed Departemen Bawaan
  const DAFTAR_DEPARTEMEN = [
    { kode: "DIR", nama: "Direksi & Manajemen", manajer: "Direktur Utama", aktif: true },
    { kode: "FIN", nama: "Keuangan & Akuntansi", manajer: "Finance Manager", aktif: true },
    { kode: "IT", nama: "Teknologi Informasi", manajer: "Head of IT", aktif: true },
    { kode: "OPS", nama: "Operasional & Logistik", manajer: "Operations Manager", aktif: true },
  ];

  for (const d of DAFTAR_DEPARTEMEN) {
    await db
      .insert(departments)
      .values(d)
      .onConflictDoNothing({ target: departments.kode });
  }

  // Seed Perusahaan Holding Bawaan
  const muIdr = await db.select().from(currencies).where(eq(currencies.kode, "IDR")).limit(1);
  if (muIdr.length > 0) {
    await db
      .insert(companies)
      .values({
        kode: "PT-ELYSIA",
        nama: "PT Elysia Finance Indonesia",
        npwp: "01.123.456.7-012.000",
        alamat: "Jl. Jendral Sudirman Kav. 52-53, Jakarta Selatan",
        telepon: "021-5150000",
        email: "corporate@elysiafinance.co.id",
        mataUangDasarId: muIdr[0]!.id,
        adalahHolding: true,
        aktif: true,
      })
      .onConflictDoNothing({ target: companies.kode });
  }

  console.log(
    `[seed keuangan] Selesai: ${DAFTAR_MATA_UANG.length} mata uang, ${DAFTAR_AKUN.length} akun COA, ` +
      `${DAFTAR_TERMIN.length} termin, ${DAFTAR_SATUAN.length} satuan, ${DAFTAR_KATEGORI.length} kategori, ${DAFTAR_PAJAK.length} pajak, ` +
      `${DAFTAR_CABANG.length} cabang, ${DAFTAR_DEPARTEMEN.length} departemen, 1 perusahaan.`,
  );
}
