import type { Metadata, Viewport } from "next";
import "./globals.css";

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
        <div className="bg-gradient-canvas" />
        <div className="relative z-10 min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  );
}
