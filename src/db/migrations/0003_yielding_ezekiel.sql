ALTER TYPE "public"."tipe_barang" ADD VALUE 'BUNDEL';--> statement-breakpoint
CREATE TABLE "item_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_item_id" uuid NOT NULL,
	"komponen_item_id" uuid NOT NULL,
	"satuan_id" uuid NOT NULL,
	"kuantitas" numeric(20, 4) DEFAULT '1' NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_item_bundles_bukan_diri_sendiri" CHECK ("item_bundles"."bundle_item_id" IS DISTINCT FROM "item_bundles"."komponen_item_id"),
	CONSTRAINT "ck_item_bundles_kuantitas_positif" CHECK ("item_bundles"."kuantitas" > 0)
);
--> statement-breakpoint
CREATE TABLE "item_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"satuan_id" uuid NOT NULL,
	"konversi" numeric(20, 4) DEFAULT '1' NOT NULL,
	"barcode" varchar(50),
	"harga_jual" numeric(20, 4),
	"harga_beli" numeric(20, 4),
	"urutan" smallint DEFAULT 1 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_item_units_konversi_positif" CHECK ("item_units"."konversi" > 0),
	CONSTRAINT "ck_item_units_harga_positif" CHECK (("item_units"."harga_jual" IS NULL OR "item_units"."harga_jual" >= 0) AND ("item_units"."harga_beli" IS NULL OR "item_units"."harga_beli" >= 0))
);
--> statement-breakpoint
CREATE TABLE "price_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_list_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"satuan_id" uuid,
	"min_kuantitas" numeric(20, 4) DEFAULT '1' NOT NULL,
	"harga" numeric(20, 4) NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_price_list_items_min_qty_positif" CHECK ("price_list_items"."min_kuantitas" > 0),
	CONSTRAINT "ck_price_list_items_harga_positif" CHECK ("price_list_items"."harga" >= 0)
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(30) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_lists_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
ALTER TABLE "item_bundles" ADD CONSTRAINT "item_bundles_bundle_item_id_items_id_fk" FOREIGN KEY ("bundle_item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_bundles" ADD CONSTRAINT "item_bundles_komponen_item_id_items_id_fk" FOREIGN KEY ("komponen_item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_bundles" ADD CONSTRAINT "item_bundles_satuan_id_units_of_measurement_id_fk" FOREIGN KEY ("satuan_id") REFERENCES "public"."units_of_measurement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_units" ADD CONSTRAINT "item_units_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_units" ADD CONSTRAINT "item_units_satuan_id_units_of_measurement_id_fk" FOREIGN KEY ("satuan_id") REFERENCES "public"."units_of_measurement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_id_price_lists_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "public"."price_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_satuan_id_units_of_measurement_id_fk" FOREIGN KEY ("satuan_id") REFERENCES "public"."units_of_measurement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_item_bundles_parent" ON "item_bundles" USING btree ("bundle_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_bundles_komponen" ON "item_bundles" USING btree ("bundle_item_id","komponen_item_id");--> statement-breakpoint
CREATE INDEX "idx_item_units_item" ON "item_units" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_units_item_satuan" ON "item_units" USING btree ("item_id","satuan_id");--> statement-breakpoint
CREATE INDEX "idx_price_list_items_list" ON "price_list_items" USING btree ("price_list_id");--> statement-breakpoint
CREATE INDEX "idx_price_list_items_item" ON "price_list_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_price_lists_nama" ON "price_lists" USING btree ("nama");