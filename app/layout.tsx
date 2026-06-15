import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOMEX | Home recovery coordination",
  description: "Coordinate post-discharge elder care with family, aides, providers, documents, videos, and daily care briefs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
