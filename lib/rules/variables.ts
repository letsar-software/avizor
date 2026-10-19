import type { ContextoFenologico, ReglaAgronomicaV2, SerieClimaticaDiaria } from "@/types";
import { hasObservations, isSpecVariable } from "@/lib/indicators/engine";

/**
 * Nombres equivalentes de la API genérica (/api/rules/evaluate) y del contrato de
 * condiciones del motor. Las reglas pueden declarar cualquiera de los dos.
 */
const ALIASES: Record<string, string> = {
  temperature_c: "temperatura_media",
  temperature_min_c: "temperatura_min",
  temperature_max_c: "temperatura_max",
  relative_humidity_pct: "humedad_relativa",
  precipitation_mm: "precipitacion",
  precipitation_accumulated_mm: "precipitacion",
  wind_speed_kmh: "viento_medio",
  soil_moisture_pct: "humedad_suelo_0_1cm",
  soil_temperature_c: "temperatura_suelo_0cm",
  reference_evapotranspiration_mm: "et0_fao_56",
  zadoks_stage: "codigo_zadoks",
  cultivar_susceptibility: "cultivar_susceptibilidad",
  manual_observation: "observacion_manual",
  field_drainage_status: "estado_drenaje",
};

export function canonicalVariable(variable: string) {
  return ALIASES[variable] ?? variable;
}

function canonicalList(values: string[] | null | undefined) {
  return [...new Set((values ?? []).map(canonicalVariable))];
}

/**
 * Indispensables declaradas. Una regla histórica que sólo trae variables_requeridas
 * se interpreta como si todas fueran críticas.
 */
export function declaredCriticalVariables(rule: ReglaAgronomicaV2) {
  return canonicalList(rule.critical_required_variables ?? rule.variables_requeridas ?? []);
}

/** Críticas declaradas + fenología cuando la regla tiene ventana Zadoks (para auditoría y datos). */
export function criticalVariables(rule: ReglaAgronomicaV2) {
  const phenology = rule.zadoks_desde !== null && rule.zadoks_desde !== undefined ? ["codigo_zadoks"] : [];
  return [...new Set([...phenology, ...declaredCriticalVariables(rule)])];
}

/** Mejoran la recomendación o el monitoreo; nunca bloquean el cálculo. */
export function complementaryVariables(rule: ReglaAgronomicaV2) {
  const critical = new Set(criticalVariables(rule));
  return canonicalList(rule.complementary_required_variables).filter((variable) => !critical.has(variable));
}

/**
 * Disponibilidad genérica: dato de campo vigente, fenología informada o serie
 * climática con valores. Sin ninguno de ellos la variable se pide como dato.
 */
export function isVariableAvailable(
  variable: string,
  series: SerieClimaticaDiaria[],
  windowDays: number,
  phenology?: ContextoFenologico,
  fieldData?: ReadonlyMap<string, unknown>,
) {
  if (fieldData?.has(variable)) return true;
  if (variable === "codigo_zadoks") return phenology?.codigo_zadoks !== null && phenology?.codigo_zadoks !== undefined;
  if (isSpecVariable(variable)) return hasObservations(variable, series, windowDays);
  return false;
}
