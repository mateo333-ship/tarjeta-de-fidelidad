import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireMerchant } from "@/lib/authServer";
import { DEFAULT_CONFIG } from "@/lib/types";
import { isValidUid } from "@/lib/sanitize";

// POST /api/stamp  { customerId: string }
// The one action a clerk takes at the till after scanning a customer's
// wallet QR: adds exactly one stamp to that customer's card. Runs as a
// Firestore transaction so two clerks tapping the same card at once can
// never double-count, and every stamp is also written to that customer's
// own events subcollection — a private, per-card audit trail (this is the
// "cada sello queda guardado en cada tarjeta, sin que se entrelacen"
// requirement: the stamp lives only under customers/{that uid}/events).
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
  const configRef = db.collection("config").doc("settings");

  try {
    const result = await db.runTransaction(async (tx) => {
      const [customerSnap, configSnap] = await Promise.all([
        tx.get(customerRef),
        tx.get(configRef),
      ]);

      if (!customerSnap.exists) {
        throw new Error("NOT_FOUND");
      }

      const stampsRequired =
        (configSnap.exists ? configSnap.data()?.stampsRequired : null) ??
        DEFAULT_CONFIG.stampsRequired;

      const current = customerSnap.data()?.stamps ?? 0;
      if (current >= stampsRequired) {
        throw new Error("ALREADY_COMPLETE");
      }

      const next = current + 1;
      tx.update(customerRef, { stamps: next, updatedAt: Date.now() });

      const eventRef = customerRef.collection("events").doc();
      tx.set(eventRef, {
        type: "stamp",
        at: Date.now(),
        by: auth.user.uid,
      });

      return next;
    });

    return NextResponse.json({ stamps: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "No existe esa tarjeta." }, { status: 404 });
    }
    if (message === "ALREADY_COMPLETE") {
      return NextResponse.json(
        { error: "Esta tarjeta ya está completa. Cánjeala para reiniciarla." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "No se pudo añadir el sello." }, { status: 500 });
  }
}
