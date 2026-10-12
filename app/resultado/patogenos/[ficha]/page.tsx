import PestFichaDetailV2 from "@/components/results/PestFichaDetailV2";
export default async function PathogenFichaPage({
  params,
}: {
  params: Promise<{ ficha: string }>;
}) {
  const { ficha } = await params;
  return <PestFichaDetailV2 fichaId={ficha} tipo="enfermedad" />;
}
