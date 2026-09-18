import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireMerchant } from "@/lib/authServer";
import { DEFAULT_CONFIG } from "@/lib/types";

// POST /api/config  { stampsRequired: number, reward: string }
// Updates the one shared loyalty-program document every card reads
// (customers/{uid}.stamps is just a count; how many stamps a reward takes
// lives here). Kept server-side, like every other write, so a client
// can't hand itself a free reward by editing the config directly.
export async function POST(request: Request) {
  const auth = await requireMerchant(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const stampsRequired = Number(body?.stampsRequired);
  const reward = String(body?.reward ?? "").trim();

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

  await adminDb()
    .collection("config")
    .doc("settings")
    .set(
      {
        stampsRequired,
        reward,
        businessName: DEFAULT_CONFIG.businessName,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true });
}
