import type { SerieClimaticaDiaria } from "@/types";
import type { ClimateSeriesProvider, ClimateSeriesRequest, ClimateSeriesResult } from "./contract";
import { buildClimateCacheKey, clearClimateCache, getClimateCache, setClimateCache } from "./cache";

const TIMEOUT_MS = 12000;
const HOURLY_FIELDS = ["temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m", "dew_point_2m", "vapour_pressure_deficit", "evapotranspiration", "et0_fao_evapotranspiration", "soil_moisture_0_to_1cm", "soil_moisture_1_to_3cm", "soil_moisture_3_to_9cm", "soil_moisture_9_to_27cm", "soil_moisture_27_to_81cm", "soil_temperature_0cm", "soil_temperature_6cm", "soil_temperature_18cm", "soil_temperature_54cm", "shortwave_radiation"] as const;
type HourlyField = typeof HOURLY_FIELDS[number];
type Hourly = { time?: string[] } & Partial<Record<HourlyField, Array<number | null>>>;
const INTERNAL_NAMES: Record<HourlyField, string> = {
  temperature_2m: "temperatura", relative_humidity_2m: "humedad_relativa", precipitation: "precipitacion", wind_speed_10m: "viento_medio", dew_point_2m: "punto_rocio", vapour_pressure_deficit: "deficit_presion_vapor", evapotranspiration: "evapotranspiracion", et0_fao_evapotranspiration: "et0_fao_56", soil_moisture_0_to_1cm: "humedad_suelo_0_1cm", soil_moisture_1_to_3cm: "humedad_suelo_1_3cm", soil_moisture_3_to_9cm: "humedad_suelo_3_9cm", soil_moisture_9_to_27cm: "humedad_suelo_9_27cm", soil_moisture_27_to_81cm: "humedad_suelo_27_81cm", soil_temperature_0cm: "temperatura_suelo_0cm", soil_temperature_6cm: "temperatura_suelo_6cm", soil_temperature_18cm: "temperatura_suelo_18cm", soil_temperature_54cm: "temperatura_suelo_54cm", shortwave_radiation: "radiacion_solar",
};

export class OpenMeteoAdapter implements ClimateSeriesProvider {
  async obtenerSerie(input: ClimateSeriesRequest): Promise<ClimateSeriesResult> {
    const desde = shiftDate(input.fechaRef, -(input.dias - 1));
    const key = buildClimateCacheKey(input.localidad.latitud, input.localidad.longitud, desde, input.fechaRef);
    const cached = getClimateCache(key);
    if (cached) return cached;
    const params = new URLSearchParams({ latitude: String(input.localidad.latitud), longitude: String(input.localidad.longitud), hourly: HOURLY_FIELDS.join(","), past_days: String(Math.max(input.dias, 14)), forecast_days: "1", timezone: "America/Argentina/Buenos_Aires" });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`DATOS_CLIMATICOS_NO_DISPONIBLES:${response.status}`);
    const payload = await response.json() as { hourly?: Hourly };
    const hourly = payload.hourly;
    assertRequiredFields(hourly);
    const dates = Array.from(new Set(hourly.time.map((time) => time.slice(0, 10)))).filter((date) => date >= desde && date <= input.fechaRef).slice(-input.dias);
    const serie = dates.map((fecha) => mapDay(fecha, hourly));
    const variablesDisponibles = HOURLY_FIELDS.filter((field) => hasValues(hourly[field])).map((field) => INTERNAL_NAMES[field]);
    if (variablesDisponibles.includes("temperatura")) variablesDisponibles.push("temperatura_media", "temperatura_min", "temperatura_max");
    const variablesFaltantes = HOURLY_FIELDS.filter((field) => !hasValues(hourly[field])).map((field) => INTERNAL_NAMES[field]);
    const result: ClimateSeriesResult = { proveedor: "Open-Meteo", coordenadas: { latitud: input.localidad.latitud, longitud: input.localidad.longitud }, fechaConsulta: input.fechaRef, rangoTemporal: { desde: serie[0]?.fecha ?? "", hasta: serie.at(-1)?.fecha ?? "" }, variablesDisponibles: Array.from(new Set(variablesDisponibles)), variablesFaltantes, diasSolicitados: input.dias, diasDisponibles: serie.length, obtenidoEn: new Date().toISOString(), cobertura: input.dias ? serie.length / input.dias : 0, errores: variablesFaltantes.map((variable) => `VARIABLE_NO_DISPONIBLE:${variable}`), adapterVersion: "3.0", serie };
    setClimateCache(key, result);
    return result;
  }
}

function mapDay(fecha: string, hourly: Hourly & { time: string[] }): SerieClimaticaDiaria {
  const indexes = hourly.time.map((time, index) => time.startsWith(fecha) ? index : -1).filter((index) => index >= 0);
  const vals = (field: HourlyField) => values(indexes, hourly[field]);
  const temperatures = vals("temperature_2m");
  return { fecha, temperaturaMedia: average(temperatures), temperaturaMinima: minimum(temperatures), temperaturaMaxima: maximum(temperatures), humedadRelativa: average(vals("relative_humidity_2m")), precipitacion: total(vals("precipitation")), vientoMedio: average(vals("wind_speed_10m")), puntoRocio: average(vals("dew_point_2m")), deficitPresionVapor: average(vals("vapour_pressure_deficit")), evapotranspiracion: total(vals("evapotranspiration")), et0: total(vals("et0_fao_evapotranspiration")), humedadSuelo: { profundidad0a1cm: average(vals("soil_moisture_0_to_1cm")), profundidad1a3cm: average(vals("soil_moisture_1_to_3cm")), profundidad3a9cm: average(vals("soil_moisture_3_to_9cm")), profundidad9a27cm: average(vals("soil_moisture_9_to_27cm")), profundidad27a81cm: average(vals("soil_moisture_27_to_81cm")) }, temperaturaSuelo: { profundidad0cm: average(vals("soil_temperature_0cm")), profundidad6cm: average(vals("soil_temperature_6cm")), profundidad18cm: average(vals("soil_temperature_18cm")), profundidad54cm: average(vals("soil_temperature_54cm")) }, radiacionSolar: average(vals("shortwave_radiation")) };
}
function assertRequiredFields(hourly?: Hourly): asserts hourly is Hourly & { time: string[] } { if (!hourly?.time?.length || !hasValues(hourly.temperature_2m) || !hasValues(hourly.relative_humidity_2m) || !hasValues(hourly.precipitation) || !hasValues(hourly.wind_speed_10m)) throw new Error("DATOS_CLIMATICOS_NO_DISPONIBLES"); }
function hasValues(source?: Array<number | null>) { return Boolean(source?.some((value) => typeof value === "number" && Number.isFinite(value))); }
function values(indexes: number[], source?: Array<number | null>) { return source ? indexes.map((index) => source[index]).filter((value): value is number => typeof value === "number" && Number.isFinite(value)) : []; }
function average(items: number[]) { return items.length ? Number((items.reduce((sum, value) => sum + value, 0) / items.length).toFixed(2)) : null; }
function total(items: number[]) { return items.length ? Number(items.reduce((sum, value) => sum + value, 0).toFixed(2)) : null; }
function minimum(items: number[]) { return items.length ? Math.min(...items) : null; }
function maximum(items: number[]) { return items.length ? Math.max(...items) : null; }
function shiftDate(date: string, days: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
export const clearOpenMeteoCache = clearClimateCache;
