"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";
import { useAuthUser } from "@/lib/useAuthUser";
import BackButton from "@/components/BackButton";

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}

export default function NegocioLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();

  // Business access is just a permission on top of the SAME account
  // system as /login and /join — there's no separate "business login".
  // So if the person already has a session going (e.g. they signed in
  // as a customer on /tarjeta a moment ago), we detect that here instead
  // of making them type their email and password again: straight to the
  // panel if that account already has merchant access, or straight to
  // the one-time activation step if it doesn't.
  const [needsActivation, setNeedsActivation] = useState(false);
  const [claimResolved, setClaimResolved] = useState(false);

  useEffect(() => {
    // Nothing to check yet (still loading), or no session to check at
    // all — the render below already handles both cases from `loading`
    // and `user` directly, with no state of our own needed here.
    if (loading || !user) return;

    let cancelled = false;
    user
      .getIdTokenResult()
      .then((token) => {
        if (cancelled) return;
        if (token.claims.merchant === true) {
          router.replace("/negocio");
          return;
        }
        setNeedsActivation(true);
        setClaimResolved(true);
      })
      .catch(() => {
        if (!cancelled) setClaimResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  // True only while we have a signed-in user whose merchant claim we
  // haven't resolved yet — avoids flashing the login form right before
  // an automatic redirect to /negocio.
  const checkingClaim = !loading && !!user && !claimResolved;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(getAuthClient(), email.trim(), password);
      // force-refresh: pick up a merchant claim granted moments ago
      const token = await cred.user.getIdTokenResult(true);
      if (token.claims.merchant !== true) {
        // Don't sign back out — just let the effect above notice this
        // session and show the "needs activation" screen below, using
        // the account they just signed in with.
        setNeedsActivation(true);
        setSubmitting(false);
        return;
      }
      router.push("/negocio");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(friendlyAuthError(code));
      setSubmitting(false);
    }
  }

  // Still figuring out whether there's already a usable session —
  // avoids flashing the login form for someone about to be redirected.
  if (loading || checkingClaim) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <p className="text-[13.5px] text-muted">Comprobando acceso…</p>
      </main>
    );
  }

  // Already signed in (as a customer or otherwise), just not as a
  // merchant yet — skip straight to activation, no password re-entry.
  if (user && needsActivation) {
    return (
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-6 px-4 py-10">
        <BackButton />
        <div className="flex flex-col gap-1.5 text-center">
          <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
            Vista interna
          </p>
          <h1 className="font-display text-[22px] font-semibold">Acceso del negocio</h1>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[13.5px] text-muted">
            Sesión iniciada como <span className="font-semibold text-ink">{user.email}</span>.
            Esta cuenta todavía no tiene acceso de negocio.
          </p>
          <Link
            href="/negocio/activar"
            className="btn-primary w-full rounded-xl px-4 py-3 text-center text-[14.5px] font-semibold"
          >
            Activar acceso de negocio
          </Link>
          <button
            type="button"
            onClick={() => signOut(getAuthClient()).then(() => window.location.reload())}
            className="font-data text-[11px] uppercase tracking-[0.08em] text-muted underline underline-offset-2"
          >
            Usar otra cuenta
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-6 px-4 py-10">
      <BackButton />
      <div className="flex flex-col gap-1.5 text-center">
        <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
          Vista interna
        </p>
        <h1 className="font-display text-[22px] font-semibold">Acceso del negocio</h1>
        <p className="text-[13px] text-muted">
          Usa la misma cuenta con la que te diste de alta, una vez tenga
          permiso de negocio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
          Correo
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
          Contraseña
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink"
          />
        </label>

        {error && <p className="text-[12.5px] text-stamp">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary mt-1 rounded-xl px-4 py-3 text-[14.5px] font-semibold"
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-[12.5px] text-muted">
        ¿Primera vez configurando el negocio?{" "}
        <Link href="/negocio/activar" className="font-semibold text-ink underline underline-offset-2">
          Actívalo aquí
        </Link>
      </p>
    </main>
  );
}
