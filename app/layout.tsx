import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Avizor · La señal antes del problema",
  description:
    "Avizor identifica condiciones ambientales que pueden favorecer riesgos agrícolas y las traduce en recomendaciones simples para el productor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col font-sans">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

