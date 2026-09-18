import Link from "next/link";
import { BusinessName } from "@/components/BusinessName";
import CubeField from "@/components/CubeField";

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
    <>
      {/* Full-viewport WebGL background — fixed behind everything, so it
          fills whatever screen it's on (phone or wide desktop) instead of
          being boxed into the content column below. */}
      <CubeField />

      <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-8 px-4 py-10 sm:max-w-[520px] lg:max-w-[640px]">
        <div className="relative flex flex-col items-center gap-1 text-center">
          <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
            Has escaneado la tarjeta de
          </p>
          <h1 className="font-display text-[26px] font-semibold sm:text-[32px]">
            <BusinessName />
          </h1>
          <p className="max-w-[32ch] text-[14px] text-muted sm:max-w-[42ch] sm:text-[15px]">
            Consigue tu tarjeta de sellos: guarda cada visita y canjea tu premio cuando la completes.
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-[360px] flex-col gap-3">
          <Link
            href="/join"
            className="btn-primary rounded-xl px-4 py-3 text-center text-[14.5px] font-semibold"
          >
            Consigue tu tarjeta
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line bg-surface/70 px-4 py-3 text-center text-[14.5px] font-semibold text-muted backdrop-blur-sm"
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
    </>
  );
}
