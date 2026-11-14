-- Migration 0010: Pajak Indonesia (M8)
-- 1. Tambah nilai enum peran_sistem_akun
ALTER TYPE "peran_sistem_akun" ADD VALUE IF NOT EXISTS 'PAJAK_DIBAYAR_DIMUKA';
ALTER TYPE "peran_sistem_akun" ADD VALUE IF NOT EXISTS 'HUTANG_PAJAK';

-- Update check constraint chart_of_accounts untuk peran_sistem baru
ALTER TABLE "chart_of_accounts" DROP CONSTRAINT IF EXISTS "ck_chart_of_accounts_peran_sesuai_tipe";
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "ck_chart_of_accounts_peran_sesuai_tipe" CHECK (
  peran_sistem IS NULL OR (
    (peran_sistem = 'KAS_BANK' AND tipe_akun = 'ASET') OR
    (peran_sistem = 'PIUTANG_USAHA' AND tipe_akun = 'ASET') OR
    (peran_sistem = 'PERSEDIAAN' AND tipe_akun = 'ASET') OR
    (peran_sistem = 'PPN_MASUKAN' AND tipe_akun = 'ASET') OR
    (peran_sistem = 'PAJAK_DIBAYAR_DIMUKA' AND tipe_akun = 'ASET') OR
    (peran_sistem = 'UANG_MUKA_PEMASOK' AND tipe_akun = 'ASET') OR
    (peran_sistem = 'HUTANG_USAHA' AND tipe_akun = 'KEWAJIBAN') OR
    (peran_sistem = 'PPN_KELUARAN' AND tipe_akun = 'KEWAJIBAN') OR
    (peran_sistem = 'HUTANG_PAJAK' AND tipe_akun = 'KEWAJIBAN') OR
    (peran_sistem = 'UANG_MUKA_PELANGGAN' AND tipe_akun = 'KEWAJIBAN') OR
    (peran_sistem = 'MODAL_DISETOR' AND tipe_akun = 'EKUITAS') OR
    (peran_sistem = 'LABA_DITAHAN' AND tipe_akun = 'EKUITAS') OR
    (peran_sistem = 'EKUITAS_SALDO_AWAL' AND tipe_akun = 'EKUITAS') OR
    (peran_sistem = 'PENDAPATAN_PENJUALAN' AND tipe_akun = 'PENDAPATAN') OR
    (peran_sistem = 'LABA_SELISIH_KURS' AND tipe_akun = 'PENDAPATAN') OR
    (peran_sistem = 'HARGA_POKOK_PENJUALAN' AND tipe_akun = 'BEBAN') OR
    (peran_sistem = 'RUGI_SELISIH_KURS' AND tipe_akun = 'BEBAN')
  )
);

