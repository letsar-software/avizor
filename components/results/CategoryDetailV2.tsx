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
import {
  aggregateClimate,
  formatNumber,
  ruleForSlug,
  statusLabel,
} from "@/lib/results/presentation";
import {
  CategoryIconChip,
  ResultScopeNote,
  SEVERITY_TONES,
  categoryIcons,
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
  const { definition, rule, rules } = selected;
  const Icon = categoryIcons[definition.slug];
  const severity = severityOf(rule);
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
              {definition.name}
            </h1>
            <p className={`mt-2 text-base font-bold ${tone.text}`}>
              {statusLabel(rule, definition.name)}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#405369]">
              {detailExplanation(rule)}
            </p>
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
        activeSlug={definition.slug}
        basePath={basePath}
      />
      {definition.slug === "enfermedades_foliares" && rules.length ? (
        <DiseaseEvaluationCards rules={rules} cultivo={result.cultivo} />
      ) : null}
      <div className="mt-3">
        <CategoryClimate
          series={visualSeries}
          category={definition.slug}
          historico={result.historico_temperatura}
        />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <CategoryRuleComparison rule={rule} categoryName={definition.name} />
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
  if (!rule) return "Esta categoría no pudo evaluarse.";
  if (rule.explicacion) return rule.explicacion;
  if (rule.estado === "evaluacion_incompleta")
    return "Se muestran las variables climáticas disponibles, pero faltan requisitos agronómicos para completar la evaluación.";
  if (rule.motivo === "datos_insuficientes")
    return "No hay datos suficientes para evaluar esta categoría con la cobertura requerida.";
  if (rule.estado === "sin_condiciones")
    return "Durante el período analizado, los valores observados no alcanzaron el umbral definido para esta regla.";
  return "Los datos observados no coinciden por completo con ninguno de los niveles definidos para esta regla.";
}
function DiseaseEvaluations({
  rules,
  summary,
  fenologia,
}: {
  rules: ResultadoConsultaV2Publica["reglas"];
  summary: ReturnType<typeof aggregateClimate>;
  fenologia: ResultadoConsultaV2Publica["contexto_fenologico"];
}) {
  return (
    <section className="mt-3 rounded-xl border bg-white p-5">
      <h2 className="text-base font-bold">Enfermedades evaluadas</h2>
      <p className="mt-1 text-sm text-[#526477]">
        Cada señal corresponde a una regla ambiental específica y no constituye
        un diagnóstico.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((item) => {
          const name = item.regla.nombre ?? item.riesgo.replaceAll("_", " ");
          const tone = SEVERITY_TONES[severityOf(item)];
          const temperature = item.observado.find(
            (value) => value.variable === "temperatura_media",
          );
          const rain = item.observado.find(
            (value) => value.variable === "precipitacion",
          );
          return (
            <article
              key={`${item.regla.clave}-${item.regla.version}`}
              className={`rounded-lg border p-4 ${tone.border}`}
            >
              <h3 className="text-sm font-bold">{name}</h3>
              <p className={`mt-2 text-sm font-semibold ${tone.text}`}>
                {statusLabel(item, name)}
              </p>
              <dl className="mt-3 space-y-1 text-xs text-[#405369]">
                <div>
                  <dt className="inline font-semibold">Temperatura: </dt>
                  <dd className="inline">
                    {temperature
                      ? `${formatNumber(temperature.valor)} °C · referencia ${temperature.umbral} °C · ${temperature.cumple ? "coincide" : "no coincide"}`
                      : "No disponible"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Humedad relativa: </dt>
                  <dd className="inline">
                    {formatNumber(summary.humidity)} % (disponible; no equivale
                    a mojado foliar)
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Precipitación: </dt>
                  <dd className="inline">
                    {rain
                      ? `${formatNumber(rain.valor)} mm · ${rain.cumple ? "coincide" : "no coincide"}`
                      : `${formatNumber(summary.precipitation)} mm observados`}
                  </dd>
                </div>
                {item.riesgo === "fusariosis_espiga" ? (
                  <div>
                    <dt className="inline font-semibold">Fenología: </dt>
                    <dd className="inline">
                      {fenologia.disponible
                        ? (fenologia.descripcion ?? fenologia.estadio_estimado)
                        : "No informada"}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="inline font-semibold">Variable faltante: </dt>
                  <dd className="inline">
                    Mojado foliar e inóculo no disponibles.
                  </dd>
                </div>
              </dl>
              {item.motivo ? (
                <p className="mt-2 text-xs text-[#526477]">
                  Motivo: {item.motivo.replaceAll("_", " ")}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
