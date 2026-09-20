import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import NavDepthTracker from "@/components/NavDepthTracker";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sello Digital",
  description:
    "Tarjeta de fidelización digital: registro por QR, sellos en segundos y una tarjeta que el cliente siempre lleva encima.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sello Digital",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#20282a",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${publicSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-paper text-ink">
        <NavDepthTracker />
        {children}
      </body>
    </html>
  );
}
