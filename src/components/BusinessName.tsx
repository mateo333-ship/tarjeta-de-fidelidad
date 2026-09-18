"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/types";

// Renders the generic placeholder immediately (so the landing page has
// real content the instant it loads, server-rendered, with zero
// dependency on Firebase) then quietly swaps in the real business name
// once /api/public-config answers. If that call is slow, blocked, or
// fails, the placeholder just stays — never a broken page.
export function BusinessName() {
  const [name, setName] = useState(DEFAULT_CONFIG.businessName);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public-config", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { businessName?: string } | null) => {
        if (!cancelled && data?.businessName) setName(data.businessName);
      })
      .catch(() => {
        // Stay on the placeholder — this is not worth surfacing to the visitor.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{name}</>;
}
