import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  // PostGIS owns spatial_ref_sys / geometry_columns / geography_columns.
  // drizzle-kit must never try to manage them (applies to push/pull).
  extensionsFilters: ["postgis"],
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
