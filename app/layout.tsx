import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNavigation from "@/components/MobileBottomNavigation";

export const metadata: Metadata = {
  title: "Avizor · La señal antes del problema",
  description: "Avizor evalúa condiciones ambientales y las compara con reglas agronómicas documentadas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es" className="overflow-x-clip"><body className="flex min-h-screen flex-col overflow-x-hidden font-sans"><Header /><main className="flex-1 pb-16 lg:pb-0">{children}</main><Footer /><MobileBottomNavigation /></body></html>;
}
