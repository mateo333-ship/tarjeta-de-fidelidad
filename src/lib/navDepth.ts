"use client";

// How many pages BackButton has seen rendered in THIS tab so far. Used
// instead of the browser's own window.history.length, which turned out
// not to be a reliable signal: a fresh tab can carry a phantom leading
// entry (e.g. the about:blank page a new tab/webview starts on before
// its first navigation) that makes history.length look bigger than 1
// even though there's nothing of ours to go back to. Counting our own
// route changes avoids that entirely.
const KEY = "sd:navDepth";

export function bumpNavDepth(): void {
  if (typeof window === "undefined") return;
  try {
    const current = Number(window.sessionStorage.getItem(KEY) ?? "0");
    window.sessionStorage.setItem(KEY, String(current + 1));
  } catch {
    // Private browsing / storage disabled: getNavDepth() below will
    // always read 0, so BackButton just always falls back — never
    // silently does nothing, which is the actual bug being fixed.
  }
}

export function getNavDepth(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.sessionStorage.getItem(KEY) ?? "0");
  } catch {
    return 0;
  }
}
