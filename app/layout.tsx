import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "referent01",
  description: "Анализ англоязычных статей с помощью AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="overflow-x-hidden antialiased">{children}</body>
    </html>
  );
}
