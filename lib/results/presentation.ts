import type { ResultadoConsultaV2Publica, ResultadoReglaV2, SerieClimaticaDiaria } from "@/types";

export const categoryDefinitions = [
  { slug: "heladas", risk: "temperatura_bajo_umbral", name: "Heladas", tone: "green" },
  { slug: "enfermedades_foliares", risk: "enfermedades_foliares", name: "Enfermedades foliares", tone: "orange" },
  { slug: "estres_hidrico", risk: "baja_precipitacion", name: "Estrés hídrico", tone: "red" },
  { slug: "exceso_hidrico", risk: "precipitacion_elevada", name: "Exceso hídrico", tone: "indigo" },
] as const;

export function ruleForSlug(result: ResultadoConsultaV2Publica, slug: string) {
  const definition = categoryDefinitions.find((item) => item.slug === slug.replaceAll("-", "_"));
  const selected = definition ?? categoryDefinitions[1];
  const rules = rulesForDefinition(result, selected.risk);
  return { definition: selected, rule: representativeRule(rules), rules };
}

export function rulesForDefinition(result: Pick<ResultadoConsultaV2Publica, "reglas">, risk: string) {
  const exact = result.reglas.filter((item) => item.riesgo === risk);
  if (exact.length || risk !== "enfermedades_foliares") return exact;
  const environmentalRisks = new Set(["temperatura_bajo_umbral", "baja_precipitacion", "precipitacion_elevada"]);
  const diseases = result.reglas.filter((item) => !environmentalRisks.has(item.riesgo));
  const stable = diseases.filter((item) => item.regla.estado !== "experimental" && item.regla.modo !== "experimental");
  return stable.length ? stable : diseases;
}

export function representativeRuleForDefinition(result: Pick<ResultadoConsultaV2Publica, "reglas">, risk: string) {
  return representativeRule(rulesForDefinition(result, risk));
}

function representativeRule(rules: ResultadoReglaV2[]) {
  const rank = (rule: ResultadoReglaV2) => {
    if (rule.estado === "favorables" || rule.estado === "condiciones_detectadas") return 4;
    if (rule.estado === "moderadas") return 3;
    if (rule.estado === "indeterminado") return 2;
    if (rule.estado === "sin_condiciones" || rule.estado === "desfavorables") return 1;
    return 0;
  };
  return [...rules].sort((left, right) => rank(right) - rank(left))[0];
}

export function statusLabel(rule?: ResultadoReglaV2, categoryName?: string) {
  if (!rule) return "No evaluada";
  const category = categoryName?.toLowerCase();
  if (rule.estado === "sin_condiciones") return category ? `Sin condiciones asociadas a ${category}` : "Sin condiciones asociadas al fenómeno evaluado";
  if (rule.estado === "indeterminado") return "No fue posible evaluar esta categoría con los datos disponibles";
  if (rule.estado === "favorables" || rule.estado === "condiciones_detectadas") {
    if (category === "heladas") return "Temperaturas bajo el umbral para heladas";
    if (category === "enfermedades foliares") return "Condiciones que pueden favorecer enfermedades foliares";
    if (category === "estrés hídrico") return "Precipitación acumulada baja";
    if (category === "exceso hídrico") return "Precipitación acumulada elevada";
  }
  if (rule.estado === "moderadas") {
    if (category === "enfermedades foliares") return "Condiciones moderadas para enfermedades foliares";
    if (category === "heladas") return "Condiciones moderadas asociadas a heladas";
    if (category === "estrés hídrico") return "Disponibilidad hídrica para monitorear";
    if (category === "exceso hídrico") return "Acumulación de agua para monitorear";
  }
  return deduplicateLabel(rule.etiqueta) ?? rule.estado.replaceAll("_", " ");
}

function deduplicateLabel(value?: string) {
  if (!value?.trim()) return undefined;
  const parts = value.split(/\s*[-–—]\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 2 && parts[0].localeCompare(parts[1], "es", { sensitivity: "base" }) === 0) return parts[0];
  return value.trim();
}

export function aggregateClimate(series: SerieClimaticaDiaria[]) {
  const precipitation = valid(series.map((day) => day.precipitacion));
  const humidity = valid(series.map((day) => day.humedadRelativa));
  const temperatures = valid(series.map((day) => day.temperaturaMedia));
  const minimums = valid(series.map((day) => day.temperaturaMinima));
  const et0 = valid(series.map((day) => day.et0));
  return {
    precipitation: sum(precipitation), rainyDays: precipitation.filter((value) => value >= 1).length,
    humidity: average(humidity), temperature: average(temperatures), minimum: minimums.length ? Math.min(...minimums) : null,
    et0: sum(et0), availableDays: series.length,
  };
}

export function formatDate(value: string, withYear = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", ...(withYear ? { year: "numeric" as const } : {}), timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}
export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")}:${part("second")}`;
}export function formatNumber(value: number | null, digits = 1) { return value === null ? "—" : new Intl.NumberFormat("es-AR", { maximumFractionDigits: digits }).format(value); }
function valid(values: Array<number | null>) { return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)); }
function sum(values: number[]) { return values.length ? Number(values.reduce((total, value) => total + value, 0).toFixed(2)) : null; }
function average(values: number[]) { return values.length ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2)) : null; }
