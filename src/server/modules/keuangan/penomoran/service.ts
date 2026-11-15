import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documentSequences } from "@/db/schema/keuangan";
import { galat } from "@/server/core/errors";

export interface DefinisiDokumen {
  prefiks: string;
  nama: string;
  modul: string;
  deskripsi: string;
  formatPola: string;
}

export const DAFTAR_DOKUMEN_SISTEM: DefinisiDokumen[] = [
  {
    prefiks: "FJ",
    nama: "Faktur Penjualan",
    modul: "Penjualan",
    deskripsi: "Tagihan penjualan kepada pelanggan (Sales Invoice)",
    formatPola: "FJ/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "SO",
    nama: "Pesanan Penjualan",
    modul: "Penjualan",
    deskripsi: "Dokumen komitmen order dari pelanggan (Sales Order)",
    formatPola: "SO/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "RJ",
    nama: "Retur Penjualan",
    modul: "Penjualan",
    deskripsi: "Pengembalian barang atau pembatalan penjualan",
    formatPola: "RJ/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "FB",
    nama: "Faktur Pembelian",
    modul: "Pembelian",
    deskripsi: "Tagihan kewajiban dari pemasok / vendor (Purchase Bill)",
    formatPola: "FB/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "PO",
    nama: "Pesanan Pembelian",
    modul: "Pembelian",
    deskripsi: "Dokumen pemesanan barang ke pemasok (Purchase Order)",
    formatPola: "PO/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "RB",
    nama: "Retur Pembelian",
    modul: "Pembelian",
    deskripsi: "Pengembalian barang rusak atau klaim ke pemasok",
    formatPola: "RB/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "BY",
    nama: "Biaya Operasional",
    modul: "Biaya",
    deskripsi: "Pengeluaran beban operasional dan administrasi kantor",
    formatPola: "BY/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "PM",
    nama: "Kas Masuk",
    modul: "Kas & Bank",
    deskripsi: "Penerimaan uang tunai / transfer ke rekening bank",
    formatPola: "PM/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "PK",
    nama: "Kas Keluar",
    modul: "Kas & Bank",
    deskripsi: "Pengeluaran dana tunai / transfer dari kas & bank",
    formatPola: "PK/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "MB",
    nama: "Mutasi Bank",
    modul: "Kas & Bank",
    deskripsi: "Pencatatan transfer antar bank atau mutasi rekening",
    formatPola: "MB/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "JU",
    nama: "Jurnal Umum Memorial",
    modul: "Akuntansi",
    deskripsi: "Jurnal penyesuaian, koreksi, dan amortisasi manual",
    formatPola: "JU/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "PS",
    nama: "Penyesuaian Stok",
    modul: "Persediaan",
    deskripsi: "Hasil stock opname fisik gudang dan koreksi kuantitas",
    formatPola: "PS/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "TG",
    nama: "Transfer Gudang",
    modul: "Persediaan",
    deskripsi: "Mutasi perpindahan barang antar lokasi gudang fisik",
    formatPola: "TG/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "FA",
    nama: "Registrasi Aset Tetap",
    modul: "Aset Tetap",
    deskripsi: "Pencatatan perolehan dan tag nomor inventaris aset",
    formatPola: "FA/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "DP",
    nama: "Penyusutan Aset",
    modul: "Aset Tetap",
    deskripsi: "Jurnal depresiasi amortisasi berkala aset tetap",
    formatPola: "DP/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "PRJ",
    nama: "Proyek & Kontrak",
    modul: "Dimensi",
    deskripsi: "Nomor registrasi penugasan proyek dan cost center",
    formatPola: "PRJ/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "BDG",
    nama: "Anggaran Keuangan",
    modul: "Anggaran",
    deskripsi: "Nomor pengesahan plafon budget tahunan/bulanan",
    formatPola: "BDG/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "CUST",
    nama: "Kode Pelanggan",
    modul: "Master Data",
    deskripsi: "Nomor registrasi unik mitra bisnis pelanggan (Customer)",
    formatPola: "CUST/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "SUPP",
    nama: "Kode Pemasok",
    modul: "Master Data",
    deskripsi: "Nomor identifikasi vendor dan penyedia barang (Supplier)",
    formatPola: "SUPP/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "PRD",
    nama: "SKU Produk & Jasa",
    modul: "Master Data",
    deskripsi: "Kode unik inventaris barang katalog persediaan dan layanan",
    formatPola: "PRD/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "CAT",
    nama: "Kategori Produk",
    modul: "Master Data",
    deskripsi: "Kode klasifikasi hierarki kategori produk dan jasa",
    formatPola: "CAT/{TAHUN}/{NOMOR_5_DIGIT}",
  },
  {
    prefiks: "GDG",
    nama: "Kode Fasilitas Gudang",
    modul: "Master Data",
    deskripsi: "Kode pengenal lokasi fisik penyimpanan persediaan",
    formatPola: "GDG/{TAHUN}/{NOMOR_5_DIGIT}",
  },
];

