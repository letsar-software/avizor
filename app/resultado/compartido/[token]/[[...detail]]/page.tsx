import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicResult } from "@/lib/consultas/public-result";
import { DomainError } from "@/lib/consultas/service";
import { logSafeError } from "@/lib/logging/safe";
import { sharedResultPath } from "@/lib/results/sharing";
import { categoryDefinitions } from "@/lib/results/presentation";
import ResultSummaryV2 from "@/components/results/ResultSummaryV2";
import CategoryDetailV2 from "@/components/results/CategoryDetailV2";
import PestDetailV2 from "@/components/results/PestDetailV2";
import PestFichaDetailV2 from "@/components/results/PestFichaDetailV2";
import PhenologyDetail from "@/components/results/PhenologyDetail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Resultado compartido · Avizor",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ token: string; detail?: string[] }>;
}) {
  const { token, detail = [] } = await params;
  const slug = detail[0];
  if (
    detail.length > 2 ||
    (slug &&
      slug !== "plagas" &&
      slug !== "patogenos" &&
      slug !== "fenologia" &&
      !categoryDefinitions.some((item) => item.slug === slug))
  )
    notFound();
  if (detail.length === 2 && slug !== "plagas" && slug !== "patogenos")
    notFound();
  let result;
  try {
    result = await getPublicResult(token);
  } catch (error) {
    if (error instanceof DomainError && error.status === 404) notFound();
    const expired =
      error instanceof DomainError && error.code === "ENLACE_VENCIDO";
    if (!expired)
      logSafeError({
        operation: "shared_result.load",
        error_code: "RESULTADO_NO_DISPONIBLE",
        status: 500,
      });
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center text-avizor-navy">
        <h1 className="text-2xl font-bold">
          {expired ? "Este enlace venció" : "No pudimos cargar el resultado"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#526477]">
          {expired
            ? "El enlace está disponible durante 30 días desde la consulta. Realizá una nueva consulta para obtener información actualizada."
            : "Intentá abrir este enlace nuevamente en unos minutos."}
        </p>
        <Link
          href="/consultar"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-avizor-green px-5 text-sm font-bold text-white"
        >
          Realizar nueva consulta
        </Link>
      </main>
    );
  }
  const props = { initialResult: result, basePath: sharedResultPath(token) };
  if (slug === "plagas" && detail[1])
    return <PestFichaDetailV2 {...props} fichaId={detail[1]} />;
  if (slug === "patogenos" && detail[1])
    return (
      <PestFichaDetailV2 {...props} fichaId={detail[1]} tipo="enfermedad" />
    );
  if (slug === "plagas") return <PestDetailV2 {...props} />;
  if (slug === "patogenos")
    return <PestDetailV2 {...props} tipo="enfermedad" />;
  if (slug === "fenologia") return <PhenologyDetail {...props} />;
  if (slug) return <CategoryDetailV2 {...props} slug={slug} />;
  return <ResultSummaryV2 {...props} />;
}
