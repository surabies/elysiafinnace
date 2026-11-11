# Decisions

Every non-obvious choice, why it was made, and what was observed. Newest decisions are not
reordered: IDs are stable and referenced from code comments (for example `D-006`).

Context for all entries: the project was built from a fresh `create-next-app` scaffold (Next.js 16.4.5)
because no existing workspace was available. See "Baseline" in [FEATURES.md](./FEATURES.md).

---

## D-001. One Next.js app, Elysia mounted as a catch-all Route Handler

- **Decision:** a single Next.js (App Router) project and a single Vercel project. Elysia lives in
  `src/server/app.ts` with `prefix: "/api"` and is served by `src/app/api/[[...slugs]]/route.ts`,
  which exports `GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS` backed by `app.fetch`. The app type is
  exported (`export type App`) for Eden.
- **Not done:** no standalone `src/index.ts` entry, no `app.listen()`, no Elysia-only `vercel.json`.
- **Why:** this is the default in the master prompt and nothing contradicted it: the UI and API share
  one origin (no CORS, cookies just work), and one deployment is simpler to operate.

## D-002. Better Auth has its own, more specific route

- **Decision:** `src/app/api/auth/[...all]/route.ts` uses `toNextJsHandler(auth)`.
- **Verified:** on the production server `GET /api/auth/ok` returns `{"ok":true}` and
  `GET /api/auth/get-session` returns `null`, i.e. the specific route wins over the Elysia catch-all
  (`e2e/api-runtime.spec.ts`). Unknown paths such as `/api/nope` still reach Elysia and return its JSON 404.

## D-003. Vercel runtime: Node.js (default). Bun is for local tooling only. No `vercel.json`.

- **Decision:** deploy on Vercel's default Node.js runtime; do not set `bunVersion`; do not create `vercel.json`.
- **Why:** Vercel's own documentation (checked while building this) says Next.js can run on the Bun
  runtime via `"bunVersion"` in `vercel.json` plus `bun --bun next ...` scripts, but the Bun runtime is
  in beta. This project showed runtime-sensitive behaviour twice (D-007, D-008), and everything here was
  verified on Node.js 22 under `next start`. Staying on Node keeps production identical to what was tested.
- **To switch later:** add `{ "bunVersion": "1.x" }` to `vercel.json`, change the `dev`/`build` scripts
  to `bun --bun next ...`, and re-run `bun run test:e2e` before trusting it.
- **No `vercel.json` needed:** nothing in it is required for framework detection, builds or routes. Add one only
  to pin a function region (see README, "Function region").

## D-004. Database driver: `pg` (node-postgres) with a per-instance pool

- **Decision:** `drizzle-orm/node-postgres` with one `Pool` per runtime instance (`src/db/index.ts`),
  `max` from `DATABASE_POOL_MAX` (default 5), TLS and pooling controlled by the connection string.
- **Why:** Vercel Functions run on Node.js with Fluid compute, which reuses an instance across concurrent
  requests, so a small TCP pool works. It also works unchanged against local Docker, any hosted PostGIS provider and
  the test database. `attachDatabasePool` from `@vercel/functions` is called only when `VERCEL` is set so idle
  connections are released when an instance is suspended.
