import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

export type LonLat = { longitude: number; latitude: number };

/**
 * Parses the hex-encoded EWKB that PostgreSQL returns for a geometry Point.
 * Layout: byte order (1) | type (4, 0x20000000 flag = SRID present) | [SRID (4)] | X (8) | Y (8)
 */
export function parseEwkbPoint(hex: string): LonLat {
  const buffer = Buffer.from(hex, "hex");
  const littleEndian = buffer.readUInt8(0) === 1;
  const type = littleEndian ? buffer.readUInt32LE(1) : buffer.readUInt32BE(1);
  if ((type & 0xff) !== 1) {
    throw new Error("Expected a PostGIS Point geometry");
  }
  const hasSrid = (type & 0x20000000) !== 0;
  const offset = hasSrid ? 9 : 5;
  const x = littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset);
  const y = littleEndian ? buffer.readDoubleLE(offset + 8) : buffer.readDoubleBE(offset + 8);
  return { longitude: x, latitude: y };
}

/**
 * `geometry(Point,4326)` column.
 *
 * Drizzle's built-in `geometry()` always emits `geometry(point)` and ignores the
 * `srid` option, so the SRID would not be enforced by the database. This custom
 * type emits the full typmod and writes values with ST_SetSRID(ST_MakePoint(lon, lat), 4326).
 * Value shape: { longitude, latitude } (PostGIS order is x = longitude, y = latitude).
 */
export const wgs84Point = customType<{ data: LonLat; driverData: string }>({
  dataType() {
    return "geometry(Point,4326)";
  },
  toDriver(value) {
    return sql`ST_SetSRID(ST_MakePoint(${value.longitude}, ${value.latitude}), 4326)`;
  },
  fromDriver(value) {
    return parseEwkbPoint(value);
  },
});
