CREATE TYPE "public"."jenis_mutasi_bank" AS ENUM('MASUK', 'KELUAR', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."jenis_mutasi_stok" AS ENUM('MASUK', 'KELUAR');--> statement-breakpoint
CREATE TYPE "public"."jenis_pembayaran" AS ENUM('PENERIMAAN', 'PENGELUARAN');--> statement-breakpoint
CREATE TYPE "public"."jenis_rekening" AS ENUM('KAS', 'BANK');--> statement-breakpoint
CREATE TYPE "public"."kategori_arus_kas" AS ENUM('OPERASI', 'INVESTASI', 'PENDANAAN');--> statement-breakpoint
CREATE TYPE "public"."metode_bayar_biaya" AS ENUM('TUNAI', 'HUTANG');--> statement-breakpoint
CREATE TYPE "public"."peran_sistem_akun" AS ENUM('KAS_BANK', 'PIUTANG_USAHA', 'PERSEDIAAN', 'PPN_MASUKAN', 'HUTANG_USAHA', 'PPN_KELUARAN', 'MODAL_DISETOR', 'LABA_DITAHAN', 'PENDAPATAN_PENJUALAN', 'LABA_SELISIH_KURS', 'HARGA_POKOK_PENJUALAN', 'RUGI_SELISIH_KURS');--> statement-breakpoint
CREATE TYPE "public"."saldo_normal" AS ENUM('DEBIT', 'KREDIT');--> statement-breakpoint
CREATE TYPE "public"."status_dokumen" AS ENUM('DRAFT', 'POSTED', 'DIBATALKAN');--> statement-breakpoint
CREATE TYPE "public"."status_jurnal" AS ENUM('DRAFT', 'POSTED', 'DIBATALKAN');--> statement-breakpoint
CREATE TYPE "public"."status_periode" AS ENUM('TERBUKA', 'DITUTUP');--> statement-breakpoint
CREATE TYPE "public"."status_pesanan" AS ENUM('DRAFT', 'DISETUJUI', 'SEBAGIAN', 'SELESAI', 'DIBATALKAN');--> statement-breakpoint
CREATE TYPE "public"."status_rekonsiliasi" AS ENUM('DRAFT', 'SELESAI');--> statement-breakpoint
CREATE TYPE "public"."sumber_jurnal" AS ENUM('MANUAL', 'PEMBALIK', 'BIAYA', 'MUTASI_BANK', 'PENYESUAIAN_STOK', 'FAKTUR_PEMBELIAN', 'FAKTUR_PENJUALAN', 'PEMBAYARAN', 'TUTUP_BUKU');--> statement-breakpoint
CREATE TYPE "public"."tipe_akun" AS ENUM('ASET', 'KEWAJIBAN', 'EKUITAS', 'PENDAPATAN', 'BEBAN');--> statement-breakpoint
CREATE TYPE "public"."tipe_barang" AS ENUM('BARANG_PERSEDIAAN', 'BARANG_NON_PERSEDIAAN', 'JASA');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
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
CREATE TABLE "bank_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rekening_bank_id" uuid NOT NULL,
	"tanggal_laporan" date NOT NULL,
	"saldo_laporan_bank" numeric(20, 4) NOT NULL,
	"saldo_buku_tercocok" numeric(20, 4) DEFAULT '0' NOT NULL,
	"selisih" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_rekonsiliasi" DEFAULT 'DRAFT' NOT NULL,
	"catatan" text,
	"diselesaikan_oleh" text,
	"diselesaikan_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_bank_reconciliations_selesai_seimbang" CHECK ("bank_reconciliations"."status" <> 'SELESAI' OR "bank_reconciliations"."selisih" = 0)
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"jenis" "jenis_mutasi_bank" NOT NULL,
	"rekening_bank_id" uuid NOT NULL,
	"rekening_tujuan_id" uuid,
	"akun_lawan_id" uuid,
	"kontak_id" uuid,
	"referensi" varchar(100),
	"deskripsi" text NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"jumlah" numeric(20, 4) NOT NULL,
	"status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL,
	"jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_transactions_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_bank_transactions_jumlah" CHECK ("bank_transactions"."jumlah" > 0),
	CONSTRAINT "ck_bank_transactions_lawan" CHECK (("bank_transactions"."jenis" = 'TRANSFER' AND "bank_transactions"."rekening_tujuan_id" IS NOT NULL AND "bank_transactions"."rekening_tujuan_id" <> "bank_transactions"."rekening_bank_id") OR ("bank_transactions"."jenis" <> 'TRANSFER' AND "bank_transactions"."akun_lawan_id" IS NOT NULL))
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
	"kategori_arus_kas" "kategori_arus_kas",
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
CREATE TABLE "document_sequences" (
	"prefiks" varchar(10) NOT NULL,
	"tahun" smallint NOT NULL,
	"nilai_terakhir" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_document_sequences" PRIMARY KEY("prefiks","tahun")
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
CREATE TABLE "expense_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"biaya_id" uuid NOT NULL,
	"urutan" smallint NOT NULL,
	"akun_beban_id" uuid NOT NULL,
	"deskripsi" text,
	"jumlah" numeric(20, 4) NOT NULL,
	CONSTRAINT "ck_expense_items_jumlah" CHECK ("expense_items"."jumlah" > 0)
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"kontak_id" uuid,
	"metode_bayar" "metode_bayar_biaya" DEFAULT 'TUNAI' NOT NULL,
	"rekening_bank_id" uuid,
	"tanggal_jatuh_tempo" date,
	"referensi" varchar(100),
	"deskripsi" text NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"subtotal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"ppn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total" numeric(20, 4) DEFAULT '0' NOT NULL,
	"sisa_tagihan" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL,
	"jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_expenses_metode_lengkap" CHECK (("expenses"."metode_bayar" = 'TUNAI' AND "expenses"."rekening_bank_id" IS NOT NULL) OR ("expenses"."metode_bayar" = 'HUTANG' AND "expenses"."kontak_id" IS NOT NULL)),
	CONSTRAINT "ck_expenses_nilai" CHECK ("expenses"."subtotal" >= 0 AND "expenses"."ppn" >= 0 AND "expenses"."sisa_tagihan" >= 0 AND "expenses"."sisa_tagihan" <= "expenses"."total")
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(7) NOT NULL,
	"tahun" smallint NOT NULL,
	"bulan" smallint NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL,
	"status" "status_periode" DEFAULT 'TERBUKA' NOT NULL,
	"ditutup_oleh" text,
	"ditutup_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fiscal_periods_kode_unique" UNIQUE("kode"),
	CONSTRAINT "ck_fiscal_periods_bulan" CHECK ("fiscal_periods"."bulan" BETWEEN 1 AND 12),
	CONSTRAINT "ck_fiscal_periods_rentang" CHECK ("fiscal_periods"."tanggal_mulai" <= "fiscal_periods"."tanggal_selesai")
);
--> statement-breakpoint
CREATE TABLE "item_stocks" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"kuantitas" numeric(20, 4) DEFAULT '0' NOT NULL,
	"nilai" numeric(20, 4) DEFAULT '0' NOT NULL,
	"biaya_rata_rata" numeric(20, 4) DEFAULT '0' NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_item_stocks_tidak_negatif" CHECK ("item_stocks"."kuantitas" >= 0 AND "item_stocks"."nilai" >= 0)
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
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"periode_id" uuid,
	"referensi" varchar(100),
	"deskripsi" text NOT NULL,
	"status" "status_jurnal" DEFAULT 'DRAFT' NOT NULL,
	"sumber" "sumber_jurnal" DEFAULT 'MANUAL' NOT NULL,
	"sumber_id" uuid,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"total_debit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total_kredit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"dibalik_oleh_id" uuid,
	"membalik_jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_journal_entries_seimbang" CHECK ("journal_entries"."status" <> 'POSTED' OR "journal_entries"."total_debit" = "journal_entries"."total_kredit"),
	CONSTRAINT "ck_journal_entries_total_tidak_negatif" CHECK ("journal_entries"."total_debit" >= 0 AND "journal_entries"."total_kredit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "journal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurnal_id" uuid NOT NULL,
	"urutan" smallint NOT NULL,
	"akun_id" uuid NOT NULL,
	"kontak_id" uuid,
	"deskripsi" text,
	"debit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"kredit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"debit_dasar" numeric(20, 4) DEFAULT '0' NOT NULL,
	"kredit_dasar" numeric(20, 4) DEFAULT '0' NOT NULL,
	"rekonsiliasi_id" uuid,
	CONSTRAINT "ck_journal_items_tidak_negatif" CHECK ("journal_items"."debit" >= 0 AND "journal_items"."kredit" >= 0 AND "journal_items"."debit_dasar" >= 0 AND "journal_items"."kredit_dasar" >= 0),
	CONSTRAINT "ck_journal_items_satu_sisi" CHECK (("journal_items"."debit" = 0) <> ("journal_items"."kredit" = 0)),
	CONSTRAINT "ck_journal_items_kurs_positif" CHECK ("journal_items"."kurs" > 0)
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
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pembayaran_id" uuid NOT NULL,
	"faktur_penjualan_id" uuid,
	"faktur_pembelian_id" uuid,
	"biaya_id" uuid,
	"jumlah" numeric(20, 4) NOT NULL,
	CONSTRAINT "ck_payment_allocations_jumlah" CHECK ("payment_allocations"."jumlah" > 0),
	CONSTRAINT "ck_payment_allocations_satu_dokumen" CHECK (num_nonnulls("payment_allocations"."faktur_penjualan_id", "payment_allocations"."faktur_pembelian_id", "payment_allocations"."biaya_id") = 1)
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
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"jenis" "jenis_pembayaran" NOT NULL,
	"kontak_id" uuid NOT NULL,
	"rekening_bank_id" uuid NOT NULL,
	"referensi" varchar(100),
	"catatan" text,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"jumlah" numeric(20, 4) NOT NULL,
	"status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL,
	"jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_payments_jumlah" CHECK ("payments"."jumlah" > 0)
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
CREATE TABLE "purchase_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urutan" smallint NOT NULL,
	"item_id" uuid,
	"akun_id" uuid,
	"deskripsi" text,
	"kuantitas" numeric(20, 4) NOT NULL,
	"harga_satuan" numeric(20, 4) NOT NULL,
	"persen_diskon" numeric(7, 4) DEFAULT '0' NOT NULL,
	"subtotal" numeric(20, 4) NOT NULL,
	"faktur_id" uuid NOT NULL,
	"baris_pesanan_id" uuid,
	CONSTRAINT "ck_purchase_invoice_items_kuantitas_positif" CHECK ("purchase_invoice_items"."kuantitas" > 0 AND "purchase_invoice_items"."harga_satuan" >= 0),
	CONSTRAINT "ck_purchase_invoice_items_item_atau_akun" CHECK ("purchase_invoice_items"."item_id" IS NOT NULL OR "purchase_invoice_items"."akun_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "purchase_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"nomor_faktur_pemasok" varchar(100),
	"tanggal" date NOT NULL,
	"tanggal_jatuh_tempo" date NOT NULL,
	"pemasok_id" uuid NOT NULL,
	"pesanan_id" uuid,
	"termin_pembayaran_id" uuid,
	"catatan" text,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"subtotal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"persen_ppn" numeric(7, 4) DEFAULT '0' NOT NULL,
	"ppn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total" numeric(20, 4) DEFAULT '0' NOT NULL,
	"sisa_tagihan" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL,
	"jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_invoices_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_purchase_invoices_sisa" CHECK ("purchase_invoices"."sisa_tagihan" >= 0 AND "purchase_invoices"."sisa_tagihan" <= "purchase_invoices"."total")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urutan" smallint NOT NULL,
	"item_id" uuid,
	"akun_id" uuid,
	"deskripsi" text,
	"kuantitas" numeric(20, 4) NOT NULL,
	"harga_satuan" numeric(20, 4) NOT NULL,
	"persen_diskon" numeric(7, 4) DEFAULT '0' NOT NULL,
	"subtotal" numeric(20, 4) NOT NULL,
	"pesanan_id" uuid NOT NULL,
	"kuantitas_ditagih" numeric(20, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "ck_purchase_order_items_kuantitas_positif" CHECK ("purchase_order_items"."kuantitas" > 0 AND "purchase_order_items"."harga_satuan" >= 0),
	CONSTRAINT "ck_purchase_order_items_item_atau_akun" CHECK ("purchase_order_items"."item_id" IS NOT NULL OR "purchase_order_items"."akun_id" IS NOT NULL),
	CONSTRAINT "ck_purchase_order_items_ditagih" CHECK ("purchase_order_items"."kuantitas_ditagih" >= 0 AND "purchase_order_items"."kuantitas_ditagih" <= "purchase_order_items"."kuantitas")
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"pemasok_id" uuid NOT NULL,
	"tanggal_diharapkan" date,
	"referensi" varchar(100),
	"catatan" text,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"subtotal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"persen_ppn" numeric(7, 4) DEFAULT '0' NOT NULL,
	"ppn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_pesanan" DEFAULT 'DRAFT' NOT NULL,
	"disetujui_oleh" text,
	"disetujui_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"peran_id" uuid NOT NULL,
	"izin" varchar(100) NOT NULL,
	CONSTRAINT "pk_role_permissions" PRIMARY KEY("peran_id","izin")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(50) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"keterangan" text,
	"akses_penuh" boolean DEFAULT false NOT NULL,
	"adalah_sistem" boolean DEFAULT false NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "sales_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urutan" smallint NOT NULL,
	"item_id" uuid,
	"akun_id" uuid,
	"deskripsi" text,
	"kuantitas" numeric(20, 4) NOT NULL,
	"harga_satuan" numeric(20, 4) NOT NULL,
	"persen_diskon" numeric(7, 4) DEFAULT '0' NOT NULL,
	"subtotal" numeric(20, 4) NOT NULL,
	"faktur_id" uuid NOT NULL,
	"baris_pesanan_id" uuid,
	"hpp" numeric(20, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "ck_sales_invoice_items_kuantitas_positif" CHECK ("sales_invoice_items"."kuantitas" > 0 AND "sales_invoice_items"."harga_satuan" >= 0),
	CONSTRAINT "ck_sales_invoice_items_item_atau_akun" CHECK ("sales_invoice_items"."item_id" IS NOT NULL OR "sales_invoice_items"."akun_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "sales_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"tanggal_jatuh_tempo" date NOT NULL,
	"pelanggan_id" uuid NOT NULL,
	"pesanan_id" uuid,
	"termin_pembayaran_id" uuid,
	"catatan" text,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"subtotal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"persen_ppn" numeric(7, 4) DEFAULT '0' NOT NULL,
	"ppn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total_hpp" numeric(20, 4) DEFAULT '0' NOT NULL,
	"sisa_tagihan" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_dokumen" DEFAULT 'DRAFT' NOT NULL,
	"jurnal_id" uuid,
	"diposting_oleh" text,
	"diposting_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_invoices_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_sales_invoices_sisa" CHECK ("sales_invoices"."sisa_tagihan" >= 0 AND "sales_invoices"."sisa_tagihan" <= "sales_invoices"."total")
);
--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urutan" smallint NOT NULL,
	"item_id" uuid,
	"akun_id" uuid,
	"deskripsi" text,
	"kuantitas" numeric(20, 4) NOT NULL,
	"harga_satuan" numeric(20, 4) NOT NULL,
	"persen_diskon" numeric(7, 4) DEFAULT '0' NOT NULL,
	"subtotal" numeric(20, 4) NOT NULL,
	"pesanan_id" uuid NOT NULL,
	"kuantitas_ditagih" numeric(20, 4) DEFAULT '0' NOT NULL,
	CONSTRAINT "ck_sales_order_items_kuantitas_positif" CHECK ("sales_order_items"."kuantitas" > 0 AND "sales_order_items"."harga_satuan" >= 0),
	CONSTRAINT "ck_sales_order_items_item_atau_akun" CHECK ("sales_order_items"."item_id" IS NOT NULL OR "sales_order_items"."akun_id" IS NOT NULL),
	CONSTRAINT "ck_sales_order_items_ditagih" CHECK ("sales_order_items"."kuantitas_ditagih" >= 0 AND "sales_order_items"."kuantitas_ditagih" <= "sales_order_items"."kuantitas")
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"pelanggan_id" uuid NOT NULL,
	"tanggal_kirim" date,
	"referensi" varchar(100),
	"catatan" text,
	"mata_uang_id" uuid NOT NULL,
	"kurs" numeric(20, 8) DEFAULT '1' NOT NULL,
	"subtotal" numeric(20, 4) DEFAULT '0' NOT NULL,
	"persen_ppn" numeric(7, 4) DEFAULT '0' NOT NULL,
	"ppn" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total" numeric(20, 4) DEFAULT '0' NOT NULL,
	"status" "status_pesanan" DEFAULT 'DRAFT' NOT NULL,
	"disetujui_oleh" text,
	"disetujui_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_orders_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "stock_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"item_id" uuid NOT NULL,
	"kuantitas_selisih" numeric(20, 4) NOT NULL,
	"biaya_satuan" numeric(20, 4),
	"nilai" numeric(20, 4) DEFAULT '0' NOT NULL,
	"akun_penyesuaian_id" uuid NOT NULL,
	"keterangan" text NOT NULL,
	"jurnal_id" uuid,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_adjustments_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "ck_stock_adjustments_tidak_nol" CHECK ("stock_adjustments"."kuantitas_selisih" <> 0)
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" date NOT NULL,
	"item_id" uuid NOT NULL,
	"jenis" "jenis_mutasi_stok" NOT NULL,
	"kuantitas" numeric(20, 4) NOT NULL,
	"biaya_satuan" numeric(20, 4) NOT NULL,
	"nilai" numeric(20, 4) NOT NULL,
	"saldo_kuantitas" numeric(20, 4) NOT NULL,
	"saldo_nilai" numeric(20, 4) NOT NULL,
	"biaya_rata_rata" numeric(20, 4) NOT NULL,
	"sumber" varchar(30) NOT NULL,
	"sumber_id" uuid NOT NULL,
	"keterangan" text,
	"jurnal_id" uuid,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_stock_movements_kuantitas_positif" CHECK ("stock_movements"."kuantitas" > 0)
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
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"pengguna_id" text NOT NULL,
	"peran_id" uuid NOT NULL,
	"dibuat_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_user_roles" PRIMARY KEY("pengguna_id","peran_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "year_end_closings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tahun" smallint NOT NULL,
	"jurnal_id" uuid NOT NULL,
	"laba_bersih" numeric(20, 4) NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibatalkan_oleh" text,
	"dibatalkan_pada" timestamp with time zone,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_akun_coa_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_coa_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_rekening_bank_id_bank_accounts_id_fk" FOREIGN KEY ("rekening_bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_rekening_bank_id_bank_accounts_id_fk" FOREIGN KEY ("rekening_bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_rekening_tujuan_id_bank_accounts_id_fk" FOREIGN KEY ("rekening_tujuan_id") REFERENCES "public"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_akun_lawan_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_lawan_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_kontak_id_partners_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_induk_id_chart_of_accounts_id_fk" FOREIGN KEY ("induk_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_biaya_id_expenses_id_fk" FOREIGN KEY ("biaya_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_akun_beban_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_beban_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_kontak_id_partners_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rekening_bank_id_bank_accounts_id_fk" FOREIGN KEY ("rekening_bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_stocks" ADD CONSTRAINT "item_stocks_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_kategori_id_product_categories_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_satuan_id_units_of_measurement_id_fk" FOREIGN KEY ("satuan_id") REFERENCES "public"."units_of_measurement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_akun_persediaan_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_persediaan_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_akun_hpp_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_hpp_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_akun_pendapatan_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_pendapatan_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_periode_id_fiscal_periods_id_fk" FOREIGN KEY ("periode_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_dibalik_oleh_id_journal_entries_id_fk" FOREIGN KEY ("dibalik_oleh_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_membalik_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("membalik_jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_kontak_id_partners_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_rekonsiliasi_id_bank_reconciliations_id_fk" FOREIGN KEY ("rekonsiliasi_id") REFERENCES "public"."bank_reconciliations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_termin_pembayaran_id_payment_terms_id_fk" FOREIGN KEY ("termin_pembayaran_id") REFERENCES "public"."payment_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_pembayaran_id_payments_id_fk" FOREIGN KEY ("pembayaran_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_faktur_penjualan_id_sales_invoices_id_fk" FOREIGN KEY ("faktur_penjualan_id") REFERENCES "public"."sales_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_faktur_pembelian_id_purchase_invoices_id_fk" FOREIGN KEY ("faktur_pembelian_id") REFERENCES "public"."purchase_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_biaya_id_expenses_id_fk" FOREIGN KEY ("biaya_id") REFERENCES "public"."expenses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_kontak_id_partners_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_rekening_bank_id_bank_accounts_id_fk" FOREIGN KEY ("rekening_bank_id") REFERENCES "public"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_induk_id_product_categories_id_fk" FOREIGN KEY ("induk_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_faktur_id_purchase_invoices_id_fk" FOREIGN KEY ("faktur_id") REFERENCES "public"."purchase_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_baris_pesanan_id_purchase_order_items_id_fk" FOREIGN KEY ("baris_pesanan_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_pemasok_id_partners_id_fk" FOREIGN KEY ("pemasok_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_pesanan_id_purchase_orders_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_termin_pembayaran_id_payment_terms_id_fk" FOREIGN KEY ("termin_pembayaran_id") REFERENCES "public"."payment_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_pesanan_id_purchase_orders_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_pemasok_id_partners_id_fk" FOREIGN KEY ("pemasok_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_peran_id_roles_id_fk" FOREIGN KEY ("peran_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_faktur_id_sales_invoices_id_fk" FOREIGN KEY ("faktur_id") REFERENCES "public"."sales_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_baris_pesanan_id_sales_order_items_id_fk" FOREIGN KEY ("baris_pesanan_id") REFERENCES "public"."sales_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_pelanggan_id_partners_id_fk" FOREIGN KEY ("pelanggan_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_pesanan_id_sales_orders_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."sales_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_termin_pembayaran_id_payment_terms_id_fk" FOREIGN KEY ("termin_pembayaran_id") REFERENCES "public"."payment_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_pesanan_id_sales_orders_id_fk" FOREIGN KEY ("pesanan_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_pelanggan_id_partners_id_fk" FOREIGN KEY ("pelanggan_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_akun_penyesuaian_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_penyesuaian_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_pengguna_id_user_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_peran_id_roles_id_fk" FOREIGN KEY ("peran_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "year_end_closings" ADD CONSTRAINT "year_end_closings_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bank_accounts_bank_nomor" ON "bank_accounts" USING btree ("nama_bank","nomor_rekening") WHERE "bank_accounts"."nama_bank" IS NOT NULL AND "bank_accounts"."nomor_rekening" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_bank_reconciliations_rekening" ON "bank_reconciliations" USING btree ("rekening_bank_id","tanggal_laporan");--> statement-breakpoint
CREATE INDEX "idx_bank_transactions_rekening_tanggal" ON "bank_transactions" USING btree ("rekening_bank_id","tanggal");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_induk" ON "chart_of_accounts" USING btree ("induk_id");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_tipe" ON "chart_of_accounts" USING btree ("tipe_akun");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_chart_of_accounts_peran_tunggal" ON "chart_of_accounts" USING btree ("peran_sistem") WHERE peran_sistem IS NOT NULL AND peran_sistem NOT IN ('KAS_BANK', 'PERSEDIAAN');--> statement-breakpoint
CREATE UNIQUE INDEX "uq_currencies_satu_mata_uang_dasar" ON "currencies" USING btree ("adalah_mata_uang_dasar") WHERE "currencies"."adalah_mata_uang_dasar" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exchange_rates_mata_uang_tanggal" ON "exchange_rates" USING btree ("mata_uang_id","tanggal_berlaku");--> statement-breakpoint
CREATE INDEX "idx_exchange_rates_pencarian" ON "exchange_rates" USING btree ("mata_uang_id","tanggal_berlaku" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_expense_items_biaya" ON "expense_items" USING btree ("biaya_id");--> statement-breakpoint
CREATE INDEX "idx_expenses_tanggal" ON "expenses" USING btree ("tanggal");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fiscal_periods_tahun_bulan" ON "fiscal_periods" USING btree ("tahun","bulan");--> statement-breakpoint
CREATE INDEX "idx_items_nama" ON "items" USING btree ("nama");--> statement-breakpoint
CREATE INDEX "idx_items_kategori" ON "items" USING btree ("kategori_id");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_tanggal" ON "journal_entries" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_status_tanggal" ON "journal_entries" USING btree ("status","tanggal");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_sumber" ON "journal_entries" USING btree ("sumber","sumber_id");--> statement-breakpoint
CREATE INDEX "idx_journal_items_jurnal" ON "journal_items" USING btree ("jurnal_id");--> statement-breakpoint
CREATE INDEX "idx_journal_items_akun" ON "journal_items" USING btree ("akun_id");--> statement-breakpoint
CREATE INDEX "idx_journal_items_rekonsiliasi" ON "journal_items" USING btree ("rekonsiliasi_id");--> statement-breakpoint
CREATE INDEX "idx_partners_nama" ON "partners" USING btree ("nama");--> statement-breakpoint
CREATE INDEX "idx_partners_peran" ON "partners" USING btree ("adalah_pelanggan","adalah_pemasok");--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_pembayaran" ON "payment_allocations" USING btree ("pembayaran_id");--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_faktur_penjualan" ON "payment_allocations" USING btree ("faktur_penjualan_id");--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_faktur_pembelian" ON "payment_allocations" USING btree ("faktur_pembelian_id");--> statement-breakpoint
CREATE INDEX "idx_payments_kontak" ON "payments" USING btree ("kontak_id");--> statement-breakpoint
CREATE INDEX "idx_payments_tanggal" ON "payments" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "idx_product_categories_induk" ON "product_categories" USING btree ("induk_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_invoice_items_faktur" ON "purchase_invoice_items" USING btree ("faktur_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_invoices_pemasok" ON "purchase_invoices" USING btree ("pemasok_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_invoices_status" ON "purchase_invoices" USING btree ("status","tanggal_jatuh_tempo");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_pesanan" ON "purchase_order_items" USING btree ("pesanan_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_pemasok" ON "purchase_orders" USING btree ("pemasok_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_tanggal" ON "purchase_orders" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "idx_sales_invoice_items_faktur" ON "sales_invoice_items" USING btree ("faktur_id");--> statement-breakpoint
CREATE INDEX "idx_sales_invoices_pelanggan" ON "sales_invoices" USING btree ("pelanggan_id");--> statement-breakpoint
CREATE INDEX "idx_sales_invoices_status" ON "sales_invoices" USING btree ("status","tanggal_jatuh_tempo");--> statement-breakpoint
CREATE INDEX "idx_sales_order_items_pesanan" ON "sales_order_items" USING btree ("pesanan_id");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_pelanggan" ON "sales_orders" USING btree ("pelanggan_id");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_tanggal" ON "sales_orders" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_item" ON "stock_movements" USING btree ("item_id","tanggal");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_sumber" ON "stock_movements" USING btree ("sumber","sumber_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_peran" ON "user_roles" USING btree ("peran_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_year_end_closings_tahun_aktif" ON "year_end_closings" USING btree ("tahun") WHERE "year_end_closings"."aktif" = true;