- **Trade-off:** HTTP/WebSocket-only drivers (for example Neon's serverless driver) avoid TCP but do not
  work against a local Postgres, so they were not chosen.

## D-005. Language

- Code, comments, API messages, UI copy and documentation are in English, matching the master prompt.
  Strings are plain literals, so translating the UI later is mechanical.

## D-006. Spatial column: `geometry(Point,4326)` via a custom type, GiST index on the geography cast

- **Observed problem:** Drizzle's built-in `geometry()` column (drizzle-orm 0.45.4) always emits
  `geometry(point)` and ignores its `srid` option, so the database would not enforce SRID 4326.
- **Decision:** `src/db/types.ts` defines `wgs84Point`, a `customType` whose SQL type is
  `geometry(Point,4326)`. It writes with `ST_SetSRID(ST_MakePoint(lon, lat), 4326)` and reads hex EWKB
  with a small, unit-tested parser (`parseEwkbPoint`). The value shape is `{ longitude, latitude }`
  (PostGIS order is x = longitude, y = latitude).
- **geometry vs geography:** the column is geometry (compact, works with all PostGIS functions), but every
  distance query casts to `geography` so radii and distances are real metres on the WGS 84 ellipsoid.
  The GiST index is therefore built on the **same expression**: `USING gist ((location::geography))`.
  An index on the bare geometry column would not be used by those queries.
- **Evidence:** the database rejects an insert with another SRID (`tests/db.test.ts`); distances match the
  ellipsoid formula to within 0.5 m (`tests/places.test.ts`); `EXPLAIN` on 20,000 rows shows
  `places_location_gist_idx` and no sequential scan (`tests/db.test.ts`).

## D-007. `elysia` is excluded from the Turbopack bundle (`serverExternalPackages`)

- **Observed problem (real, found by manual HTTP checks, not by `bun test`):** with Elysia bundled into the
  production build, `GET /api/places/nearby?lon=999&lat=1` returned **200** and `limit=999` was accepted:
  the range limits of `t.Numeric({ minimum, maximum })` were silently not enforced. The same code returned
  422 under Bun, under plain Node, and in `bun test`.
- **Decision:** `next.config.ts` sets `serverExternalPackages: ["elysia"]`, so Elysia loads from
  `node_modules` like in plain Node. After the change the production server returns 422 for all the
  out-of-range cases.
- **Root cause:** not isolated. Plain Node with the same Elysia and TypeBox versions behaves correctly, so
  the difference comes from bundling. Treat this as a version-sensitive area: `e2e/api-runtime.spec.ts`
  ("query validation enforces numeric ranges") exists to catch a regression after upgrading Next.js, Elysia or Turbopack.

## D-008. `DELETE /api/places/:id` returns 200 with JSON, not 204

- **Observed problem:** a handler that returned 204 (via `set.status = 204`, `status(204)` or
  `new Response(null, { status: 204 })`) worked under Bun, plain Node and `next dev`, but returned **500**
  under `next start` with `Response constructor: Invalid response status code 204`. A 204 from a plain Next route
  and the 204 preflight response from `@elysiajs/cors` both work in the same production server.
- **Decision:** the endpoint returns `200 { "success": true, "data": { "id": "<id>" } }`.
- **Root cause:** not isolated; the stack only showed Next.js internals. The HTTP semantics are equivalent for
  clients and the response now carries a confirmation body. 204 remains in the allowed status list for other uses;
  verify any new 204 handler with `bun run test:e2e`.

## D-009. Security headers: a safe baseline, not a script CSP

- **Decision:** `next.config.ts` sends `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy` (geolocation allowed for same origin, used by "Use my location"),
  `Strict-Transport-Security`, and a CSP limited to `frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  object-src 'none'`. `X-Powered-By` is disabled.
- **Why not more:** a CSP that restricts `script-src` needs per-request nonces and would force every page to
  render dynamically. That trade-off is the owner's call; it is listed under Recommendations in the README.

## D-010. Rate limiting without extra infrastructure

- **Auth endpoints:** Better Auth's built-in limiter, enabled in production, `storage: "database"` (table
  `rate_limit`, so counters are shared by all serverless instances). Verified on the production server:
  the 4th sign-in attempt within the window from one IP returns 429 with `x-retry-after`; another IP is unaffected.
  It is disabled in development and tests by default.
- **Write endpoints on the Elysia API:** a fixed-window limiter in `onRequest` for POST/PUT/PATCH/DELETE,
  `WRITE_RATE_LIMIT_MAX` per minute per client IP (default 30). It runs before validation and auth, so
  anonymous floods are counted too. This was found by a test: the first version used a route macro that ran
  after the auth check and therefore never counted unauthenticated requests.
- **Limitation:** its counters are in memory, so on serverless the limit is per instance. Use a shared store or
  Vercel's WAF rate limiting for a hard global limit. Client IP comes from `x-vercel-forwarded-for`, then
  `x-real-ip`, then `x-forwarded-for` (the first two are set by the platform).

## D-011. Cache Components stay enabled; sessions are read behind Suspense

