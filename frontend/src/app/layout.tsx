import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Providers } from "./providers";
import { ServiceWorkerRegister } from "./service-worker-register";

import { getSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = getSeoMetadata({
  path: "",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('wiki-settings-storage');
                  var theme = raw ? (JSON.parse(raw).state || {}).theme : null;
                  var dark = theme === 'dark' || theme === 'meta-dark';
                  document.documentElement.setAttribute('data-theme', dark ? 'dark' : (theme || 'light'));
                  if (dark) document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@700&family=Geist:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased">
        <ServiceWorkerRegister />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
