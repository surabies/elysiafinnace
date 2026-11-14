import { sql } from "drizzle-orm";
import { db } from "../shared/context";

export async function cekKesehatanSistem() {
  const t0 = performance.now();
  let dbStatus = "HEALTHY";
  let dbError: string | null = null;
  let latensiDbMs = 0;

  try {
    const res = await db.execute(sql`SELECT 1 as ping`);
    latensiDbMs = Math.round((performance.now() - t0) * 100) / 100;
    if (!res) dbStatus = "DEGRADED";
  } catch (err: unknown) {
    dbStatus = "UNHEALTHY";
    const errObj = err as { message?: string };
    dbError = errObj?.message ?? String(err);
  }

  const mem = process.memoryUsage();

  return {
    status: dbStatus === "HEALTHY" ? "OK" : "DEGRADED",
    waktu: new Date().toISOString(),
    uptimeDetik: Math.round(process.uptime()),
    database: {
      status: dbStatus,
      latensiMs: latensiDbMs,
      error: dbError,
    },
    memori: {
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    },
    lingkungan: process.env.NODE_ENV || "development",
  };
}
