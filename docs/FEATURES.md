# Feature inventory and traceability

Status values: `done` (evidence recorded), `blocked` (reason and what the owner must do), `in-progress`, `todo`.
A row is `done` only with real results in the Evidence column. Nothing is deleted from this file.

## Baseline (before any change)

No existing workspace was visible to the agent, so the baseline is the `create-next-app` scaffold that was
generated for this project (Next.js 16.4.5, React 19.3, Tailwind 4, ESLint, Bun).

| Check | Result |
| --- | --- |
| Install (`bun install`) | passes |
| Typecheck (`tsc --noEmit`) | passes |
| Lint (`eslint`) | passes |
| Tests | none existed |
| Build (`next build`) | **failed** in the build environment: `next/font/google` could not download Geist (no access to fonts.googleapis.com). An environment limit, not a code defect; resolved by D-016 (self-hosted fonts). |

## A. Existing features (the scaffold)

| ID | Feature | Where | Status | Evidence |
| --- | --- | --- | --- | --- |
| EX-001 | Default home page | `src/app/page.tsx` | done (replaced) | Replaced by the product home page; `e2e/ui-smoke.spec.ts` "home page renders the hero". |
| EX-002 | Root layout with Geist from Google Fonts | `src/app/layout.tsx` | done (changed) | Layout kept, fonts self-hosted (D-016); production build passes. |
| EX-003 | Tailwind CSS v4 pipeline (`@tailwindcss/turbopack` loader, `globals.css`) | `next.config.ts`, `src/app/globals.css` | done (preserved) | Loader rule kept in `next.config.ts`; build and screenshots checked. |
| EX-004 | ESLint flat config (`eslint-config-next`) | `eslint.config.mjs` | done (preserved) | `bun run lint` exit 0. |
| EX-005 | TypeScript strict, `@/*` alias | `tsconfig.json` | done (extended) | `strict` still on; `noUncheckedIndexedAccess` added; `tsc --noEmit` exit 0. |
| EX-006 | Cache Components and partial prefetching enabled | `next.config.ts` | done (preserved) | Kept (D-011); build output shows `◐ /dashboard` partial prerender. |
| EX-007 | `AGENTS.md` (Next.js agent notes) | `AGENTS.md` | done (preserved) | Untouched. |
| EX-008 | Default favicon | `src/app/favicon.ico` | done (preserved) | Untouched. |
| EX-009 | Sample SVGs in `public/` | `public/*.svg` | done (removed) | Unused by any file (grep found no reference), removed. |

## B. Required features

### Stack, structure, tooling

| ID | Requirement | Files | Status | Evidence |
| --- | --- | --- | --- | --- |
| RQ-001 | Next.js App Router + TypeScript strict | `tsconfig.json`, `src/app` | done | `tsc --noEmit` exit 0; `next build` passes (Next.js 16.4.5). |
| RQ-002 | Bun as package manager / local runtime | `bun.lock`, `package.json`, `bunfig.toml` | done | Bun 1.4.4 installs, runs scripts and tests. |
| RQ-003 | Scripts: dev, build, start, lint, typecheck, test, db:generate, db:migrate, db:studio, auth:generate | `package.json` | done | Each exercised except `db:studio` (needs a browser UI; config is plain `drizzle-kit studio`). `db:seed` intentionally absent (D-014). Also `test:e2e`. |
| RQ-004 | Elysia mounted in Next.js, prefix `/api`, app type exported | `src/server/app.ts`, `src/app/api/[[...slugs]]/route.ts` | done | Production server answers `/api`, `/api/health`, etc. (`e2e/api-runtime.spec.ts`). |
| RQ-005 | No `app.listen()`, no standalone entry | repository | done | The only `listen(` in `src` is a comment saying not to call it (`grep -rn "listen(" src`). |
| RQ-006 | Architecture decision recorded | `docs/DECISIONS.md` | done | D-001 to D-022. |
| RQ-007 | Feature inventory + baseline | this file | done | This file. |
| RQ-008 | Modular structure (modules, plugins, db, lib) | `src/server`, `src/db`, `src/lib` | done | See README "Project structure". |
| RQ-009 | Eden Treaty client for end-to-end types | `src/lib/api-client.ts`, `src/lib/api-server.ts` | done | Browser components call the API through it; typecheck verifies route types; e2e UI flow passes. |

### Database and PostGIS

