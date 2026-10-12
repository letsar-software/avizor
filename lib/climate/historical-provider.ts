import type { LocalidadNormalizada, SerieClimaticaDiaria } from "@/types";

export interface HistoricalDay {
  fecha: string;
  media: number | null;
  maxima: number | null;
  minima: number | null;
  precipitacion?: number | null;
  humedad?: number | null;
}
export interface HistoricalComparison {
  clave: string;
  nombre: string;
  actual: number | null;
  historico: number | null;
  diferencia: number | null;
  unidad: "°C" | "mm" | "días" | "%";
  disponible: boolean;
}
export interface HistoricalTemperature {
  disponible: boolean;
  fuente: string;
  periodo_referencia: string;
  cobertura: number;
  anios_validos: number;
  metodo: string;
  actualizado_en: string;
  temperatura_media_observada: number | null;
  temperatura_media_historica: number | null;
  anomalia_temperatura: number | null;
  serie_observada: HistoricalDay[];
  serie_historica: HistoricalDay[];
  comparaciones: HistoricalComparison[];
}
type Fetcher = typeof fetch;
const cache = new Map<
  string,
  { until: number; value: HistoricalTemperature }
>();
const mean = (v: Array<number | null>) => {
  const n = v.filter(
    (x): x is number => typeof x === "number" && Number.isFinite(x),
  );
  return n.length
    ? Number((n.reduce((a, b) => a + b, 0) / n.length).toFixed(2))
    : null;
};
const sum = (v: Array<number | null>) => {
  const n = v.filter(
    (x): x is number => typeof x === "number" && Number.isFinite(x),
  );
  return n.length ? Number(n.reduce((a, b) => a + b, 0).toFixed(2)) : null;
};
const diff = (a: number | null, b: number | null) =>
  a === null || b === null ? null : Number((a - b).toFixed(2));
const metric = (
  clave: string,
  nombre: string,
  actual: number | null,
  historico: number | null,
  unidad: HistoricalComparison["unidad"],
): HistoricalComparison => ({
  clave,
  nombre,
  actual,
  historico,
  diferencia: diff(actual, historico),
  unidad,
  disponible: actual !== null && historico !== null,
});

const referenceYears = (observed: HistoricalDay[]) => {
  const firstDate = observed[0]?.fecha;
  const queryYear = firstDate ? Number(firstDate.slice(0, 4)) : NaN;
  const lastCompleteYear = Number.isFinite(queryYear)
    ? queryYear - 1
    : new Date().getUTCFullYear() - 1;
  return Array.from({ length: 10 }, (_, index) => lastCompleteYear - 9 + index);
};

const historicalRange = (observed: HistoricalDay[]) => {
  const first = observed[0]?.fecha;
  const last = observed.at(-1)?.fecha;
  if (!first || !last) return null;
  const years = referenceYears(observed);
  return {
    start: `${years[0]}-${first.slice(5)}`,
    end: `${years.at(-1)}-${last.slice(5)}`,
  };
};

type ArchiveDaily = {
  time: string[];
  temperature_2m_mean?: Array<number | null>;
  temperature_2m_max?: Array<number | null>;
  temperature_2m_min?: Array<number | null>;
  precipitation_sum?: Array<number | null>;
  relative_humidity_2m_mean?: Array<number | null>;
};

type NasaPowerResponse = {
  properties?: {
    parameter?: Record<string, Record<string, number | null>>;
  };
};

