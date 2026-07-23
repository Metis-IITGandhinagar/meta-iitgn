import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Lora,
  Playfair_Display,
  Space_Grotesk,
  Inter,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Neo-brutalist display + body faces used by the home cards (mirrors the mock).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { Providers } from "./providers";
import { ServiceWorkerRegister } from "./service-worker-register";

export const metadata: Metadata = {
  title: "META IITGN",
  description: "The collaborative campus wiki for IIT Gandhinagar.",
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${playfair.variable} ${spaceGrotesk.variable} ${inter.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
