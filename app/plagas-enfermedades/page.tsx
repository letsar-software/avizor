import CatalogoSanitario from "@/components/CatalogoSanitario";
import { PageIntro, PublicPage, ScopeDisclaimer } from "@/components/PublicPage";

export const metadata = { title: "Plagas y Enfermedades | Avizor", description: "Catálogo informativo para acompañar el monitoreo del lote." };

export default async function PlagasEnfermedadesPage({ searchParams }: { searchParams: Promise<{ cultivo?: string; localidad?: string; volver?: string }> }) {
  const { cultivo, localidad, volver } = await searchParams;
  const returnPath = volver?.startsWith("/") && !volver.startsWith("//") ? volver : undefined;
  return <PublicPage><PageIntro eyebrow="Catálogo informativo" title="Plagas y Enfermedades" description="Conocé las principales plagas y enfermedades que pueden afectar tu cultivo y las condiciones ambientales que favorecen su desarrollo." /><CatalogoSanitario cultivoInicial={cultivo} localidad={localidad} volver={returnPath} /><ScopeDisclaimer /></PublicPage>;
}
