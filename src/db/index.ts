import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * One pg Pool per runtime instance (module-level singleton, also kept on
 * globalThis so dev hot-reloads do not leak connections).
 *
 * Driver choice: node-postgres over TCP. Vercel Functions run on Node.js with
 * Fluid compute, which reuses an instance across concurrent requests, so a small
 * pool works well. Use the provider's pooled connection string in production.
 */
const globalForDb = globalThis as unknown as { __pgPool?: Pool };

function createPool(): Pool {
  const env = getEnv();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
  // Without a listener an idle-client error would crash the process.
  pool.on("error", (error) => {
    console.error("[db] idle client error:", error.message);
  });
  // On Vercel, lets the function instance stay alive long enough to close idle connections.
  if (env.VERCEL) attachDatabasePool(pool);
  return pool;
}

export const pool = (globalForDb.__pgPool ??= createPool());
export const db = drizzle({ client: pool, schema });
export type Database = typeof db;
