"use client";

import { useRouter } from "next/navigation";

// A single, consistent "go back" control for every page except the
// landing screen — it uses the browser's own history (router.back()) so
// it always returns wherever the person actually came from, rather than
// a hardcoded route that might not match how they got here.
export default function BackButton({
  label = "Volver",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
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
