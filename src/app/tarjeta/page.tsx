"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { getAuthClient, getDbClient } from "@/lib/firebase";
import { useAuthUser } from "@/lib/useAuthUser";
import { DEFAULT_CONFIG, type ProgramConfig } from "@/lib/types";
import Ticket from "@/components/Ticket";
import InstallPwaButton from "@/components/InstallPwaButton";

type CustomerDoc = { name: string; stamps: number };

export default function TarjetaPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [customer, setCustomer] = useState<CustomerDoc | null>(null);
  const [config, setConfig] = useState<ProgramConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const db = getDbClient();
    const unsubCustomer = onSnapshot(doc(db, "customers", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCustomer({ name: data.name, stamps: data.stamps ?? 0 });
      }
    });
    const unsubConfig = onSnapshot(doc(db, "config", "settings"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({
          stampsRequired: data.stampsRequired ?? DEFAULT_CONFIG.stampsRequired,
          reward: data.reward ?? DEFAULT_CONFIG.reward,
          businessName: data.businessName ?? DEFAULT_CONFIG.businessName,
        });
      }
    });
    return () => {
      unsubCustomer();
      unsubConfig();
    };
  }, [loading, user, router]);

  if (loading || !user || !customer) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <p className="text-[13.5px] text-muted">Cargando tu tarjeta…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
          Tu tarjeta
        </p>
        <h1 className="font-display text-[20px] font-semibold">{config.businessName}</h1>
      </div>

      <Ticket
        name={customer.name}
        stamps={customer.stamps}
        stampsRequired={config.stampsRequired}
        reward={config.reward}
        code={user.uid.slice(0, 6).toUpperCase()}
        businessName={config.businessName}
        qr={<QRCodeSVG value={user.uid} size={148} marginSize={0} />}
      />

      <p className="max-w-[32ch] text-center text-[13px] text-muted">
        Enséñale este código QR al dependiente al pagar. Se actualiza solo, no
        hace falta que hagas nada más.
      </p>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            disabled
            title="Se activará cuando el negocio configure Apple Wallet."
            className="rounded-[10px] border border-line px-3.5 py-2 text-[13px] font-semibold text-muted opacity-50"
          >
            Añadir a Apple Wallet
          </button>
          <button
            type="button"
            disabled
            title="Se activará cuando el negocio configure Google Wallet."
            className="rounded-[10px] border border-line px-3.5 py-2 text-[13px] font-semibold text-muted opacity-50"
          >
            Añadir a Google Wallet
          </button>
        </div>
        <InstallPwaButton />
      </div>

      <button
        type="button"
        onClick={() => signOut(getAuthClient()).then(() => router.replace("/"))}
        className="mt-2 font-data text-[11px] uppercase tracking-[0.08em] text-muted underline underline-offset-2"
      >
        Cerrar sesión
      </button>
    </main>
  );
}
