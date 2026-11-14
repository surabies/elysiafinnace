CREATE TYPE "public"."metode_penilaian_stok" AS ENUM('RATA_RATA', 'FIFO');
--> statement-breakpoint
CREATE TYPE "public"."status_transfer_gudang" AS ENUM('DRAFT', 'POSTED', 'DIBATALKAN');
--> statement-breakpoint
ALTER TYPE "public"."sumber_jurnal" ADD VALUE IF NOT EXISTS 'TRANSFER_GUDANG';
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "metode_penilaian" "metode_penilaian_stok" DEFAULT 'RATA_RATA' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(30) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"alamat" text,
	"penanggung_jawab" varchar(150),
	"adalah_gudang_utama" boolean DEFAULT false NOT NULL,
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text NOT NULL,
	"diubah_oleh" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warehouses_nama" ON "warehouses" USING btree ("nama");
--> statement-breakpoint
INSERT INTO "warehouses" ("id", "kode", "nama", "adalah_gudang_utama", "dibuat_oleh", "diubah_oleh")
VALUES ('a0000000-0000-0000-0000-000000000001', 'WH-UTAMA', 'Gudang Utama', true, 'migrasi', 'migrasi')
ON CONFLICT ("kode") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "item_stocks" DROP CONSTRAINT IF EXISTS "item_stocks_pkey";
--> statement-breakpoint
ALTER TABLE "item_stocks" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "item_stocks" ADD CONSTRAINT "item_stocks_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "item_stocks" ADD COLUMN IF NOT EXISTS "gudang_id" uuid DEFAULT 'a0000000-0000-0000-0000-000000000001' NOT NULL REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_item_stocks_item_gudang" ON "item_stocks" USING btree ("item_id", "gudang_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_item_stocks_gudang" ON "item_stocks" USING btree ("gudang_id");
--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "gudang_id" uuid DEFAULT 'a0000000-0000-0000-0000-000000000001' REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_movements_gudang" ON "stock_movements" USING btree ("gudang_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL REFERENCES "items"("id") ON DELETE RESTRICT,
	"gudang_id" uuid NOT NULL REFERENCES "warehouses"("id") ON DELETE RESTRICT,
	"nomor_batch" varchar(50) NOT NULL,
	"tanggal_kedaluwarsa" date,
	"kuantitas" numeric(20, 4) DEFAULT '0' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text NOT NULL,
	"diubah_oleh" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_item_batches_kuantitas_tidak_negatif" CHECK ("kuantitas" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_item_batches_item" ON "item_batches" USING btree ("item_id", "nomor_batch");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_item_batches_nomor" ON "item_batches" USING btree ("item_id", "gudang_id", "nomor_batch");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouse_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"gudang_asal_id" uuid NOT NULL REFERENCES "warehouses"("id") ON DELETE RESTRICT,
	"gudang_tujuan_id" uuid NOT NULL REFERENCES "warehouses"("id") ON DELETE RESTRICT,
	"status" "status_transfer_gudang" DEFAULT 'DRAFT' NOT NULL,
	"keterangan" text,
	"total_nilai" numeric(20, 4) DEFAULT '0' NOT NULL,
	"jurnal_id" uuid REFERENCES "journal_entries"("id") ON DELETE RESTRICT,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibatalkan_oleh" text,
	"dibatalkan_pada" timestamp with time zone,
	"dibuat_oleh" text NOT NULL,
	"diubah_oleh" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_transfers_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_warehouse_transfers_gudang_berbeda" CHECK ("gudang_asal_id" <> "gudang_tujuan_id"),
	CONSTRAINT "ck_warehouse_transfers_total_tidak_negatif" CHECK ("total_nilai" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warehouse_transfers_tanggal" ON "warehouse_transfers" USING btree ("tanggal");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warehouse_transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL REFERENCES "warehouse_transfers"("id") ON DELETE CASCADE,
	"urutan" smallint NOT NULL,
	"item_id" uuid NOT NULL REFERENCES "items"("id") ON DELETE RESTRICT,
	"kuantitas" numeric(20, 4) NOT NULL,
	"biaya_satuan" numeric(20, 4) DEFAULT '0' NOT NULL,
	"nilai" numeric(20, 4) DEFAULT '0' NOT NULL,
	"keterangan" text,
	CONSTRAINT "ck_warehouse_transfer_items_kuantitas_positif" CHECK ("kuantitas" > 0),
	CONSTRAINT "ck_warehouse_transfer_items_nilai_positif" CHECK ("nilai" >= 0 AND "biaya_satuan" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warehouse_transfer_items_transfer" ON "warehouse_transfer_items" USING btree ("transfer_id");
--> statement-breakpoint
ALTER TABLE "stock_adjustments" DROP CONSTRAINT IF EXISTS "ck_stock_adjustments_tidak_nol";
--> statement-breakpoint
ALTER TABLE "stock_adjustments" DROP CONSTRAINT IF EXISTS "stock_adjustments_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_adjustments" DROP COLUMN IF EXISTS "item_id";
--> statement-breakpoint
ALTER TABLE "stock_adjustments" DROP COLUMN IF EXISTS "kuantitas_selisih";
--> statement-breakpoint
ALTER TABLE "stock_adjustments" DROP COLUMN IF EXISTS "biaya_satuan";
--> statement-breakpoint
ALTER TABLE "stock_adjustments" DROP COLUMN IF EXISTS "nilai";
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "gudang_id" uuid DEFAULT 'a0000000-0000-0000-0000-000000000001' NOT NULL REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL;
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "total_nilai" numeric(20, 4) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "diposting_oleh" text;
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "diposting_pada" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "dibatalkan_oleh" text;
--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD COLUMN IF NOT EXISTS "dibatalkan_pada" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_adjustments_gudang" ON "stock_adjustments" USING btree ("gudang_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_adjustments_tanggal" ON "stock_adjustments" USING btree ("tanggal");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_adjustment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"penyesuaian_id" uuid NOT NULL REFERENCES "stock_adjustments"("id") ON DELETE CASCADE,
	"urutan" smallint NOT NULL,
	"item_id" uuid NOT NULL REFERENCES "items"("id") ON DELETE RESTRICT,
	"kuantitas_tercatat" numeric(20, 4) DEFAULT '0' NOT NULL,
	"kuantitas_fisik" numeric(20, 4) DEFAULT '0' NOT NULL,
	"kuantitas_selisih" numeric(20, 4) NOT NULL,
	"biaya_satuan" numeric(20, 4) DEFAULT '0' NOT NULL,
	"nilai" numeric(20, 4) DEFAULT '0' NOT NULL,
	"keterangan" text,
	CONSTRAINT "ck_stock_adjustment_items_tidak_nol" CHECK ("kuantitas_selisih" <> 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_adjustment_items_penyesuaian" ON "stock_adjustment_items" USING btree ("penyesuaian_id");
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN IF NOT EXISTS "gudang_id" uuid REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD COLUMN IF NOT EXISTS "gudang_id" uuid REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD COLUMN IF NOT EXISTS "gudang_id" uuid REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD COLUMN IF NOT EXISTS "gudang_id" uuid REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD COLUMN IF NOT EXISTS "gudang_id" uuid REFERENCES "warehouses"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "sales_return_items" ADD COLUMN IF NOT EXISTS "gudang_id" uuid REFERENCES "warehouses"("id") ON DELETE RESTRICT;