| ID | Requirement | Files | Status | Evidence |
| --- | --- | --- | --- | --- |
| RQ-010 | Local PostGIS via Docker Compose | `docker-compose.yml` | blocked | Docker is not available in the build environment. YAML syntax validated; the same Postgres 16 + PostGIS 3.4 combination (`postgis/postgis:16-3.4`) was tested natively. **Owner:** run `docker compose up -d db` once and confirm `bun run db:migrate` works. |
| RQ-011 | `.env.example` with placeholders and `DATABASE_URL` format | `.env.example` | done | Complete list of variables; real env files are git-ignored (`git check-ignore .env` matches, `.env.example` is tracked). |
| RQ-012 | Drizzle config (postgresql, schema, out, creds from env) | `drizzle.config.ts` | done | `db:generate` and `db:migrate` run; `db:generate` reports "No schema changes". |
| RQ-013 | drizzle-kit does not manage PostGIS tables | `drizzle.config.ts` | done | `extensionsFilters: ["postgis"]` (D-022); test asserts migrations never mention `spatial_ref_sys`, `geometry_columns`, `geography_columns`. |
| RQ-014 | Driver suited to Vercel, choice explained | `src/db/index.ts` | done | D-004; singleton pool, `attachDatabasePool` on Vercel. |
| RQ-015 | First migration enables PostGIS before geometry migrations | `src/db/migrations/0000_enable_postgis.sql` | done | Test "enabled by a migration that runs before any geometry column"; migrations applied to a fresh database in every test run and to a second new database in `tests/db.test.ts`. |
| RQ-016 | SRID 4326 spatial column, deliberate type choice | `src/db/types.ts`, `src/db/schema/geo.ts` | done | D-006; `geometry_columns` shows `POINT`/4326; inserting SRID 3857 is rejected by the database. |
| RQ-017 | GiST index on the spatial column | `src/db/schema/geo.ts` | done | Index `places_location_gist_idx` exists; `EXPLAIN` on 20,000 rows uses it, no sequential scan (`tests/db.test.ts`). |
| RQ-018 | Places module: create, list, get, delete, nearby (`ST_DWithin`, ordered by distance), parameterized SQL | `src/server/modules/places` | done | `tests/places.test.ts`; e2e lifecycle on the production server. |
| RQ-019 | Coordinate and radius validation at the API boundary | `src/server/modules/places/index.ts`, `src/lib/validation.ts` | done | lon/lat limits, radius 1 to 50,000 m, tests for each boundary; production server returns 422 for out-of-range values (D-007). |
| RQ-020 | Migrations: generate + migrate, SQL reviewed, applied locally, production process documented | `src/db/migrations`, README | done | Both migration files read before applying; applied to the local database; production steps in README. Nothing was run against a remote database. |
| RQ-021 | Serverless connection management | `src/db/index.ts` | done | Module-level pool, bounded `max`, idle error listener, README notes on pooled URLs. |
| RQ-022 | Hosted PostGIS provider confirmed | README | blocked | Provider not chosen by the owner. Neon documents `CREATE EXTENSION IF NOT EXISTS postgis` support (checked in its docs). **Owner:** pick a provider, create the database, confirm `select * from pg_available_extensions where name = 'postgis'` returns a row, set `DATABASE_URL`. |

### Authentication

| ID | Requirement | Files | Status | Evidence |
| --- | --- | --- | --- | --- |
| RQ-023 | Better Auth server + client, Drizzle adapter (`pg`) | `src/lib/auth.ts`, `src/lib/auth-client.ts` | done | Sign-up/in/out flows pass in `tests/auth.test.ts` and e2e. |
| RQ-024 | Auth schema generated by the Better Auth CLI, migration reviewed | `src/db/schema/auth.ts`, `0001_init_auth_and_places.sql` | done | Generated with `auth generate` (D-018); tables user, session, account, verification, rate_limit. |
| RQ-025 | Email + password (sign-up, sign-in, sign-out, session) | `src/lib/auth.ts`, UI forms | done | `tests/auth.test.ts` (duplicate email, short password, wrong password, get-session, sign-out invalidation); e2e. |
| RQ-026 | Handler mounted in Next.js; cookies plugin | `src/app/api/auth/[...all]/route.ts` | done | `nextCookies()` last in plugins; precedence verified on the production server (D-002). |
| RQ-027 | UI route protection (proxy + server-side validation) | `src/proxy.ts`, `src/lib/session.ts`, `src/app/dashboard` | done | Signed-out `/dashboard` redirects to `/sign-in?next=%2Fdashboard`; forged cookie renders no protected content (D-011); e2e. |
| RQ-028 | API auth macro returning 401 | `src/server/plugins/auth.ts` | done | 401 without cookie and with a forged cookie; protected endpoints tested. |
| RQ-029 | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `trustedOrigins`, secure cookies, Vercel preview URLs | `src/lib/env.ts`, `src/lib/auth.ts` | done | `tests/env-and-utils.test.ts` covers production requirement and preview URL derivation; README documents preview handling. Behaviour on a real Vercel preview is unverified (see RQ-056). |
| RQ-030 | Passwords, tokens and secrets are never logged | all | done | Project code never logs passwords, cookies, headers, tokens or env values; env errors name variables only (tested). The only logging is `console.error` of unexpected errors, which for a failed Drizzle query includes the SQL and its bound parameters (for example a place name), never credentials. |
| RQ-031 | Other auth providers only on request | n/a | done | None added; listed under Recommendations. |

