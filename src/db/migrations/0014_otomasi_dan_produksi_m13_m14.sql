CREATE TABLE IF NOT EXISTS "recurring_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL UNIQUE,
	"nama" varchar(150) NOT NULL,
	"jenis" varchar(30) NOT NULL,
	"frekuensi" varchar(20) NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date,
	"tanggal_berikutnya" date NOT NULL,
	"template_payload" jsonb NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"total_dijalankan" integer DEFAULT 0 NOT NULL,
	"terakhir_diposting_pada" timestamp with time zone,
	"dokumen_terakhir_id" text,
	"catatan" text,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_recurring_transactions_jadwal" ON "recurring_transactions" ("aktif", "tanggal_berikutnya");

CREATE TABLE IF NOT EXISTS "recurring_execution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jadwal_id" uuid NOT NULL REFERENCES "public"."recurring_transactions"("id") ON DELETE CASCADE,
	"tanggal_eksekusi" date NOT NULL,
	"sukses" boolean NOT NULL,
	"dokumen_id" text,
	"nomor_dokumen" varchar(50),
	"pesan" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_recurring_logs_jadwal" ON "recurring_execution_logs" ("jadwal_id", "dibuat_pada");

CREATE TABLE IF NOT EXISTS "reminder_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jenis_dokumen" varchar(30) NOT NULL,
	"dokumen_id" text NOT NULL,
	"nomor_dokumen" varchar(50) NOT NULL,
	"kontak_id" uuid NOT NULL REFERENCES "public"."partners"("id") ON DELETE RESTRICT,
	"email_penerima" varchar(255) NOT NULL,
	"hari_offset" integer NOT NULL,
	"sisa_tagihan" text NOT NULL,
	"status_pengiriman" varchar(20) DEFAULT 'TERKIRIM' NOT NULL,
	"konten_email" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_reminder_logs_dokumen" ON "reminder_logs" ("dokumen_id", "hari_offset");

CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(100) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"kunci_hash" varchar(128) NOT NULL UNIQUE,
	"scopes" jsonb NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"kedaluwarsa_pada" timestamp with time zone,
	"terakhir_digunakan_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_api_keys_hash" ON "api_keys" ("kunci_hash", "aktif");

CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(64) NOT NULL,
	"events" jsonb NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_webhooks_aktif" ON "webhooks" ("aktif");

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL REFERENCES "public"."webhooks"("id") ON DELETE CASCADE,
	"event" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status_http" integer,
	"sukses" boolean NOT NULL,
	"respons_body" text,
	"waktu_kirim" timestamp with time zone DEFAULT now() NOT NULL,
	"durasi_ms" integer DEFAULT 0 NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_webhook" ON "webhook_deliveries" ("webhook_id", "dibuat_pada");

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kunci" varchar(128) NOT NULL UNIQUE,
	"pengguna_id" text,
	"metode" varchar(10) NOT NULL,
	"path" text NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"status_http" integer NOT NULL,
	"response_body" text NOT NULL,
	"kedaluwarsa_pada" timestamp with time zone NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_idempotency_kunci" ON "idempotency_keys" ("kunci");
CREATE INDEX IF NOT EXISTS "idx_idempotency_kedaluwarsa" ON "idempotency_keys" ("kedaluwarsa_pada");

-- Indeks optimasi performa query laporan & produksi
CREATE INDEX IF NOT EXISTS "idx_journal_items_akun_jurnal" ON "journal_items" ("akun_id", "jurnal_id");
CREATE INDEX IF NOT EXISTS "idx_sales_invoices_jatuh_tempo_sisa" ON "sales_invoices" ("tanggal_jatuh_tempo", "sisa_tagihan");
CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_jatuh_tempo_sisa" ON "purchase_invoices" ("tanggal_jatuh_tempo", "sisa_tagihan");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_waktu_entitas" ON "audit_logs" ("waktu", "entitas");
