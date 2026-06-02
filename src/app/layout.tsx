import type { Metadata, Viewport } from "next";
import "./globals.css";
import RootClient from "./RootClient";

export const metadata: Metadata = {
  title: "NeuralPulse — Daily Brain Training",
  description:
    "Sharpen your mind with daily brain games. Track your cognitive progress across memory, math, reflexes, and vocabulary — all in your browser.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
  openGraph: {
    title: "NeuralPulse — Daily Brain Training",
    description:
      "Sharpen your mind with daily brain games. Track your cognitive progress across memory, math, reflexes, and vocabulary.",
    url: "https://neuralpulse.app",
    siteName: "NeuralPulse",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "NeuralPulse — Daily Brain Training",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuralPulse — Daily Brain Training",
    description:
      "Sharpen your mind with daily brain games. Track your cognitive progress across memory, math, reflexes, and vocabulary.",
    images: ["/og-image.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d1117",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <RootClient>{children}</RootClient>
      </body>
    </html>
  );
}
