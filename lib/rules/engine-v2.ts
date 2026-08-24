import type { EvaluacionObservada, ReglaAgronomicaV2, ResultadoReglaV2, SerieClimaticaDiaria } from "@/types";
import { IndicatorEngine, evaluateOperator, formatThreshold } from "@/lib/indicators/engine";

export class RulesEngineV2 {
  constructor(private readonly indicators = new IndicatorEngine()) {}

  evaluate(rule: ReglaAgronomicaV2, series: SerieClimaticaDiaria[], evaluatedAt: string): ResultadoReglaV2 {
    const window = series.slice(-rule.ventana_dias);
    const modo: "estable" | "experimental" = rule.estado === "experimental" ? "experimental" : "estable";
    const base = {
      riesgo: rule.clave,
      regla: {
        clave: rule.clave,
        version: rule.version,
        estado: rule.estado,
        modo,
        nombre: rule.nombre,
        categoria: rule.categoria,
        evaluabilidad: rule.evaluabilidad,
      },
      ventana: { desde: window[0]?.fecha ?? "", hasta: window.at(-1)?.fecha ?? "", dias: rule.ventana_dias },
      evaluado_en: evaluatedAt,
    };

    let bestObserved: EvaluacionObservada[] = [];
    let bestMatches = -1;
    for (const level of [...rule.definicion.niveles].sort((a, b) => a.orden - b.orden)) {
      const observed: EvaluacionObservada[] = [];
      for (const condition of level.condiciones) {
        const indicator = this.indicators.calculate(condition, series, rule.ventana_dias);
        if (!indicator.disponible || indicator.valor === null) {
          return {
            ...base,
            estado: "indeterminado",
            motivo: "datos_insuficientes",
            observado: observed,
            detalle: { variable: condition.variable, agregador: condition.agregador, dias_esperados: indicator.diasEsperados, dias_disponibles: indicator.diasDisponibles, cobertura_requerida: indicator.coberturaRequerida },
            calidad_dato: { cobertura_min: indicator.cobertura, dias_faltantes: indicator.diasEsperados - indicator.diasDisponibles, distancia_punto_km: null },
          };
        }
        observed.push({ variable: condition.variable, agregador: condition.agregador, valor: indicator.valor, unidad: condition.unidad, umbral: formatThreshold(condition.operador, condition.valor), cumple: evaluateOperator(indicator.valor, condition.operador, condition.valor), cobertura: indicator.cobertura });
      }

      if (observed.every((item) => item.cumple)) {
        return { ...base, estado: level.clave, etiqueta: level.etiqueta, explicacion: level.explicacion, recomendacion: level.recomendacion, fuente_tecnica: rule.fuente_tecnica, limitaciones_declaradas: rule.limitaciones_declaradas, orden_visual: level.orden_visual, observado: observed, calidad_dato: quality(observed, rule.ventana_dias) };
      }

      const matches = observed.filter((item) => item.cumple).length;
      if (matches > bestMatches) {
        bestMatches = matches;
        bestObserved = observed;
      }
    }

    return { ...base, estado: rule.definicion.sin_coincidencia?.estado ?? "indeterminado", motivo: rule.definicion.sin_coincidencia?.motivo ?? "sin_nivel_coincidente", fuente_tecnica: rule.fuente_tecnica, limitaciones_declaradas: rule.limitaciones_declaradas, observado: bestObserved, calidad_dato: quality(bestObserved, rule.ventana_dias) };
  }
}

function quality(observed: EvaluacionObservada[], windowDays: number) {
  const min = observed.length ? Math.min(...observed.map((item) => item.cobertura)) : 1;
  return { cobertura_min: min, dias_faltantes: Math.max(0, windowDays - Math.ceil(windowDays * min)), distancia_punto_km: null };
}
