import type { NextConfig } from "next";

/**
 * Production security hardening (Phase 16).
 *
 * Headers are applied to every route. Everything here is hosting-provider
 * neutral — the same headers work on Vercel, a Node server, or a container.
 *
 * CSP notes:
 *   - A nonce-based "strict" CSP (script-src 'strict-dynamic') requires every
 *     route to render dynamically. This app still statically prerenders /,
 *     /login and /register, so nonces cannot be applied consistently yet.
 *     The policy below is therefore the compatible, still-valuable baseline:
 *     it locks the app to same-origin sources, blocks plugins/objects and
 *     clickjacking, and forbids mixed content — while allowing the inline
 *     bootstrap script/style tags Next.js injects.
 *   - `'unsafe-eval'` and the `ws:` connect source are development-only (React
 *     devtooling / HMR) and are stripped from the production build.
 *   - Once routes are all dynamic, tighten to nonce+strict-dynamic per
 *     node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
 */

const isProduction = process.env.NODE_ENV === "production";

const connectSrc = ["'self'", ...(isProduction ? [] : ["ws:", "wss:"])].join(" ");
const scriptSrc = ["'self'", "'unsafe-inline'", ...(isProduction ? [] : ["'unsafe-eval'"])].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  // Next.js injects inline styles; Tailwind ships as a same-origin stylesheet.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Clickjacking defence for browsers that ignore frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Never let a browser MIME-sniff a response into executable content.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // HSTS only makes sense over HTTPS in production; never send it to localhost.
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Do not advertise the framework in the X-Powered-By header.
  poweredByHeader: false,
  headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // NOTE: /_next/static/* already receives
      // `Cache-Control: public, max-age=31536000, immutable` from Next.js
      // itself — overriding it here only produces a build warning.
    ];
  },
};

export default nextConfig;
