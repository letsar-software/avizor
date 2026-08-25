import type { AsociacionRegionalPlaga, ContextoFenologico, EvaluacionPlaga, IndicadorPlaga, ReglaPlaga, SerieClimaticaDiaria, SpecOperator } from "@/types";

const RAIN_DAY_MM = 1;

type Metric = { value: number | null; coverage: number };

export class PestRulesEngine {
  evaluate(input: { rule: ReglaPlaga; region: AsociacionRegionalPlaga; series: SerieClimaticaDiaria[]; phenology: ContextoFenologico; fechaRef: string; evaluatedAt: string }): EvaluacionPlaga {
    const { rule, region, phenology, fechaRef, evaluatedAt } = input;
    const inUsualPeriod = monthApplies(Number(fechaRef.slice(5, 7)), region.meses_desde, region.meses_hasta);
    const base = {
      grupo: rule.grupo_plaga,
      especies: rule.especies,
      tipo_regla: rule.tipo_regla,
      zona: region.zona_agronomica,
      prioridad_regional: region.prioridad,
      fenologia: phenology.disponible && phenology.estadio_estimado ? { estado: phenology.estadio_estimado, tipo: "estimada" as const } : null,
      regla: rule.id,
      version: rule.version,
      nivel_evidencia_climatica: rule.nivel_evidencia_climatica,
      indicadores: {},
      cobertura: {},
      textos: rule.textos,
      evaluado_en: evaluatedAt,
      ...(!inUsualPeriod && rule.tipo_regla === "climatica" ? { fuera_periodo_habitual: true } : {}),
    };

    if (!rule.activa || rule.estado === "retirada") return { ...base, estado: "no_evaluada", motivo: "configuracion_incompleta", calidad_dato: "baja" };
    if (!region.aplicable || region.prioridad === "sin_evidencia_suficiente") return { ...base, estado: "no_evaluada", motivo: "fuera_zona", calidad_dato: "baja" };
    if (!inUsualPeriod && rule.tipo_regla === "prioridad_monitoreo") return { ...base, estado: "no_evaluada", motivo: "fuera_periodo", calidad_dato: "baja" };

    if (rule.fenologia_desde || rule.fenologia_hasta) {
      if (!phenology.disponible || !phenology.estadio_estimado) return { ...base, estado: "indeterminado", motivo: "fenologia_no_disponible", calidad_dato: "baja" };
      if (!phenologyApplies(phenology.estadio_estimado, rule.fenologia_desde, rule.fenologia_hasta)) return { ...base, estado: "no_evaluada", motivo: "fuera_fenologia", calidad_dato: "alta" };
    }

    if (rule.tipo_regla === "prioridad_monitoreo") return { ...base, estado: "periodo_relevante_monitoreo", calidad_dato: "alta" };
    if (!rule.configuracion.niveles?.length) return { ...base, estado: "indeterminado", motivo: "configuracion_incompleta", calidad_dato: "baja" };

    const calculated = Object.fromEntries(rule.variables_requeridas.map((key) => [key, calculate(key, input.series, rule.configuracion)])) as Record<IndicadorPlaga, Metric>;
    const indicadores = Object.fromEntries(Object.entries(calculated).filter(([, metric]) => metric.value !== null).map(([key, metric]) => [key, metric.value])) as Partial<Record<IndicadorPlaga, number>>;
    const cobertura = Object.fromEntries(Object.entries(calculated).map(([key, metric]) => [key, metric.coverage])) as Partial<Record<IndicadorPlaga, number>>;
    const quality = qualityFromCoverage(Object.values(calculated).map((item) => item.coverage));
    if (Object.values(calculated).some((item) => item.value === null || item.coverage < 1)) return { ...base, indicadores, cobertura, estado: "indeterminado", motivo: "datos_insuficientes", calidad_dato: quality };

    for (const level of [...rule.configuracion.niveles].sort((a, b) => a.orden - b.orden)) {
      const matches = level.condiciones.map((condition) => compare(calculated[condition.indicador].value!, condition.operador, condition.valor));
      if (level.combinador === "all" ? matches.every(Boolean) : matches.some(Boolean)) return { ...base, indicadores, cobertura, estado: level.estado, calidad_dato: quality };
    }
    return { ...base, indicadores, cobertura, estado: "indeterminado", motivo: "sin_nivel_coincidente", calidad_dato: quality };
  }
}

function calculate(key: IndicadorPlaga, series: SerieClimaticaDiaria[], config: ReglaPlaga["configuracion"]): Metric {
  const days = key.includes("10d") || key === "dias_consecutivos_sin_lluvia" ? 10 : 7;
  const window = series.slice(-days);
  const precipitation = window.map((day) => day.precipitacion);
  const mean = window.map((day) => day.temperaturaMedia);
  const maximum = window.map((day) => day.temperaturaMaxima);
  if (window.length !== days) return { value: null, coverage: window.length / days };
  if (key.startsWith("precip_") || key.startsWith("dias_con_lluvia") || key === "dias_consecutivos_sin_lluvia") {
    const values = complete(precipitation);
    if (!values) return { value: null, coverage: validCount(precipitation) / days };
    if (key.startsWith("precip_")) return metric(sum(values), 1);
    if (key.startsWith("dias_con_lluvia")) return metric(values.filter((value) => value >= RAIN_DAY_MM).length, 1);
    let max = 0; let current = 0;
    for (const value of values) { current = value < RAIN_DAY_MM ? current + 1 : 0; max = Math.max(max, current); }
    return metric(max, 1);
  }
  const source = key === "temp_media_7d" || key === "temp_media_10d" ? mean : maximum;
  const values = complete(source);
  if (!values) return { value: null, coverage: validCount(source) / days };
  if (key === "dias_calidos_10d") {
    if (config.umbral_termico === undefined) return { value: null, coverage: 1 };
    return metric(values.filter((value) => value >= config.umbral_termico!).length, 1);
  }
  return metric(sum(values) / values.length, 1);
}

function complete(values: Array<number | null>) { return values.every((value): value is number => typeof value === "number" && Number.isFinite(value)) ? values : null; }
function validCount(values: Array<number | null>) { return values.filter((value) => typeof value === "number" && Number.isFinite(value)).length; }
function sum(values: number[]) { return values.reduce((total, value) => total + value, 0); }
function metric(value: number, coverage: number): Metric { return { value: Number(value.toFixed(2)), coverage }; }
function qualityFromCoverage(values: number[]): "alta" | "media" | "baja" { const min = values.length ? Math.min(...values) : 0; return min === 1 ? "alta" : min >= 0.8 ? "media" : "baja"; }
function compare(value: number, operator: SpecOperator, target: number) { if (operator === "gt") return value > target; if (operator === "gte") return value >= target; if (operator === "lt") return value < target; if (operator === "lte") return value <= target; return value === target; }
function monthApplies(month: number, from: number | null, to: number | null) { if (from === null || to === null) return true; return from <= to ? month >= from && month <= to : month >= from || month <= to; }
function phenologyApplies(stage: string, from: string | null, to: string | null) { const rank = phenologyRank(stage); const start = from ? phenologyRank(from) : -Infinity; const end = to ? phenologyRank(to) : Infinity; return rank !== null && start !== null && end !== null && rank >= start && rank <= end; }
function phenologyRank(stage: string): number | null { const match = /^(VE|VC|V|R)(\d+)?/i.exec(stage.trim()); if (!match) return null; const prefix = match[1].toUpperCase(); const number = Number(match[2] ?? 0); if (prefix === "VE") return 0; if (prefix === "VC") return 1; if (prefix === "V") return 2 + number; return 100 + number; }
