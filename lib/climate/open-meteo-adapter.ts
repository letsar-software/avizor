import type { SerieClimaticaDiaria } from "@/types";
import type { ClimateSeriesProvider, ClimateSeriesRequest, ClimateSeriesResult } from "./contract";

const cache = new Map<string, { expiresAt: number; value: ClimateSeriesResult }>();
const ttl = Number(process.env.CLIMATE_CACHE_TTL_SECONDS ?? 10800) * 1000;

type Hourly = { time: string[]; temperature_2m: Array<number | null>; relative_humidity_2m: Array<number | null>; precipitation: Array<number | null>; wind_speed_10m: Array<number | null>; evapotranspiration: Array<number | null> };

export class OpenMeteoAdapter implements ClimateSeriesProvider {
  async obtenerSerie(input: ClimateSeriesRequest): Promise<ClimateSeriesResult> {
    const key = `${input.localidad.nombre.toLowerCase()}:${input.fechaRef}:${input.dias}`;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const params = new URLSearchParams({ latitude: String(input.localidad.latitud), longitude: String(input.localidad.longitud), hourly: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,evapotranspiration", past_days: String(Math.max(input.dias, 14)), forecast_days: "1", timezone: "America/Argentina/Buenos_Aires" });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`DATOS_CLIMATICOS_NO_DISPONIBLES:${response.status}`);
    const payload = await response.json() as { hourly?: Partial<Hourly> };
    const hourly = payload.hourly;
    if (!hourly?.time || !hourly.temperature_2m || !hourly.relative_humidity_2m || !hourly.precipitation || !hourly.wind_speed_10m || !hourly.evapotranspiration) throw new Error("DATOS_CLIMATICOS_NO_DISPONIBLES");

    const dates = Array.from(new Set(hourly.time.map((time) => time.slice(0, 10)))).filter((date) => date <= input.fechaRef).slice(-input.dias);
    const serie = dates.map((fecha): SerieClimaticaDiaria => {
      const indexes = hourly.time!.map((time, index) => time.startsWith(fecha) ? index : -1).filter((index) => index >= 0);
      const temperatures = values(indexes, hourly.temperature_2m!);
      return { fecha, temperaturaMedia: average(temperatures), temperaturaMinima: temperatures.length ? Math.min(...temperatures) : null, temperaturaMaxima: temperatures.length ? Math.max(...temperatures) : null, humedadRelativa: average(values(indexes, hourly.relative_humidity_2m!)), precipitacion: totalOrNull(values(indexes, hourly.precipitation!)), vientoMedio: average(values(indexes, hourly.wind_speed_10m!)), et0: totalOrNull(values(indexes, hourly.evapotranspiration!)) };
    });
    const result: ClimateSeriesResult = { proveedor: "Open-Meteo", coordenadas: { latitud: input.localidad.latitud, longitud: input.localidad.longitud }, fechaConsulta: input.fechaRef, rangoTemporal: { desde: serie[0]?.fecha ?? "", hasta: serie.at(-1)?.fecha ?? "" }, variablesDisponibles: ["temperatura_media","temperatura_min","temperatura_max","humedad_relativa","precipitacion","viento_medio","et0"], cobertura: serie.length / input.dias, errores: [], adapterVersion: "2.0", serie };
    cache.set(key, { expiresAt: Date.now() + ttl, value: result });
    return result;
  }
}

function values(indexes: number[], source: Array<number | null>) { return indexes.map((index) => source[index]).filter((value): value is number => typeof value === "number" && Number.isFinite(value)); }
function average(items: number[]) { return items.length ? Number((items.reduce((sum, value) => sum + value, 0) / items.length).toFixed(2)) : null; }
function totalOrNull(items: number[]) { return items.length ? Number(items.reduce((sum, value) => sum + value, 0).toFixed(2)) : null; }
