import { describe, expect, test } from "bun:test";
import { pool } from "@/db";

describe("database schema & core tables", () => {
  test("core auth and rate limit tables exist", async () => {
    const { rows } = await pool.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' and table_name in ('user','session','account','verification','rate_limit')",
    );
    const names = rows.map((r) => r.table_name).sort();
    expect(names).toContain("user");
    expect(names).toContain("session");
    expect(names).toContain("account");
    expect(names).toContain("verification");
  });

  test("places table does not exist in financial application", async () => {
    const { rows } = await pool.query(
      "select table_name from information_schema.tables where table_schema = 'public' and table_name = 'places'",
    );
    expect(rows).toHaveLength(0);
  });
});
