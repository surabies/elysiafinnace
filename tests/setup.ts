/**
 * Preload for `bun test` (see bunfig.toml). Runs before any test file is imported.
 *
 * It points the app at a FRESH database (`app_test`), created from scratch and
 * migrated with the real migration files. That is what proves "migrations apply
 * cleanly on a fresh PostGIS database" on every run. The development database
 * from .env is never touched.
 *
 * Admin connection (needs CREATE DATABASE): TEST_DATABASE_ADMIN_URL, default is the
 * docker-compose database server.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { Client } from "pg";

const adminUrl = new URL(
  process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://app:app_dev_pw@localhost:5433/postgres",
);
export const TEST_DB_NAME = "app_test";

if (!/^app_test[a-z0-9_]*$/.test(TEST_DB_NAME)) {
  throw new Error("Refusing to run tests against a database that is not named app_test*");
}

const testUrl = new URL(adminUrl);
testUrl.pathname = `/${TEST_DB_NAME}`;

process.env.DATABASE_URL = testUrl.toString();
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.ALLOWED_ORIGINS = "";
process.env.WRITE_RATE_LIMIT_MAX = "200";
process.env.DATABASE_POOL_MAX = "5";
delete process.env.VERCEL;
delete process.env.VERCEL_URL;
delete process.env.VERCEL_BRANCH_URL;
delete process.env.VERCEL_ENV;

const admin = new Client({ connectionString: adminUrl.toString() });
await admin.connect();
try {
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
} finally {
  await admin.end();
}

const client = new Client({ connectionString: testUrl.toString() });
await client.connect();
try {
  await migrate(drizzle({ client }), {
    migrationsFolder: path.join(import.meta.dir, "..", "src", "db", "migrations"),
  });
} finally {
  await client.end();
}
