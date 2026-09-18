import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * Reads the "Authorization: Bearer <idToken>" header, verifies it against
 * Firebase Auth, and returns the decoded token (with any custom claims,
 * e.g. `merchant: true`). Every mutation in this app (adding a stamp,
 * redeeming a card, editing the program config) goes through a route
 * handler that calls this first — the client SDK's Firestore writes are
 * locked down by firestore.rules, so the real access decision always
 * happens here, on the server, not in the browser.
 */
export async function getAuthedUser(
  request: Request,
): Promise<DecodedIdToken | null> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  try {
    return await adminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function requireMerchant(
  request: Request,
): Promise<{ user: DecodedIdToken } | { error: NextResponse }> {
  const user = await getAuthedUser(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 }),
    };
  }
  if (user.merchant !== true) {
    return {
      error: NextResponse.json(
        { error: "Esta cuenta no tiene acceso de negocio." },
        { status: 403 },
      ),
    };
  }
  return { user };
}
