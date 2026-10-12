import assert from "node:assert/strict";
import test from "node:test";
import { HistoricalClimateProvider } from "../lib/climate/historical-provider";
import type { SerieClimaticaDiaria } from "../types";

const location = {
  nombre: "Tandil",
  provincia: "Buenos Aires",
  pais: "Argentina" as const,
  latitud: -37,
  longitud: -59,
};
const day = (
  fecha: string,
  media: number | null,
  minima = media === null ? null : media - 2,
  maxima = media === null ? null : media + 2,
  precipitacion: number | null = null,
  humedad: number | null = null,
): SerieClimaticaDiaria => ({
  fecha,
  temperaturaMedia: media,
  temperaturaMinima: minima,
  temperaturaMaxima: maxima,
  humedadRelativa: humedad,
  precipitacion,
  vientoMedio: null,
  puntoRocio: null,
  deficitPresionVapor: null,
  evapotranspiracion: null,
  et0: null,
  humedadSuelo: {
    profundidad0a1cm: null,
    profundidad1a3cm: null,
    profundidad3a9cm: null,
    profundidad9a27cm: null,
    profundidad27a81cm: null,
  },
  temperaturaSuelo: {
    profundidad0cm: null,
    profundidad6cm: null,
    profundidad18cm: null,
    profundidad54cm: null,
  },
  radiacionSolar: null,
});
const response = (
  time: string[],
  mean: Array<number | null>,
  min: Array<number | null>,
  max: Array<number | null>,
  rain: Array<number | null>,
  humidity: Array<number | null>,
) =>
  new Response(
    JSON.stringify({
      daily: {
        time,
        temperature_2m_mean: mean,
        temperature_2m_min: min,
        temperature_2m_max: max,
        precipitation_sum: rain,
        relative_humidity_2m_mean: humidity,
      },
    }),
  );

test("calcula las seis métricas con ventanas equivalentes", async () => {
  const provider = new HistoricalClimateProvider(async () =>
    response(
      ["1991-12-31", "1992-12-31", "1991-01-01", "1992-01-01"],
      [10, 14, 8, 12],
      [8, 12, 6, 10],
      [12, 16, 10, 14],
      [0, 2, 1, 3],
      [60, 70, 50, 60],
    ),
  );
  const result = await provider.comparar(location, [
    day("2026-12-31", 15, 13, 17, 4, 80),
    day("2027-01-01", 11, 9, 13, 0.5, 70),
  ]);
  const byKey = Object.fromEntries(
    result.comparaciones.map((item) => [item.clave, item]),
  );
  assert.deepEqual(
    [
      byKey.temperatura_media.actual,
      byKey.temperatura_media.historico,
      byKey.temperatura_media.diferencia,
    ],
    [13, 11, 2],
  );
  assert.deepEqual(
    [byKey.temperatura_minima.actual, byKey.temperatura_minima.historico],
    [11, 9],
  );
  assert.deepEqual(
    [byKey.temperatura_maxima.actual, byKey.temperatura_maxima.historico],
    [15, 13],
  );
  assert.deepEqual(
    [byKey.precipitacion.actual, byKey.precipitacion.historico],
    [4.5, 3],
  );
  assert.deepEqual(
    [byKey.dias_lluvia.actual, byKey.dias_lluvia.historico],
    [1, 1.5],
  );
  assert.deepEqual(
    [byKey.humedad_relativa.actual, byKey.humedad_relativa.historico],
    [75, 60],
  );
});

test("conserva diferencias negativas, cero y referencias de precipitación cero", async () => {
  const provider = new HistoricalClimateProvider(async () =>
    response(["1991-05-01"], [20], [18], [22], [0], [70]),
  );
  const result = await provider.comparar({ ...location, latitud: -36 }, [
    day("2026-05-01", 20, 16, 24, 0, 70),
  ]);
  const byKey = Object.fromEntries(
    result.comparaciones.map((item) => [item.clave, item]),
  );
  assert.equal(byKey.temperatura_media.diferencia, 0);
  assert.equal(byKey.precipitacion.diferencia, 0);
  assert.equal(byKey.precipitacion.historico, 0);
});

