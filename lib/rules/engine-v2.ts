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
import {
  complementaryVariables,
  criticalVariables,
  declaredCriticalVariables,
  isVariableAvailable,
} from "@/lib/rules/variables";
import { fieldValueSource, numericValue, type CurrentFieldData } from "@/lib/field-data/current";
import { explicitMissingVariables } from "@/lib/rules/required-data";

type Condition = ReglaAgronomicaV2["definicion"]["niveles"][number]["condiciones"][number];

/** Un dato de campo reemplaza a la estimación sólo para variables de estado (no acumuladas). */
const FIELD_OVERRIDE_AGGREGATORS = new Set<Condition["agregador"]>(["media_ventana", "min_ventana"]);

export class RulesEngineV2 {
  constructor(private readonly indicators = new IndicatorEngine()) {}

  evaluate(
    rule: ReglaAgronomicaV2,
    series: SerieClimaticaDiaria[],
    evaluatedAt: string,
    phenology?: ContextoFenologico,
    fieldData?: CurrentFieldData,
  ): ResultadoReglaV2 {
    // Una etapa cargada en el lote (vigente) prevalece sobre la estimada.
    const stage = numericValue(fieldData?.get("codigo_zadoks"));
    const effectivePhenology: ContextoFenologico | undefined = stage !== null
      ? { ...(phenology ?? { modifica_reglas: false }), disponible: true, codigo_zadoks: stage, fuente: "Dato de campo", modifica_reglas: false }
      : phenology;
    const evaluated = this.evaluateLevels(rule, series, evaluatedAt, effectivePhenology, fieldData);
    if (evaluated.motivo === "fuera_fenologia") return evaluated;
    // Sólo se piden las críticas que realmente no tienen dato (el motivo puede ser otro).
    const incomplete = evaluated.estado === "no_evaluable" || evaluated.estado === "requiere_validacion_agronoma";
    const result = incomplete
      ? {
          ...evaluated,
          missing_critical_variables: explicitMissingVariables(evaluated) ?? criticalVariables(rule).filter(
            (variable) => !isVariableAvailable(variable, series, rule.ventana_dias, effectivePhenology, fieldData),
          ),
        }
      : evaluated;
    // Los complementarios nunca cambian el estado: sólo se informan como dato a sumar.
    const missing = complementaryVariables(rule).filter(
      (variable) => !isVariableAvailable(variable, series, rule.ventana_dias, effectivePhenology, fieldData),
    );
    return missing.length ? { ...result, missing_complementary_variables: missing } : result;
  }

  /** Dato de campo vigente (medido) antes que la estimación del proveedor climático. */
  private indicator(condition: Condition, series: SerieClimaticaDiaria[], windowDays: number, fieldData?: CurrentFieldData) {
    const measured = FIELD_OVERRIDE_AGGREGATORS.has(condition.agregador) ? numericValue(fieldData?.get(condition.variable)) : null;
    if (measured !== null) {
      const datum = fieldData!.get(condition.variable)!;
      return { valor: measured, cobertura: 1, disponible: true, diasEsperados: windowDays, diasDisponibles: windowDays, coberturaRequerida: 1, fuente: fieldValueSource(datum.source) };
    }
    return { ...this.indicators.calculate(condition, series, windowDays), fuente: undefined };
  }

  private evaluateLevels(
    rule: ReglaAgronomicaV2,
    series: SerieClimaticaDiaria[],
    evaluatedAt: string,
    phenology?: ContextoFenologico,
    fieldData?: CurrentFieldData,
  ): ResultadoReglaV2 {
    const window = series.slice(-rule.ventana_dias);
    const modo: "estable" | "experimental" =
      rule.estado === "experimental" ? "experimental" : "estable";
    const base = {
      riesgo: rule.clave,
      regla: {
        id: rule.id,
        clave: rule.clave,
        version: rule.version,
        estado: rule.estado,
        modo,
        nombre: rule.nombre,
        ...(rule.nombre_cientifico ? { nombre_cientifico: rule.nombre_cientifico } : {}),
        categoria: rule.categoria,
        ...(rule.categoria_clave ? { categoria_clave: rule.categoria_clave } : {}),
        evaluabilidad: rule.evaluabilidad,
        prioridad: rule.prioridad,
        validation_status: rule.validation_status ?? validationStatusFromLegacy(rule),
        evidence_level: rule.evidence_level ?? evidenceLevelFromLegacy(rule),
        source_name: rule.source_name ?? rule.fuente_tecnica,
        source_url: rule.source_url ?? rule.url_fuente,
        reviewed_at: rule.reviewed_at ?? rule.validado_en,
        notes: rule.notes ?? rule.limitaciones_declaradas,
        critical_required_variables: criticalVariables(rule),
        complementary_required_variables: complementaryVariables(rule),
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

    // Críticas declaradas (o variables_requeridas en reglas históricas).
    const requiredVariables = declaredCriticalVariables(rule);
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
        : // Fuera de las condiciones, una crítica cuenta si hay dato (serie, etapa o lote).
          !configuredVariables.has(variable as never) &&
          !isVariableAvailable(variable, series, rule.ventana_dias, phenology, fieldData),
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
      const indicator = this.indicator(condition, series, rule.ventana_dias, fieldData);
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
        const indicator = this.indicator(condition, series, rule.ventana_dias, fieldData);
        if (!indicator.disponible || indicator.valor === null) {
          return {
            ...base,
            estado: "no_evaluable",
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
          ...(indicator.fuente ? { fuente: indicator.fuente } : {}),
        });
      }

      if (observed.every((item) => item.cumple)) {
        return {
          ...base,
          estado: normalizeResultState(level.clave),
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
      estado: normalizeResultState(definition.sin_coincidencia?.estado ?? "no_evaluable"),
      motivo: definition.sin_coincidencia?.motivo ?? "sin_nivel_coincidente",
      fuente_tecnica: rule.fuente_tecnica,
      limitaciones_declaradas: rule.limitaciones_declaradas,
      observado: bestObserved,
      calidad_dato: quality(bestObserved, rule.ventana_dias),
    };
  }
}

/** Compatibilidad de lectura para reglas históricas; la API nunca emite estos alias. */
function normalizeResultState(value: string) {
  const aliases: Record<string, import("@/types").EstadoResultadoRegla> = {
    favorables: "favorable",
    condiciones_detectadas: "favorable",
    moderadas: "vigilancia",
    condiciones_parciales: "vigilancia",
    indeterminado: "no_evaluable",
    evaluacion_incompleta: "no_evaluable",
    desfavorables: "sin_condiciones",
  };
  if (value in aliases) return aliases[value];
  if (["no_evaluable", "sin_condiciones", "informativo", "vigilancia", "moderado", "alto", "critico", "favorable", "requiere_validacion_agronoma"].includes(value)) {
    return value as import("@/types").EstadoResultadoRegla;
  }
  return "no_evaluable";
}

function validationStatusFromLegacy(rule: ReglaAgronomicaV2) {
  return rule.requiere_validacion_agronomica
    ? "requiere_validacion_agronoma"
    : "validada";
}

function evidenceLevelFromLegacy(rule: ReglaAgronomicaV2) {
  if (rule.nivel_evidencia === "alta" || rule.nivel_evidencia === "media" || rule.nivel_evidencia === "limitada") {
    return rule.nivel_evidencia;
  }
  return "limitada";
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
