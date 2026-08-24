import test from "node:test";
import assert from "node:assert/strict";
import { clearOpenMeteoCache, OpenMeteoAdapter } from "../lib/climate/open-meteo-adapter";

const localidad = { nombre: "Tandil", provincia: "Buenos Aires", pais: "Argentina" as const, latitud: -37.32, longitud: -59.13 };
const request = { localidad, fechaRef: "2026-08-20", dias: 2 };
const times = ["2026-08-19T00:00", "2026-08-19T12:00", "2026-08-20T00:00", "2026-08-20T12:00"];
const required = { time: times, temperature_2m: [10, 20, 12, 22], relative_humidity_2m: [80, 60, 70, 50], precipitation: [1, 2, 0, 4], wind_speed_10m: [5, 15, 10, 20] };
const response = (hourly: Record<string, unknown>, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => ({ hourly }) }) as Response;

test.beforeEach(() => clearOpenMeteoCache());

test("normaliza todas las variables agroclimaticas y conserva profundidades", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response({ ...required, dew_point_2m: [7, 8, 9, 10], vapour_pressure_deficit: [0.2, 0.4, 0.6, 0.8], evapotranspiration: [0.1, 0.2, 0.3, 0.4], et0_fao_evapotranspiration: [0.2, 0.3, 0.4, 0.5], soil_moisture_0_to_1cm: [0.1, 0.2, 0.3, 0.4], soil_moisture_1_to_3cm: [0.2, 0.3, 0.4, 0.5], soil_moisture_3_to_9cm: [0.3, 0.4, 0.5, 0.6], soil_moisture_9_to_27cm: [0.4, 0.5, 0.6, 0.7], soil_moisture_27_to_81cm: [0.5, 0.6, 0.7, 0.8], soil_temperature_0cm: [11, 21, 13, 23], soil_temperature_6cm: [12, 20, 14, 22], soil_temperature_18cm: [13, 19, 15, 21], soil_temperature_54cm: [14, 18, 16, 20], shortwave_radiation: [10, 20, 30, 40] }));
  const result = await new OpenMeteoAdapter().obtenerSerie(request);
  assert.equal(result.serie[0].temperaturaMedia, 15);
  assert.equal(result.serie[0].temperaturaMinima, 10);
  assert.equal(result.serie[0].precipitacion, 3);
  assert.equal(result.serie[0].et0, 0.5);
  assert.equal(result.serie[0].humedadSuelo.profundidad0a1cm, 0.15);
  assert.equal(result.serie[0].humedadSuelo.profundidad27a81cm, 0.55);
  assert.equal(result.serie[0].temperaturaSuelo.profundidad54cm, 16);
  assert.equal(result.serie[0].radiacionSolar, 15);
  assert.equal(result.diasSolicitados, 2);
  assert.equal(result.diasDisponibles, 2);
  assert.equal(result.cobertura, 1);
  assert.deepEqual(result.variablesFaltantes, []);
});

test("mantiene campos opcionales en null e informa una respuesta parcial", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response(required));
  const result = await new OpenMeteoAdapter().obtenerSerie(request);
  assert.equal(result.serie[0].puntoRocio, null);
  assert.equal(result.serie[0].humedadSuelo.profundidad0a1cm, null);
  assert.ok(result.variablesFaltantes.includes("punto_rocio"));
  assert.ok(result.errores.includes("VARIABLE_NO_DISPONIBLE:punto_rocio"));
});

test("rechaza ausencia de una variable requerida por las reglas actuales", async (t) => {
  const { precipitation: _missing, ...partial } = required;
  t.mock.method(globalThis, "fetch", async () => response(partial));
  await assert.rejects(() => new OpenMeteoAdapter().obtenerSerie(request), /DATOS_CLIMATICOS_NO_DISPONIBLES/);
});

test("propaga error del proveedor", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response({}, false));
  await assert.rejects(() => new OpenMeteoAdapter().obtenerSerie(request), /503/);
});

test("reutiliza cache para coordenadas y periodo iguales", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => response(required));
  const adapter = new OpenMeteoAdapter();
  const first = await adapter.obtenerSerie(request);
  const second = await adapter.obtenerSerie(request);
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.strictEqual(second, first);
});
