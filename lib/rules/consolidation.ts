import type {
  AgronomicAdvisory,
  CalculationCompleteness,
  ConsolidatedCategoryRisk,
  MatchedRule,
  ResultadoReglaV2,
  RiskCategory,
  RiskStatus,
} from "@/types";
import { DEFAULT_ACTION, DEFAULT_MESSAGE, MONITORING_ONLY, displayStatus } from "@/lib/rules/display";
import { isOutsideApplicability, missingVariablesOf, requiredDataFor, type VariableLabels } from "@/lib/rules/required-data";

const RANK: Record<RiskStatus, number> = {
  no_evaluable: 0,
  sin_condiciones: 1,
  informativo: 2,
  vigilancia: 3,
  requiere_validacion_agronoma: 3,
  favorable: 4,
  moderado: 5,
  alto: 6,
  critico: 7,
};

const INCOMPLETE = new Set<RiskStatus>(["no_evaluable", "requiere_validacion_agronoma"]);

/** La categoría administrable (categoria_id) prevalece sobre la categoría del catálogo sanitario. */
function categoryKeyOf(rule: ResultadoReglaV2) {
  return rule.regla.categoria_clave ?? rule.regla.categoria;
}

/** Estados en que las condiciones de la regla se cumplieron (coincidencias). */
const MATCH = new Set<RiskStatus>(["favorable", "vigilancia", "moderado", "alto", "critico"]);
/** Coincidencias visibles en el resumen de la tarjeta; el detalle las muestra todas. */
export const CARD_MATCH_LIMIT = 3;

const EVIDENCE_RANK: Record<string, number> = { alta: 3, media: 2, limitada: 1 };

/**
 * Severidad, luego prioridad configurada, luego nivel de evidencia y revisión más
 * reciente. Nunca el orden alfabético: el empate restante conserva el orden de entrada.
 */
function compareRules(a: ResultadoReglaV2, b: ResultadoReglaV2) {
  return RANK[b.estado] - RANK[a.estado]
    || (b.regla.prioridad ?? 0) - (a.regla.prioridad ?? 0)
    || (EVIDENCE_RANK[b.regla.evidence_level ?? ""] ?? 0) - (EVIDENCE_RANK[a.regla.evidence_level ?? ""] ?? 0)
    || (b.regla.reviewed_at ?? "").localeCompare(a.regla.reviewed_at ?? "");
}

function winner(rules: ResultadoReglaV2[]) {
  return [...rules].sort(compareRules)[0];
}

function ruleMessage(rule: ResultadoReglaV2) {
  return rule.explicacion || rule.etiqueta || DEFAULT_MESSAGE[rule.estado];
}

function matchedRule(rule: ResultadoReglaV2, labels?: VariableLabels): MatchedRule {
  const variables = new Map(rule.observado.map((item) => [item.variable as string, item.fuente ?? "weather"] as const));
  return {
    rule_id: rule.regla.id ?? `${rule.regla.clave}@${rule.regla.version}`,
    rule_name: rule.regla.nombre ?? rule.regla.clave,
    ...(rule.regla.nombre_cientifico ? { scientific_name: rule.regla.nombre_cientifico } : {}),
    internal_status: rule.estado,
    display_status: displayStatus(rule.estado),
    message: ruleMessage(rule),
    recommended_action: rule.recomendacion || DEFAULT_ACTION[rule.estado],
    variables_used: [...variables].map(([key, source]) => ({ key, source })),
    required_data: requiredDataFor([rule], labels).map(({ variable, label }) => ({ variable, label })),
    ...(rule.regla.source_name ? { source_name: rule.regla.source_name } : {}),
    ...(rule.regla.source_url ? { source_url: rule.regla.source_url } : {}),
    ...(rule.regla.reviewed_at ? { reviewed_at: rule.regla.reviewed_at } : {}),
  };
}

/** Nombres distintos de las coincidencias, en orden de relevancia. */
export function matchNames(matches: Pick<MatchedRule, "rule_name">[]) {
  return [...new Set(matches.map((match) => match.rule_name))];
}

function advisoryWinner(advisories: AgronomicAdvisory[]) {
  return [...advisories].sort((a, b) =>
    RANK[b.status] - RANK[a.status] || b.priority - a.priority || b.reviewed_at.localeCompare(a.reviewed_at),
  )[0];
}

/**
 * Consolida sin conocer cultivo, patógeno, plaga ni nombres climáticos. Orden visible:
 * 1) alerta técnica vigente, 2) regla automática evaluada, 3) monitoreo + datos
 * requeridos, 4) sin condiciones, 5) información para el monitoreo. Nunca eleva un
 * estado: favorable/alto/crítico sólo provienen de una regla que cumplió todas sus
 * condiciones o de una alerta técnica validada. Los textos se toman tal como están
 * configurados (regla o alerta): no se filtran ni recortan por palabras.
 */
