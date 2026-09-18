import type { MetadataRoute } from "next";
import { DEFAULT_CONFIG } from "@/lib/types";

// Makes the card installable ("Añadir a pantalla de inicio") on Android
// and, with the apple-touch-icon link in the layout, close to it on iOS.
// This is the practical stand-in for Apple/Google Wallet until this
// project is wired up with real Wallet credentials — see SETUP.md.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `Sello Digital — ${DEFAULT_CONFIG.businessName}`,
    short_name: "Sello Digital",
    description: "Tu tarjeta de fidelización digital.",
    start_url: "/tarjeta",
    display: "standalone",
    background_color: "#eeeadd",
    theme_color: "#20282a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