test("omite comparaciones sin referencia o dato reciente válido", async () => {
  const provider = new HistoricalClimateProvider(async () =>
    response(["1991-02-28"], [null], [null], [null], [null], [null]),
  );
  const result = await provider.comparar({ ...location, latitud: -35 }, [
    day("2026-02-28", null, null, null, null, null),
  ]);
  assert.ok(
    result.comparaciones.every(
      (item) => !item.disponible && item.diferencia === null,
    ),
  );
  assert.equal(result.anios_validos, 1);
});

test("trata el 29 de febrero según los años realmente disponibles", async () => {
  const provider = new HistoricalClimateProvider(async () =>
    response(
      ["1992-02-29", "1996-02-29"],
      [10, 14],
      [8, 12],
      [12, 16],
      [1, 1],
      [60, 70],
    ),
  );
  const result = await provider.comparar({ ...location, latitud: -34 }, [
    day("2028-02-29", 13, 11, 15, 1, 65),
  ]);
  assert.equal(result.anios_validos, 2);
  assert.equal(result.temperatura_media_historica, 12);
});

test("la caché reutiliza una consulta idéntica", async () => {
  let calls = 0;
  const provider = new HistoricalClimateProvider(async () => {
    calls++;
    return response(["1991-06-01"], [10], [8], [12], [1], [50]);
  });
  const input = [day("2026-06-01", 12, 10, 14, 1, 60)];
  await provider.comparar({ ...location, latitud: -33 }, input);
  await provider.comparar({ ...location, latitud: -33 }, input);
  assert.equal(calls, 3);
});

test("calcula la referencia de diez años a partir del año de la consulta", async () => {
  const requested = new Set<string>();
  const requestedEnds = new Set<string>();
  const provider = new HistoricalClimateProvider(async (input) => {
    const url = new URL(input.toString());
    requested.add(url.searchParams.get("start_date") ?? "");
    requestedEnds.add(url.searchParams.get("end_date") ?? "");
    return response(["2022-06-01"], [10], [8], [12], [1], [50]);
  });
  await provider.comparar({ ...location, latitud: -31 }, [
    day("2023-06-01", 12, 10, 14, 1, 60),
  ]);
  assert.equal(requested.size, 1);
  assert.ok(requested.has("2013-06-01"));
  assert.ok(requestedEnds.has("2022-06-01"));
});

test("una falla del proveedor no inventa referencias", async () => {
  const provider = new HistoricalClimateProvider(async () => {
    throw new Error("offline");
  });
  const result = await provider.comparar({ ...location, latitud: -32 }, [
    day("2026-01-01", 12),
  ]);
  assert.equal(result.disponible, false);
  assert.equal(result.temperatura_media_historica, null);
  assert.deepEqual(result.comparaciones, []);
});

test("usa NASA POWER cuando Open-Meteo no entrega el histórico", async () => {
  const requests: string[] = [];
  const provider = new HistoricalClimateProvider(async (input) => {
    const url = input.toString();
    requests.push(url);
    if (url.includes("archive-api.open-meteo.com")) {
      return new Response("limit", { status: 429 });
    }
    return new Response(
      JSON.stringify({
        properties: {
          parameter: {
            T2M: { "20160601": 10, "20170601": 12 },
            T2M_MIN: { "20160601": 8, "20170601": 10 },
            T2M_MAX: { "20160601": 12, "20170601": 14 },
            PRECTOTCORR: { "20160601": 1, "20170601": 3 },
            RH2M: { "20160601": 60, "20170601": 70 },
          },
        },
      }),
    );
  });
  const result = await provider.comparar({ ...location, latitud: -30 }, [
    day("2026-06-01", 13, 11, 15, 2, 65),
  ]);
  assert.equal(result.fuente, "NASA POWER Daily API (MERRA-2)");
  assert.equal(result.temperatura_media_historica, 11);
  assert.ok(requests.some((url) => url.includes("power.larc.nasa.gov")));
});
