import assert from "node:assert/strict";
import test from "node:test";
import { calculateAnalysisQuality } from "../lib/results/analysis-quality";
import type { ResultadoReglaV2 } from "../types";

function rule(overrides: Partial<ResultadoReglaV2> = {}): ResultadoReglaV2 {
  return { riesgo: "enfermedades_foliares", regla: { clave: "EF-01", version: "1", estado: "vigente", modo: "estable", categoria: "Enfermedades foliares" }, estado: "sin_condiciones", ventana: { desde: "2026-08-01", hasta: "2026-08-14", dias: 14 }, observado: [], calidad_dato: { cobertura_min: 1, dias_faltantes: 0, distancia_punto_km: null }, evaluado_en: "2026-08-14T12:00:00Z", ...overrides };
}

test("datos climáticos completos producen 100 % y Datos completos", () => {
  assert.deepEqual(calculateAnalysisQuality([rule()]), { cobertura: 1, estado: "datos_completos", variables_faltantes_relevantes: [], evaluaciones_limitadas: [] });
});

test("valores diarios faltantes bajan cobertura aunque existan las 14 fechas", () => {
  const quality = calculateAnalysisQuality([rule({ calidad_dato: { cobertura_min: 12 / 14, dias_faltantes: 2, distancia_punto_km: null } })]);
  assert.equal(quality.cobertura, 12 / 14); assert.equal(quality.estado, "datos_parciales");
});

test("datos_insuficientes nunca informa cobertura completa", () => {
  const quality = calculateAnalysisQuality([rule({ estado: "indeterminado", motivo: "datos_insuficientes", detalle: { variable: "humedad_relativa", dias_esperados: 14, dias_disponibles: 10 }, calidad_dato: { cobertura_min: 10 / 14, dias_faltantes: 4, distancia_punto_km: null } })]);
  assert.equal(quality.estado, "datos_insuficientes"); assert.equal(quality.cobertura, 10 / 14); assert.deepEqual(quality.variables_faltantes_relevantes, ["humedad_relativa"]);
});

test("fenología no informada no reduce la cobertura climática", () => {
  const quality = calculateAnalysisQuality([rule({ estado: "indeterminado", motivo: "fenologia_no_disponible" })]);
  assert.equal(quality.estado, "datos_completos"); assert.equal(quality.cobertura, 1);
});

test("zona no aplicable y una variable opcional ausente no reducen la cobertura", () => {
  assert.equal(calculateAnalysisQuality([], 1).estado, "datos_completos");
  assert.equal(calculateAnalysisQuality([rule()]).estado, "datos_completos");
});

test("varias categorías usan el mínimo de cobertura estable", () => {
  const quality = calculateAnalysisQuality([rule(), rule({ riesgo: "heladas", regla: { clave: "H-01", version: "1", estado: "vigente", modo: "estable" }, calidad_dato: { cobertura_min: 0.8, dias_faltantes: 1, distancia_punto_km: null } })]);
  assert.equal(quality.cobertura, 0.8); assert.equal(quality.estado, "datos_parciales");
});

test("la ausencia de reglas estables aplicables usa cobertura de respaldo sin clasificarla como déficit climático", () => {
  const experimental = rule({ regla: { clave: "EXP-01", version: "1", estado: "experimental", modo: "experimental" }, calidad_dato: { cobertura_min: 0, dias_faltantes: 14, distancia_punto_km: null }, estado: "indeterminado", motivo: "datos_insuficientes" });
  const quality = calculateAnalysisQuality([experimental], 1);
  assert.equal(quality.cobertura, 1); assert.equal(quality.estado, "datos_completos");
});
