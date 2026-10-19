import type { ConsolidatedCategoryRisk, EstadoGeneral, RiskStatus } from "@/types";

export type AlertLevel = "critico" | "prioritario" | "monitoreo" | "sin_alertas";

/**
 * Estado general visible. `legacy` es el valor que acepta la columna consultas.estado_general
 * (CHECK de la migración 002): se conserva para persistir sin migrar; la UI usa `display`.
 */
export const OVERALL_STATUS: Record<AlertLevel, { display: string; explicacion: string; legacy: EstadoGeneral }> = {
  critico: {
    display: "Alerta crítica de monitoreo",
    explicacion: "Hay condiciones que requieren seguimiento prioritario.",
    legacy: "Atención recomendada",
  },
  prioritario: {
    display: "Alerta de monitoreo prioritario",
    explicacion: "Hay condiciones que merecen atención prioritaria en el lote.",
    legacy: "Atención recomendada",
  },
  monitoreo: {
    display: "Monitoreo recomendado",
    explicacion: "Conviene mantener el monitoreo del lote durante los próximos días.",
    legacy: "Monitoreo preventivo sugerido",
  },
  sin_alertas: {
    display: "Sin alertas activas",
    explicacion: "Las condiciones observadas no alcanzaron los umbrales de las reglas evaluadas.",
    legacy: "Sin alertas activas",
  },
};

/** Estados que, en una tarjeta, se muestran como "Monitoreo recomendado" o más. */
const MONITORING = new Set<RiskStatus>(["moderado", "vigilancia", "favorable", "no_evaluable", "requiere_validacion_agronoma"]);

/**
 * Deriva el estado general de las categorías ya consolidadas (alertas técnicas
 * incluidas). Nunca "Sin alertas activas" si alguna tarjeta muestra monitoreo o más.
 */
export function overallFromCategories(categories: Pick<ConsolidatedCategoryRisk, "internal_status">[]) {
  const statuses = new Set(categories.map((category) => category.internal_status));
  const level: AlertLevel = statuses.has("critico")
    ? "critico"
    : statuses.has("alto")
      ? "prioritario"
      : [...statuses].some((status) => MONITORING.has(status))
        ? "monitoreo"
        : "sin_alertas";
  return { level, ...OVERALL_STATUS[level] };
}