export function consolidateCategoryRisks(
  categories: RiskCategory[],
  rules: ResultadoReglaV2[],
  advisories: AgronomicAdvisory[],
  options: { labels?: VariableLabels } = {},
): ConsolidatedCategoryRisk[] {
  return categories.map((category) => {
    const evaluatedRules = rules.filter((rule) => categoryKeyOf(rule) === category.key);
    const appliedAdvisories = advisories.filter((advisory) => advisory.category_key === category.key);
    const applicable = evaluatedRules.filter((rule) => !isOutsideApplicability(rule));
    const complete = applicable.filter((rule) => !INCOMPLETE.has(rule.estado));
    const incomplete = applicable.filter((rule) => INCOMPLETE.has(rule.estado));
    // Críticos faltantes de reglas incompletas + complementarios faltantes de cualquier regla aplicable.
    const requiredData = requiredDataFor(applicable, options.labels);
    const completeness: CalculationCompleteness = !complete.length && incomplete.length
      ? "needs_data"
      : incomplete.length || requiredData.length ? "partial" : "complete";
    const automatic = winner(complete);
    const pending = winner(incomplete);
    const automaticResult = automatic ?? pending ?? winner(evaluatedRules);
    // Todas las coincidencias: varias reglas empatadas no se descartan ni elevan la severidad.
    // Sólo con evidencia: una coincidencia sin variables observadas no puede afirmar una condición.
    const matches = complete.filter((rule) => MATCH.has(rule.estado) && rule.observado.length > 0).sort(compareRules).map((rule) => matchedRule(rule, options.labels));
    const shared = {
      category: category.key,
      title: category.name,
      required_data: requiredData,
      calculation_completeness: completeness,
      matched_rules: matches,
      additional_matches_count: Math.max(0, matchNames(matches).length - CARD_MATCH_LIMIT),
      ...(automaticResult
        ? { automatic_result: { status: automaticResult.estado, missing_variables: [...new Set(applicable.flatMap(missingVariablesOf))] } }
        : {}),
      evaluated_rules: evaluatedRules,
      applied_advisories: appliedAdvisories,
    };

    const advisory = advisoryWinner(appliedAdvisories);
    if (advisory && (!automatic || RANK[advisory.status] >= RANK[automatic.estado])) {
      return {
        ...shared,
        internal_status: advisory.status,
        display_status: displayStatus(advisory.status),
        message: advisory.message || DEFAULT_MESSAGE[advisory.status],
        recommended_action: advisory.recommended_action || DEFAULT_ACTION[advisory.status],
        resolution_source: matches.length ? "combined" : "agronomic_advisory",
        reviewed_at: advisory.reviewed_at,
        validated_by: advisory.validated_by,
      };
    }
    if (automatic) {
      return {
        ...shared,
        internal_status: automatic.estado,
        display_status: displayStatus(automatic.estado),
        message: ruleMessage(automatic),
        recommended_action: automatic.recomendacion || DEFAULT_ACTION[automatic.estado],
        resolution_source: "automatic_rule",
      };
    }
    if (pending) {
      return {
        ...shared,
        internal_status: pending.estado,
        display_status: displayStatus(pending.estado),
        // Sin datos que pedir, el texto por defecto no promete completar la evaluación.
        message: pending.explicacion || (requiredData.length ? DEFAULT_MESSAGE[pending.estado] : MONITORING_ONLY.message),
        recommended_action: pending.recomendacion || (requiredData.length ? DEFAULT_ACTION[pending.estado] : MONITORING_ONLY.action),
        resolution_source: "monitoring_fallback",
      };
    }
    if (evaluatedRules.length) {
      // Todas las reglas quedan fuera de su ventana fenológica: no aplican en esta etapa.
      return {
        ...shared,
        internal_status: "sin_condiciones",
        display_status: displayStatus("sin_condiciones"),
        message: "La etapa actual del cultivo está fuera del período en que aplican las reglas de esta categoría.",
        recommended_action: DEFAULT_ACTION.sin_condiciones,
        resolution_source: "automatic_rule",
      };
    }
    return {
      ...shared,
      internal_status: "informativo",
      display_status: displayStatus("informativo"),
      message: DEFAULT_MESSAGE.informativo,
      recommended_action: DEFAULT_ACTION.informativo,
      calculation_completeness: "partial",
      resolution_source: "monitoring_fallback",
    };
  });
}
