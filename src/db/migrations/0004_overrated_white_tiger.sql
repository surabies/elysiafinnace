ALTER TYPE "public"."sumber_jurnal" ADD VALUE 'REVALUASI_KURS';--> statement-breakpoint
CREATE TABLE "currency_revaluation_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revaluasi_id" uuid NOT NULL,
	"akun_id" uuid NOT NULL,
	"mata_uang_id" uuid NOT NULL,
	"saldo_valas" numeric(20, 4) NOT NULL,
	"kurs_buku" numeric(20, 8) NOT NULL,
	"saldo_buku_idr" numeric(20, 4) NOT NULL,
	"kurs_baru" numeric(20, 8) NOT NULL,
	"saldo_wajar_idr" numeric(20, 4) NOT NULL,
	"selisih" numeric(20, 4) NOT NULL,
	"jenis_selisih" varchar(10) NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_revaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" varchar(30) NOT NULL,
	"tanggal" date NOT NULL,
	"keterangan" text,
	"jurnal_id" uuid NOT NULL,
	"jurnal_balik_id" uuid,
	"total_laba" numeric(20, 4) DEFAULT '0' NOT NULL,
	"total_rugi" numeric(20, 4) DEFAULT '0' NOT NULL,
	"balik_otomatis" boolean DEFAULT false NOT NULL,
	"dibuat_oleh" text,
	"diubah_oleh" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currency_revaluations_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
ALTER TABLE "currency_revaluation_lines" ADD CONSTRAINT "currency_revaluation_lines_revaluasi_id_currency_revaluations_id_fk" FOREIGN KEY ("revaluasi_id") REFERENCES "public"."currency_revaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_revaluation_lines" ADD CONSTRAINT "currency_revaluation_lines_akun_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_revaluation_lines" ADD CONSTRAINT "currency_revaluation_lines_mata_uang_id_currencies_id_fk" FOREIGN KEY ("mata_uang_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_revaluations" ADD CONSTRAINT "currency_revaluations_jurnal_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_revaluations" ADD CONSTRAINT "currency_revaluations_jurnal_balik_id_journal_entries_id_fk" FOREIGN KEY ("jurnal_balik_id") REFERENCES "public"."journal_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_currency_revaluation_lines_revaluasi" ON "currency_revaluation_lines" USING btree ("revaluasi_id");--> statement-breakpoint
CREATE INDEX "idx_currency_revaluation_lines_akun" ON "currency_revaluation_lines" USING btree ("akun_id");--> statement-breakpoint
CREATE INDEX "idx_currency_revaluations_tanggal" ON "currency_revaluations" USING btree ("tanggal");