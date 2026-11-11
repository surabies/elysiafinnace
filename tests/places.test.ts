import { beforeAll, describe, expect, test } from "bun:test";
import { api, authed, createUser, json } from "./helpers";

type Place = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  ownerId: string;
  createdAt: string;
};
type Nearby = Place & { distanceMeters: number };

let owner: Awaited<ReturnType<typeof createUser>>;
let stranger: Awaited<ReturnType<typeof createUser>>;

beforeAll(async () => {
  owner = await createUser("owner");
  stranger = await createUser("stranger");
});

async function create(
  user: { cookie: string },
  name: string,
  longitude: number,
  latitude: number,
) {
  const response = await api(
    "/api/places",
    authed(user.cookie, json({ name, longitude, latitude })),
  );
  return response;
}

async function createOk(user: { cookie: string }, name: string, lon: number, lat: number) {
  const response = await create(user, name, lon, lat);
  expect(response.status).toBe(201);
  return ((await response.json()) as { data: Place }).data;
}

describe("create", () => {
  test("returns 201 with the stored place", async () => {
    const response = await create(owner, "Eiffel Tower", 2.2945, 48.8584);
    expect(response.status).toBe(201);
    const { success, data } = (await response.json()) as { success: boolean; data: Place };
    expect(success).toBe(true);
    expect(data.name).toBe("Eiffel Tower");
    expect(data.longitude).toBeCloseTo(2.2945, 6);
    expect(data.latitude).toBeCloseTo(48.8584, 6);
    expect(data.ownerId).toBe(owner.userId);
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(data.createdAt).toString()).not.toBe("Invalid Date");
  });

  test("trims the name", async () => {
    const place = await createOk(owner, "  Padded Name  ", 10, 10);
    expect(place.name).toBe("Padded Name");
  });

  test.each([
    ["longitude below -180", { name: "x", longitude: -180.0001, latitude: 0 }],
    ["longitude above 180", { name: "x", longitude: 180.0001, latitude: 0 }],
    ["latitude below -90", { name: "x", longitude: 0, latitude: -90.0001 }],
    ["latitude above 90", { name: "x", longitude: 0, latitude: 90.0001 }],
    ["missing name", { longitude: 0, latitude: 0 }],
    ["empty name", { name: "", longitude: 0, latitude: 0 }],
    ["blank name", { name: "   ", longitude: 0, latitude: 0 }],
    ["name too long", { name: "n".repeat(121), longitude: 0, latitude: 0 }],
    ["string coordinates", { name: "x", longitude: "abc", latitude: 0 }],
  ])("rejects %s with 422", async (_label, body) => {
    const response = await api("/api/places", authed(owner.cookie, json(body)));
    expect(response.status).toBe(422);
    const payload = (await response.json()) as { success: boolean; error: { code: string } };
    expect(payload).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
  });

  test("accepts the exact coordinate limits", async () => {
    const a = await create(owner, "Limit corner A", 180, 90);
    const b = await create(owner, "Limit corner B", -180, -90);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
  });

  test("returns 409 for a duplicate name within the same owner only", async () => {
    await createOk(owner, "Duplicate name", 5, 5);
    const again = await create(owner, "Duplicate name", 6, 6);
    expect(again.status).toBe(409);
    expect(((await again.json()) as { error: { code: string } }).error.code).toBe("CONFLICT");

    const otherOwner = await create(stranger, "Duplicate name", 6, 6);
    expect(otherOwner.status).toBe(201);
  });
});

describe("list and get", () => {
  test("paginates with limit, offset and total", async () => {
    const tag = crypto.randomUUID().slice(0, 6);
    for (let i = 0; i < 3; i++) await createOk(owner, `page-${tag}-${i}`, 20 + i, 20);

    const first = await api("/api/places?limit=2&offset=0");
    expect(first.status).toBe(200);
    const page1 = (await first.json()) as {
      data: Place[];
      pagination: { limit: number; offset: number; total: number };
    };
    expect(page1.data).toHaveLength(2);
    expect(page1.pagination.limit).toBe(2);
    expect(page1.pagination.offset).toBe(0);
    expect(page1.pagination.total).toBeGreaterThanOrEqual(3);

    const second = await api("/api/places?limit=2&offset=2");
    const page2 = (await second.json()) as { data: Place[] };
    const ids1 = new Set(page1.data.map((p) => p.id));
    expect(page2.data.every((p) => !ids1.has(p.id))).toBe(true);

    // newest first
    const times = page1.data.map((p) => Date.parse(p.createdAt));
    expect(times[0]).toBeGreaterThanOrEqual(times[1] ?? 0);
  });

  test("rejects out-of-range pagination", async () => {
    expect((await api("/api/places?limit=0")).status).toBe(422);
    expect((await api("/api/places?limit=101")).status).toBe(422);
    expect((await api("/api/places?offset=-1")).status).toBe(422);
  });

  test("gets one place, 404 for unknown ids, 422 for malformed ids", async () => {
    const place = await createOk(owner, `get-${crypto.randomUUID().slice(0, 6)}`, 30, 30);
    const found = await api(`/api/places/${place.id}`);
    expect(found.status).toBe(200);
    expect(((await found.json()) as { data: Place }).data.id).toBe(place.id);

    const missing = await api("/api/places/00000000-0000-4000-8000-000000000000");
    expect(missing.status).toBe(404);

    const malformed = await api("/api/places/not-a-uuid");
    expect(malformed.status).toBe(422);
  });
});

