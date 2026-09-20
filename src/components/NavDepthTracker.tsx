"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { bumpNavDepth } from "@/lib/navDepth";

// Mounted once in the root layout. Every time the pathname changes
// (including the very first page of the tab) it counts one more page
// seen — BackButton reads that count to know whether there's actually
// somewhere in-app to go back to. Renders nothing.
export default function NavDepthTracker() {
  const pathname = usePathname();

  useEffect(() => {
    bumpNavDepth();
  }, [pathname]);

  return null;
}
