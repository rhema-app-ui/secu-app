import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🌐 Métadonnées SEO & PWA
export const metadata: Metadata = {
  title: "Secu-App",
  description: "Application de gestion opérationnelle pour agences de sécurité",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

// 📱 Configuration viewport mobile-first (empêche le zoom, style app native)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="fr" 
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}