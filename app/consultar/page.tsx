import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import { featureFlags } from "@/lib/config/featureFlags";

export const metadata: Metadata = { title: "Consultar condiciones · Avizor", description: "Consultá condiciones ambientales para soja y trigo sin crear una cuenta." };

export default function ConsultarPage() { return <HeroSection enableTrigo={featureFlags.enableTrigo} />; }
