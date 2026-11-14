CREATE TABLE "partner_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kontak_id" uuid NOT NULL,
	"judul" varchar(100) NOT NULL,
	"jenis" varchar(30) DEFAULT 'UTAMA' NOT NULL,
	"alamat" text NOT NULL,
	"kota" varchar(100),
	"provinsi" varchar(100),
	"kode_pos" varchar(10),
	"negara" varchar(100) DEFAULT 'Indonesia' NOT NULL,
	"adalah_utama" boolean DEFAULT false NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kontak_id" uuid NOT NULL,
	"nama" varchar(150) NOT NULL,
	"jabatan" varchar(100),
	"email" varchar(150),
	"telepon" varchar(30),
	"ponsel" varchar(30),
	"adalah_utama" boolean DEFAULT false NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "nik" varchar(16);--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "grup" varchar(50);--> statement-breakpoint
ALTER TABLE "partner_addresses" ADD CONSTRAINT "partner_addresses_kontak_id_partners_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_contacts" ADD CONSTRAINT "partner_contacts_kontak_id_partners_id_fk" FOREIGN KEY ("kontak_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_partner_addresses_kontak" ON "partner_addresses" USING btree ("kontak_id");--> statement-breakpoint
CREATE INDEX "idx_partner_contacts_kontak" ON "partner_contacts" USING btree ("kontak_id");--> statement-breakpoint
CREATE INDEX "idx_partners_grup" ON "partners" USING btree ("grup");