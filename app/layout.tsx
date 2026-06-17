import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "HOMEX",
  title: "HOMEX | Home recovery coordination",
  description: "Coordinate post-discharge elder care with family, aides, providers, documents, videos, and daily care briefs.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HOMEX",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: true
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d6b57"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
