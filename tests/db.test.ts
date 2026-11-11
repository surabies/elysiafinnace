import { describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { pool } from "@/db";
import { parseEwkbPoint } from "@/db/types";
import { buildNearbyQuery } from "@/server/modules/places/service";
import { api, authed, createUser, json } from "./helpers";

const migrationsDir = path.join(import.meta.dir, "..", "src", "db", "migrations");
const sqlFiles = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

describe("schema on the fresh test database", () => {
  test("PostGIS extension is installed", async () => {
    const { rows } = await pool.query("select extversion from pg_extension where extname = 'postgis'");
    expect(rows).toHaveLength(1);
  });

  test("places.location is geometry(Point, 4326)", async () => {
    const { rows } = await pool.query(
      "select type, srid from geometry_columns where f_table_name = 'places' and f_geometry_column = 'location'",
    );
    expect(rows).toEqual([{ type: "POINT", srid: 4326 }]);
  });

  test("the database rejects a point with another SRID", async () => {
    const user = await createUser("srid");
    let message = "";
    try {
      await pool.query(
        "insert into places (name, owner_id, location) values ('wrong srid', $1, ST_SetSRID(ST_MakePoint(1, 1), 3857))",
        [user.userId],
      );
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("SRID");
  });

  test("a GiST index covers the geography expression used by the queries", async () => {
    const { rows } = await pool.query<{ indexdef: string }>(
      "select indexdef from pg_indexes where indexname = 'places_location_gist_idx'",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.indexdef).toContain("USING gist");
    expect(rows[0]!.indexdef).toContain("geography");
  });
});

describe("migrations", () => {
  test("PostGIS is enabled by a migration that runs before any geometry column is created", () => {
    const contents = sqlFiles.map((file) => readFileSync(path.join(migrationsDir, file), "utf8"));
    const extensionIndex = contents.findIndex((sql) => /CREATE EXTENSION IF NOT EXISTS postgis/i.test(sql));
    const geometryIndex = contents.findIndex((sql) => /geometry\(/i.test(sql));
    expect(extensionIndex).toBe(0);
    expect(geometryIndex).toBeGreaterThan(extensionIndex);
  });

  test("migrations never touch PostGIS' own tables", () => {
    for (const file of sqlFiles) {
      const sql = readFileSync(path.join(migrationsDir, file), "utf8");
      expect(sql).not.toMatch(/spatial_ref_sys|geometry_columns|geography_columns/);
    }
  });

  test("apply cleanly to a brand-new database", async () => {
    const adminUrl = new URL(
      process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://app:app_dev_pw@localhost:5432/postgres",
    );
    const name = `app_test_fresh_${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;
    const admin = new Client({ connectionString: adminUrl.toString() });
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE ${name}`);
      const freshUrl = new URL(adminUrl);
      freshUrl.pathname = `/${name}`;
      const client = new Client({ connectionString: freshUrl.toString() });
      await client.connect();
      try {
        await migrate(drizzle({ client }), { migrationsFolder: migrationsDir });
        const extension = await client.query("select 1 from pg_extension where extname = 'postgis'");
        expect(extension.rowCount).toBe(1);
        const tables = await client.query<{ table_name: string }>(
          "select table_name from information_schema.tables where table_schema = 'public' and table_name in ('user','session','account','verification','rate_limit','places')",
        );
        expect(tables.rows.map((row) => row.table_name).sort()).toEqual([
          "account",
          "places",
          "rate_limit",
          "session",
          "user",
          "verification",
        ]);
        // running the migrations again is a no-op
        await migrate(drizzle({ client }), { migrationsFolder: migrationsDir });
      } finally {
        await client.end();
      }
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end();
    }
  });
});

describe("spatial query performance", () => {
  test("EXPLAIN shows the nearby query using the GiST index on a realistic table", async () => {
    const user = await createUser("bulk");
    await pool.query(
      `insert into places (name, owner_id, location)
       select 'bulk-' || g, $1,
              ST_SetSRID(ST_MakePoint(50 + random(), 10 + random()), 4326)
       from generate_series(1, 20000) g`,
      [user.userId],
    );
    try {
      await pool.query("analyze places");
      const { sql: text, params } = buildNearbyQuery({
        longitude: 50.5,
        latitude: 10.5,
        radiusMeters: 500,
        limit: 20,
      }).toSQL();
      const plan = await pool.query(`explain (format json) ${text}`, params);
      const planText = JSON.stringify(plan.rows);
      expect(planText).toContain("places_location_gist_idx");
      expect(planText).not.toContain('"Node Type":"Seq Scan"');
    } finally {
      await pool.query("delete from places where name like 'bulk-%'");
    }
  });
});

describe("SQL injection safety", () => {
  test("hostile query parameters are rejected by validation and the table survives", async () => {
    for (const query of [
      "lon=1;DROP TABLE places;--&lat=0&radius=10",
      "lon=0&lat=0&radius=10 OR 1=1",
      "lon=0&lat=0' OR '1'='1&radius=10",
    ]) {
      const response = await api(`/api/places/nearby?${encodeURI(query)}`);
      expect([422, 400]).toContain(response.status);
    }
    const { rows } = await pool.query("select to_regclass('public.places') as t");
    expect(rows[0].t).toBe("places");
  });

  test("hostile text is stored and returned verbatim, never executed", async () => {
    const user = await createUser("inject");
    const hostile = "x'); DROP TABLE places;--";
    const created = await api(
      "/api/places",
      authed(user.cookie, json({ name: hostile, longitude: 3, latitude: 3 })),
    );
    expect(created.status).toBe(201);
    const { data } = (await created.json()) as { data: { id: string; name: string } };
    expect(data.name).toBe(hostile);
    const fetched = await api(`/api/places/${data.id}`);
    expect(((await fetched.json()) as { data: { name: string } }).data.name).toBe(hostile);
    const { rows } = await pool.query("select to_regclass('public.places') as t");
    expect(rows[0].t).toBe("places");
  });
});

describe("EWKB point parsing", () => {
  async function hex(expression: string) {
    const { rows } = await pool.query<{ hex: string }>(`select encode(${expression}, 'hex') as hex`);
    return rows[0]!.hex;
  }

  test("reads little-endian EWKB with an SRID", async () => {
    const value = await hex("ST_AsEWKB(ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326))");
    expect(parseEwkbPoint(value)).toEqual({ longitude: 106.8456, latitude: -6.2088 });
  });

  test("reads big-endian EWKB", async () => {
    const value = await hex("ST_AsEWKB(ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), 'XDR')");
    expect(parseEwkbPoint(value)).toEqual({ longitude: -122.4194, latitude: 37.7749 });
  });

  test("rejects geometries that are not points", async () => {
    const value = await hex("ST_AsEWKB(ST_GeomFromText('LINESTRING(0 0, 1 1)', 4326))");
    expect(() => parseEwkbPoint(value)).toThrow("Point");
  });
});
