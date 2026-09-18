"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";
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
        await signOut(getAuthClient());
        setError(
          "Esta cuenta no tiene acceso de negocio. Pide al administrador que la active (ver scripts/setMerchant.mjs).",
        );
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
          className="mt-1 rounded-xl bg-ink px-4 py-3 text-[14.5px] font-semibold text-paper disabled:opacity-50"
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