### API

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| RQ-032 | `GET /api` returns name and version | done | `tests/api-core.test.ts`; e2e. |
| RQ-033 | `GET /api/health` | done | Same. |
| RQ-034 | `POST /api/echo` validated, safe errors | done | 5 invalid-body cases return 422 without echoing values; malformed JSON is rejected. |
| RQ-035 | `GET /api/me` (401 when signed out) | done | `tests/auth.test.ts`. |
| RQ-036 | `POST /api/places` (protected), `GET /api/places` (paginated), `GET /api/places/:id`, `DELETE /api/places/:id` (owner only), `GET /api/places/nearby` | done | `tests/places.test.ts`; delete returns 200 JSON instead of 204 (D-008). |
| RQ-037 | Correct status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 500) | done | 200, 201, 400 (malformed JSON), 401, 403, 404, 409, 422, 429, 500 exercised. 204 is produced only by the CORS preflight (D-008). |
| RQ-038 | `GET /` is the UI home page, no conflict with the API | done | D-015; e2e home page test. |
| RQ-039 | Endpoint documentation with examples | done | README "API reference". |

### Security and error handling

| ID | Requirement | Files | Status | Evidence |
| --- | --- | --- | --- | --- |
| RQ-040 | Centralized error handler, no internals leaked | `src/server/plugins/error-handler.ts` | done | Test throws an error containing a connection string and asserts the production-mode response has neither it nor stack frames; unique violation maps to 409. |
| RQ-041 | Input validation (body, query, params) | routes | done | TypeBox schemas on every route; invalid uuid returns 422. |
| RQ-042 | CORS same-origin by default, explicit allowlist from env, no wildcard | `src/server/plugins/cors.ts` | done | Verified on the production server with `ALLOWED_ORIGINS=https://a.example`: allowed origin gets `access-control-allow-origin`, other origin gets none; `*` is rejected by env validation (tested). |
| RQ-043 | Security headers | `next.config.ts` | done | Asserted by `e2e/api-runtime.spec.ts` (D-009). |
| RQ-044 | Env validated at startup, server vs public separation | `src/lib/env.ts`, `src/instrumentation.ts` | done | 7 tests; no `NEXT_PUBLIC_` variables exist. |
| RQ-045 | No hardcoded secrets; `.env*` ignored | `.gitignore`, `.env.example` | done | `.env` is untracked; only documented local-development Docker credentials appear in `docker-compose.yml` and `tests/setup.ts`. |
| RQ-046 | SQL injection safety and ownership checks on mutations | `service.ts` | done | Hostile query strings and a `'); DROP TABLE` name tested; delete re-checks the owner inside the statement. |
| RQ-047 | Rate limiting for auth and write endpoints | `src/server/plugins/rate-limit.ts`, `src/lib/auth.ts` | done | D-010; verified on the production server (auth: 4th attempt 429; writes: 31st request 429 with `Retry-After`). |
| RQ-048 | Dependency audit | n/a | done | `bun audit`: 2 moderate, both transitive dev-tooling (esbuild via drizzle-kit, minimatch via eslint); neither is bundled in the runtime. |

### UI

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| RQ-049 | shadcn/ui on Tailwind v4 (`components.json`, CSS variables, `cn`) | done | Components copied from the official `shadcn-ui/ui` repository (`new-york-v4`); `components.json` written by hand because the shadcn CLI registry host was not reachable from the build environment. Only 8 components used. |
| RQ-050 | UI covering sign-up, sign-in, sign-out, protected page, API demo (echo, geo) | done | Pages `/sign-up`, `/sign-in`, `/dashboard`, `/playground`; e2e "sign up, manage places, search nearby, sign out and sign in again". Loading, error and validation states present. |

### Quality gates and Vercel

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| RQ-051 | Tests: core, errors, auth, places, database, UI smoke | done | `bun run test`: 85 pass, 0 fail (6 files). `bun run test:e2e`: 10 pass in Chromium against the production build. |
| RQ-052 | `typecheck`, `lint`, `test`, `next build` pass | done | All exit 0 with the final code; `next build` completes and lists `/api/[[...slugs]]`, `/api/auth/[...all]`, `/dashboard` (partial prerender), static pages and the proxy. |
| RQ-053 | Local run and manual HTTP check of every endpoint | done | `next start` on Node 22 queried with curl and Playwright; findings D-007 and D-008 came from this step. |
| RQ-054 | Serverless and performance review | done | README "Serverless notes"; spatial index usage proven by `EXPLAIN`. |
| RQ-055 | Vercel readiness: runtime choice, region, env vars, migration step, commands | done | D-003; README "Deploying to Vercel". |
| RQ-056 | Vercel login/link, preview deployment, production deployment | blocked | Not run: requires the owner's Vercel account, and production deploys need explicit approval. **Owner:** see README "Deploying to Vercel". |
| RQ-057 | Production database migration | blocked | Awaiting explicit approval and a hosted database. Never run against a remote database. |
| RQ-058 | README and docs complete | done | `README.md`, this file, `DECISIONS.md`. |

## Summary

| Status | Count |
| --- | --- |
| done | 63 (9 existing, 54 required) |
| blocked | 4 of the 58 required rows (RQ-010, RQ-022, RQ-056, RQ-057), all need something only the owner can do |
| in-progress / todo | 0 |

Verification that is **not** covered: Docker Compose itself, behaviour on a real Vercel deployment (preview URL
derivation, cookie flags over HTTPS, function limits), and a hosted PostGIS provider.
