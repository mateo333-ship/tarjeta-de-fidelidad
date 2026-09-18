import Link from "next/link";
import { BusinessName } from "@/components/BusinessName";

// This is what a customer lands on the instant they scan the in-store QR
// or tap their phone on the NFC point — before they have an account.
//
// Deliberately a plain, static Server Component: it renders instantly
// with the generic placeholder name and has zero dependency on Firebase
// during render, so nothing about the database or its credentials can
// ever break this route. The real business name (set by the merchant in
// /negocio) is filled in client-side by <BusinessName>, which calls
// /api/public-config — a route that always answers, even if Firestore is
// unreachable or not configured yet.
export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-8 overflow-hidden px-4 py-10">
      <div
        className="bg-blob -left-24 -top-16 h-64 w-64 bg-accent/35"
        aria-hidden
      />
      <div
        className="bg-blob -right-24 bottom-0 h-72 w-72 bg-accent-2/30"
        style={{ animationDelay: "-4s" }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="medallion-3d grid h-14 w-14 place-items-center">
          <span
            className="medallion-3d-inner grid h-14 w-14 place-items-center rounded-2xl shadow-[0_10px_24px_-10px_rgba(124,58,237,0.55)]"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            }}
          >
            <span className="h-7 w-7 rounded-full border-[3px] border-white/85" />
          </span>
        </div>
        <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
          Has escaneado la tarjeta de
        </p>
        <h1 className="font-display text-[26px] font-semibold">
          <BusinessName />
        </h1>
        <p className="max-w-[32ch] text-[14px] text-muted">
          Consigue tu tarjeta de sellos: guarda cada visita y canjea tu premio cuando la completes.
        </p>
      </div>

      <div className="relative flex flex-col gap-3">
        <Link
          href="/join"
          className="btn-primary rounded-xl px-4 py-3 text-center text-[14.5px] font-semibold"
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
        className="relative text-center font-data text-[11px] uppercase tracking-[0.08em] text-muted underline underline-offset-2"
      >
        Acceso del negocio
      </Link>
    </main>
  );
}
