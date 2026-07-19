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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mono.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
