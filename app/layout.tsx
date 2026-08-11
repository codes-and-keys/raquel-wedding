import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Hospedada localmente (em vez de next/font/google) para o build não depender
// da disponibilidade do fonts.gstatic.com — arquivos baixados de
// github.com/google/fonts/tree/main/ofl/playfairdisplay (licença OFL em app/fonts/OFL.txt).
const playfair = localFont({
  src: [
    { path: "./fonts/PlayfairDisplay-Variable.ttf", weight: "400 900", style: "normal" },
    { path: "./fonts/PlayfairDisplay-Italic-Variable.ttf", weight: "400 900", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://raquelefilipe.vercel.app';

export const metadata: Metadata = {
  title: { default: 'Raquel & Filipe', template: '%s | Raquel & Filipe' },
  description: 'Você está convidado! Casamento de Raquel & Filipe — 29 de Novembro de 2026, Arujá, SP.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: BASE_URL,
    siteName: 'Raquel & Filipe',
    title: 'Raquel & Filipe — Casamento 29.11.2026',
    description: 'Você está convidado! Celebre conosco em 29 de Novembro de 2026, Arujá, SP.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Raquel & Filipe — Casamento 29.11.2026' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raquel & Filipe — Casamento 29.11.2026',
    description: 'Você está convidado! Celebre conosco em 29 de Novembro de 2026, Arujá, SP.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