-- 2. Buat enum baru untuk perpajakan Indonesia
DO $$ BEGIN
  CREATE TYPE "tipe_pajak" AS ENUM ('PPN', 'PPH_21', 'PPH_22', 'PPH_23', 'PPH_4_AYAT_2', 'PPH_15', 'PPH_25', 'PPH_26', 'LAINNYA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "kategori_pajak" AS ENUM ('PAJAK_KELUARAN', 'PAJAK_MASUKAN', 'PEMOTONGAN_PEMUNGUTAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "jenis_faktur_pajak" AS ENUM ('KELUARAN', 'MASUKAN', 'DIBATALKAN', 'DIGANTI');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "status_faktur_pajak" AS ENUM ('DRAFT', 'SIAP_UPLOAD', 'DISETUJUI_DJP', 'DITOLAK_DJP', 'BATAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "jenis_bupot" AS ENUM ('BP_PASAL_21', 'BP_PASAL_22', 'BP_PASAL_23', 'BP_PASAL_4_2', 'BP_PASAL_15', 'BP_UNIFIKASI');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "status_bupot" AS ENUM ('DRAFT', 'TERBIT', 'DIBATALKAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Master Data Pajak
CREATE TABLE IF NOT EXISTS "taxes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(150) NOT NULL,
  "tipe_pajak" "tipe_pajak" NOT NULL,
  "kategori_pajak" "kategori_pajak" NOT NULL,
  "persentase_tarif" numeric(8, 4) NOT NULL,
  "dpp_nilai_lain" boolean DEFAULT false NOT NULL,
  "faktor_dpp" numeric(8, 4) DEFAULT '100' NOT NULL,
  "akun_pajak_penjualan_id" uuid REFERENCES "chart_of_accounts"("id") ON DELETE restrict,
  "akun_pajak_pembelian_id" uuid REFERENCES "chart_of_accounts"("id") ON DELETE restrict,
  "keterangan" text,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_taxes_tarif_tidak_negatif" CHECK ("persentase_tarif" >= 0),
  CONSTRAINT "ck_taxes_faktor_dpp_positif" CHECK ("faktor_dpp" > 0 AND "faktor_dpp" <= 100)
);

CREATE INDEX IF NOT EXISTS "idx_taxes_tipe" ON "taxes" ("tipe_pajak");

-- 4. Tabel Alokasi NSFP
CREATE TABLE IF NOT EXISTS "tax_invoice_ranges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nomor_awal" varchar(20) NOT NULL,
  "nomor_akhir" varchar(20) NOT NULL,
  "nomor_berikutnya" varchar(20) NOT NULL,
  "tanggal_surat" date NOT NULL,
  "tahun" smallint NOT NULL,
  "keterangan" text,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_tax_invoice_ranges_urutan" CHECK ("nomor_akhir" >= "nomor_awal")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_tax_invoice_ranges" ON "tax_invoice_ranges" ("tahun", "nomor_awal", "nomor_akhir");

-- 5. Tabel Faktur Pajak Elektronik
CREATE TABLE IF NOT EXISTS "tax_invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nomor_faktur_pajak" varchar(30) NOT NULL UNIQUE,
  "jenis" "jenis_faktur_pajak" NOT NULL,
  "tanggal" date NOT NULL,
  "masa_pajak" smallint NOT NULL,
  "tahun_pajak" smallint NOT NULL,
  "kontak_id" uuid REFERENCES "partners"("id") ON DELETE restrict,
  "nama_lawan_transaksi" varchar(200) NOT NULL,
  "npwp_lawan_transaksi" varchar(30),
  "nik_lawan_transaksi" varchar(20),
  "alamat_lawan_transaksi" text,
  "jumlah_dpp" numeric(18, 4) DEFAULT '0' NOT NULL,
  "jumlah_ppn" numeric(18, 4) DEFAULT '0' NOT NULL,
  "jumlah_ppnbm" numeric(18, 4) DEFAULT '0' NOT NULL,
  "status_faktur" "status_faktur_pajak" DEFAULT 'DRAFT' NOT NULL,
  "referensi_dokumen" varchar(100),
  "faktur_penjualan_id" uuid REFERENCES "sales_invoices"("id") ON DELETE set null,
  "faktur_pembelian_id" uuid REFERENCES "purchase_invoices"("id") ON DELETE set null,
  "dapat_dikreditkan" boolean DEFAULT true NOT NULL,
  "keterangan" text,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_tax_invoices_masa_valid" CHECK ("masa_pajak" >= 1 AND "masa_pajak" <= 12),
  CONSTRAINT "ck_tax_invoices_nilai_positif" CHECK ("jumlah_dpp" >= 0 AND "jumlah_ppn" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_tax_invoices_masa_tahun" ON "tax_invoices" ("tahun_pajak", "masa_pajak");
CREATE INDEX IF NOT EXISTS "idx_tax_invoices_jenis" ON "tax_invoices" ("jenis");

-- 6. Tabel Bukti Potong Pajak
CREATE TABLE IF NOT EXISTS "withholding_tax_slips" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nomor_bukti_potong" varchar(50) NOT NULL UNIQUE,
  "jenis_bupot" "jenis_bupot" NOT NULL,
  "tanggal" date NOT NULL,
  "masa_pajak" smallint NOT NULL,
  "tahun_pajak" smallint NOT NULL,
  "kontak_id" uuid REFERENCES "partners"("id") ON DELETE restrict,
  "nama_wajib_pajak" varchar(200) NOT NULL,
  "npwp_wajib_pajak" varchar(30),
  "nik_wajib_pajak" varchar(20),
  "kode_objek_pajak" varchar(30) NOT NULL,
  "jumlah_bruto" numeric(18, 4) NOT NULL,
  "tarif" numeric(8, 4) NOT NULL,
  "jumlah_pph" numeric(18, 4) NOT NULL,
  "dokumen_referensi" varchar(100),
  "faktur_pembelian_id" uuid REFERENCES "purchase_invoices"("id") ON DELETE set null,
  "biaya_id" uuid REFERENCES "expenses"("id") ON DELETE set null,
  "status" "status_bupot" DEFAULT 'DRAFT' NOT NULL,
  "keterangan" text,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_bupot_masa_valid" CHECK ("masa_pajak" >= 1 AND "masa_pajak" <= 12),
  CONSTRAINT "ck_bupot_nilai_positif" CHECK ("jumlah_bruto" >= 0 AND "jumlah_pph" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_bupot_masa_tahun" ON "withholding_tax_slips" ("tahun_pajak", "masa_pajak");
CREATE INDEX IF NOT EXISTS "idx_bupot_jenis" ON "withholding_tax_slips" ("jenis_bupot");
