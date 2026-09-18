import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { DEFAULT_CONFIG } from "@/lib/types";

// Public, read-only endpoint: just the business name for the landing page.
// No auth required (it's the same text a visitor already sees on a paper
// sign in the shop) and nothing here can ever throw past this handler —
// any Firebase/Firestore problem (missing env vars, a transient outage,
// wrong credentials) falls back to the generic default instead of
// breaking the page that loads it. This keeps "/" itself a plain static
// page that never touches the Admin SDK during render — see page.tsx and
// BusinessName.tsx.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb().collection("config").doc("settings").get();
    const data = snap.exists ? snap.data() : null;
    return NextResponse.json({
      businessName:
        (typeof data?.businessName === "string" && data.businessName) ||
        DEFAULT_CONFIG.businessName,
    });
  } catch {
    return NextResponse.json({ businessName: DEFAULT_CONFIG.businessName });
  }
}
