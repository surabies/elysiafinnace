import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { wgs84Point } from "../types";
import { user } from "./auth";

/**
 * Places with a PostGIS point.
 *
 * Column type: geometry(Point, 4326) via the `wgs84Point` custom type (Drizzle's built-in
 * `geometry()` cannot emit the SRID). SRID 4326 = WGS 84 longitude/latitude.
 * PostGIS coordinate order is (longitude, latitude), i.e. (x, y).
 *
 * Distance queries cast to `geography` so radii are real metres on the spheroid.
 * The GiST index is therefore built on the SAME expression (`location::geography`);
 * an index on the bare geometry column would not be used by those queries.
 * See docs/DECISIONS.md (D-006).
 */
export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    location: wgs84Point("location").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("places_location_gist_idx").using("gist", sql`(${table.location}::geography)`),
    index("places_owner_id_idx").on(table.ownerId),
    index("places_created_at_idx").on(table.createdAt),
    unique("places_owner_name_unique").on(table.ownerId, table.name),
  ],
);

export type PlaceRow = typeof places.$inferSelect;
