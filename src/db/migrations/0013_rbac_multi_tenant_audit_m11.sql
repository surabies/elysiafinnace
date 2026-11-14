CREATE TYPE "public"."status_undangan" AS ENUM('MENUNGGU', 'DITERIMA', 'KADALUARSA', 'DIBATALKAN');
CREATE TYPE "public"."jenis_dokumen_persetujuan" AS ENUM('PESANAN_PEMBELIAN', 'FAKTUR_PEMBELIAN', 'FAKTUR_PENJUALAN', 'PEMBAYARAN', 'BIAYA', 'JURNAL_UMUM', 'ANGGARAN');
CREATE TYPE "public"."status_persetujuan" AS ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN');
CREATE TYPE "public"."aksi_persetujuan" AS ENUM('DISETUJUI', 'DITOLAK');

CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(50) NOT NULL UNIQUE,
	"nama" varchar(200) NOT NULL,
	"npwp" varchar(32),
	"alamat" text,
	"telepon" varchar(30),
	"email" varchar(100),
	"mata_uang_dasar_id" uuid REFERENCES "public"."currencies"("id") ON DELETE SET NULL,
	"adalah_holding" boolean DEFAULT false NOT NULL,
	"induk_id" uuid,
	"logo" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "company_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perusahaan_id" uuid NOT NULL REFERENCES "public"."companies"("id") ON DELETE CASCADE,
	"pengguna_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
	"peran_id" uuid REFERENCES "public"."roles"("id") ON DELETE SET NULL,
	"adalah_utama" boolean DEFAULT false NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_company_users_perusahaan_pengguna" ON "company_users" ("perusahaan_id", "pengguna_id");
CREATE INDEX IF NOT EXISTS "idx_company_users_pengguna" ON "company_users" ("pengguna_id");

CREATE TABLE IF NOT EXISTS "company_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perusahaan_id" uuid NOT NULL REFERENCES "public"."companies"("id") ON DELETE CASCADE,
	"email" varchar(150) NOT NULL,
	"peran_id" uuid REFERENCES "public"."roles"("id") ON DELETE SET NULL,
	"token" varchar(100) NOT NULL UNIQUE,
	"status" "status_undangan" DEFAULT 'MENUNGGU' NOT NULL,
	"kedaluwarsa_pada" timestamp with time zone NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_company_invitations_email" ON "company_invitations" ("email");
CREATE INDEX IF NOT EXISTS "idx_company_invitations_token" ON "company_invitations" ("token");

CREATE TABLE IF NOT EXISTS "user_branch_access" (
	"pengguna_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
	"cabang_id" uuid NOT NULL REFERENCES "public"."branches"("id") ON DELETE CASCADE,
	"dibuat_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_user_branch_access" PRIMARY KEY("pengguna_id", "cabang_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_branch_access_cabang" ON "user_branch_access" ("cabang_id");

CREATE TABLE IF NOT EXISTS "user_warehouse_access" (
	"pengguna_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
	"gudang_id" uuid NOT NULL REFERENCES "public"."warehouses"("id") ON DELETE CASCADE,
	"dibuat_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_user_warehouse_access" PRIMARY KEY("pengguna_id", "gudang_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_warehouse_access_gudang" ON "user_warehouse_access" ("gudang_id");

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perusahaan_id" uuid REFERENCES "public"."companies"("id") ON DELETE SET NULL,
	"pengguna_id" text NOT NULL,
	"pengguna_nama" text,
	"aksi" varchar(50) NOT NULL,
	"entitas" varchar(50) NOT NULL,
	"entitas_id" text NOT NULL,
	"nomor_referensi" text,
	"data_sebelum" text,
	"data_sesudah" text,
	"ip_address" text,
	"user_agent" text,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_entitas" ON "audit_logs" ("entitas", "entitas_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_pengguna" ON "audit_logs" ("pengguna_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_waktu" ON "audit_logs" ("waktu");

CREATE TABLE IF NOT EXISTS "approval_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perusahaan_id" uuid REFERENCES "public"."companies"("id") ON DELETE CASCADE,
	"jenis_dokumen" "jenis_dokumen_persetujuan" NOT NULL,
	"nominal_min" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	"nominal_max" numeric(20, 4),
	"tingkat" integer DEFAULT 1 NOT NULL,
	"peran_id" uuid REFERENCES "public"."roles"("id") ON DELETE SET NULL,
	"pengguna_id" text,
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_approval_rules_jenis" ON "approval_rules" ("jenis_dokumen", "tingkat");
CREATE INDEX IF NOT EXISTS "idx_approval_rules_perusahaan" ON "approval_rules" ("perusahaan_id");

CREATE TABLE IF NOT EXISTS "document_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perusahaan_id" uuid REFERENCES "public"."companies"("id") ON DELETE CASCADE,
	"jenis_dokumen" "jenis_dokumen_persetujuan" NOT NULL,
	"dokumen_id" text NOT NULL,
	"nomor_dokumen" text NOT NULL,
	"nominal" numeric(20, 4) DEFAULT '0.0000' NOT NULL,
	"diajukan_oleh" text NOT NULL,
	"diajukan_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"tingkat_saat_ini" integer DEFAULT 1 NOT NULL,
	"tingkat_maksimal" integer DEFAULT 1 NOT NULL,
	"status" "status_persetujuan" DEFAULT 'MENUNGGU' NOT NULL,
	"catatan" text,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_document_approvals_dokumen" ON "document_approvals" ("dokumen_id", "jenis_dokumen");
CREATE INDEX IF NOT EXISTS "idx_document_approvals_status" ON "document_approvals" ("status");

CREATE TABLE IF NOT EXISTS "approval_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persetujuan_id" uuid NOT NULL REFERENCES "public"."document_approvals"("id") ON DELETE CASCADE,
	"tingkat" integer NOT NULL,
	"penyetuju_id" text NOT NULL,
	"penyetuju_nama" text,
	"aksi" "aksi_persetujuan" NOT NULL,
	"catatan" text,
	"dilakukan_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_approval_actions_persetujuan" ON "approval_actions" ("persetujuan_id");

CREATE TABLE IF NOT EXISTS "transaction_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perusahaan_id" uuid REFERENCES "public"."companies"("id") ON DELETE CASCADE,
	"kunci_semua_sebelum" date,
	"kunci_non_admin_sebelum" date,
	"catatan" text,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);
