import type { RiskStatus } from "@/types";

/** Texto de producto por estado interno. La UI de usuario nunca muestra el estado interno. */
export const DISPLAY_STATUS: Record<RiskStatus, string> = {
  favorable: "Condiciones favorables para monitoreo",
  vigilancia: "Monitoreo recomendado",
  moderado: "Riesgo moderado",
  alto: "Riesgo alto",
  critico: "Situación crítica",
  sin_condiciones: "Sin condiciones de riesgo relevantes",
  informativo: "Información para el monitoreo",
  no_evaluable: "Monitoreo recomendado",
  requiere_validacion_agronoma: "Monitoreo recomendado",
};

export function displayStatus(status: RiskStatus | undefined) {
  return status ? DISPLAY_STATUS[status] ?? DISPLAY_STATUS.no_evaluable : DISPLAY_STATUS.informativo;
}

export const DEFAULT_MESSAGE: Record<RiskStatus, string> = {
  favorable: "Las condiciones ambientales del período pueden favorecer este riesgo.",
  vigilancia: "Algunas condiciones del período justifican seguir el lote de cerca.",
  moderado: "Las condiciones actuales merecen atención.",
  alto: "Las condiciones actuales merecen atención.",
  critico: "Las condiciones actuales merecen atención prioritaria.",
  sin_condiciones: "Las condiciones observadas no alcanzaron los umbrales de las reglas aplicables.",
  informativo: "Revisá la información de monitoreo disponible para esta categoría.",
  no_evaluable: "Conviene seguir esta categoría con monitoreo a campo mientras se suman los datos indicados.",
  requiere_validacion_agronoma: "Conviene seguir esta categoría con monitoreo a campo mientras se suman los datos indicados.",
};

export const DEFAULT_ACTION: Record<RiskStatus, string> = {
  favorable: "Monitorear el lote durante los próximos 5 días.",
  vigilancia: "Monitorear el lote durante los próximos 5 días.",
  moderado: "Recorrer el lote y confirmar la situación a campo.",
  alto: "Recorrer el lote y confirmar la situación a campo.",
  critico: "Recorrer el lote cuanto antes y confirmar la situación a campo.",
  sin_condiciones: "Mantener el monitoreo habitual del lote.",
  informativo: "Mantener el monitoreo habitual del lote.",
  no_evaluable: "Monitorear el lote y registrar los datos indicados para completar la evaluación.",
  requiere_validacion_agronoma: "Monitorear el lote y registrar los datos indicados para completar la evaluación.",
};

/** Monitoreo sin datos que completen la evaluación (p. ej. regla pendiente de evidencia). */
export const MONITORING_ONLY = {
  message: "Conviene seguir esta categoría con monitoreo a campo.",
  action: "Mantener el monitoreo habitual del lote.",
};
