-- 0016_payroll_pos_marketplace_crm.sql
-- Migrasi: Modul Payroll, POS (Point of Sale), Integrasi Marketplace Omnichannel, & CRM

-- 1. Enums Payroll
DO $$ BEGIN
  CREATE TYPE "public"."status_karyawan" AS ENUM('TETAP', 'KONTRAK', 'MAGANG', 'FREELANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_ptkp" AS ENUM('TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."jenis_komponen_gaji" AS ENUM('PENDAPATAN', 'POTONGAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."metode_hitung_komponen" AS ENUM('TETAP', 'PERSENTASE', 'FORMULA_LEMBUR', 'BPJS_KES', 'BPJS_TK', 'PPH21_TER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_payroll" AS ENUM('DRAFT', 'DISETUJUI', 'DIBAYAR', 'DIBATALKAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Enums POS
DO $$ BEGIN
  CREATE TYPE "public"."status_shift_pos" AS ENUM('BUKA', 'TUTUP');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."metode_bayar_pos" AS ENUM('TUNAI', 'QRIS', 'DEBIT', 'KREDIT', 'TRANSFER', 'SPLIT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_order_pos" AS ENUM('SELESAI', 'BATAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Enums Marketplace
DO $$ BEGIN
  CREATE TYPE "public"."channel_marketplace" AS ENUM('TOKOPEDIA', 'SHOPEE', 'TIKTOK', 'LAZADA', 'BLIBLI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_sync_marketplace" AS ENUM('AKTIF', 'NONAKTIF', 'ERROR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_order_marketplace" AS ENUM('MENUNGGU_PEMBAYARAN', 'SIAP_DIKIRIM', 'SEDANG_DIKIRIM', 'SELESAI', 'DIBATALKAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_sync_order" AS ENUM('MENUNGGU', 'DIPROSES', 'SELESAI', 'GAGAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Enums CRM
DO $$ BEGIN
  CREATE TYPE "public"."status_lead" AS ENUM('BARU', 'DIHUBUNGI', 'KUALIFIKASI', 'PROPOSAL', 'NEGOSIASI', 'MENANG', 'KALAH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."stage_deal" AS ENUM('PROSPEK', 'KUALIFIKASI', 'PENAWARAN', 'NEGOSIASI', 'MENANG', 'KALAH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."tipe_aktivitas_crm" AS ENUM('TELEPON', 'EMAIL', 'MEETING', 'CATATAN', 'TUGAS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_aktivitas_crm" AS ENUM('PENDING', 'SELESAI', 'DIBATALKAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ========================================================
-- TABEL PAYROLL & KARYAWAN
-- ========================================================

CREATE TABLE IF NOT EXISTS "public"."employees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nik" varchar(50) NOT NULL UNIQUE,
  "nama" varchar(200) NOT NULL,
  "email" varchar(150),
  "telepon" varchar(30),
  "departemen_id" uuid REFERENCES "public"."departments"("id") ON DELETE SET NULL,
  "jabatan" varchar(100) NOT NULL,
  "status_karyawan" "public"."status_karyawan" DEFAULT 'TETAP' NOT NULL,
  "status_ptkp" "public"."status_ptkp" DEFAULT 'TK/0' NOT NULL,
  "npwp" varchar(32),
  "tanggal_masuk" date NOT NULL,
  "tanggal_keluar" date,
  "gaji_pokok" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "tunjangan_tetap" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "bank_nama" varchar(50),
  "bank_rekening" varchar(50),
  "bank_atas_nama" varchar(150),
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_employees_nama" ON "public"."employees" ("nama");
CREATE INDEX IF NOT EXISTS "idx_employees_departemen" ON "public"."employees" ("departemen_id");
CREATE INDEX IF NOT EXISTS "idx_employees_status" ON "public"."employees" ("status_karyawan", "aktif");

CREATE TABLE IF NOT EXISTS "public"."salary_components" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(150) NOT NULL,
  "jenis" "public"."jenis_komponen_gaji" NOT NULL,
  "metode" "public"."metode_hitung_komponen" DEFAULT 'TETAP' NOT NULL,
  "nilai_default" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "kena_pajak" boolean DEFAULT true NOT NULL,
  "akun_beban_id" uuid REFERENCES "public"."chart_of_accounts"("id") ON DELETE RESTRICT,
  "akun_hutang_id" uuid REFERENCES "public"."chart_of_accounts"("id") ON DELETE RESTRICT,
  "keterangan" text,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_salary_components_jenis" ON "public"."salary_components" ("jenis");

CREATE TABLE IF NOT EXISTS "public"."payrolls" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(50) NOT NULL UNIQUE,
  "periode_bulan" smallint NOT NULL,
  "periode_tahun" integer NOT NULL,
  "tanggal_bayar" date NOT NULL,
  "status" "public"."status_payroll" DEFAULT 'DRAFT' NOT NULL,
  "total_gaji_kotor" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_potongan" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_pph21" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_bpjs" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_gaji_bersih" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "rekening_kas_bank_id" uuid REFERENCES "public"."bank_accounts"("id") ON DELETE RESTRICT,
  "jurnal_id" uuid REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL,
  "catatan" text,
  "diposting_oleh" text,
  "diposting_pada" timestamp with time zone,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_payrolls_periode" UNIQUE ("periode_tahun", "periode_bulan")
);

CREATE INDEX IF NOT EXISTS "idx_payrolls_status" ON "public"."payrolls" ("status");

CREATE TABLE IF NOT EXISTS "public"."payroll_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payroll_id" uuid NOT NULL REFERENCES "public"."payrolls"("id") ON DELETE CASCADE,
  "employee_id" uuid NOT NULL REFERENCES "public"."employees"("id") ON DELETE RESTRICT,
  "gaji_pokok" numeric(18, 4) NOT NULL,
  "total_tunjangan" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_potongan" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "pph21" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "bpjs_kesehatan" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "bpjs_ketenagakerjaan" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "gaji_bersih" numeric(18, 4) NOT NULL,
  "catatan" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_payroll_items_run_employee" UNIQUE ("payroll_id", "employee_id")
);

CREATE INDEX IF NOT EXISTS "idx_payroll_items_employee" ON "public"."payroll_items" ("employee_id");

-- ========================================================
-- TABEL POINT OF SALE (POS)
-- ========================================================

CREATE TABLE IF NOT EXISTS "public"."pos_registers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(100) NOT NULL,
  "gudang_id" uuid NOT NULL REFERENCES "public"."warehouses"("id") ON DELETE RESTRICT,
  "akun_kas_id" uuid NOT NULL REFERENCES "public"."bank_accounts"("id") ON DELETE RESTRICT,
  "keterangan" text,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_pos_registers_gudang" ON "public"."pos_registers" ("gudang_id");

CREATE TABLE IF NOT EXISTS "public"."pos_shifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nomor" varchar(30) NOT NULL UNIQUE,
  "register_id" uuid NOT NULL REFERENCES "public"."pos_registers"("id") ON DELETE RESTRICT,
  "kasir_id" text NOT NULL,
  "kasir_nama" text NOT NULL,
  "waktu_buka" timestamp with time zone DEFAULT now() NOT NULL,
  "waktu_tutup" timestamp with time zone,
  "kas_awal" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "kas_akhir_fisik" numeric(18, 4),
  "total_penjualan_tunai" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_penjualan_non_tunai" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_transaksi" integer DEFAULT 0 NOT NULL,
  "selisih_kas" numeric(18, 4),
  "status" "public"."status_shift_pos" DEFAULT 'BUKA' NOT NULL,
  "catatan" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_pos_shifts_register" ON "public"."pos_shifts" ("register_id", "status");
CREATE INDEX IF NOT EXISTS "idx_pos_shifts_kasir" ON "public"."pos_shifts" ("kasir_id");

CREATE TABLE IF NOT EXISTS "public"."pos_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nomor_struk" varchar(50) NOT NULL UNIQUE,
  "shift_id" uuid NOT NULL REFERENCES "public"."pos_shifts"("id") ON DELETE RESTRICT,
  "register_id" uuid NOT NULL REFERENCES "public"."pos_registers"("id") ON DELETE RESTRICT,
  "kontak_id" uuid REFERENCES "public"."partners"("id") ON DELETE SET NULL,
  "nama_pelanggan" varchar(150) DEFAULT 'Pelanggan Umum' NOT NULL,
  "tanggal" date NOT NULL,
  "waktu_transaksi" timestamp with time zone DEFAULT now() NOT NULL,
  "subtotal" numeric(18, 4) NOT NULL,
  "diskon" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "pajak" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total" numeric(18, 4) NOT NULL,
  "metode_bayar" "public"."metode_bayar_pos" DEFAULT 'TUNAI' NOT NULL,
  "jumlah_bayar" numeric(18, 4) NOT NULL,
  "kembalian" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "referensi_pembayaran" varchar(100),
  "status" "public"."status_order_pos" DEFAULT 'SELESAI' NOT NULL,
  "sales_invoice_id" uuid REFERENCES "public"."sales_invoices"("id") ON DELETE SET NULL,
  "jurnal_id" uuid REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL,
  "catatan" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_pos_orders_shift" ON "public"."pos_orders" ("shift_id");
CREATE INDEX IF NOT EXISTS "idx_pos_orders_tanggal" ON "public"."pos_orders" ("tanggal");

CREATE TABLE IF NOT EXISTS "public"."pos_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "public"."pos_orders"("id") ON DELETE CASCADE,
  "urutan" smallint NOT NULL,
  "item_id" uuid NOT NULL REFERENCES "public"."items"("id") ON DELETE RESTRICT,
  "nama_item" varchar(200) NOT NULL,
  "satuan_id" uuid NOT NULL REFERENCES "public"."units_of_measurement"("id") ON DELETE RESTRICT,
  "kuantitas" numeric(18, 4) NOT NULL,
  "harga_satuan" numeric(18, 4) NOT NULL,
  "diskon" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "subtotal" numeric(18, 4) NOT NULL,
  "biaya_hpp" numeric(18, 4) DEFAULT '0.0000' NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_pos_order_items_order" ON "public"."pos_order_items" ("order_id");

-- ========================================================
-- TABEL INTEGRASI MARKETPLACE OMNICHANNEL
-- ========================================================

CREATE TABLE IF NOT EXISTS "public"."marketplace_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(100) NOT NULL,
  "channel" "public"."channel_marketplace" NOT NULL,
  "shop_id" varchar(100),
  "api_key" text,
  "api_secret" text,
  "access_token" text,
  "gudang_id" uuid NOT NULL REFERENCES "public"."warehouses"("id") ON DELETE RESTRICT,
  "akun_pendapatan_id" uuid REFERENCES "public"."chart_of_accounts"("id") ON DELETE RESTRICT,
  "akun_biaya_admin_id" uuid REFERENCES "public"."chart_of_accounts"("id") ON DELETE RESTRICT,
  "status" "public"."status_sync_marketplace" DEFAULT 'AKTIF' NOT NULL,
  "auto_sync_stock" boolean DEFAULT true NOT NULL,
  "auto_sync_orders" boolean DEFAULT true NOT NULL,
  "terakhir_sinkron" timestamp with time zone,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_marketplace_channels_channel" ON "public"."marketplace_channels" ("channel");

CREATE TABLE IF NOT EXISTS "public"."marketplace_product_mappings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "channel_id" uuid NOT NULL REFERENCES "public"."marketplace_channels"("id") ON DELETE CASCADE,
  "item_id" uuid NOT NULL REFERENCES "public"."items"("id") ON DELETE CASCADE,
  "marketplace_sku" varchar(100) NOT NULL,
  "marketplace_item_id" varchar(100),
  "marketplace_item_name" varchar(250),
  "harga_sinkron" numeric(18, 4),
  "aktif" boolean DEFAULT true NOT NULL,
  "terakhir_sinkron" timestamp with time zone,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_mkt_mapping_channel_item" UNIQUE ("channel_id", "item_id")
);

CREATE INDEX IF NOT EXISTS "idx_mkt_mapping_sku" ON "public"."marketplace_product_mappings" ("marketplace_sku");

CREATE TABLE IF NOT EXISTS "public"."marketplace_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "channel_id" uuid NOT NULL REFERENCES "public"."marketplace_channels"("id") ON DELETE RESTRICT,
  "external_order_id" varchar(100) NOT NULL,
  "nomor_pesanan" varchar(100) NOT NULL,
  "nama_pembeli" varchar(150),
  "tanggal_pesanan" timestamp with time zone NOT NULL,
  "total_nilai" numeric(18, 4) NOT NULL,
  "biaya_admin" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "total_bersih" numeric(18, 4) NOT NULL,
  "status_external" varchar(50) NOT NULL,
  "status_sync" "public"."status_sync_order" DEFAULT 'SELESAI' NOT NULL,
  "sales_invoice_id" uuid REFERENCES "public"."sales_invoices"("id") ON DELETE SET NULL,
  "catatan" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_mkt_orders_channel_ext" UNIQUE ("channel_id", "external_order_id")
);

CREATE INDEX IF NOT EXISTS "idx_mkt_orders_tanggal" ON "public"."marketplace_orders" ("tanggal_pesanan");

-- ========================================================
-- TABEL CRM (LEADS, DEALS, ACTIVITIES)
-- ========================================================

CREATE TABLE IF NOT EXISTS "public"."crm_leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(150) NOT NULL,
  "perusahaan" varchar(150),
  "email" varchar(150),
  "telepon" varchar(30),
  "sumber" varchar(50) DEFAULT 'WEBSITE' NOT NULL,
  "status" "public"."status_lead" DEFAULT 'BARU' NOT NULL,
  "nilai_estimasi" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "kontak_id" uuid REFERENCES "public"."partners"("id") ON DELETE SET NULL,
  "assigned_to" text,
  "catatan" text,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_crm_leads_status" ON "public"."crm_leads" ("status");
CREATE INDEX IF NOT EXISTS "idx_crm_leads_assigned" ON "public"."crm_leads" ("assigned_to");

CREATE TABLE IF NOT EXISTS "public"."crm_deals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "judul" varchar(200) NOT NULL,
  "lead_id" uuid REFERENCES "public"."crm_leads"("id") ON DELETE SET NULL,
  "kontak_id" uuid REFERENCES "public"."partners"("id") ON DELETE SET NULL,
  "stage" "public"."stage_deal" DEFAULT 'PROSPEK' NOT NULL,
  "nilai_peluang" numeric(18, 4) DEFAULT '0.0000' NOT NULL,
  "probabilitas" smallint DEFAULT 50 NOT NULL,
  "target_closing" date,
  "assigned_to" text,
  "keterangan" text,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_crm_deals_stage" ON "public"."crm_deals" ("stage");
CREATE INDEX IF NOT EXISTS "idx_crm_deals_closing" ON "public"."crm_deals" ("target_closing");

CREATE TABLE IF NOT EXISTS "public"."crm_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tipe" "public"."tipe_aktivitas_crm" DEFAULT 'TELEPON' NOT NULL,
  "judul" varchar(200) NOT NULL,
  "lead_id" uuid REFERENCES "public"."crm_leads"("id") ON DELETE CASCADE,
  "deal_id" uuid REFERENCES "public"."crm_deals"("id") ON DELETE CASCADE,
  "kontak_id" uuid REFERENCES "public"."partners"("id") ON DELETE CASCADE,
  "tanggal" timestamp with time zone DEFAULT now() NOT NULL,
  "status" "public"."status_aktivitas_crm" DEFAULT 'PENDING' NOT NULL,
  "hasil" text,
  "dibuat_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_crm_activities_tanggal" ON "public"."crm_activities" ("tanggal");
CREATE INDEX IF NOT EXISTS "idx_crm_activities_status" ON "public"."crm_activities" ("status");
