import Link from "next/link";
import { adminDb } from "@/lib/firebaseAdmin";
import { DEFAULT_CONFIG } from "@/lib/types";

// The Admin SDK call below isn't a `fetch()`, so Next.js's automatic
// dynamic-detection doesn't reliably catch it — force this route to
// render per request rather than being frozen with whatever
// businessName happened to exist at build time.
export const dynamic = "force-dynamic";

async function getPublicConfig() {
  try {
    const snap = await adminDb().collection("config").doc("settings").get();
    const data = snap.exists ? snap.data() : null;
    return {
      businessName: data?.businessName || DEFAULT_CONFIG.businessName,
    };
  } catch {
    // Firebase not configured yet (no env vars) or a transient read error —
    // fall back to the generic placeholder rather than breaking the page.
    return { businessName: DEFAULT_CONFIG.businessName };
  }
}

// This is what a customer lands on the instant they scan the in-store QR
// or tap their phone on the NFC point — before they have an account. The
// business name comes straight from the merchant's own config (set in
// /negocio, see api/config/route.ts), read here on the server with the
// Admin SDK, so cloning this project for a new business is a config
// change from the dashboard, never a code edit.
export default async function Home() {
  const { businessName } = await getPublicConfig();

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-card-bg">
          <span className="h-7 w-7 rounded-full border-[3px] border-stamp" />
        </span>
        <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
          Has escaneado la tarjeta de
        </p>
        <h1 className="font-display text-[26px] font-semibold">{businessName}</h1>
        <p className="max-w-[32ch] text-[14px] text-muted">
          Consigue tu tarjeta de sellos: guarda cada visita y canjea tu premio cuando la completes.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/join"
          className="rounded-xl bg-ink px-4 py-3 text-center text-[14.5px] font-semibold text-paper"
        >
          Consigue tu tarjeta
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-line px-4 py-3 text-center text-[14.5px] font-semibold text-muted"
        >
          Ya tengo tarjeta — iniciar sesión
        </Link>
      </div>

      <Link
        href="/negocio/login"
        className="text-center font-data text-[11px] uppercase tracking-[0.08em] text-muted underline underline-offset-2"
      >
        Acceso del negocio
      </Link>
    </main>
  );
}
