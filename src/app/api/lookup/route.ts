import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireMerchant } from "@/lib/authServer";

// GET /api/lookup?id=<customerUid>
// Used by the merchant dashboard right after a QR scan: turns the code on
// a customer's card (their Firebase uid) into their name and current
// stamp count, so the clerk can confirm "is this the right person?"
// before tapping "+1 sello".
export async function GET(request: Request) {
  const auth = await requireMerchant(request);
  if ("error" in auth) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta el parámetro id." }, { status: 400 });
  }

  const snap = await adminDb().collection("customers").doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "No existe ninguna tarjeta con ese código." }, { status: 404 });
  }

  const data = snap.data()!;
  return NextResponse.json({
    id: snap.id,
    name: data.name,
    stamps: data.stamps ?? 0,
  });
}
