import type { Metadata } from "next";
import "./globals.css";
import LayoutChrome from "@/components/LayoutChrome";

export const metadata: Metadata = {
  title: "Avizor · La señal antes del problema",
  description: "Avizor evalúa condiciones ambientales y las compara con reglas agronómicas documentadas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es" className="overflow-x-clip"><body className="flex min-h-screen flex-col overflow-x-hidden font-sans"><LayoutChrome>{children}</LayoutChrome></body></html>;
}
