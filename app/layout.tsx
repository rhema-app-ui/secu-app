import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secu-App",
  description: "Gestion d'agents de sécurité",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}