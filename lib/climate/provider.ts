import type { ClimateData, ClimateMetrics, DiaClimatico, LocalidadNormalizada } from "@/types";
import { buildClimateCacheKey, getClimateCache, setClimateCache } from "./cache";

interface OpenMeteoHourly {
  time?: string[];
  temperature_2m?: Array<number | null>;
  relative_humidity_2m?: Array<number | null>;
  precipitation?: Array<number | null>;
  wind_speed_10m?: Array<number | null>;
}

interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly;
}

function average(values: Array<number | null | undefined>) {
  const validValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (validValues.length === 0) return null;

  return Number((validValues.reduce((sum, value) => sum + value, 0) / validValues.length).toFixed(1));
}

function sum(values: Array<number | null | undefined>) {
  const total = values.reduce<number>((acc, value) => acc + (typeof value === "number" && Number.isFinite(value) ? value : 0), 0);
  return Number(total.toFixed(1));
}

function groupByDay(hourly: Required<OpenMeteoHourly>): DiaClimatico[] {
  const dates = Array.from(new Set(hourly.time.map((timestamp) => timestamp.slice(0, 10))));

  return dates
    .map((fecha) => {
      const indexes = hourly.time
        .map((timestamp, index) => (timestamp.slice(0, 10) === fecha ? index : -1))
        .filter((index) => index >= 0);

      return {
        fecha,
        temp_media: average(indexes.map((index) => hourly.temperature_2m[index])),
        humedad_media: average(indexes.map((index) => hourly.relative_humidity_2m[index])),
        lluvia_mm: sum(indexes.map((index) => hourly.precipitation[index])),
        viento_medio_kmh: average(indexes.map((index) => hourly.wind_speed_10m[index])),
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(-14);
}

function buildMetrics(dias: DiaClimatico[]): ClimateMetrics {
  const last5Days = dias.slice(-5);
  const last7Days = dias.slice(-7);
  const tempValues = dias.map((dia) => dia.temp_media).filter((value): value is number => value !== null);

  return {
    dias_datos: dias.length,
    humedad_media_14d: average(dias.map((dia) => dia.humedad_media)),
    lluvia_5d_mm: sum(last5Days.map((dia) => dia.lluvia_mm)),
    lluvia_7d_mm: sum(last7Days.map((dia) => dia.lluvia_mm)),
    lluvia_14d_mm: sum(dias.map((dia) => dia.lluvia_mm)),
    temp_media_14d: average(dias.map((dia) => dia.temp_media)),
    viento_medio_14d_kmh: average(dias.map((dia) => dia.viento_medio_kmh)),
    dias_lluvia_14d: dias.filter((dia) => dia.lluvia_mm > 0.5).length,
    temp_min_14d: tempValues.length > 0 ? Number(Math.min(...tempValues).toFixed(1)) : null,
  };
}

function assertHourly(hourly: OpenMeteoHourly | undefined): asserts hourly is Required<OpenMeteoHourly> {
  if (
    !hourly?.time?.length ||
    !hourly.temperature_2m?.length ||
    !hourly.relative_humidity_2m?.length ||
    !hourly.precipitation?.length ||
    !hourly.wind_speed_10m?.length
  ) {
    throw new Error("Respuesta climatica incompleta");
  }
}

export class ClimateProvider {
  async getLast14Days(localidad: LocalidadNormalizada): Promise<ClimateData> {
    const cacheKey = buildClimateCacheKey(localidad.nombre);
    const cached = getClimateCache(cacheKey);

    if (cached) return cached;

    const params = new URLSearchParams({
      latitude: String(localidad.latitud),
      longitude: String(localidad.longitud),
      hourly: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
      past_days: "14",
      forecast_days: "1",
      timezone: "America/Argentina/Buenos_Aires",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 3 },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondio ${response.status}`);
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    assertHourly(payload.hourly);

    const dias = groupByDay(payload.hourly);
    const climateData: ClimateData = {
      localidad,
      dias,
      resumen: buildMetrics(dias),
      fuente: "Open-Meteo",
    };

    setClimateCache(cacheKey, climateData);
    return climateData;
  }
}

