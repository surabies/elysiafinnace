ALTER TABLE "bank_transactions" ADD COLUMN "jumlah_tujuan" numeric(20, 4);--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "kurs_tujuan" numeric(20, 8);--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "biaya_admin" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN "akun_biaya_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_akun_biaya_admin_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_biaya_admin_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "ck_bank_transactions_biaya_admin" CHECK ("bank_transactions"."biaya_admin" >= 0);