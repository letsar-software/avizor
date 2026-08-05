import type { ResultadoConsultaV2Publica, ResultadoReglaV2, SerieClimaticaDiaria } from "@/types";

export const categoryDefinitions = [
  { slug: "heladas", risk: "temperatura_bajo_umbral", name: "Heladas", tone: "green" },
  { slug: "enfermedades_foliares", risk: "enfermedades_foliares", name: "Enfermedades foliares", tone: "orange" },
  { slug: "estres_hidrico", risk: "baja_precipitacion", name: "Estrés hídrico", tone: "red" },
  { slug: "exceso_hidrico", risk: "precipitacion_elevada", name: "Exceso hídrico", tone: "indigo" },
] as const;

export function ruleForSlug(result: ResultadoConsultaV2Publica, slug: string) {
  const definition = categoryDefinitions.find((item) => item.slug === slug.replaceAll("-", "_"));
  return { definition: definition ?? categoryDefinitions[1], rule: result.reglas.find((item) => item.riesgo === (definition ?? categoryDefinitions[1]).risk) };
}

export function statusLabel(rule?: ResultadoReglaV2) {
  if (!rule) return "No evaluada";
  if (rule.estado === "sin_condiciones") return "Condiciones desfavorables";
  if (rule.estado === "indeterminado") return "No fue posible determinarla";
  return rule.etiqueta ?? rule.estado.replaceAll("_", " ");
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
