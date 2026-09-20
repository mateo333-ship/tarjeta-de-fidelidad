import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireMerchant } from "@/lib/authServer";
import { sanitizeText } from "@/lib/sanitize";

// POST /api/config  { stampsRequired: number, reward: string, businessName: string }
// Updates the one shared loyalty-program document every card (and the
// public landing page) reads. Kept server-side, like every other write,
// so a client can't hand itself a free reward by editing the config
// directly. businessName lives here too — on purpose: cloning this
// project for a different business is then a setting in /negocio, not a
// code change.
export async function POST(request: Request) {
  const auth = await requireMerchant(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const stampsRequired = Number(body?.stampsRequired);
  const reward = sanitizeText(body?.reward, 80);
  const businessName = sanitizeText(body?.businessName, 60);

  if (!Number.isInteger(stampsRequired) || stampsRequired < 2 || stampsRequired > 30) {
    return NextResponse.json(
      { error: "Los sellos para el premio deben ser un número entre 2 y 30." },
      { status: 400 },
    );
  }
  if (!reward || reward.length > 80) {
    return NextResponse.json(
      { error: "Escribe una descripción del premio (máximo 80 caracteres)." },
      { status: 400 },
    );
  }
  if (!businessName || businessName.length > 60) {
    return NextResponse.json(
      { error: "Escribe el nombre del negocio (máximo 60 caracteres)." },
      { status: 400 },
    );
  }

  await adminDb()
    .collection("config")
    .doc("settings")
    .set(
      {
        stampsRequired,
        reward,
        businessName,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true });
}
