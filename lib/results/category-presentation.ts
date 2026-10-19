import type {
  CalculationCompleteness,
  CategoryResolutionSource,
  MatchedRule,
  RequiredDataItem,
  ResultadoConsultaV2Publica,
  ResultadoReglaV2,
  RiskStatus,
  StoredCategoryRisk,
} from "@/types";
import { CARD_MATCH_LIMIT, consolidateCategoryRisks, matchNames } from "@/lib/rules/consolidation";
import { DEFAULT_ACTION, DEFAULT_MESSAGE, displayStatus } from "@/lib/rules/display";
import { requiredDataLabel } from "@/lib/rules/required-data";
import { categoryDefinitions, rulesForDefinition } from "@/lib/results/presentation";

export type CategoryTone = "attention" | "monitor" | "calm";

/** Lo único que una tarjeta de usuario necesita; no expone el estado interno. */
export interface CategoryCardModel {
  key: string;
  slug: string;
  title: string;
  display_status: string;
  message: string;
  recommended_action: string;
  required_data: RequiredDataItem[];
  calculation_completeness: CalculationCompleteness;
  resolution_source: CategoryResolutionSource;
  tone: CategoryTone;
  advisory?: { title: string; reviewed_at?: string };
  /** Resumen de coincidencias para la tarjeta (máx. CARD_MATCH_LIMIT nombres). */
  matches: { names: string[]; additional: number };
  /** Detalle completo de coincidencias, en orden de relevancia. */
  matched_rules: MatchedRule[];
  rules: ResultadoReglaV2[];
}

/** "Y 2 condiciones adicionales para monitorear" / "Y 1 condición adicional para monitorear". */
export function additionalMatchesLabel(count: number) {
  return count === 1 ? "Y 1 condición adicional para monitorear" : `Y ${count} condiciones adicionales para monitorear`;
}

const ATTENTION = new Set<RiskStatus>(["favorable", "moderado", "alto", "critico"]);
const CALM = new Set<RiskStatus>(["sin_condiciones"]);

export function toneOf(status: RiskStatus): CategoryTone {
  if (ATTENTION.has(status)) return "attention";
  if (CALM.has(status)) return "calm";
  return "monitor";
}

function resolutionOf(source: string): CategoryResolutionSource {
  if (source === "combined") return "combined";
  if (source === "agronomic_advisory") return "agronomic_advisory";
  if (source === "monitoring_fallback") return "monitoring_fallback";
  return "automatic_rule";
}

/** Normaliza resultados nuevos y los guardados con el contrato anterior (status/automatic/combined). */
export function presentCategory(stored: StoredCategoryRisk): CategoryCardModel {
  const prepared = "internal_status" in stored;
  const status = prepared ? stored.internal_status : stored.status;
  // El contrato anterior guardaba como mensaje el texto técnico de "sin regla aplicable";
  // para esos casos se usa el texto de producto del estado, sin inspeccionar el contenido.
  const legacyFallback = !prepared && (status === "no_evaluable" || status === "requiere_validacion_agronoma");
  const legacyMissing = stored.automatic_result?.missing_variables ?? [];
  const requiredData = stored.required_data ??
    [...new Map(legacyMissing.map((variable) => [requiredDataLabel(variable), { variable, label: requiredDataLabel(variable) }])).values()];
  const resolution = resolutionOf(stored.resolution_source);
  const advisory = resolution === "agronomic_advisory" || resolution === "combined" ? stored.applied_advisories[0] : undefined;
  const matched = stored.matched_rules ?? [];
  const names = matchNames(matched);
  return {
    key: stored.category,
    slug: stored.category.replaceAll("_", "-"),
    title: stored.title,
    display_status: stored.display_status ?? displayStatus(status),
    message: legacyFallback || !stored.message ? DEFAULT_MESSAGE[status] : stored.message,
    recommended_action: legacyFallback || !stored.recommended_action ? DEFAULT_ACTION[status] : stored.recommended_action,
    required_data: requiredData,
    calculation_completeness: stored.calculation_completeness ?? (requiredData.length ? "needs_data" : "complete"),
    resolution_source: resolution,
    tone: toneOf(status),
    ...(advisory ? { advisory: { title: advisory.title, reviewed_at: stored.reviewed_at ?? advisory.reviewed_at } } : {}),
    matches: {
      names: names.slice(0, CARD_MATCH_LIMIT),
      additional: stored.additional_matches_count ?? Math.max(0, names.length - CARD_MATCH_LIMIT),
    },
    matched_rules: matched,
    rules: stored.evaluated_rules,
  };
}

/**
 * Tarjetas por categoría para cualquier cultivo. Si el resultado no trae categorías
 * consolidadas (resultados anteriores o sin catálogo), consolida las reglas con la
 * misma función del servidor para que la presentación sea siempre la misma.
 */
export function categoriesForResult(result: Pick<ResultadoConsultaV2Publica, "reglas" | "categorias">): CategoryCardModel[] {
  if (result.categorias?.length) return result.categorias.map(presentCategory);
  const categories = categoryDefinitions.map((definition) => ({ id: definition.slug, key: definition.slug, name: definition.name }));
  const rules = categoryDefinitions.flatMap((definition) =>
    rulesForDefinition(result, definition.risk).map((rule) => ({ ...rule, regla: { ...rule.regla, categoria: definition.slug, categoria_clave: definition.slug } })),
  );
  return consolidateCategoryRisks(categories, rules, []).map(presentCategory);
}

export function categoryForSlug(result: Pick<ResultadoConsultaV2Publica, "reglas" | "categorias">, slug: string) {
  const normalized = slug.replaceAll("_", "-");
  return categoriesForResult(result).find((category) => category.slug === normalized);
}
