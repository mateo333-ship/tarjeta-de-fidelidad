import { NextResponse, type NextRequest } from "next/server";

// This app has exactly one frontend: the pages served from this same
// deployment. So "only my app can call the backend" just means: only
// accept API calls whose Origin matches the origin this request itself
// arrived on. Using request.nextUrl.origin (instead of a hardcoded
// domain) means this works automatically in every environment — local
// dev, Vercel preview deployments, and production — with nothing to
// keep in sync by hand.
function isAllowedOrigin(origin: string | null, selfOrigin: string): boolean {
  if (!origin) {
    // Browsers attach an Origin header to every cross-site fetch/XHR
    // request; they only omit it for plain same-origin requests (and
    // non-browser callers like curl never send one either). So a
    // missing Origin is not a way for another website to sneak a
    // request past this check — it's what our own app's calls, and
    // simple direct visits, normally look like.
    return true;
  }
  return origin === selfOrigin;
}

export function proxy(request: NextRequest) {
  const selfOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");

  if (!isAllowedOrigin(origin, selfOrigin)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  // Preflight requests: answer them here, with the same allow/deny
  // decision already applied above, instead of letting them fall
  // through to a route handler that doesn't expect an OPTIONS method.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": selfOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", selfOrigin);
  response.headers.set("Vary", "Origin");
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
