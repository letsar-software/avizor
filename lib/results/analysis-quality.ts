import type { CoberturaAnalisis, EstadoCoberturaAnalisis, EvaluacionLimitadaPorClima, ResultadoReglaV2 } from "@/types";

function isStable(rule: ResultadoReglaV2) { return rule.regla.modo !== "experimental" && rule.regla.estado !== "experimental"; }
function normalizedCoverage(value: number) { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; }
function detailNumber(detail: Record<string, unknown> | undefined, key: string, fallback: number) { const value = detail?.[key]; return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function limitedEvaluation(rule: ResultadoReglaV2): EvaluacionLimitadaPorClima | null {
  if (rule.estado !== "indeterminado" || rule.motivo !== "datos_insuficientes") return null;
  const expected = detailNumber(rule.detalle, "dias_esperados", rule.ventana.dias);
  const available = detailNumber(rule.detalle, "dias_disponibles", Math.max(0, expected - rule.calidad_dato.dias_faltantes));
  const variable = typeof rule.detalle?.variable === "string" ? rule.detalle.variable : undefined;
  return { riesgo: rule.riesgo, ...(rule.regla.categoria ? { categoria: rule.regla.categoria } : {}), ...(variable ? { variable } : {}), dias_esperados: expected, dias_disponibles: available, dias_faltantes: Math.max(0, expected - available), cobertura: normalizedCoverage(rule.calidad_dato.cobertura_min), motivo: "datos_insuficientes" };
}
export function analysisCoverageLabel(state: EstadoCoberturaAnalisis) { return ({ datos_completos: "Datos completos", datos_parciales: "Datos parciales", datos_insuficientes: "Datos insuficientes" })[state]; }
/** Cobertura = mínimo observado entre reglas estables evaluadas; para `datos_insuficientes`, también considera días disponibles/esperados. */
export function calculateAnalysisQuality(results: ResultadoReglaV2[], fallbackCoverage = 1): CoberturaAnalisis {
  const stable = results.filter(isStable); const coverages = stable.map((rule) => normalizedCoverage(rule.calidad_dato.cobertura_min));
  const limited = stable.map(limitedEvaluation).filter((item): item is EvaluacionLimitadaPorClima => item !== null);
  const limitedCoverages = limited.map((item) => item.dias_esperados > 0 ? normalizedCoverage(item.dias_disponibles / item.dias_esperados) : item.cobertura);
  const cobertura = coverages.length ? Math.min(...coverages, ...limitedCoverages) : normalizedCoverage(fallbackCoverage);
  const estado: EstadoCoberturaAnalisis = limited.length ? "datos_insuficientes" : cobertura < 1 ? "datos_parciales" : "datos_completos";
  return { cobertura, estado, variables_faltantes_relevantes: Array.from(new Set(limited.flatMap((item) => item.variable ? [item.variable] : []))), evaluaciones_limitadas: limited };
}
