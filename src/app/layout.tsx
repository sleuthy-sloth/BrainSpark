import type { Metadata, Viewport } from "next";
import "./globals.css";
import RootClient from "./RootClient";

export const metadata: Metadata = {
  title: "NeuralPulse",
  description: "Daily brain training. Sharpen your edge.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
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
