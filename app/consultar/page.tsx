import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";

export const metadata: Metadata = { title: "Consultar condiciones · Avizor", description: "Consultá condiciones ambientales para soja sin crear una cuenta." };

export default function ConsultarPage() { return <HeroSection />; }
