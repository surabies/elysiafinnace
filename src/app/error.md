## Error Type

Console Error

## Error Message

(node:26396) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:

- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)

    at DashboardPage (<anonymous>:null:null)

Next.js version: 16.4.5 (Turbopack)

## Error Type

Blocking Route

## Error Message

Route "/dashboard": Next.js encountered uncached data during prerendering.

`fetch(...)` or `connection()` accessed outside of `<Suspense>` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.

Ways to fix this:

- [stream] Provide a placeholder with `<Suspense fallback={...}>` around the data access
- [cache] Cache the data access with `"use cache"` (does not apply to `connection()`)
- [block] Set `export const instant = false` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-dynamic

    at verifySignature (node_modules\better-call\src\crypto.ts:28:37)
    at Object.getSignedCookie (node_modules\better-call\src\context.ts:287:29)
    at internalHandler (node_modules\better-call\src\endpoint.ts:648:20)
    at requireSession (src\lib\session.ts:18:19)
    at DashboardPage (src\app\(dashboard)\dashboard\page.tsx:20:20)

## Code Frame

26 | signature[i] = signatureBinStr.charCodeAt(i);
27 | }

> 28 | return await getWebcryptoSubtle().verify(
> | ^
> 29 | algorithm,
> 30 | secret,
> 31 | signature,

Next.js version: 16.4.5 (Turbopack)