export interface ItemPenomoran {
  prefiks: string;
  nama: string;
  modul: string;
  deskripsi: string;
  formatPola: string;
  tahun: number;
  nilaiTerakhir: number;
  contohBerikutnya: string;
}

export async function daftarPenomoran(tahunPilihan?: number): Promise<ItemPenomoran[]> {
  const tahun = tahunPilihan ?? new Date().getFullYear();

  const rows = await db
    .select()
    .from(documentSequences)
    .where(eq(documentSequences.tahun, tahun));

  const mapSequence = new Map<string, number>();
  for (const r of rows) {
    mapSequence.set(r.prefiks, r.nilaiTerakhir);
  }

  return DAFTAR_DOKUMEN_SISTEM.map((dok) => {
    const nilaiTerakhir = mapSequence.get(dok.prefiks) ?? 0;
    const nomorBerikutnya = nilaiTerakhir + 1;
    const contohBerikutnya = `${dok.prefiks}/${tahun}/${String(nomorBerikutnya).padStart(5, "0")}`;

    return {
      prefiks: dok.prefiks,
      nama: dok.nama,
      modul: dok.modul,
      deskripsi: dok.deskripsi,
      formatPola: dok.formatPola,
      tahun,
      nilaiTerakhir,
      contohBerikutnya,
    };
  });
}

export async function perbaruiSequence(
  prefiksInput: string,
  nilaiBaru: number,
  tahunPilihan?: number,
): Promise<{ prefiks: string; tahun: number; nilaiTerakhir: number; contohBerikutnya: string }> {
  const prefiks = prefiksInput.toUpperCase();
  const adaDok = DAFTAR_DOKUMEN_SISTEM.some((d) => d.prefiks === prefiks);
  if (!adaDok) {
    throw galat.tidakDitemukan(`Dokumen dengan prefiks '${prefiks}' tidak terdaftar`);
  }

  const tahun = tahunPilihan ?? new Date().getFullYear();

  const [row] = await db
    .insert(documentSequences)
    .values({
      prefiks,
      tahun,
      nilaiTerakhir: nilaiBaru,
    })
    .onConflictDoUpdate({
      target: [documentSequences.prefiks, documentSequences.tahun],
      set: { nilaiTerakhir: nilaiBaru },
    })
    .returning();

  const nomorBerikutnya = (row?.nilaiTerakhir ?? 0) + 1;
  const contohBerikutnya = `${prefiks}/${tahun}/${String(nomorBerikutnya).padStart(5, "0")}`;

  return {
    prefiks,
    tahun,
    nilaiTerakhir: row?.nilaiTerakhir ?? 0,
    contohBerikutnya,
  };
}

export async function ambilNomorBerikutnyaPreview(
  prefiksInput: string,
  tahunPilihan?: number,
): Promise<{ prefiks: string; tahun: number; nomorBerikutnya: string; nilaiTerakhir: number }> {
  const prefiks = prefiksInput.toUpperCase();
  const tahun = tahunPilihan ?? new Date().getFullYear();

  const [row] = await db
    .select({ nilaiTerakhir: documentSequences.nilaiTerakhir })
    .from(documentSequences)
    .where(
      and(
        eq(documentSequences.prefiks, prefiks),
        eq(documentSequences.tahun, tahun),
      ),
    );

  const nilaiTerakhir = row?.nilaiTerakhir ?? 0;
  const counterBerikutnya = nilaiTerakhir + 1;
  const nomorBerikutnya = `${prefiks}/${tahun}/${String(counterBerikutnya).padStart(5, "0")}`;

  return {
    prefiks,
    tahun,
    nomorBerikutnya,
    nilaiTerakhir,
  };
}
