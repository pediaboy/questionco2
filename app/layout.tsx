import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Rajdhani } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const display = Rajdhani({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Locks pinch-zoom / double-tap-zoom across every page (mobile HUD feel,
// prevents accidental zoom breaking the fixed-header/bottom-nav layout).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05080F",
};

export const metadata: Metadata = {
  title: "LASTQUESTION.CO — Master The Market",
  description:
    "LASTQUESTION.CO — crypto, forex & market intelligence ecosystem. Analytics, signals, community. Access the elite setup.",
  openGraph: {
    title: "LASTQUESTION.CO — Master The Market",
    description:
      "Crypto, forex & market intelligence ecosystem. Access the elite setup.",
    url: "https://lastquestion.co",
    siteName: "LASTQUESTION.CO",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LASTQUESTION.CO",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
  // Facebook domain verification (Business Manager > Brand Safety > Domains).
  // Rendered via Next's Metadata API `other` so it's static server-rendered HTML
  // in <head> on the homepage, not injected client-side by JS -- Facebook's
  // crawler requires that (a JS-injected tag fails verification).
  other: {
    "facebook-domain-verification": "m6arb5l37neip2zwlfr0yosx3wdhuh",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mono.variable} ${display.variable}`}>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
