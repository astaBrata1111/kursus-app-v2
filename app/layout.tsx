import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mingxian GEO — Sistem Manajemen Kursus",
  description: "Mandarin Education Growth OS — Operasi kursus yang tenang, jelas, dan cerdas.",
};

import { SettingsProvider } from "./components/SettingsProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
