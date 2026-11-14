ALTER TABLE "payment_allocations" ADD COLUMN "potongan" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD COLUMN "akun_potongan_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD COLUMN "selisih_kurs" numeric(20, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_akun_potongan_id_chart_of_accounts_id_fk" FOREIGN KEY ("akun_potongan_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE restrict ON UPDATE no action;