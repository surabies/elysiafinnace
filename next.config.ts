import type { NextConfig } from "next";

/**
 * Baseline security headers.
 * - The CSP only restricts framing, base URI, form targets and plugins. A full
 *   script CSP needs per-request nonces (see docs/DECISIONS.md, D-009).
 * - geolocation=(self) is required by the "Use my location" button.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Elysia validates with its own TypeBox build and compiles handlers at runtime; loading it
  // from node_modules instead of the Turbopack bundle keeps that behaviour intact (D-007).
  serverExternalPackages: ["elysia"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
