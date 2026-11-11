import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ObraCerta | Orçamentação de obras",
  description: "Orçamentação e controlo financeiro de obras para empresas de construção.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
