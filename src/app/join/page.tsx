"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getAuthClient, getDbClient } from "@/lib/firebase";
import { sanitizeText } from "@/lib/sanitize";
import BackButton from "@/components/BackButton";

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "Ya existe una tarjeta con ese correo. Prueba a iniciar sesión.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "Ese correo no parece válido.";
    default:
      return "No se pudo crear la tarjeta. Inténtalo de nuevo.";
  }
}

export default function JoinPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const cleanName = sanitizeText(name, 60);
    const cleanEmail = sanitizeText(email, 120);
    try {
      const cred = await createUserWithEmailAndPassword(getAuthClient(), cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanName });

      const now = Date.now();
      await setDoc(doc(getDbClient(), "customers", cred.user.uid), {
        name: cleanName,
        email: cleanEmail,
        stamps: 0,
        createdAt: now,
        updatedAt: now,
      });

      router.push("/tarjeta");
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
          Un minuto y ya está
        </p>
        <h1 className="font-display text-[22px] font-semibold">Crea tu tarjeta</h1>
        <p className="text-[13.5px] text-muted">
          La usarás cada vez que vuelvas: sin descargar nada.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
          Nombre
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink"
            placeholder="Como quieres que te llamemos"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
          Correo
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink"
            placeholder="tucorreo@ejemplo.com"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
          Contraseña
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink"
            placeholder="Mínimo 6 caracteres"
          />
        </label>

        {error && <p className="text-[12.5px] text-stamp">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary mt-1 rounded-xl px-4 py-3 text-[14.5px] font-semibold"
        >
          {submitting ? "Creando tu tarjeta…" : "Crear mi tarjeta"}
        </button>
      </form>

      <p className="text-center text-[13px] text-muted">
        ¿Ya tienes tarjeta?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
