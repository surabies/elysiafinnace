-- Migration 0012: Dimensi & Anggaran Keuangan (M10)

-- 1. Enum status_proyek & status_anggaran
DO $$ BEGIN
  CREATE TYPE "status_proyek" AS ENUM ('PERENCANAAN', 'BERJALAN', 'SELESAI', 'DIBATALKAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "status_anggaran" AS ENUM ('DRAFT', 'DISETUJUI', 'DITUTUP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tabel Cabang (Branches)
CREATE TABLE IF NOT EXISTS "branches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(150) NOT NULL,
  "alamat" text,
  "telepon" varchar(50),
  "penanggung_jawab" varchar(150),
  "pusat" boolean DEFAULT false NOT NULL,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_branches_kode" ON "branches" ("kode");
CREATE INDEX IF NOT EXISTS "idx_branches_aktif" ON "branches" ("aktif");

-- 3. Tabel Departemen (Departments)
CREATE TABLE IF NOT EXISTS "departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(150) NOT NULL,
  "induk_id" uuid REFERENCES "departments"("id") ON DELETE set null,
  "manajer" varchar(150),
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_departments_kode" ON "departments" ("kode");
CREATE INDEX IF NOT EXISTS "idx_departments_induk" ON "departments" ("induk_id");

-- 4. Tabel Proyek (Projects)
CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kode" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(200) NOT NULL,
  "pelanggan_id" uuid REFERENCES "partners"("id") ON DELETE set null,
  "tanggal_mulai" date,
  "tanggal_selesai" date,
  "nilai_kontrak" numeric(20, 4) DEFAULT '0' NOT NULL,
  "status" "status_proyek" DEFAULT 'PERENCANAAN' NOT NULL,
  "penanggung_jawab" varchar(150),
  "keterangan" text,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_projects_nilai_positif" CHECK ("nilai_kontrak" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_projects_kode" ON "projects" ("kode");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects" ("status");
CREATE INDEX IF NOT EXISTS "idx_projects_pelanggan" ON "projects" ("pelanggan_id");

-- 5. Tabel Tag (Tags)
CREATE TABLE IF NOT EXISTS "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nama" varchar(50) NOT NULL UNIQUE,
  "warna" varchar(20),
  "keterangan" text,
  "aktif" boolean DEFAULT true NOT NULL,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_tags_nama" ON "tags" ("nama");

-- 6. Tambah Kolom Dimensi pada Jurnal
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "cabang_id" uuid REFERENCES "branches"("id") ON DELETE set null;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "proyek_id" uuid REFERENCES "projects"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS "idx_journal_entries_cabang" ON "journal_entries" ("cabang_id");
CREATE INDEX IF NOT EXISTS "idx_journal_entries_proyek" ON "journal_entries" ("proyek_id");

ALTER TABLE "journal_items" ADD COLUMN IF NOT EXISTS "cabang_id" uuid REFERENCES "branches"("id") ON DELETE set null;
ALTER TABLE "journal_items" ADD COLUMN IF NOT EXISTS "departemen_id" uuid REFERENCES "departments"("id") ON DELETE set null;
ALTER TABLE "journal_items" ADD COLUMN IF NOT EXISTS "proyek_id" uuid REFERENCES "projects"("id") ON DELETE set null;
ALTER TABLE "journal_items" ADD COLUMN IF NOT EXISTS "tag" varchar(100);

CREATE INDEX IF NOT EXISTS "idx_journal_items_cabang" ON "journal_items" ("cabang_id");
CREATE INDEX IF NOT EXISTS "idx_journal_items_departemen" ON "journal_items" ("departemen_id");
CREATE INDEX IF NOT EXISTS "idx_journal_items_proyek" ON "journal_items" ("proyek_id");

-- 7. Tabel Header Anggaran (Budgets)
CREATE TABLE IF NOT EXISTS "budgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nomor" varchar(30) NOT NULL UNIQUE,
  "nama" varchar(150) NOT NULL,
  "tahun" smallint NOT NULL,
  "cabang_id" uuid REFERENCES "branches"("id") ON DELETE set null,
  "departemen_id" uuid REFERENCES "departments"("id") ON DELETE set null,
  "proyek_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "status" "status_anggaran" DEFAULT 'DRAFT' NOT NULL,
  "total_anggaran" numeric(20, 4) DEFAULT '0' NOT NULL,
  "keterangan" text,
  "disetujui_oleh" text,
  "disetujui_pada" timestamp with time zone,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_budgets_total_positif" CHECK ("total_anggaran" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_budgets_tahun" ON "budgets" ("tahun");
CREATE INDEX IF NOT EXISTS "idx_budgets_status" ON "budgets" ("status");
CREATE INDEX IF NOT EXISTS "idx_budgets_cabang" ON "budgets" ("cabang_id");
CREATE INDEX IF NOT EXISTS "idx_budgets_departemen" ON "budgets" ("departemen_id");
CREATE INDEX IF NOT EXISTS "idx_budgets_proyek" ON "budgets" ("proyek_id");

-- 8. Tabel Rincian Anggaran (Budget Lines)
CREATE TABLE IF NOT EXISTS "budget_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "anggaran_id" uuid NOT NULL REFERENCES "budgets"("id") ON DELETE cascade,
  "akun_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id") ON DELETE restrict,
  "periode" varchar(7) NOT NULL,
  "jumlah" numeric(20, 4) DEFAULT '0' NOT NULL,
  "keterangan" text,
  "dibuat_oleh" text,
  "diubah_oleh" text,
  "dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
  "diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ck_budget_lines_jumlah_positif" CHECK ("jumlah" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_budget_lines_anggaran_akun_periode" ON "budget_lines" ("anggaran_id", "akun_id", "periode");
CREATE INDEX IF NOT EXISTS "idx_budget_lines_anggaran" ON "budget_lines" ("anggaran_id");
CREATE INDEX IF NOT EXISTS "idx_budget_lines_akun" ON "budget_lines" ("akun_id");
CREATE INDEX IF NOT EXISTS "idx_budget_lines_periode" ON "budget_lines" ("periode");
