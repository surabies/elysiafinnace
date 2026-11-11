import { Elysia, t } from "elysia";
import { LIMITS } from "@/lib/validation";
import { authPlugin } from "../../plugins/auth";
import { ApiError } from "../../errors";
import {
  createPlace,
  deletePlace,
  findNearby,
  getPlace,
  listPlaces,
} from "./service";

const longitude = t.Numeric({ minimum: LIMITS.lonMin, maximum: LIMITS.lonMax });
const latitude = t.Numeric({ minimum: LIMITS.latMin, maximum: LIMITS.latMax });
const idParams = t.Object({ id: t.String({ format: "uuid" }) });

export const placesModule = new Elysia({ prefix: "/places" })
  .use(authPlugin)
  .get(
    "/",
    async ({ query }) => {
      const limit = query.limit ?? LIMITS.pageSizeDefault;
      const offset = query.offset ?? 0;
      const { items, total } = await listPlaces(limit, offset);
      return {
        success: true as const,
        data: items,
        pagination: { limit, offset, total },
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: LIMITS.pageSizeMax })),
        offset: t.Optional(t.Numeric({ minimum: 0 })),
      }),
    },
  )
  // Declared before "/:id" so "nearby" is never read as an id.
  .get(
    "/nearby",
    async ({ query }) => {
      const radiusMeters = query.radius ?? LIMITS.radiusDefaultMeters;
      const data = await findNearby({
        longitude: query.lon,
        latitude: query.lat,
        radiusMeters,
        limit: query.limit ?? LIMITS.nearbyLimitDefault,
      });
      return {
        success: true as const,
        data,
        query: { longitude: query.lon, latitude: query.lat, radiusMeters },
      };
    },
    {
      query: t.Object({
        lon: longitude,
        lat: latitude,
        radius: t.Optional(
          t.Numeric({ minimum: LIMITS.radiusMinMeters, maximum: LIMITS.radiusMaxMeters }),
        ),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: LIMITS.pageSizeMax })),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params }) => ({ success: true as const, data: await getPlace(params.id) }),
    { params: idParams },
  )
  .post(
    "/",
    async ({ body, user, set }) => {
      const name = body.name.trim();
      if (name.length === 0) {
        throw new ApiError(422, "VALIDATION_ERROR", "Request validation failed", [
          { path: "/name", message: "Name must not be blank" },
        ]);
      }
      const data = await createPlace(user.id, {
        name,
        longitude: body.longitude,
        latitude: body.latitude,
      });
      set.status = 201;
      return { success: true as const, data };
    },
    {
      auth: true,
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: LIMITS.placeNameMax }),
        longitude,
        latitude,
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, user }) => {
      await deletePlace(params.id, user.id);
      // 200 + JSON instead of 204: a 204 from Elysia fails under the Next.js production
      // runtime (see docs/DECISIONS.md, D-008), and clients get a confirmation body.
      return { success: true as const, data: { id: params.id } };
    },
    { auth: true, params: idParams },
  );
