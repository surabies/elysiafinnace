CREATE TABLE IF NOT EXISTS "entity_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL REFERENCES "public"."tags"("id") ON DELETE CASCADE,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" uuid NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_entity_tag" UNIQUE("tag_id", "entity_type", "entity_id")
);

CREATE INDEX IF NOT EXISTS "idx_entity_tags_lookup" ON "entity_tags" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_entity_tags_tag" ON "entity_tags" ("tag_id");
