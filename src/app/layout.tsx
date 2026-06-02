import type { Metadata, Viewport } from "next";
import "./globals.css";
import RootClient from "./RootClient";

export const metadata: Metadata = {
  title: "BrainSpark",
  description: "Train your mind with brain games",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/BrainSpark/apple-touch-icon.png" />
      </head>
      <body>
        <RootClient>{children}</RootClient>
      </body>
    </html>
  );
}
