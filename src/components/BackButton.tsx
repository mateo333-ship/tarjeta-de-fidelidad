"use client";

import { useRouter } from "next/navigation";
import { getNavDepth } from "@/lib/navDepth";

// A single, consistent "go back" control for every page except the
// landing screen — it uses the browser's own history (router.back()) so
// it usually returns wherever the person actually came from, rather than
// a hardcoded route that might not match how they got here.
//
// router.back() silently does nothing when there's no earlier page in
// THIS TAB's history — which happens whenever someone opens the app
// fresh with nowhere to go back to: tapping the home-screen icon of an
// installed PWA, opening a shared link or a QR code in a new tab, and so
// on. That's device/entry-point dependent, which is exactly why it looked
// like it "sometimes" didn't work.
//
// window.history.length isn't a reliable way to detect that case: a
// fresh tab can carry a phantom leading entry (e.g. the blank page a
// new tab/webview starts on) that makes it look like there's history to
// go back to when there isn't. Instead, NavDepthTracker (mounted once in
// the root layout) counts how many pages THIS APP has actually rendered
// in this tab, and that's what decides whether router.back() has
// anywhere real to go — falling back to fallbackHref otherwise, so the
// button always does something sensible instead of nothing.
export default function BackButton({
  label = "Volver",
  className = "",
  fallbackHref = "/",
}: {
  label?: string;
  className?: string;
  fallbackHref?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (getNavDepth() > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 self-start font-data text-[11px] uppercase tracking-[0.08em] text-muted ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}