const nasaDaily = (payload: NasaPowerResponse): ArchiveDaily => {
  const parameters = payload.properties?.parameter ?? {};
  const keys = new Set(
    Object.values(parameters).flatMap((series) => Object.keys(series)),
  );
  const ordered = [...keys].sort();
  const values = (key: string) =>
    ordered.map((date) => parameters[key]?.[date] ?? null);
  return {
    time: ordered.map(
      (date) => `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    ),
    temperature_2m_mean: values("T2M"),
    temperature_2m_max: values("T2M_MAX"),
    temperature_2m_min: values("T2M_MIN"),
    precipitation_sum: values("PRECTOTCORR"),
    relative_humidity_2m_mean: values("RH2M"),
  };
};

export class HistoricalClimateProvider {
  constructor(private readonly fetcher: Fetcher = fetch) {}
  async comparar(
    localidad: LocalidadNormalizada,
    serie: SerieClimaticaDiaria[],
  ): Promise<HistoricalTemperature> {
    const observed = serie.slice(-14).map((d) => ({
      fecha: d.fecha,
      media: d.temperaturaMedia,
      maxima: d.temperaturaMaxima,
      minima: d.temperaturaMinima,
      precipitacion: d.precipitacion,
      humedad: d.humedadRelativa,
    }));
    const key = `era5:${localidad.latitud},${localidad.longitud}:${observed[0]?.fecha}:${observed.at(-1)?.fecha}`;
    const hit = cache.get(key);
    if (hit && hit.until > Date.now()) return hit.value;
    try {
      const years = referenceYears(observed);
      const range = historicalRange(observed);
      if (!range) throw new Error("historico_sin_periodo");
      const fetchBlock = async (daily: string) => {
        const url = new URL("https://archive-api.open-meteo.com/v1/archive");
        url.search = new URLSearchParams({
          latitude: String(localidad.latitud),
          longitude: String(localidad.longitud),
          start_date: range.start,
          end_date: range.end,
          daily,
          timezone: "America/Argentina/Buenos_Aires",
          models: "era5",
        }).toString();
        const response = await this.fetcher(url);
        if (!response.ok) throw new Error("historico_no_disponible");
        const data = (await response.json()) as { daily: ArchiveDaily };
        return data.daily;
      };
      let dailyResponses: ArchiveDaily[];
      let source = "Open-Meteo Historical Weather API (ERA5 reanalysis)";
      let method =
        "Promedio de las mismas fechas calendario. Días con lluvia: precipitación diaria ≥ 1 mm. No interviene en reglas agronómicas.";
      try {
        dailyResponses = await Promise.all([
          fetchBlock("temperature_2m_mean,temperature_2m_min"),
          fetchBlock("temperature_2m_max,precipitation_sum"),
          fetchBlock("relative_humidity_2m_mean"),
        ]);
      } catch {
        const nasaUrl = new URL(
          "https://power.larc.nasa.gov/api/temporal/daily/point",
        );
        nasaUrl.search = new URLSearchParams({
          parameters: "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M",
          community: "AG",
          longitude: String(localidad.longitud),
          latitude: String(localidad.latitud),
          start: range.start.replaceAll("-", ""),
          end: range.end.replaceAll("-", ""),
          format: "JSON",
          "time-standard": "UTC",
        }).toString();
        const nasaResponse = await this.fetcher(nasaUrl);
        if (!nasaResponse.ok) throw new Error("historico_no_disponible");
        dailyResponses = [
          nasaDaily((await nasaResponse.json()) as NasaPowerResponse),
        ];
        source = "NASA POWER Daily API (MERRA-2)";
        method =
          "Promedio de las mismas fechas calendario con NASA POWER (MERRA-2). Días con lluvia: precipitación diaria ≥ 1 mm. No interviene en reglas agronómicas.";
      }
      const dates = new Map<
        string,
        Array<
          [
            number | null,
            number | null,
            number | null,
            number | null,
            number | null,
          ]
        >
      >();
      const yearsByCalendarDay = new Map<string, Set<number>>();
      dailyResponses.forEach((daily) => {
        daily.time.forEach((date, i) => {
          const calendarDay = date.slice(5);
          const values = dates.get(calendarDay) ?? [];
          values.push([
            daily.temperature_2m_mean?.[i] ?? null,
            daily.temperature_2m_max?.[i] ?? null,
            daily.temperature_2m_min?.[i] ?? null,
            daily.precipitation_sum?.[i] ?? null,
            daily.relative_humidity_2m_mean?.[i] ?? null,
          ]);
          dates.set(calendarDay, values);
          const years =
            yearsByCalendarDay.get(calendarDay) ?? new Set<number>();
          years.add(Number(date.slice(0, 4)));
          yearsByCalendarDay.set(calendarDay, years);
        });
      });
      const historical = observed.map((d) => {
        const v = dates.get(d.fecha.slice(5)) ?? [];
        return {
          fecha: d.fecha,
          media: mean(v.map((x) => x[0])),
          maxima: mean(v.map((x) => x[1])),
          minima: mean(v.map((x) => x[2])),
          precipitacion: mean(v.map((x) => x[3])),
          humedad: mean(v.map((x) => x[4])),
        };
      });
      const rainCurrent = observed.some((d) => d.precipitacion !== null)
        ? observed.filter((d) => (d.precipitacion ?? 0) >= 1).length
        : null;
      const monthDays = new Set(observed.map((day) => day.fecha.slice(5)));
      const rainyDaysByYear = new Map<number, number>();
      const rainByHistoricalDate = new Map<string, number>();
      dailyResponses.forEach((daily) => {
        daily.time.forEach((date, index) => {
          if (monthDays.has(date.slice(5))) {
            rainByHistoricalDate.set(
              date,
              daily.precipitation_sum?.[index] ?? 0,
            );
          }
        });
      });
      rainByHistoricalDate.forEach((rain, date) => {
        const year = Number(date.slice(0, 4));
        rainyDaysByYear.set(
          year,
          (rainyDaysByYear.get(year) ?? 0) + (rain >= 1 ? 1 : 0),
        );
      });
      const rainHistorical = historical.some((d) => d.precipitacion !== null)
        ? mean([...rainyDaysByYear.values()])
        : null;
      const validYears = Math.min(
        ...observed.map(
          (day) => yearsByCalendarDay.get(day.fecha.slice(5))?.size ?? 0,
        ),
      );
      const comparisons = [
        metric(
          "temperatura_media",
          "Temperatura media",
          mean(observed.map((d) => d.media)),
          mean(historical.map((d) => d.media)),
          "°C",
        ),
        metric(
          "temperatura_minima",
          "Temperatura mínima media",
          mean(observed.map((d) => d.minima)),
          mean(historical.map((d) => d.minima)),
          "°C",
        ),
        metric(
          "temperatura_maxima",
          "Temperatura máxima media",
          mean(observed.map((d) => d.maxima)),
          mean(historical.map((d) => d.maxima)),
          "°C",
        ),
        metric(
          "precipitacion",
          "Precipitación acumulada",
          sum(observed.map((d) => d.precipitacion)),
          sum(historical.map((d) => d.precipitacion)),
          "mm",
        ),
        metric(
          "dias_lluvia",
          "Días con lluvia",
          rainCurrent,
          rainHistorical,
          "días",
        ),
        metric(
          "humedad_relativa",
          "Humedad relativa media",
          mean(observed.map((d) => d.humedad)),
          mean(historical.map((d) => d.humedad)),
          "%",
        ),
      ];
      const temp = comparisons[0];
      const value: HistoricalTemperature = {
        disponible: comparisons.some((x) => x.disponible),
        fuente: source,
        periodo_referencia: `${years[0]}-${years.at(-1)}`,
        cobertura:
          historical.filter((d) => d.media !== null).length /
          Math.max(1, historical.length),
        anios_validos: validYears,
        metodo: method,
        actualizado_en: new Date().toISOString(),
        temperatura_media_observada: temp.actual,
        temperatura_media_historica: temp.historico,
        anomalia_temperatura: temp.diferencia,
        serie_observada: observed,
        serie_historica: historical,
        comparaciones: comparisons,
      };
      cache.set(key, { until: Date.now() + 1000 * 60 * 60 * 24 * 30, value });
      return value;
    } catch {
      return {
        disponible: false,
        fuente: "Open-Meteo Historical Weather API (ERA5 reanalysis)",
        periodo_referencia: `${referenceYears(observed)[0]}-${referenceYears(observed).at(-1)}`,
        cobertura: 0,
        anios_validos: 0,
        metodo: "Histórico no disponible; no afecta la consulta principal.",
        actualizado_en: new Date().toISOString(),
        temperatura_media_observada: mean(observed.map((d) => d.media)),
        temperatura_media_historica: null,
        anomalia_temperatura: null,
        serie_observada: observed,
        serie_historica: [],
        comparaciones: [],
      };
    }
  }
}
