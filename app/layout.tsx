import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Fostern — Ambição merece um plano à altura.",
  description: "Preparação internacional com profundidade para estudantes brasileiros.",
  metadataBase: new URL("https://fostern.com"),
  openGraph: {
    title: "Fostern — Ambição merece um plano à altura.",
    description: "Preparação internacional com profundidade para estudantes brasileiros.",
    url: "https://fostern.com",
    siteName: "Fostern",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#081D36",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${newsreader.variable} bg-ivory`}>
      <body>{children}</body>
    </html>
  );
}
