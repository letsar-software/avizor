"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { ResultadoConsultaV2Publica } from "@/types";
import { ruleForSlug, representativeRule, statusLabel } from "@/lib/results/presentation";
import { categoryForSlug } from "@/lib/results/category-presentation";
import { AdvisoryNote, CATEGORY_ICONS, RequiredDataList } from "@/components/results/CategoryRiskCard";
import {
  CategoryIconChip,
  ResultScopeNote,
  SEVERITY_TONES,
  severityOf,
} from "@/components/results/shared";
import {
  useResult,
  type ResultViewProps,
} from "@/components/results/useResult";
import { DiseaseEvaluationCards } from "@/components/results/DiseaseEvaluationCards";
import { CategoryDetailMetadata } from "@/components/results/CategoryDetailMetadata";
import { CategoryInformationCard } from "@/components/results/CategoryInformationCard";
import { CategoryNavigation } from "@/components/results/CategoryNavigation";
import { CategoryClimate } from "@/components/results/CategoryClimate";
import { CategoryRuleComparison } from "@/components/results/CategoryRuleComparison";
import { CategoryMatches } from "@/components/results/CategoryMatches";
export default function CategoryDetailV2({
  slug,
  initialResult,
  basePath = "/resultado",
}: { slug: string } & ResultViewProps) {
  const { result, loaded } = useResult(initialResult);
  const selected = useMemo(
    () => (result ? ruleForSlug(result, slug) : null),
    [result, slug],
  );
  if (!loaded) return <main className="min-h-[60vh]" />;
  if (!result || !selected)
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">
          Necesitamos una consulta actualizada
        </h1>
        <Link
          href="/consultar"
          className="mt-5 inline-flex rounded-lg bg-[#087b4b] px-5 py-3 text-white"
        >
          Realizar consulta
        </Link>
      </main>
    );
  const { definition } = selected;
  // La cabecera usa el mismo modelo que la tarjeta del resumen, para cualquier cultivo.
  const card = categoryForSlug(result, slug);
  const rules = card?.rules.length ? card.rules : selected.rules;
  const rule = card?.rules.length ? representativeRule(card.rules) : selected.rule;
  const categoryKey = card?.key ?? definition.slug;
  const Icon = CATEGORY_ICONS[categoryKey] ?? CATEGORY_ICONS.enfermedades_foliares;
  const severity = card?.tone ?? severityOf(rule);
  const tone = SEVERITY_TONES[severity];
  const days = rule?.ventana.dias ?? 14;
  const ruleSeries = result.clima.serie.slice(-days);
  const visualSeries = result.clima.serie.slice(-14);
  return (
    <main className="mx-auto max-w-[1420px] px-4 py-5 text-[#081a31] sm:px-7 lg:py-8">
      <Link
        href={basePath}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#087b4b]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al resultado
      </Link>
      <section className="mt-2 grid gap-5 rounded-xl bg-white p-1 lg:grid-cols-[1fr_1.05fr] lg:border lg:p-6">
        <div className="flex gap-4">
          <CategoryIconChip Icon={Icon} severity={severity} size="lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#087b4b]">
              Detalle por categoría
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {card?.title ?? definition.name}
            </h1>
            <p className={`mt-2 text-base font-bold ${tone.text}`}>
              {card?.display_status ?? statusLabel(rule)}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#405369]">
              {card?.message ?? detailExplanation(rule)}
            </p>
            {card ? (
              <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[#081a31]">
                {card.recommended_action}
              </p>
            ) : null}
            {card?.advisory ? <AdvisoryNote reviewedAt={card.advisory.reviewed_at} /> : null}
            {card ? <RequiredDataList items={card.required_data} /> : null}
          </div>
        </div>
        <CategoryDetailMetadata
          result={result}
          days={days}
          ruleSeries={ruleSeries}
        />
      </section>
      <CategoryNavigation
        result={result}
        activeSlug={categoryKey}
        basePath={basePath}
      />
      {card?.matched_rules.length ? <CategoryMatches matches={card.matched_rules} /> : null}
      {categoryKey === "enfermedades_foliares" && rules.length ? (
        <DiseaseEvaluationCards rules={rules} cultivo={result.cultivo} />
      ) : null}
      <div className="mt-3">
        <CategoryClimate
          series={visualSeries}
          category={categoryKey}
          historico={result.historico_temperatura}
        />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <CategoryRuleComparison rule={rule} categoryName={card?.title ?? definition.name} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <CategoryInformationCard
          Icon={BookOpen}
          title="Fuente y evidencia"
          lines={[
            rule?.fuente_tecnica ?? "Fuente técnica registrada en la regla.",
          ]}
        />
        <CategoryInformationCard
          Icon={Eye}
          title="Qué observar"
          lines={[
            rule?.recomendacion ?? "Mantener el monitoreo habitual del lote.",
          ]}
        />
        <CategoryInformationCard
          Icon={TriangleAlert}
          title="Limitaciones"
          lines={[
            rule?.limitaciones_declaradas ??
              "No reemplaza la observación a campo.",
          ]}
        />
        <CategoryInformationCard
          Icon={ShieldCheck}
          title="Calidad de los datos"
          lines={[
            `Fuente: ${result.proveedor_climatico}`,
            `Cobertura: ${Math.round((rule?.calidad_dato.cobertura_min ?? result.clima.cobertura) * 100)} %`,
            `Período: ${rule?.ventana.dias ?? 14} días`,
          ]}
        />
      </div>
      <div className="mt-3">
        <ResultScopeNote />
      </div>
    </main>
  );
}
function detailExplanation(
  rule: ResultadoConsultaV2Publica["reglas"][number] | undefined,
) {
  if (rule?.explicacion && rule.estado !== "no_evaluable") return rule.explicacion;
  if (!rule || rule.estado === "no_evaluable" || rule.estado === "requiere_validacion_agronoma")
    return "Conviene seguir esta categoría con monitoreo a campo mientras se suman los datos del lote.";
  if (rule.estado === "sin_condiciones")
    return "Durante el período analizado, los valores observados no alcanzaron el umbral definido para esta regla.";
  return "Algunas condiciones del período justifican seguir el lote de cerca.";
}
