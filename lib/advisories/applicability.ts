import type { AgronomicAdvisory } from "@/types";

/** Contexto de la consulta contra el que se evalúa cada alerta técnica. */
export interface AdvisoryContext {
  cropId: string;
  /** Instante de referencia: ahora para la fecha de hoy, fin del día para fechas pasadas. */
  referenceAt: string;
  /** Inicio del día consultado: una alerta que terminó antes no aplica. */
  dayStartsAt: string;
  /** Claves de región de la localidad o lote (zona agronómica, provincia). */
  regionKeys: string[];
  farmId?: string | null;
  fieldId?: string | null;
}

export type AdvisoryDecision =
  | "aplica"
  | "inactiva"
  | "no_iniciada"
  | "vencida"
  | "cultivo_distinto"
  | "region_distinta"
  | "requiere_lote"
  | "establecimiento_distinto"
  | "lote_distinto";

/** Normaliza claves de región: sin tildes, minúsculas, separadores como "_". */
export function regionKey(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/**
 * Reglas de aplicación, iguales para cualquier cultivo, categoría y alcance:
 * activa, vigente en el día consultado, mismo cultivo (o global) y alcance
 * geográfico coincidente. farm/field exigen lote; global/region usan la localidad.
 */
export function advisoryDecision(advisory: AgronomicAdvisory, context: AdvisoryContext): AdvisoryDecision {
  if (!advisory.active) return "inactiva";
  if (Date.parse(advisory.starts_at) > Date.parse(context.referenceAt)) return "no_iniciada";
  if (advisory.ends_at && Date.parse(advisory.ends_at) < Date.parse(context.dayStartsAt)) return "vencida";
  if (advisory.crop_id && advisory.crop_id.toLowerCase() !== context.cropId.toLowerCase()) return "cultivo_distinto";
  if (advisory.scope_type === "global") return "aplica";
  if (advisory.scope_type === "region") {
    const keys = new Set(context.regionKeys.map(regionKey));
    return advisory.scope_id && keys.has(regionKey(advisory.scope_id)) ? "aplica" : "region_distinta";
  }
  if (!context.fieldId) return "requiere_lote";
  if (advisory.scope_type === "farm") return advisory.scope_id && advisory.scope_id === context.farmId ? "aplica" : "establecimiento_distinto";
  return advisory.scope_id === context.fieldId ? "aplica" : "lote_distinto";
}

export interface AdvisoryDiagnostic {
  advisory_id: string;
  category: string | undefined;
  status: AgronomicAdvisory["status"];
  scope: string;
  decision: AdvisoryDecision;
}

export function applicableAdvisories(advisories: AgronomicAdvisory[], context: AdvisoryContext) {
  const diagnostics: AdvisoryDiagnostic[] = advisories.map((advisory) => ({
    advisory_id: advisory.id,
    category: advisory.category_key,
    status: advisory.status,
    scope: advisory.scope_type === "global" ? "global" : `${advisory.scope_type}:${advisory.scope_id}`,
    decision: advisoryDecision(advisory, context),
  }));
  return { applied: advisories.filter((_, index) => diagnostics[index].decision === "aplica"), diagnostics };
}

/** Ventana de referencia para una fecha de consulta (día calendario en Argentina, UTC-3). */
export function referenceWindow(fechaRef: string, now = new Date()) {
  const dayStart = new Date(`${fechaRef}T00:00:00-03:00`);
  const dayEnd = new Date(`${fechaRef}T23:59:59.999-03:00`);
  const reference = now < dayEnd ? (now > dayStart ? now : dayStart) : dayEnd;
  return { referenceAt: reference.toISOString(), dayStartsAt: dayStart.toISOString() };
}
