"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getAuthClient, getDbClient } from "@/lib/firebase";
import { useAuthUser } from "@/lib/useAuthUser";
import { DEFAULT_CONFIG, type ProgramConfig } from "@/lib/types";
import QrScanner from "@/components/QrScanner";

type CustomerRow = { id: string; name: string; stamps: number; updatedAt: number };
type ScannedCustomer = { id: string; name: string; stamps: number };

async function authedFetch(path: string, init?: RequestInit) {
  const user = getAuthClient().currentUser;
  if (!user) throw new Error("No has iniciado sesión.");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Ha ocurrido un error.");
  return data;
}

export default function NegocioPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/negocio/login");
      return;
    }
    user.getIdTokenResult().then((token) => {
      setAccess(token.claims.merchant === true ? "granted" : "denied");
    });
  }, [loading, user, router]);

  // ---- program config ----
  const [config, setConfig] = useState<ProgramConfig>(DEFAULT_CONFIG);
  const [cfgName, setCfgName] = useState(DEFAULT_CONFIG.businessName);
  const [cfgTotal, setCfgTotal] = useState(String(DEFAULT_CONFIG.stampsRequired));
  const [cfgReward, setCfgReward] = useState(DEFAULT_CONFIG.reward);
  const [cfgSaving, setCfgSaving] = useState(false);
  const [cfgMessage, setCfgMessage] = useState<string | null>(null);

  useEffect(() => {
    if (access !== "granted") return;
    return onSnapshot(doc(getDbClient(), "config", "settings"), (snap) => {
      const data = snap.exists() ? snap.data() : null;
      const next: ProgramConfig = {
        stampsRequired: data?.stampsRequired ?? DEFAULT_CONFIG.stampsRequired,
        reward: data?.reward ?? DEFAULT_CONFIG.reward,
        businessName: data?.businessName ?? DEFAULT_CONFIG.businessName,
      };
      setConfig(next);
      setCfgName(next.businessName);
      setCfgTotal(String(next.stampsRequired));
      setCfgReward(next.reward);
    });
  }, [access]);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setCfgSaving(true);
    setCfgMessage(null);
    try {
      await authedFetch("/api/config", {
        method: "POST",
        body: JSON.stringify({
          businessName: cfgName,
          stampsRequired: Number(cfgTotal),
          reward: cfgReward,
        }),
      });
      setCfgMessage("Guardado.");
    } catch (err) {
      setCfgMessage(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setCfgSaving(false);
      setTimeout(() => setCfgMessage(null), 3000);
    }
  }

  // ---- customer list (live) ----
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (access !== "granted") return;
    const q = query(collection(getDbClient(), "customers"), orderBy("updatedAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => {
      setCustomers(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? "Cliente",
          stamps: d.data().stamps ?? 0,
          updatedAt: d.data().updatedAt ?? 0,
        })),
      );
    });
  }, [access]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, search]);

  // ---- scanner + stamping ----
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<ScannedCustomer | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const handledRef = useRef(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleScan(code: string) {
    if (handledRef.current) return;
    handledRef.current = true;
    setScanning(false);
    setScanError(null);
    try {
      const data = await authedFetch(`/api/lookup?id=${encodeURIComponent(code)}`);
      setScanned(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "No se pudo leer esa tarjeta.");
    }
  }

  function resetScan() {
    handledRef.current = false;
    setScanned(null);
    setScanError(null);
  }

  async function addStamp(customerId: string) {
    setBusyId(customerId);
    try {
      await authedFetch("/api/stamp", {
        method: "POST",
        body: JSON.stringify({ customerId }),
      });
      showToast("Sello añadido.");
      if (scanned?.id === customerId) {
        setScanned({ ...scanned, stamps: Math.min(scanned.stamps + 1, config.stampsRequired) });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo añadir el sello.");
    } finally {
      setBusyId(null);
    }
  }

  async function redeem(customerId: string) {
    setBusyId(customerId);
    try {
      await authedFetch("/api/redeem", {
        method: "POST",
        body: JSON.stringify({ customerId }),
      });
      showToast("Premio canjeado. Tarjeta reiniciada.");
      if (scanned?.id === customerId) setScanned({ ...scanned, stamps: 0 });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo canjear.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading || access === "checking") {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <p className="text-[13.5px] text-muted">Comprobando acceso…</p>
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <p className="text-[14px] text-ink">Esta cuenta no tiene acceso de negocio.</p>
        <button
          type="button"
          onClick={() => signOut(getAuthClient()).then(() => router.replace("/negocio/login"))}
          className="font-data text-[11px] uppercase tracking-[0.08em] text-muted underline underline-offset-2"
        >
          Cerrar sesión
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-data text-[11px] font-bold uppercase tracking-[0.11em] text-stamp">
            Vista interna
          </p>
          <h1 className="font-display text-[20px] font-semibold">Panel del negocio</h1>
        </div>
        <button
          type="button"
          onClick={() => signOut(getAuthClient()).then(() => router.replace("/"))}
          className="font-data text-[11px] uppercase tracking-[0.08em] text-muted underline underline-offset-2"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Scanner */}
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-[14.5px] font-semibold">Escanear tarjeta</h2>

        {!scanning && !scanned && (
          <button
            type="button"
            onClick={() => {
              resetScan();
              setScanning(true);
            }}
            className="rounded-xl bg-ink px-4 py-3 text-[14px] font-semibold text-paper"
          >
            Abrir cámara
          </button>
        )}

        {scanning && !scanned && (
          <div className="flex flex-col gap-3">
            <QrScanner active={scanning} onScan={handleScan} />
            <button
              type="button"
              onClick={() => {
                setScanning(false);
                handledRef.current = false;
              }}
              className="self-center rounded-[10px] border border-line px-3.5 py-2 text-[13px] font-semibold text-muted"
            >
              Cancelar
            </button>
          </div>
        )}

        {scanError && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[13px] text-stamp">{scanError}</p>
            <button
              type="button"
              onClick={() => {
                resetScan();
                setScanning(true);
              }}
              className="rounded-[10px] border border-line px-3.5 py-2 text-[13px] font-semibold text-muted"
            >
              Probar otra vez
            </button>
          </div>
        )}

        {scanned && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-2 p-4 text-center">
            <div>
              <p className="text-[15px] font-semibold">{scanned.name}</p>
              <p className="font-data text-[12px] tabular-nums text-muted">
                {scanned.stamps} / {config.stampsRequired} sellos
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {scanned.stamps >= config.stampsRequired ? (
                <button
                  type="button"
                  disabled={busyId === scanned.id}
                  onClick={() => redeem(scanned.id)}
                  className="rounded-[10px] bg-gold px-3.5 py-2 text-[13px] font-semibold text-[#211d05] disabled:opacity-50"
                >
                  Canjear y reiniciar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyId === scanned.id}
                  onClick={() => addStamp(scanned.id)}
                  className="rounded-[10px] bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper disabled:opacity-50"
                >
                  + 1 sello
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetScan();
                  setScanning(true);
                }}
                className="rounded-[10px] border border-line px-3.5 py-2 text-[13px] font-semibold text-muted"
              >
                Siguiente cliente
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Config */}
      <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-[14.5px] font-semibold">Configuración del programa</h2>
        <form onSubmit={saveConfig} className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
          <label className="col-span-2 flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted max-[380px]:col-span-1">
            Nombre del negocio
            <input
              type="text"
              maxLength={60}
              value={cfgName}
              onChange={(e) => setCfgName(e.target.value)}
              className="rounded-[9px] border border-line bg-surface-2 px-2.5 py-2 text-[14px] text-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
            Sellos para el premio
            <input
              type="number"
              min={2}
              max={30}
              value={cfgTotal}
              onChange={(e) => setCfgTotal(e.target.value)}
              className="rounded-[9px] border border-line bg-surface-2 px-2.5 py-2 text-[14px] text-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-muted">
            Premio
            <input
              type="text"
              maxLength={80}
              value={cfgReward}
              onChange={(e) => setCfgReward(e.target.value)}
              className="rounded-[9px] border border-line bg-surface-2 px-2.5 py-2 text-[14px] text-ink"
            />
          </label>
          <button
            type="submit"
            disabled={cfgSaving}
            className="col-span-2 rounded-[10px] bg-ink px-3.5 py-2.5 text-[13.5px] font-semibold text-paper disabled:opacity-50 max-[380px]:col-span-1"
          >
            {cfgSaving ? "Guardando…" : "Guardar"}
          </button>
        </form>
        {cfgMessage && <p className="text-[12.5px] text-muted">{cfgMessage}</p>}
      </section>

      {/* Customer list */}
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14.5px] font-semibold">Clientes recientes</h2>
          <span className="rounded-full border border-line px-2 py-1 font-data text-[10.5px] uppercase tracking-[0.06em] text-muted">
            {customers.length}
          </span>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-[9px] border border-line bg-surface-2 px-3 py-2 text-[14px] text-ink"
        />
        <div className="flex flex-col gap-2">
          {filteredCustomers.length === 0 && (
            <p className="text-[13px] text-muted">
              Todavía no hay clientes, o ninguno coincide con la búsqueda.
            </p>
          )}
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold">{c.name}</p>
                <p className="font-data text-[11px] tabular-nums text-muted">
                  {c.stamps} / {config.stampsRequired}
                </p>
              </div>
              {c.stamps >= config.stampsRequired ? (
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => redeem(c.id)}
                  className="flex-none rounded-[9px] bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-[#211d05] disabled:opacity-50"
                >
                  Canjear
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => addStamp(c.id)}
                  className="flex-none rounded-[9px] bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-paper disabled:opacity-50"
                >
                  + Sello
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
          <div className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
