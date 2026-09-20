import type { NextConfig } from "next";

// Static (non-nonce) Content-Security-Policy. Next.js's nonce-based CSP
// requires switching every page to per-request dynamic rendering, which
// is a much bigger, riskier change for an app that's already live; this
// app also has zero uses of dangerouslySetInnerHTML (React escapes all
// user text by default), so the main thing this header needs to do is
// stop any *injected* script/resource from being loaded from somewhere
// else, which a static allowlist already covers.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  // Firebase Auth + Firestore client SDK calls, plus the QR camera
  // stream (getUserMedia doesn't need a connect-src entry, but is
  // covered by Permissions-Policy below).
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera=(self): the merchant panel's QR scanner needs it. Everything
  // else this app doesn't use gets switched off outright.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  // Legacy clickjacking fallback for browsers that don't honor
  // frame-ancestors yet.
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  // firebase-admin uses Node-only APIs (native crypto, gRPC) that don't
  // survive being bundled for the server; this keeps it as a plain
  // Node `require` in the deployed function instead, which is what
  // Vercel's Next.js runtime expects for this package.
  serverExternalPackages: ["firebase-admin"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
