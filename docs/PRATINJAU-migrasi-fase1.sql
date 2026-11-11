CREATE TYPE "public"."peran_sistem_akun" AS ENUM('KAS_BANK', 'PIUTANG_USAHA', 'PERSEDIAAN', 'PPN_MASUKAN', 'HUTANG_USAHA', 'PPN_KELUARAN', 'MODAL_DISETOR', 'LABA_DITAHAN', 'PENDAPATAN_PENJUALAN', 'LABA_SELISIH_KURS', 'HARGA_POKOK_PENJUALAN', 'RUGI_SELISIH_KURS');--> statement-breakpoint
CREATE TYPE "public"."saldo_normal" AS ENUM('DEBIT', 'KREDIT');--> statement-breakpoint
CREATE TYPE "public"."tipe_akun" AS ENUM('ASET', 'KEWAJIBAN', 'EKUITAS', 'PENDAPATAN', 'BEBAN');--> statement-breakpoint
CREATE TYPE "public"."tipe_barang" AS ENUM('BARANG_PERSEDIAAN', 'BARANG_NON_PERSEDIAAN', 'JASA');--> statement-breakpoint
CREATE TYPE "public"."jenis_rekening" AS ENUM('KAS', 'BANK');--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(3) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"simbol" varchar(10) NOT NULL,
	"jumlah_desimal" smallint DEFAULT 2 NOT NULL,
	"adalah_mata_uang_dasar" boolean DEFAULT false NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_kode_unique" UNIQUE("kode"),
	CONSTRAINT "ck_currencies_kode_iso" CHECK ("currencies"."kode" ~ '^[A-Z]{3}$'),
	CONSTRAINT "ck_currencies_jumlah_desimal" CHECK ("currencies"."jumlah_desimal" BETWEEN 0 AND 8)
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"tanggal_berlaku" date NOT NULL,
	"kurs" numeric(20, 8) NOT NULL,
	"sumber" varchar(100),
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_exchange_rates_kurs_positif" CHECK ("exchange_rates"."kurs" > 0)
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(20) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"tipe_akun" "tipe_akun" NOT NULL,
	"normal_balance" "saldo_normal" NOT NULL,
	"induk_id" uuid,
	"level" smallint DEFAULT 1 NOT NULL,
	"bisa_diposting" boolean DEFAULT true NOT NULL,
	"adalah_akun_kontra" boolean DEFAULT false NOT NULL,
	"peran_sistem" "peran_sistem_akun",
	"mata_uang_id" uuid,
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chart_of_accounts_kode_unique" UNIQUE("kode"),
	CONSTRAINT "ck_chart_of_accounts_saldo_normal_sesuai_tipe" CHECK (adalah_akun_kontra OR (tipe_akun IN ('ASET', 'BEBAN') AND normal_balance = 'DEBIT') OR (tipe_akun IN ('KEWAJIBAN', 'EKUITAS', 'PENDAPATAN') AND normal_balance = 'KREDIT')),
	CONSTRAINT "ck_chart_of_accounts_peran_sesuai_tipe" CHECK (peran_sistem IS NULL OR (peran_sistem = 'KAS_BANK' AND tipe_akun = 'ASET') OR (peran_sistem = 'PIUTANG_USAHA' AND tipe_akun = 'ASET') OR (peran_sistem = 'PERSEDIAAN' AND tipe_akun = 'ASET') OR (peran_sistem = 'PPN_MASUKAN' AND tipe_akun = 'ASET') OR (peran_sistem = 'HUTANG_USAHA' AND tipe_akun = 'KEWAJIBAN') OR (peran_sistem = 'PPN_KELUARAN' AND tipe_akun = 'KEWAJIBAN') OR (peran_sistem = 'MODAL_DISETOR' AND tipe_akun = 'EKUITAS') OR (peran_sistem = 'LABA_DITAHAN' AND tipe_akun = 'EKUITAS') OR (peran_sistem = 'PENDAPATAN_PENJUALAN' AND tipe_akun = 'PENDAPATAN') OR (peran_sistem = 'LABA_SELISIH_KURS' AND tipe_akun = 'PENDAPATAN') OR (peran_sistem = 'HARGA_POKOK_PENJUALAN' AND tipe_akun = 'BEBAN') OR (peran_sistem = 'RUGI_SELISIH_KURS' AND tipe_akun = 'BEBAN')),
	CONSTRAINT "ck_chart_of_accounts_peran_hanya_akun_detail" CHECK (peran_sistem IS NULL OR bisa_diposting),
	CONSTRAINT "ck_chart_of_accounts_bukan_induk_sendiri" CHECK ("chart_of_accounts"."induk_id" IS DISTINCT FROM "chart_of_accounts"."id"),
	CONSTRAINT "ck_chart_of_accounts_level_positif" CHECK ("chart_of_accounts"."level" >= 1)
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(30) NOT NULL,
	"nama" varchar(200) NOT NULL,
	"adalah_pelanggan" boolean DEFAULT false NOT NULL,
	"adalah_pemasok" boolean DEFAULT false NOT NULL,
	"npwp" varchar(32),
	"adalah_pkp" boolean DEFAULT false NOT NULL,
	"nama_kontak" varchar(150),
	"email" varchar(150),
	"telepon" varchar(30),
	"alamat" text,
	"kota" varchar(100),
	"provinsi" varchar(100),
	"kode_pos" varchar(10),
	"negara" varchar(100) DEFAULT 'Indonesia' NOT NULL,
	"termin_pembayaran_id" uuid,
	"mata_uang_id" uuid,
	"batas_kredit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"catatan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_kode_unique" UNIQUE("kode"),
	CONSTRAINT "ck_partners_minimal_satu_peran" CHECK ("partners"."adalah_pelanggan" OR "partners"."adalah_pemasok"),
	CONSTRAINT "ck_partners_batas_kredit" CHECK ("partners"."batas_kredit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(20) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"jumlah_hari" smallint DEFAULT 0 NOT NULL,
	"persen_diskon" numeric(7, 4) DEFAULT '0' NOT NULL,
	"hari_diskon" smallint DEFAULT 0 NOT NULL,
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_terms_kode_unique" UNIQUE("kode"),
	CONSTRAINT "ck_payment_terms_jumlah_hari" CHECK ("payment_terms"."jumlah_hari" >= 0),
	CONSTRAINT "ck_payment_terms_persen_diskon" CHECK ("payment_terms"."persen_diskon" BETWEEN 0 AND 100),
	CONSTRAINT "ck_payment_terms_hari_diskon" CHECK ("payment_terms"."hari_diskon" >= 0 AND "payment_terms"."hari_diskon" <= "payment_terms"."jumlah_hari")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(50) NOT NULL,
	"barcode" varchar(50),
	"nama" varchar(200) NOT NULL,
	"deskripsi" text,
	"tipe_barang" "tipe_barang" DEFAULT 'BARANG_PERSEDIAAN' NOT NULL,
	"kategori_id" uuid,
	"satuan_id" uuid NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"harga_beli_standar" numeric(20, 4) DEFAULT '0' NOT NULL,
	"harga_jual_standar" numeric(20, 4) DEFAULT '0' NOT NULL,
	"stok_minimum" numeric(20, 4) DEFAULT '0' NOT NULL,
	"akun_persediaan_id" uuid,
	"akun_hpp_id" uuid,
	"akun_pendapatan_id" uuid,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_sku_unique" UNIQUE("sku"),
	CONSTRAINT "items_barcode_unique" UNIQUE("barcode"),
	CONSTRAINT "ck_items_barang_persediaan_wajib_akun_persediaan" CHECK ("items"."tipe_barang" <> 'BARANG_PERSEDIAAN' OR "items"."akun_persediaan_id" IS NOT NULL),
	CONSTRAINT "ck_items_harga_tidak_negatif" CHECK ("items"."harga_beli_standar" >= 0 AND "items"."harga_jual_standar" >= 0),
	CONSTRAINT "ck_items_stok_minimum_tidak_negatif" CHECK ("items"."stok_minimum" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(30) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"induk_id" uuid,
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_categories_kode_unique" UNIQUE("kode"),
	CONSTRAINT "ck_product_categories_bukan_induk_sendiri" CHECK ("product_categories"."induk_id" IS DISTINCT FROM "product_categories"."id")
);
--> statement-breakpoint
CREATE TABLE "units_of_measurement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(10) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "units_of_measurement_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(20) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"jenis" "jenis_rekening" DEFAULT 'BANK' NOT NULL,
	"nama_bank" varchar(100),
	"nomor_rekening" varchar(50),
	"atas_nama" varchar(150),
	"cabang" varchar(100),
	"akun_coa_id" uuid NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"keterangan" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_accounts_kode_unique" UNIQUE("kode"),
	CONSTRAINT "bank_accounts_akun_coa_id_unique" UNIQUE("akun_coa_id"),
	CONSTRAINT "ck_bank_accounts_rekening_bank_lengkap" CHECK ("bank_accounts"."jenis" <> 'BANK' OR ("bank_accounts"."nama_bank" IS NOT NULL AND "bank_accounts"."nomor_rekening" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_induk_id_chart_of_accounts_id_fk" FOREIGN KEY ("induk_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_termin_pembayaran_id_payment_terms_id_fk" FOREIGN KEY ("termin_pembayaran_id") REFERENCES "public"."payment_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_kategori_id_product_categories_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_satuan_id_units_of_measurement_id_fk" FOREIGN KEY ("satuan_id") REFERENCES "public"."units_of_measurement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_akun_persediaan_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_persediaan_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_akun_hpp_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_hpp_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_akun_pendapatan_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_pendapatan_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_induk_id_product_categories_id_fk" FOREIGN KEY ("induk_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_akun_coa_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_coa_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_currencies_satu_mata_uang_dasar" ON "currencies" USING btree ("adalah_mata_uang_dasar") WHERE "currencies"."adalah_mata_uang_dasar" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exchange_rates_mata_uang_tanggal" ON "exchange_rates" USING btree ("mata_uang_id","tanggal_berlaku");--> statement-breakpoint
CREATE INDEX "idx_exchange_rates_pencarian" ON "exchange_rates" USING btree ("mata_uang_id","tanggal_berlaku" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_induk" ON "chart_of_accounts" USING btree ("induk_id");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_tipe" ON "chart_of_accounts" USING btree ("tipe_akun");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_chart_of_accounts_peran_tunggal" ON "chart_of_accounts" USING btree ("peran_sistem") WHERE peran_sistem IS NOT NULL AND peran_sistem NOT IN ('KAS_BANK', 'PERSEDIAAN');--> statement-breakpoint
CREATE INDEX "idx_partners_nama" ON "partners" USING btree ("nama");--> statement-breakpoint
CREATE INDEX "idx_partners_peran" ON "partners" USING btree ("adalah_pelanggan","adalah_pemasok");--> statement-breakpoint
CREATE INDEX "idx_items_nama" ON "items" USING btree ("nama");--> statement-breakpoint
CREATE INDEX "idx_items_kategori" ON "items" USING btree ("kategori_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_induk" ON "product_categories" USING btree ("induk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bank_accounts_bank_nomor" ON "bank_accounts" USING btree ("nama_bank","nomor_rekening") WHERE "bank_accounts"."nama_bank" IS NOT NULL AND "bank_accounts"."nomor_rekening" IS NOT NULL;