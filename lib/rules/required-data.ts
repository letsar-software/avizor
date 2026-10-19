import type { RequiredDataItem, ResultadoReglaV2 } from "@/types";
import { BASE_VARIABLES } from "@/lib/variables/catalog";
import { canonicalVariable } from "@/lib/rules/variables";

/**
 * Etiquetas de producto por variable, no por cultivo ni categoría: qué dato se
 * necesita lo decide cada regla configurable (variables críticas y complementarias).
 * Fuente: catálogo de variables (tabla variables_agronomicas o su semilla). Una variable
 * sin etiqueta se muestra humanizada, sin cambios de código.
 */
const BASE_LABELS = new Map(BASE_VARIABLES.map((variable) => [variable.clave, variable.etiqueta]));

/** Etiquetas administrables (clave → etiqueta) que reemplazan a las de la semilla. */
export type VariableLabels = ReadonlyMap<string, string>;

export function requiredDataLabel(variable: string, labels?: VariableLabels) {
  const key = canonicalVariable(variable);
  const known = labels?.get(key) ?? BASE_LABELS.get(key);
  if (known) return known;
  const text = variable.replaceAll("_", " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** La regla no aplica en la etapa actual: no falta ningún dato. */
export function isOutsideApplicability(rule: ResultadoReglaV2) {
  return rule.estado === "no_evaluable" && rule.motivo === "fuera_fenologia";
}

/** Variable que el propio motivo interno nombra como faltante, si lo hace. */
export function explicitMissingVariables(rule: Pick<ResultadoReglaV2, "motivo" | "detalle">): string[] | null {
  const motivo = rule.motivo ?? "";
  if (motivo.startsWith("dato_requerido_no_disponible:")) {
    return motivo.slice("dato_requerido_no_disponible:".length).split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (motivo === "fenologia_no_disponible") return ["codigo_zadoks"];
  const detailVariable = rule.detalle && typeof rule.detalle.variable === "string" ? rule.detalle.variable : undefined;
  return detailVariable ? [detailVariable] : null;
}

/** Variables críticas concretas que impidieron completar una regla. */
export function missingCriticalVariablesOf(rule: ResultadoReglaV2): string[] {
  if (rule.estado !== "no_evaluable" && rule.estado !== "requiere_validacion_agronoma") return [];
  if (isOutsideApplicability(rule)) return [];
  // El motor informa qué críticas no tienen dato; resultados guardados antes se infieren del motivo.
  if (rule.missing_critical_variables) return rule.missing_critical_variables;
  const explicit = explicitMissingVariables(rule);
  if (explicit) return explicit;
  const observed = new Set<string>(rule.observado.map((item) => item.variable));
  return (rule.regla.critical_required_variables ?? []).filter((variable) => !observed.has(variable));
}

/** Críticas y complementarias faltantes, en ese orden; la clasificación no se expone en la UI. */
export function missingVariablesOf(rule: ResultadoReglaV2): string[] {
  if (isOutsideApplicability(rule)) return [];
  return [...new Set([...missingCriticalVariablesOf(rule), ...(rule.missing_complementary_variables ?? [])])];
}

/** Datos a pedir para completar las reglas indicadas, deduplicados por etiqueta visible. */
export function requiredDataFor(rules: ResultadoReglaV2[], labels?: VariableLabels): RequiredDataItem[] {
  const items = new Map<string, RequiredDataItem>();
  for (const rule of rules) {
    for (const variable of missingVariablesOf(rule)) {
      const label = requiredDataLabel(variable, labels);
      if (items.has(label)) continue;
      const ruleName = rule.regla.nombre ?? rule.regla.clave;
      items.set(label, { variable, label, ...(ruleName ? { reason: `Permite completar la evaluación de ${ruleName}.` } : {}) });
    }
  }
  return [...items.values()];
}
