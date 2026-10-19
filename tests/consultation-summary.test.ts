import test from "node:test";
import assert from "node:assert/strict";
import { buildConsultationSummary } from "../lib/results/consultation-summary";
import type { ResultadoReglaV2 } from "../types";

function result(riesgo: string, estado: ResultadoReglaV2["estado"]): ResultadoReglaV2 {
  return { riesgo, estado, regla: { clave: riesgo, version: "1", estado: "vigente" }, ventana: { desde: "2026-08-01", hasta: "2026-08-14", dias: 14 }, observado: [], calidad_dato: { cobertura_min: 1, dias_faltantes: 0, distancia_punto_km: null }, evaluado_en: "2026-08-14T12:00:00Z" };
}

test("una regla favorable genera atención", () => {
  const summary = buildConsultationSummary([
    result("temperatura_bajo_umbral", "favorable"),
    result("enfermedades_foliares", "no_evaluable"),
  ]);
  assert.match(summary.destaque, /bajas temperaturas/);
});

test("vigilancia mantiene monitoreo preventivo", () => {
  const summary = buildConsultationSummary([result("roya_amarilla", "vigilancia")]);
  assert.match(summary.destaque, /monitoreo preventivo/);
});

test("resultados no evaluables conservan la advertencia de información limitada", () => {
  const summary = buildConsultationSummary([
    result("temperatura_bajo_umbral", "no_evaluable"),
    result("enfermedades_foliares", "no_evaluable"),
  ]);
  assert.match(summary.destaque, /orientativo/);
});
