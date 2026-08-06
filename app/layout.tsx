import type { Metadata } from "next";
import "./globals.css";

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
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="bg-ivory">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
