"use client";

import { useEffect, useState } from "react";

// The stand-in for "Añadir a Apple/Google Wallet" that actually works
// today without any developer account: installing the card as an app
// icon on the home screen (a PWA). Chrome/Android fires
// "beforeinstallprompt" and we can trigger it directly; Safari/iOS never
// fires it, so there we just explain the two-tap manual route.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPwaButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    if (isIos()) {
      setShowIosHint((v) => !v);
    }
  }

  if (!deferred && !isIos()) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-[10px] border border-line bg-transparent px-3.5 py-2 text-[13px] font-semibold text-muted"
      >
        Añadir a pantalla de inicio
      </button>
      {showIosHint && (
        <p className="max-w-[30ch] text-center text-[12px] text-muted">
          En iPhone: pulsa Compartir (el icono con la flecha) y luego
          &ldquo;Añadir a pantalla de inicio&rdquo;.
        </p>
      )}
    </div>
  );
}