- **Decision:** keep the scaffold defaults `cacheComponents: true` and `partialPrefetching: true`.
  Route Handlers call `await connection()` so GET endpoints are never prerendered at build time.
  Pages that need the session (`/dashboard`) read it inside `<Suspense>`.
- **Layered protection:** `src/proxy.ts` (Next 16's replacement for `middleware.ts`) only checks that a session
  cookie exists, to redirect signed-out visitors early. The real check is `requireSession()` in
  `src/lib/session.ts`, called in the dashboard layout and page, plus the Elysia `auth` macro for the API.
- **Observed:** with a forged cookie `/dashboard` returns HTTP 200 (the shell is already streaming) but renders none
  of the protected content and redirects the browser to `/sign-in`.
- **Header session:** the navigation uses `authClient.useSession()` on the client so the static shell is not made
  dynamic by a server session read.

## D-012. Two Eden Treaty clients

- `src/lib/api-client.ts` (browser, `import type { App }` only) and `src/lib/api-server.ts`
  (`server-only`, calls the Elysia app in-process). One isomorphic file would import the server app into the
  browser bundle (and with it `pg`).

## D-013. Validation: TypeBox on the API, zod for env and forms, shared limits

- Elysia routes use TypeBox (`t`) as the master prompt asks. Environment variables and browser forms use zod.
  `src/lib/validation.ts` holds the shared numeric limits (`LIMITS`) used by both sides, so they cannot drift.

## D-014. No seed script

- The master prompt asks for `db:seed` only if needed. Nothing needs seed data (places belong to users and
  tests create their own data), so there is no `db:seed`.

## D-015. `GET /` is the UI; `GET /api` returns name and version

- The prompt describes both a UI home page at `/` and a JSON "Elysia API is running" message "at the root".
  These conflict, so `/` is the UI and `GET /api` returns exactly
  `{ "success": true, "name": "Elysia Backend API", "version": "1.0.0" }`, as the endpoint list specifies.
  The "is running" message is not exposed anywhere. No unprefixed `/health` exists (not required).

## D-016. Fonts are self-hosted from npm (`@fontsource-variable/*`)

- The scaffold's `next/font/google` could not download fonts in the build environment, so the baseline
  `next build` failed. Self-hosted fonts make builds independent of Google, and avoid the external request at runtime.

## D-017. Light theme only

- The scaffold's dark mode was a bare media query with no designed dark palette. Shipping a half-themed dark mode
  would be worse than none, and the prompt asks for theming only on request. `dark:` utilities from shadcn only
  apply under an explicit `.dark` class, which the app never sets.

## D-018. Better Auth CLI is the `auth` package

- `@better-auth/cli` (1.4.x) lags `better-auth` 1.7.x, and the current documentation uses the `auth` CLI.
  `bun run auth:generate` runs `auth generate --config src/lib/auth.ts --output src/db/schema/auth.ts`.
  `src/db/schema/auth.ts` is generated by it (including the `rate_limit` table) and must not be edited by hand.

## D-019. Unique place name per owner

- `UNIQUE (owner_id, name)` gives the centralized 409 handling a real case (and prevents accidental double
  submits). Different owners can use the same name. Postgres `23505` and `23503` map to 409 (also when
  wrapped by Drizzle's query error).

## D-020. Pagination is `limit` / `offset`

- `GET /api/places?limit=&offset=` (limit 1 to 100, default 20), newest first, with `pagination.total`.
  Simple and predictable for this dataset size; switch to keyset pagination if the table grows large.

## D-021. Test strategy

- `bun test ./tests` runs unit and integration tests against a **fresh** database (`app_test`) that the
  preload script drops, recreates and migrates on every run. `playwright test` runs against the production build
  (`next build` + `next start`), because two real defects (D-007, D-008) only appeared there.
- Tests are restricted to `./tests` because `bun test` would otherwise pick up `e2e/*.spec.ts`.

## D-022. `extensionsFilters: ["postgis"]`

- Set in `drizzle.config.ts` so `drizzle-kit push`/`pull` never touch `spatial_ref_sys` and friends. It does not
  apply to `generate`, which diffs schema files against the previous snapshot; the generated migrations contain no
  PostGIS system objects (asserted in `tests/db.test.ts`). `push` is not used for any non-local database.
