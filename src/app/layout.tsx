import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PremiumPopup } from "@/components/ads/PremiumPopup";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wealth Tracker România — Urmărire Avere Personală 100% Privat",
  description:
    "Trackuiește-ți acțiunile, crypto, economii și datorii. 100% gratuit, fără cont, datele rămân în browser-ul tău.",
  keywords: [
    "urmărire avere personală",
    "calculare net worth România",
    "tracker portofoliu investiții",
    "gestiune finanțe personale gratuit",
    "wealth tracker",
    "net worth calculator",
  ],
  openGraph: {
    title: "Wealth Tracker România — Urmărire Avere Personală 100% Privat",
    description:
      "Trackuiește-ți acțiunile, crypto, economii și datorii. 100% gratuit, fără cont, datele rămân în browser-ul tău.",
    type: "website",
    locale: "ro_RO",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <head>
        <script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || ""}
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-[family-name:var(--font-geist-sans)]`}
      >
        {children}
        <PremiumPopup />
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