describe("delete", () => {
  test("only the owner can delete (403 for others, 200 for the owner, then 404)", async () => {
    const place = await createOk(owner, `del-${crypto.randomUUID().slice(0, 6)}`, 40, 40);

    const forbidden = await api(`/api/places/${place.id}`, authed(stranger.cookie, { method: "DELETE" }));
    expect(forbidden.status).toBe(403);
    expect(((await forbidden.json()) as { error: { code: string } }).error.code).toBe("FORBIDDEN");
    expect((await api(`/api/places/${place.id}`)).status).toBe(200);

    const deleted = await api(`/api/places/${place.id}`, authed(owner.cookie, { method: "DELETE" }));
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ success: true, data: { id: place.id } });

    expect((await api(`/api/places/${place.id}`)).status).toBe(404);
    const again = await api(`/api/places/${place.id}`, authed(owner.cookie, { method: "DELETE" }));
    expect(again.status).toBe(404);
  });
});

describe("nearby search (PostGIS)", () => {
  // Real distances on the WGS 84 ellipsoid, independent of the code under test.
  // One degree of longitude on the equator is a * pi / 180 metres, with a = 6_378_137.
  const metresPerDegreeAtEquator = (6_378_137 * Math.PI) / 180; // 111_319.4908 m

  async function nearby(query: string) {
    const response = await api(`/api/places/nearby?${query}`);
    return { response, body: (await response.json()) as { data: Nearby[] } };
  }

  test("finds places inside the radius, nearest first, with metre distances", async () => {
    const tag = crypto.randomUUID().slice(0, 6);
    // all on the equator at lon ~ 100 so expected distances are exact
    const baseLon = 100;
    const offsets = [0.003, 0.001, 0.002]; // degrees east of the origin
    for (const offset of offsets) {
      await createOk(owner, `eq-${tag}-${offset}`, baseLon + offset, 0);
    }
    await createOk(owner, `eq-${tag}-far`, baseLon + 1, 0); // ~111 km away

    const { response, body } = await nearby(`lon=${baseLon}&lat=0&radius=500`);
    expect(response.status).toBe(200);
    const mine = body.data.filter((p) => p.name.startsWith(`eq-${tag}`));
    expect(mine.map((p) => p.name.slice(`eq-${tag}-`.length))).toEqual(["0.001", "0.002", "0.003"]);
    mine.forEach((place, index) => {
      const expected = [0.001, 0.002, 0.003][index]! * metresPerDegreeAtEquator;
      expect(place.distanceMeters).toBeCloseTo(expected, 0); // within 0.5 m
    });
    expect(mine.find((p) => p.name.endsWith("far"))).toBeUndefined();
  });

  test("radius boundary: a place at 111.319 m is in for 111.32 m and out for 111.31 m", async () => {
    const lon = 120;
    await createOk(owner, `edge-${crypto.randomUUID().slice(0, 6)}`, lon + 0.001, 0);

    const inside = await nearby(`lon=${lon}&lat=0&radius=111.32`);
    expect(inside.body.data.length).toBe(1);

    const outside = await nearby(`lon=${lon}&lat=0&radius=111.31`);
    expect(outside.body.data.length).toBe(0);
  });

  test("matches a known real-world distance (Eiffel Tower to Louvre is about 3.2 km)", async () => {
    const tag = crypto.randomUUID().slice(0, 6);
    await createOk(owner, `louvre-${tag}`, 2.3376, 48.8606);
    const { body } = await nearby("lon=2.2945&lat=48.8584&radius=5000&limit=100");
    const louvre = body.data.find((p) => p.name === `louvre-${tag}`);
    expect(louvre).toBeDefined();
    expect(louvre!.distanceMeters).toBeGreaterThan(3150);
    expect(louvre!.distanceMeters).toBeLessThan(3250);
  });

  test("works across the antimeridian", async () => {
    const tag = crypto.randomUUID().slice(0, 6);
    await createOk(owner, `anti-${tag}`, -179.9995, 0);
    const { body } = await nearby("lon=179.9995&lat=0&radius=200");
    const hit = body.data.find((p) => p.name === `anti-${tag}`);
    expect(hit).toBeDefined();
    expect(hit!.distanceMeters).toBeCloseTo(metresPerDegreeAtEquator * 0.001, 0);
  });

  test("respects limit and defaults the radius", async () => {
    const lon = 130;
    const tag = crypto.randomUUID().slice(0, 6);
    for (let i = 1; i <= 3; i++) await createOk(owner, `lim-${tag}-${i}`, lon + i * 0.0001, 0);
    const limited = await nearby(`lon=${lon}&lat=0&radius=1000&limit=2`);
    expect(limited.body.data).toHaveLength(2);
    const defaulted = (await (await api(`/api/places/nearby?lon=${lon}&lat=0`)).json()) as {
      query: { radiusMeters: number };
    };
    expect(defaulted.query.radiusMeters).toBe(1000);
  });

  test.each([
    ["missing lon", "lat=0&radius=100"],
    ["missing lat", "lon=0&radius=100"],
    ["lon out of range", "lon=181&lat=0&radius=100"],
    ["lat out of range", "lon=0&lat=-91&radius=100"],
    ["radius zero", "lon=0&lat=0&radius=0"],
    ["radius above the limit", "lon=0&lat=0&radius=50001"],
    ["non-numeric lon", "lon=abc&lat=0&radius=100"],
  ])("rejects %s with 422", async (_label, query) => {
    const response = await api(`/api/places/nearby?${query}`);
    expect(response.status).toBe(422);
  });

  test("accepts the maximum radius", async () => {
    const response = await api("/api/places/nearby?lon=0&lat=0&radius=50000");
    expect(response.status).toBe(200);
  });
});
