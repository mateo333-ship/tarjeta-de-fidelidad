import { NextResponse, after } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireMerchant } from "@/lib/authServer";
import { isValidUid } from "@/lib/sanitize";
import { DEFAULT_CONFIG } from "@/lib/types";
import { bestEffortSync } from "@/lib/googleWallet";

// POST /api/redeem  { customerId: string }
// The clerk hands over the reward and resets that one card to zero so a
// new cycle can start. Logged as its own event, same as a stamp.
export async function POST(request: Request) {
  const auth = await requireMerchant(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const customerId = body?.customerId;
  if (!isValidUid(customerId)) {
    return NextResponse.json({ error: "Falta customerId." }, { status: 400 });
  }

  const db = adminDb();
  const customerRef = db.collection("customers").doc(customerId);
  const [snap, configSnap] = await Promise.all([
    customerRef.get(),
    db.collection("config").doc("settings").get(),
  ]);
  if (!snap.exists) {
    return NextResponse.json({ error: "No existe esa tarjeta." }, { status: 404 });
  }

  await customerRef.update({ stamps: 0, updatedAt: Date.now() });
  await customerRef.collection("events").add({
    type: "redeem",
    at: Date.now(),
    by: auth.user.uid,
  });

  const configData = configSnap.exists ? configSnap.data() : null;
  const origin = new URL(request.url).origin;
  after(() =>
    bestEffortSync({
      origin,
      businessName: configData?.businessName ?? DEFAULT_CONFIG.businessName,
      uid: customerId,
      name: snap.data()?.name ?? "Cliente",
      stamps: 0,
      stampsRequired: configData?.stampsRequired ?? DEFAULT_CONFIG.stampsRequired,
      reward: configData?.reward ?? DEFAULT_CONFIG.reward,
    }),
  );

  return NextResponse.json({ stamps: 0 });
}
