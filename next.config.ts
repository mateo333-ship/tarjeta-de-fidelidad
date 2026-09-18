import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin uses Node-only APIs (native crypto, gRPC) that don't
  // survive being bundled for the server; this keeps it as a plain
  // Node `require` in the deployed function instead, which is what
  // Vercel's Next.js runtime expects for this package.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
