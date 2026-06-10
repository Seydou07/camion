import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruckManager - Gestion de flotte de camions",
  description: "Application professionnelle de gestion de flotte de camions pour entreprise de transport et vente de matériaux",
  manifest: "/manifest.json",
  themeColor: "#0077B6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
