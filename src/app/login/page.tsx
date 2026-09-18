"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento y vuelve a probar.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent">("idle");
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(getAuthClient(), email.trim(), password);
      router.push("/tarjeta");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(friendlyAuthError(code));
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setResetError("Escribe primero tu correo arriba.");
      return;
    }
    setResetError(null);
    setResetState("sending");
    try {
      await sendPasswordResetEmail(getAuthClient(), email.trim());
      setResetState("sent");
    } catch {
      // Firebase deliberately doesn't reveal whether the address exists —
      // show the same confirmation either way, never leak that detail.
      setResetState("sent");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col gap-1.5 text-center">
        <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
          Bienvenido de nuevo
        </p>
        <h1 className="font-display text-[22px] font-semibold">Tu tarjeta</h1>
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

        <div className="-mt-1 flex justify-end">
          {resetState === "sent" ? (
            <p className="text-[12px] text-muted">
              Si ese correo tiene tarjeta, te hemos enviado un enlace para elegir contraseña nueva.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetState === "sending"}
              className="text-[12px] text-muted underline underline-offset-2 disabled:opacity-50"
            >
              {resetState === "sending" ? "Enviando…" : "¿Olvidaste tu contraseña?"}
            </button>
          )}
        </div>
        {resetError && <p className="text-[12px] text-stamp">{resetError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-xl bg-ink px-4 py-3 text-[14.5px] font-semibold text-paper disabled:opacity-50"
        >
          {submitting ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="text-center text-[13px] text-muted">
        ¿No tienes tarjeta todavía?{" "}
        <Link href="/join" className="font-semibold text-ink underline underline-offset-2">
          Créala aquí
        </Link>
      </p>
    </main>
  );
}
