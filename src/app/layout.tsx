import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruckManager - Gestion de flotte de camions",
  description: "Application professionnelle de gestion de flotte de camions pour entreprise de transport et vente de matériaux",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
