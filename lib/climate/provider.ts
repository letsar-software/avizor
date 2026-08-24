import type { ClimateData, ClimateMetrics, DiaClimatico, LocalidadNormalizada } from "@/types";
import { OpenMeteoAdapter } from "./open-meteo-adapter";

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return valid.length ? Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1)) : null;
}
function sum(values: Array<number | null>) { return Number(values.reduce<number>((acc, value) => acc + (value ?? 0), 0).toFixed(1)); }
function buildMetrics(dias: DiaClimatico[]): ClimateMetrics {
  const temperatures = dias.map((dia) => dia.temp_media).filter((value): value is number => value !== null);
  return { dias_datos: dias.length, humedad_media_14d: average(dias.map((dia) => dia.humedad_media)), lluvia_5d_mm: sum(dias.slice(-5).map((dia) => dia.lluvia_mm)), lluvia_7d_mm: sum(dias.slice(-7).map((dia) => dia.lluvia_mm)), lluvia_14d_mm: sum(dias.map((dia) => dia.lluvia_mm)), temp_media_14d: average(dias.map((dia) => dia.temp_media)), viento_medio_14d_kmh: average(dias.map((dia) => dia.viento_medio_kmh)), dias_lluvia_14d: dias.filter((dia) => dia.lluvia_mm > 0.5).length, temp_min_14d: temperatures.length ? Number(Math.min(...temperatures).toFixed(1)) : null };
}

/** Compatibility facade for the original public endpoint. */
export class ClimateProvider {
  constructor(private readonly provider = new OpenMeteoAdapter()) {}
  async getLast14Days(localidad: LocalidadNormalizada): Promise<ClimateData> {
    const normalized = await this.provider.obtenerSerie({ localidad, fechaRef: new Date().toISOString().slice(0, 10), dias: 14 });
    const dias: DiaClimatico[] = normalized.serie.map((day) => ({ fecha: day.fecha, temp_media: day.temperaturaMedia, humedad_media: day.humedadRelativa, lluvia_mm: day.precipitacion ?? 0, viento_medio_kmh: day.vientoMedio }));
    return { localidad, dias, resumen: buildMetrics(dias), fuente: "Open-Meteo" };
  }
}
