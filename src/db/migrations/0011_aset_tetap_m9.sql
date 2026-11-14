-- Migration 0011: Aset Tetap & Penyusutan (M9)

-- 1. Tambah nilai enum sumber_jurnal
ALTER TYPE "sumber_jurnal" ADD VALUE IF NOT EXISTS 'PENYUSUTAN_ASET';
ALTER TYPE "sumber_jurnal" ADD VALUE IF NOT EXISTS 'PELEPASAN_ASET';

-- 2. Buat enum baru untuk Aset Tetap
DO $$ BEGIN
  CREATE TYPE "metode_penyusutan" AS ENUM ('GARIS_LURUS', 'SALDO_MENURUN', 'TIDAK_DISUSUTKAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "golongan_fiskal_aset" AS ENUM (
    'NON_FISKAL',
    'GOLONGAN_1',
    'GOLONGAN_2',
    'GOLONGAN_3',
    'GOLONGAN_4',
    'BANGUNAN_PERMANEN',
    'BANGUNAN_SEMI_PERMANEN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "status_aset" AS ENUM ('DRAFT', 'AKTIF', 'DISUSUTKAN_PENUH', 'DILEPAS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "status_penyusutan_aset" AS ENUM ('DRAFT', 'POSTED', 'DIBATALKAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Kategori Aset Tetap
CREATE TABLE IF NOT EXISTS "asset_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(150) NOT NULL,
  "metode_penyusutan" "metode_penyusutan" DEFAULT 'GARIS_LURUS' NOT NULL,
  "golongan_fiskal" "golongan_fiskal_aset" DEFAULT 'NON_FISKAL' NOT NULL,
  "masa_manfaat_bulan" smallint DEFAULT 48 NOT NULL,
  "tarif_tahunan_persen" numeric(7, 4) DEFAULT '25' NOT NULL,
  "akun_aset_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id") ON DELETE restrict,
  "akun_akumulasi_penyusutan_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id") ON DELETE restrict,
  "akun_beban_penyusutan_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id") ON DELETE restrict,
  "keterangan" text,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_asset_categories_masa_manfaat_positif" CHECK ("masa_manfaat_bulan" >= 0),
  CONSTRAINT "ck_asset_categories_tarif_positif" CHECK ("tarif_tahunan_persen" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_asset_categories_kode" ON "asset_categories" ("kode");

-- 4. Tabel Registrasi Aset Tetap
CREATE TABLE IF NOT EXISTS "fixed_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(200) NOT NULL,
  "kategori_id" uuid NOT NULL REFERENCES "asset_categories"("id") ON DELETE restrict,
  "tanggal_perolehan" date NOT NULL,
  "tanggal_mulai_penyusutan" date NOT NULL,
  "nilai_perolehan" numeric(20, 4) NOT NULL,
  "nilai_residu" numeric(20, 4) DEFAULT '0' NOT NULL,
  "masa_manfaat_bulan" smallint NOT NULL,
  "metode_penyusutan" "metode_penyusutan" NOT NULL,
  "lokasi" varchar(150),
  "penanggung_jawab" varchar(150),
  "nomor_seri" varchar(100),
  "status" "status_aset" DEFAULT 'AKTIF' NOT NULL,
  "akumulasi_penyusutan" numeric(20, 4) DEFAULT '0' NOT NULL,
  "nilai_buku" numeric(20, 4) NOT NULL,
  "sisa_manfaat_bulan" smallint NOT NULL,
  "tanggal_pelepasan" date,
  "nilai_pelepasan" numeric(20, 4),
  "alasan_pelepasan" text,
  "akun_kas_pelepasan_id" uuid REFERENCES "chart_of_accounts"("id") ON DELETE restrict,
  "jurnal_pelepasan_id" uuid REFERENCES "journal_entries"("id") ON DELETE set null,
  "keterangan" text,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_fixed_assets_nilai_positif" CHECK ("nilai_perolehan" >= 0 AND "nilai_residu" >= 0),
  CONSTRAINT "ck_fixed_assets_residu_valid" CHECK ("nilai_residu" <= "nilai_perolehan"),
  CONSTRAINT "ck_fixed_assets_masa_valid" CHECK ("masa_manfaat_bulan" >= 0 AND "sisa_manfaat_bulan" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_fixed_assets_kategori" ON "fixed_assets" ("kategori_id");
CREATE INDEX IF NOT EXISTS "idx_fixed_assets_status" ON "fixed_assets" ("status");

-- 5. Tabel Riwayat Penyusutan Aset Tetap
CREATE TABLE IF NOT EXISTS "asset_depreciations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "aset_id" uuid NOT NULL REFERENCES "fixed_assets"("id") ON DELETE cascade,
  "periode" varchar(7) NOT NULL,
  "tanggal" date NOT NULL,
  "nilai_penyusutan" numeric(20, 4) NOT NULL,
  "nilai_buku_awal" numeric(20, 4) NOT NULL,
  "nilai_buku_akhir" numeric(20, 4) NOT NULL,
  "jurnal_id" uuid REFERENCES "journal_entries"("id") ON DELETE set null,
  "status" "status_penyusutan_aset" DEFAULT 'POSTED' NOT NULL,
  "keterangan" text,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_asset_depreciations_nilai_positif" CHECK ("nilai_penyusutan" >= 0)
);

DROP INDEX IF EXISTS "uq_asset_depreciations_aset_periode";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_asset_depreciations_aset_periode" ON "asset_depreciations" ("aset_id", "periode") WHERE "status" = 'POSTED';
CREATE INDEX IF NOT EXISTS "idx_asset_depreciations_periode" ON "asset_depreciations" ("periode");
