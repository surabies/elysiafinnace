-- Enums already added
CREATE TABLE "purchase_return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urutan" smallint NOT NULL,
	"item_id" uuid,
	"akun_id" uuid,
	"deskripsi" text,
	"kuantitas" numeric(20, 4) NOT NULL,
	"harga_satuan" numeric(20, 4) NOT NULL,
	"persen_diskon" numeric(7, 4) DEFAULT '0' NOT NULL,
	"subtotal" numeric(20, 4) NOT NULL,
	"retur_id" uuid NOT NULL,
	"baris_faktur_id" uuid,
	CONSTRAINT "ck_purchase_return_items_kuantitas_positif" CHECK ("purchase_return_items"."kuantitas" > 0 AND "purchase_return_items"."harga_satuan" >= 0),
	CONSTRAINT "ck_purchase_return_items_item_atau_akun" CHECK ("purchase_return_items"."item_id" IS NOT NULL OR "purchase_return_items"."akun_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "purchase_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"pemasok_id" uuid NOT NULL,
	"faktur_id" uuid NOT NULL,
	"catatan" text,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"subtotal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"persen_ppn" numeric(7, 4) DEFAULT '0' NOT NULL,
	"ppn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total" numeric(20, 4) DEFAULT '0' NOT NULL,
	"diskon_nominal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL,
	"jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_returns_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
CREATE TABLE "sales_return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urutan" smallint NOT NULL,
	"item_id" uuid,
	"akun_id" uuid,
	"deskripsi" text,
	"kuantitas" numeric(20, 4) NOT NULL,
	"harga_satuan" numeric(20, 4) NOT NULL,
	"persen_diskon" numeric(7, 4) DEFAULT '0' NOT NULL,
	"subtotal" numeric(20, 4) NOT NULL,
	"retur_id" uuid NOT NULL,
	"baris_faktur_id" uuid,
	"hpp" numeric(20, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "ck_sales_return_items_kuantitas_positif" CHECK ("sales_return_items"."kuantitas" > 0 AND "sales_return_items"."harga_satuan" >= 0),
	CONSTRAINT "ck_sales_return_items_item_atau_akun" CHECK ("sales_return_items"."item_id" IS NOT NULL OR "sales_return_items"."akun_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "sales_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"pelanggan_id" uuid NOT NULL,
	"faktur_id" uuid NOT NULL,
	"catatan" text,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"subtotal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"persen_ppn" numeric(7, 4) DEFAULT '0' NOT NULL,
	"ppn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total" numeric(20, 4) DEFAULT '0' NOT NULL,
	"diskon_nominal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total_hpp" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL,
	"jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_returns_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
ALTER TABLE "chart_of_accounts" DROP CONSTRAINT "ck_chart_of_accounts_peran_sesuai_tipe";--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "diskon_nominal" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "ongkir" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "uang_muka" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "akun_uang_muka_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD COLUMN "akun_ongkir_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "diskon_nominal" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "ongkir" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "uang_muka" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "akun_uang_muka_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "akun_ongkir_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "diskon_nominal" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "ongkir" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "uang_muka" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "akun_uang_muka_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "akun_ongkir_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "diskon_nominal" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "ongkir" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "uang_muka" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "akun_uang_muka_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "akun_ongkir_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_retur_id_purchase_returns_id_fk" FOREIGN KEY ("retur_id") REFERENCES "public"."purchase_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_baris_faktur_id_purchase_invoice_items_id_fk" FOREIGN KEY ("baris_faktur_id") REFERENCES "public"."purchase_invoice_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_pemasok_id_partners_id_fk" FOREIGN KEY ("pemasok_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_faktur_id_purchase_invoices_id_fk" FOREIGN KEY ("faktur_id") REFERENCES "public"."purchase_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_retur_id_sales_returns_id_fk" FOREIGN KEY ("retur_id") REFERENCES "public"."sales_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_baris_faktur_id_sales_invoice_items_id_fk" FOREIGN KEY ("baris_faktur_id") REFERENCES "public"."sales_invoice_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_pelanggan_id_partners_id_fk" FOREIGN KEY ("pelanggan_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_faktur_id_sales_invoices_id_fk" FOREIGN KEY ("faktur_id") REFERENCES "public"."sales_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_purchase_return_items_retur" ON "purchase_return_items" USING btree ("retur_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_returns_pemasok" ON "purchase_returns" USING btree ("pemasok_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_returns_faktur" ON "purchase_returns" USING btree ("faktur_id");--> statement-breakpoint
CREATE INDEX "idx_sales_return_items_retur" ON "sales_return_items" USING btree ("retur_id");--> statement-breakpoint
CREATE INDEX "idx_sales_returns_pelanggan" ON "sales_returns" USING btree ("pelanggan_id");--> statement-breakpoint
CREATE INDEX "idx_sales_returns_faktur" ON "sales_returns" USING btree ("faktur_id");--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_akun_uang_muka_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_uang_muka_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_akun_ongkir_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_ongkir_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_akun_uang_muka_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_uang_muka_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_akun_ongkir_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_ongkir_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_akun_uang_muka_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_uang_muka_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_akun_ongkir_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_ongkir_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_akun_uang_muka_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_uang_muka_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_akun_ongkir_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_ongkir_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "ck_chart_of_accounts_peran_sesuai_tipe" CHECK (peran_sistem IS NULL OR (peran_sistem = 'KAS_BANK' AND tipe_akun = 'ASET') OR (peran_sistem = 'PIUTANG_USAHA' AND tipe_akun = 'ASET') OR (peran_sistem = 'PERSEDIAAN' AND tipe_akun = 'ASET') OR (peran_sistem = 'PPN_MASUKAN' AND tipe_akun = 'ASET') OR (peran_sistem = 'UANG_MUKA_PEMASOK' AND tipe_akun = 'ASET') OR (peran_sistem = 'HUTANG_USAHA' AND tipe_akun = 'KEWAJIBAN') OR (peran_sistem = 'PPN_KELUARAN' AND tipe_akun = 'KEWAJIBAN') OR (peran_sistem = 'UANG_MUKA_PELANGGAN' AND tipe_akun = 'KEWAJIBAN') OR (peran_sistem = 'MODAL_DISETOR' AND tipe_akun = 'EKUITAS') OR (peran_sistem = 'LABA_DITAHAN' AND tipe_akun = 'EKUITAS') OR (peran_sistem = 'EKUITAS_SALDO_AWAL' AND tipe_akun = 'EKUITAS') OR (peran_sistem = 'PENDAPATAN_PENJUALAN' AND tipe_akun = 'PENDAPATAN') OR (peran_sistem = 'LABA_SELISIH_KURS' AND tipe_akun = 'PENDAPATAN') OR (peran_sistem = 'HARGA_POKOK_PENJUALAN' AND tipe_akun = 'BEBAN') OR (peran_sistem = 'RUGI_SELISIH_KURS' AND tipe_akun = 'BEBAN'));