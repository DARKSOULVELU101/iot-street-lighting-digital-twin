import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-tech",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iot-street-lighting.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IoT Enabled Street Lighting Management System | 3D Smart City Digital Twin",
    template: "%s | SmartLamp Digital Twin",
  },
  description:
    "A 3D smart city digital twin of an ESP32 based adaptive street lighting system: live sensor telemetry, traffic simulation, adaptive dimming, fault detection, ThingSpeak analytics and Telegram remote control.",
  applicationName: "SmartLamp Digital Twin",
  keywords: [
    "IoT street lighting",
    "ESP32",
    "smart city digital twin",
    "adaptive street lighting",
    "React Three Fiber",
    "Next.js",
    "ThingSpeak",
    "Telegram bot",
    "LDR sensor",
    "PIR motion sensor",
    "ACS712",
    "PWM dimming",
  ],
  authors: [{ name: "IoT Street Lighting Project" }],
  creator: "IoT Street Lighting Project",
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "SmartLamp Digital Twin",
    title: "IoT Enabled Street Lighting Management System",
    description:
      "3D smart city digital twin: ESP32 adaptive street lighting with live sensor telemetry, fault detection and cloud analytics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "IoT Enabled Street Lighting Management System",
    description:
      "A 3D smart city digital twin of an ESP32 adaptive street lighting system.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#050816",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-ink-950 antialiased">
        <AppProviders>
          <a
            href="#overview"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="top">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
