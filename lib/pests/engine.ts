import type { AsociacionRegionalPlaga, ContextoFenologico, EvaluacionPlaga, IndicadorPlaga, ReglaPlaga, SerieClimaticaDiaria } from "@/types";
import { IndicatorEngine, evaluateOperator } from "@/lib/indicators/engine";
import { resolverIndicadorPlaga } from "@/lib/pests/indicator-spec";

type Metric = { value: number | null; coverage: number };

export class PestRulesEngine {
  constructor(private readonly indicators = new IndicatorEngine()) {}

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

    const calculated = Object.fromEntries(rule.variables_requeridas.map((key) => [key, this.calcular(key, input.series, rule.configuracion)])) as Record<IndicadorPlaga, Metric>;
    const indicadores = Object.fromEntries(Object.entries(calculated).filter(([, metric]) => metric.value !== null).map(([key, metric]) => [key, metric.value])) as Partial<Record<IndicadorPlaga, number>>;
    const cobertura = Object.fromEntries(Object.entries(calculated).map(([key, metric]) => [key, metric.coverage])) as Partial<Record<IndicadorPlaga, number>>;
    const quality = qualityFromCoverage(Object.values(calculated).map((item) => item.coverage));
    if (Object.values(calculated).some((item) => item.value === null || item.coverage < 1)) return { ...base, indicadores, cobertura, estado: "indeterminado", motivo: "datos_insuficientes", calidad_dato: quality };

    for (const level of [...rule.configuracion.niveles].sort((a, b) => a.orden - b.orden)) {
      const matches = level.condiciones.map((condition) => evaluateOperator(calculated[condition.indicador].value!, condition.operador, condition.valor));
      if (level.combinador === "all" ? matches.every(Boolean) : matches.some(Boolean)) return { ...base, indicadores, cobertura, estado: level.estado, calidad_dato: quality };
    }
    return { ...base, indicadores, cobertura, estado: "indeterminado", motivo: "sin_nivel_coincidente", calidad_dato: quality };
  }

  private calcular(key: IndicadorPlaga, series: SerieClimaticaDiaria[], config: ReglaPlaga["configuracion"]): Metric {
    const resolved = resolverIndicadorPlaga(key, config);
    if (!resolved) return { value: null, coverage: 0 };
    const result = this.indicators.calculate(resolved.spec, series, resolved.ventanaDias);
    return { value: result.valor, coverage: result.cobertura };
  }
}

function qualityFromCoverage(values: number[]): "alta" | "media" | "baja" { const min = values.length ? Math.min(...values) : 0; return min === 1 ? "alta" : min >= 0.8 ? "media" : "baja"; }
function monthApplies(month: number, from: number | null, to: number | null) { if (from === null || to === null) return true; return from <= to ? month >= from && month <= to : month >= from || month <= to; }
function phenologyApplies(stage: string, from: string | null, to: string | null) { const rank = phenologyRank(stage); const start = from ? phenologyRank(from) : -Infinity; const end = to ? phenologyRank(to) : Infinity; return rank !== null && start !== null && end !== null && rank >= start && rank <= end; }
function phenologyRank(stage: string): number | null { const match = /^(VE|VC|V|R)(\d+)?/i.exec(stage.trim()); if (!match) return null; const prefix = match[1].toUpperCase(); const number = Number(match[2] ?? 0); if (prefix === "VE") return 0; if (prefix === "VC") return 1; if (prefix === "V") return 2 + number; return 100 + number; }
