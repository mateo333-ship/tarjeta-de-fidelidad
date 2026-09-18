import Link from "next/link";

// This is what a customer lands on the instant they scan the in-store QR
// or tap their phone on the NFC point — before they have an account, and
// before there's any specific business branding to show (that's the
// point of this build: swap the name/logo per client, everything else
// stays the same).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-card-bg">
          <span className="h-7 w-7 rounded-full border-[3px] border-stamp" />
        </span>
        <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
          Has escaneado la tarjeta de
        </p>
        <h1 className="font-display text-[26px] font-semibold">Tu Negocio</h1>
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
