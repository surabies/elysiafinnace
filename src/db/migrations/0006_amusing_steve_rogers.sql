CREATE TABLE "document_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipe_dokumen" varchar(30) NOT NULL,
	"dokumen_id" uuid NOT NULL,
	"nama_file" varchar(255) NOT NULL,
	"ukuran_bytes" integer DEFAULT 0 NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"keterangan" text,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"urutan" smallint DEFAULT 1 NOT NULL,
	"akun_id" uuid NOT NULL,
	"posisi" varchar(10) NOT NULL,
	"nominal_default" numeric(20, 4) DEFAULT '0' NOT NULL,
	"persentase" numeric(7, 4) DEFAULT '0' NOT NULL,
	"deskripsi" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kode" varchar(30) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"deskripsi" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_templates_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "recurring_journals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"deskripsi" text NOT NULL,
	"frekuensi" varchar(20) NOT NULL,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date,
	"tanggal_berikutnya" date NOT NULL,
	"template_id" uuid,
	"mata_uang_id" uuid NOT NULL,
	"total_debit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total_kredit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"terakhir_diposting_pada" timestamp with time zone,
	"jurnal_terakhir_id" uuid,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_journals_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
ALTER TABLE "journal_template_items" ADD CONSTRAINT "journal_template_items_template_id_journal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."journal_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_template_items" ADD CONSTRAINT "journal_template_items_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_journals" ADD CONSTRAINT "recurring_journals_template_id_journal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."journal_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_journals" ADD CONSTRAINT "recurring_journals_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_journals" ADD CONSTRAINT "recurring_journals_jurnal_terakhir_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_terakhir_id") REFERENCES "public"."journal_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_document_attachments_dokumen" ON "document_attachments" USING btree ("tipe_dokumen","dokumen_id");--> statement-breakpoint
CREATE INDEX "idx_journal_template_items_template" ON "journal_template_items" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_journal_templates_nama" ON "journal_templates" USING btree ("nama");--> statement-breakpoint
CREATE INDEX "idx_recurring_journals_jadwal" ON "recurring_journals" USING btree ("aktif","tanggal_berikutnya");