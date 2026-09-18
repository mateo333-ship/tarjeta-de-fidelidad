"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type QrScannerProps = {
  /** Called once per decoded code while the scanner is active. */
  onScan: (text: string) => void;
  /** Camera runs while true; set to false to pause it (e.g. while a scan
   * result is on screen waiting for the clerk to confirm "+1 sello"). */
  active: boolean;
};

const ELEMENT_ID = "qr-reader";

export default function QrScanner({ onScan, active }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          onScanRef.current(decodedText);
        },
        () => {
          // fires continuously while no code is in frame — not an error
        },
      )
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.name === "NotAllowedError"
            ? "Necesitas dar permiso de cámara para escanear tarjetas."
            : "No se pudo abrir la cámara en este dispositivo o navegador.",
        );
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s && s.isScanning) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [active]);

  return (
    <div className="flex flex-col gap-2">
      <div
        id={ELEMENT_ID}
        className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl bg-card-bg"
      />
      {error && (
        <p className="text-center text-[12.5px] text-stamp">{error}</p>
      )}
      {!active && (
        <p className="text-center text-[12.5px] text-muted">Cámara en pausa.</p>
      )}
    </div>
  );
}
