import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "CareLedger — Catch therapy billing mistakes early",
  description: "A private therapy authorization and billing reconciliation workspace for families.",
  openGraph: {
    title: "CareLedger",
    description: "Catch therapy billing mistakes before care stops.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "CareLedger therapy billing reconciliation preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareLedger",
    description: "Catch therapy billing mistakes before care stops.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
