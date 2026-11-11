import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { places, type PlaceRow } from "@/db/schema";
import { ApiError } from "../../errors";

export type PlaceDto = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  ownerId: string;
  createdAt: string;
};

export type NearbyPlaceDto = PlaceDto & { distanceMeters: number };

function toDto(row: PlaceRow): PlaceDto {
  return {
    id: row.id,
    name: row.name,
    longitude: row.location.longitude,
    latitude: row.location.latitude,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createPlace(
  ownerId: string,
  input: { name: string; longitude: number; latitude: number },
): Promise<PlaceDto> {
  const [row] = await db
    .insert(places)
    .values({
      name: input.name,
      ownerId,
      location: { longitude: input.longitude, latitude: input.latitude },
    })
    .returning();
  if (!row) throw new Error("Insert returned no row");
  return toDto(row);
}

export async function listPlaces(limit: number, offset: number) {
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(places)
      .orderBy(desc(places.createdAt), desc(places.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(places),
  ]);
  return {
    items: rows.map(toDto),
    total: totals[0]?.total ?? 0,
  };
}

export async function getPlace(id: string): Promise<PlaceDto> {
  const [row] = await db.select().from(places).where(eq(places.id, id)).limit(1);
  if (!row) throw new ApiError(404, "NOT_FOUND", "Place not found");
  return toDto(row);
}

export async function deletePlace(id: string, requesterId: string): Promise<void> {
  const [row] = await db
    .select({ id: places.id, ownerId: places.ownerId })
    .from(places)
    .where(eq(places.id, id))
    .limit(1);
  if (!row) throw new ApiError(404, "NOT_FOUND", "Place not found");
  if (row.ownerId !== requesterId) {
    throw new ApiError(403, "FORBIDDEN", "Only the owner can delete this place");
  }
  // Re-check ownership in the statement itself so a concurrent change cannot slip through.
  const deleted = await db
    .delete(places)
    .where(and(eq(places.id, id), eq(places.ownerId, requesterId)))
    .returning({ id: places.id });
  if (deleted.length === 0) throw new ApiError(404, "NOT_FOUND", "Place not found");
}

/**
 * Proximity search. All user input goes through bound parameters (Drizzle `sql`
 * templates), never string concatenation.
 *
 * ST_DWithin on geography takes METRES and can use the GiST index on
 * (location::geography). Results are ordered by exact spheroidal distance.
 */
export function buildNearbyQuery(params: {
  longitude: number;
  latitude: number;
  radiusMeters: number;
  limit: number;
}) {
  const origin = sql`ST_SetSRID(ST_MakePoint(${params.longitude}::double precision, ${params.latitude}::double precision), 4326)::geography`;
  const distance = sql<number>`ST_Distance(${places.location}::geography, ${origin})`.mapWith(Number);
  return db
    .select({ place: places, distanceMeters: distance })
    .from(places)
    .where(
      sql`ST_DWithin(${places.location}::geography, ${origin}, ${params.radiusMeters}::double precision)`,
    )
    .orderBy(distance, places.id)
    .limit(params.limit);
}

export async function findNearby(params: {
  longitude: number;
  latitude: number;
  radiusMeters: number;
  limit: number;
}): Promise<NearbyPlaceDto[]> {
  const rows = await buildNearbyQuery(params);
  return rows.map(({ place, distanceMeters }) => ({
    ...toDto(place),
    distanceMeters: Math.round(distanceMeters * 100) / 100,
  }));
}
