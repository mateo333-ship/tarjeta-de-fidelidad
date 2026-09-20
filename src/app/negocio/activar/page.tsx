"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { useAuthUser } from "@/lib/useAuthUser";

// Self-service, no-terminal alternative to scripts/setMerchant.mjs: turns
// the currently signed-in account into a merchant account, given the
// SETUP_SECRET set in the project's environment variables. Meant to be
// used exactly once, by the business owner, right after setting up
// Firebase — see SETUP.md.
export default function ActivarNegocioPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [secret, setSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/setup/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo activar. Inténtalo de nuevo.");
        setSubmitting(false);
        return;
      }
      // Force-refresh the ID token so the new merchant claim is picked up
      // immediately, without asking the person to log out and back in.
      await user.getIdTokenResult(true);
      router.push("/negocio");
    } catch {
      setError("No se pudo activar. Comprueba tu conexión e inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-6 px-4 py-10">
      <BackButton fallbackHref="/negocio/login" />
      <div className="flex flex-col gap-1.5 text-center">
        <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
          Solo una vez
        </p>
        <h1 className="font-display text-[22px] font-semibold">Activar acceso de negocio</h1>
        <p className="text-[13px] text-muted">
          Convierte tu cuenta en la cuenta del negocio, sin usar la terminal.
          Necesitas el código secreto que hayas puesto en la variable{" "}
          <code className="font-data text-[12px]">SETUP_SECRET</code> en Vercel.
        </p>
      </div>

      {loading ? null : !user ? (
        <p className="text-center text-[13px] text-muted">
          Primero inicia sesión con la cuenta que quieres convertir en cuenta
          del negocio.{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
            Iniciar sesión
          </Link>{" "}
          o{" "}
          <Link href="/join" className="font-semibold text-ink underline underline-offset-2">
            crear una cuenta
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <p className="text-center text-[12.5px] text-muted">
            Sesión iniciada como <span className="font-semibold text-ink">{user.email}</span>
          </p>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
            Código secreto (SETUP_SECRET)
            <input
              required
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink"
            />
          </label>

          {error && <p className="text-[12.5px] text-stamp">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-1 rounded-xl px-4 py-3 text-[14.5px] font-semibold"
          >
            {submitting ? "Activando…" : "Activar mi cuenta"}
          </button>
        </form>
      )}

      <p className="text-center text-[12px] text-muted">
        Por seguridad, cuando termines borra la variable{" "}
        <code className="font-data text-[11px]">SETUP_SECRET</code> de Vercel
        — esta página deja de funcionar hasta que la vuelvas a añadir.
      </p>
    </main>
  );
}
