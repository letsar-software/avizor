import PestFichaDetailV2 from "@/components/results/PestFichaDetailV2";

export default async function PestFichaPage({
  params,
}: {
  params: Promise<{ ficha: string }>;
}) {
  const { ficha } = await params;
  return <PestFichaDetailV2 fichaId={ficha} />;
}
