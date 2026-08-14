import test from "node:test";
import assert from "node:assert/strict";
import { buildConsultationSummary } from "../lib/results/consultation-summary";
import type { ResultadoReglaV2 } from "../types";

function result(riesgo: string, estado: string): ResultadoReglaV2 {
  return { riesgo, estado, regla: { clave: riesgo, version: "1", estado: "vigente" }, ventana: { desde: "2026-08-01", hasta: "2026-08-14", dias: 14 }, observado: [], calidad_dato: { cobertura_min: 1, dias_faltantes: 0, distancia_punto_km: null }, evaluado_en: "2026-08-14T12:00:00Z" };
}

test("resume una única condición principal sin afirmar un diagnóstico", () => {
  const summary = buildConsultationSummary([
    result("temperatura_bajo_umbral", "condiciones_detectadas"),
    result("enfermedades_foliares", "indeterminado"),
    result("baja_precipitacion", "sin_condiciones"),
    result("precipitacion_elevada", "sin_condiciones"),
  ]);
  assert.match(summary.descripcion, /temperaturas mínimas por debajo del umbral/);
  assert.match(summary.descripcion, /no pudo evaluarse con suficiente información/i);
  assert.equal(summary.destaque, "Principal condición a observar: bajas temperaturas.");
  assert.doesNotMatch(summary.descripcion, /cultivo (está|afectado)/i);
});

test("recomienda monitoreo habitual cuando no hay condiciones señaladas", () => {
  const summary = buildConsultationSummary([
    result("temperatura_bajo_umbral", "sin_condiciones"),
    result("enfermedades_foliares", "sin_condiciones"),
    result("baja_precipitacion", "sin_condiciones"),
    result("precipitacion_elevada", "sin_condiciones"),
  ]);
  assert.match(summary.descripcion, /no muestran situaciones que requieran atención especial/);
  assert.match(summary.destaque, /monitoreo habitual/);
});

test("advierte cuando toda la evaluación es indeterminada", () => {
  const summary = buildConsultationSummary([
    result("temperatura_bajo_umbral", "indeterminado"),
    result("enfermedades_foliares", "indeterminado"),
  ]);
  assert.match(summary.descripcion, /no permiten realizar una evaluación completa/);
  assert.match(summary.destaque, /orientativo/);
});
