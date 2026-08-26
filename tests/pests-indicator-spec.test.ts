import test from "node:test";
import assert from "node:assert/strict";
import { resolverIndicadorPlaga } from "../lib/pests/indicator-spec";
import { IndicatorEngine } from "../lib/indicators/engine";
import type { ReglaPlaga, SerieClimaticaDiaria } from "../types";

const configBase: ReglaPlaga["configuracion"] = { umbral_dia_lluvia_mm: 1 };

function series(overrides: Partial<SerieClimaticaDiaria> = {}, length = 10): SerieClimaticaDiaria[] {
  return Array.from({ length }, (_, index) => ({
    fecha: `2026-01-${String(index + 1).padStart(2, "0")}`, temperaturaMedia: 20, temperaturaMinima: 15, temperaturaMaxima: 30,
    humedadRelativa: 50, precipitacion: 0, vientoMedio: null, puntoRocio: null, deficitPresionVapor: null,
    evapotranspiracion: null, et0: null,
    humedadSuelo: { profundidad0a1cm: null, profundidad1a3cm: null, profundidad3a9cm: null, profundidad9a27cm: null, profundidad27a81cm: null },
    temperaturaSuelo: { profundidad0cm: null, profundidad6cm: null, profundidad18cm: null, profundidad54cm: null },
    radiacionSolar: null, ...overrides,
  }));
}

test("resolverIndicadorPlaga mapea cada indicador con nombre a variable/agregador/ventana del motor genérico", () => {
  assert.deepEqual(resolverIndicadorPlaga("temp_media_7d", configBase), { spec: { variable: "temperatura_media", agregador: "media_ventana", cobertura_minima: 1 }, ventanaDias: 7 });
  assert.deepEqual(resolverIndicadorPlaga("precip_10d", configBase), { spec: { variable: "precipitacion", agregador: "suma_ventana", cobertura_minima: 1 }, ventanaDias: 10 });
});

test("dias_con_lluvia_7d usa el umbral de la propia regla, no una constante hardcodeada", () => {
  const resolved = resolverIndicadorPlaga("dias_con_lluvia_7d", { umbral_dia_lluvia_mm: 3 });
  assert.equal(resolved?.spec.subcondicion?.valor, 3);
});

test("dias_calidos_10d requiere umbral_termico configurado, si no está devuelve null (no inventa un umbral)", () => {
  assert.equal(resolverIndicadorPlaga("dias_calidos_10d", configBase), null);
  const resolved = resolverIndicadorPlaga("dias_calidos_10d", { ...configBase, umbral_termico: 30 });
  assert.equal(resolved?.spec.variable, "temperatura_max");
  assert.equal(resolved?.spec.subcondicion?.valor, 30);
});

test("dias_consecutivos_sin_lluvia no tiene agregador todavía y se documenta como no soportado, no como un valor incorrecto", () => {
  assert.equal(resolverIndicadorPlaga("dias_consecutivos_sin_lluvia", configBase), null);
});

test("dias_calidos_10d resuelto por IndicatorEngine coincide con un conteo manual de días cálidos", () => {
  const engine = new IndicatorEngine();
  const dias = series({}, 10).map((day, index) => ({ ...day, temperaturaMaxima: index < 4 ? 32 : 28 }));
  const resolved = resolverIndicadorPlaga("dias_calidos_10d", { ...configBase, umbral_termico: 30 })!;
  const result = engine.calculate(resolved.spec, dias, resolved.ventanaDias);
  assert.equal(result.valor, 4);
  assert.equal(result.disponible, true);
});
