import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PRODGERS",
  description: "Portal web operativo para expedientes fotovoltaicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
