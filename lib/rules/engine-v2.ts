import type {
  ContextoFenologico,
  EvaluacionObservada,
  ReglaAgronomicaV2,
  ResultadoReglaV2,
  SerieClimaticaDiaria,
} from "@/types";
import {
  IndicatorEngine,
  evaluateOperator,
  formatThreshold,
} from "@/lib/indicators/engine";

export class RulesEngineV2 {
  constructor(private readonly indicators = new IndicatorEngine()) {}

  evaluate(
    rule: ReglaAgronomicaV2,
    series: SerieClimaticaDiaria[],
    evaluatedAt: string,
    phenology?: ContextoFenologico,
  ): ResultadoReglaV2 {
    const window = series.slice(-rule.ventana_dias);
    const modo: "estable" | "experimental" =
      rule.estado === "experimental" ? "experimental" : "estable";
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
      ventana: {
        desde: window[0]?.fecha ?? "",
        hasta: window.at(-1)?.fecha ?? "",
        dias: rule.ventana_dias,
      },
      evaluado_en: evaluatedAt,
    };

    if (
      rule.evaluabilidad === "NO_EVALUABLE" ||
      rule.evaluabilidad === "PENDIENTE_EVIDENCIA"
    ) {
      return noEvaluable(base, rule, "configuracion_incompleta");
    }

    const requiredVariables = rule.variables_requeridas ?? [];
    const definition = resolveDefinition(rule);
    const configuredVariables = new Set(
      definition.niveles.flatMap((level) =>
        level.condiciones.map((condition) => condition.variable),
      ),
    );
    const missingContext = requiredVariables.filter((variable) =>
      variable === "codigo_zadoks"
        ? phenology?.codigo_zadoks === null ||
          phenology?.codigo_zadoks === undefined
        : !configuredVariables.has(variable as never),
    );
    if (missingContext.length) {
      return noEvaluable(
        base,
        rule,
        `dato_requerido_no_disponible:${missingContext.join(",")}`,
      );
    }

    for (const variable of requiredVariables) {
      if (variable === "codigo_zadoks") continue;
      const condition = definition.niveles
        .flatMap((level) => level.condiciones)
        .find((item) => item.variable === variable);
      if (!condition) continue;
      const indicator = this.indicators.calculate(
        condition,
        series,
        rule.ventana_dias,
      );
      if (!indicator.disponible || indicator.valor === null) {
        return noEvaluable(
          base,
          rule,
          `dato_requerido_no_disponible:${variable}`,
        );
      }
    }

    if (rule.zadoks_desde !== null && rule.zadoks_desde !== undefined) {
      const zadoks = phenology?.codigo_zadoks;
      if (zadoks === null || zadoks === undefined) {
        return noEvaluable(base, rule, "fenologia_no_disponible");
      }
      if (
        zadoks < rule.zadoks_desde ||
        (rule.zadoks_hasta !== null &&
          rule.zadoks_hasta !== undefined &&
          zadoks > rule.zadoks_hasta)
      ) {
        return noEvaluable(base, rule, "fuera_fenologia");
      }
    }

    let bestObserved: EvaluacionObservada[] = [];
    let bestMatches = -1;
    for (const level of [...definition.niveles].sort(
      (a, b) => a.orden - b.orden,
    )) {
      const observed: EvaluacionObservada[] = [];
      for (const condition of level.condiciones) {
        const indicator = this.indicators.calculate(
          condition,
          series,
          rule.ventana_dias,
        );
        if (!indicator.disponible || indicator.valor === null) {
          return {
            ...base,
            estado: "indeterminado",
            motivo: "datos_insuficientes",
            observado: observed,
            detalle: {
              variable: condition.variable,
              agregador: condition.agregador,
              dias_esperados: indicator.diasEsperados,
              dias_disponibles: indicator.diasDisponibles,
              cobertura_requerida: indicator.coberturaRequerida,
            },
            calidad_dato: {
              cobertura_min: indicator.cobertura,
              dias_faltantes:
                indicator.diasEsperados - indicator.diasDisponibles,
              distancia_punto_km: null,
            },
          };
        }
        observed.push({
          variable: condition.variable,
          agregador: condition.agregador,
          valor: indicator.valor,
          unidad: condition.unidad,
          umbral: formatThreshold(condition.operador, condition.valor),
          cumple: evaluateOperator(
            indicator.valor,
            condition.operador,
            condition.valor,
          ),
          cobertura: indicator.cobertura,
        });
      }

      if (observed.every((item) => item.cumple)) {
        return {
          ...base,
          estado: level.clave,
          etiqueta: level.etiqueta,
          explicacion: level.explicacion,
          recomendacion: level.recomendacion,
          fuente_tecnica: rule.fuente_tecnica,
          limitaciones_declaradas: rule.limitaciones_declaradas,
          orden_visual: level.orden_visual,
          observado: observed,
          calidad_dato: quality(observed, rule.ventana_dias),
        };
      }

      const matches = observed.filter((item) => item.cumple).length;
      if (matches > bestMatches) {
        bestMatches = matches;
        bestObserved = observed;
      }
    }

    return {
      ...base,
      estado: definition.sin_coincidencia?.estado ?? "indeterminado",
      motivo: definition.sin_coincidencia?.motivo ?? "sin_nivel_coincidente",
      fuente_tecnica: rule.fuente_tecnica,
      limitaciones_declaradas: rule.limitaciones_declaradas,
      observado: bestObserved,
      calidad_dato: quality(bestObserved, rule.ventana_dias),
    };
  }
}

function noEvaluable(
  base: Omit<ResultadoReglaV2, "estado" | "observado" | "calidad_dato">,
  rule: ReglaAgronomicaV2,
  motivo: string,
): ResultadoReglaV2 {
  return {
    ...base,
    estado: "no_evaluable",
    motivo,
    explicacion: rule.texto_no_evaluable ?? undefined,
    recomendacion: rule.accion_sugerida ?? undefined,
    fuente_tecnica: rule.fuente_tecnica,
    limitaciones_declaradas: rule.limitaciones_declaradas,
    observado: [],
    calidad_dato: {
      cobertura_min: 0,
      dias_faltantes: rule.ventana_dias,
      distancia_punto_km: null,
    },
  };
}

function resolveDefinition(
  rule: ReglaAgronomicaV2,
): ReglaAgronomicaV2["definicion"] {
  const configured = rule.condiciones_logicas;
  if (!configured) return rule.definicion;
  if (configured.niveles?.length) {
    return {
      niveles: configured.niveles,
      sin_coincidencia: configured.sin_coincidencia,
    };
  }
  if (configured.all?.length) {
    return {
      niveles: [
        {
          orden: 1,
          clave: rule.nivel_resultado ?? "vigilancia",
          orden_visual: 1,
          etiqueta: rule.texto_alerta ?? rule.nombre_regla ?? rule.clave,
          recomendacion: rule.accion_sugerida ?? undefined,
          condiciones: configured.all,
        },
      ],
      sin_coincidencia: configured.sin_coincidencia ?? {
        estado: "sin_condiciones",
      },
    };
  }
  return rule.definicion;
}

function quality(observed: EvaluacionObservada[], windowDays: number) {
  const min = observed.length
    ? Math.min(...observed.map((item) => item.cobertura))
    : 1;
  return {
    cobertura_min: min,
    dias_faltantes: Math.max(0, windowDays - Math.ceil(windowDays * min)),
    distancia_punto_km: null,
  };
}
