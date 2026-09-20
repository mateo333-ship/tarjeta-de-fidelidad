import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuthedUser } from "@/lib/authServer";
import { DEFAULT_CONFIG } from "@/lib/types";
import { buildSaveLink, getWalletCreds, syncLoyaltyObject } from "@/lib/googleWallet";

// POST /api/wallet/google — any signed-in CUSTOMER (not a merchant-only
// action) calls this from /tarjeta to add their own card to Google
// Wallet. Creates/refreshes their pass with the current stamp count and
// returns the signed "Save to Google Wallet" link for the browser to
// open. No customerId in the request body: the pass is always for
// whoever's ID token this is, the same rule every other write in this
// app follows.
export async function POST(request: Request) {
  const user = await getAuthedUser(request);
  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const creds = getWalletCreds();
  if (!creds) {
    return NextResponse.json(
      { error: "Google Wallet todavía no está configurado. Revisa SETUP.md." },
      { status: 400 },
    );
  }

  const db = adminDb();
  const [customerSnap, configSnap] = await Promise.all([
    db.collection("customers").doc(user.uid).get(),
    db.collection("config").doc("settings").get(),
  ]);

  if (!customerSnap.exists) {
    return NextResponse.json({ error: "No existe tu tarjeta." }, { status: 404 });
  }

  const customer = customerSnap.data()!;
  const config = configSnap.exists ? configSnap.data()! : {};
  const businessName = config.businessName ?? DEFAULT_CONFIG.businessName;
  const stampsRequired = config.stampsRequired ?? DEFAULT_CONFIG.stampsRequired;
  const reward = config.reward ?? DEFAULT_CONFIG.reward;

  try {
    const origin = new URL(request.url).origin;
    const objectId = await syncLoyaltyObject(creds, {
      origin,
      businessName,
      uid: user.uid,
      name: customer.name ?? "Cliente",
      stamps: customer.stamps ?? 0,
      stampsRequired,
      reward,
    });
    const url = buildSaveLink(creds, objectId, origin);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `No se pudo preparar el pase de Google Wallet: ${message}` }, { status: 500 });
  }
}
