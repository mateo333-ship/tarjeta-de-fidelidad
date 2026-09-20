import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/authServer";
import { adminAuth } from "@/lib/firebaseAdmin";

// One-time, self-service alternative to scripts/setMerchant.mjs — for
// people setting this up without a terminal. It only does one thing: if
// the caller is signed in AND supplies the exact SETUP_SECRET set in the
// project's environment variables, it grants their OWN account the
// `merchant: true` claim. It can never touch another account (the uid
// always comes from the caller's own verified ID token, never from the
// request body), and it does nothing at all unless SETUP_SECRET is set —
// so once you're done using it, delete that environment variable in
// Vercel and this route permanently stops accepting anyone.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthedUser(request);
  if (!user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  // Trimmed defensively: a stray trailing space or newline is an easy
  // mistake to make when pasting into Vercel's env var field (or when a
  // mobile keyboard adds one), and would otherwise cause a confusing,
  // silent mismatch here.
  const expected = process.env.SETUP_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "Esta función está desactivada: falta la variable de entorno SETUP_SECRET. Añádela en Vercel (cualquier texto secreto que elijas) y vuelve a intentarlo.",
      },
      { status: 400 },
    );
  }

  let secret = "";
  try {
    const body = await request.json();
    secret = typeof body?.secret === "string" ? body.secret.trim() : "";
  } catch {
    // no body / invalid JSON — treated as a wrong secret below
  }

  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 403 });
  }

  await adminAuth().setCustomUserClaims(user.uid, { merchant: true });

  return NextResponse.json({ ok: true });
}
