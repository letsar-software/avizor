import assert from "node:assert/strict";
import test from "node:test";
import { representativeRuleForDefinition, statusLabel } from "../lib/results/presentation";
import type { ResultadoReglaV2 } from "../types";

function rule(estado: ResultadoReglaV2["estado"], etiqueta?: string) {
  return { estado, etiqueta } as ResultadoReglaV2;
}

test("la presentación usa el enum normalizado", () => {
  assert.equal(statusLabel(rule("favorable", "Favorable")), "Condiciones favorables para monitoreo");
  assert.equal(statusLabel(rule("sin_condiciones")), "Sin condiciones de riesgo relevantes");
  assert.equal(statusLabel(rule("no_evaluable")), "Monitoreo recomendado");
});

test("la alternativa de vigilancia prevalece sobre una regla completa no evaluable", () => {
  const complete = rule("no_evaluable", "Mojado foliar no disponible");
  complete.riesgo = "roya_amarilla";
  complete.regla = { clave: "roya_amarilla_mojado", version: "1", estado: "vigente", prioridad: 10 };
  const alternative = rule("vigilancia", "Vigilancia térmica");
  alternative.riesgo = "roya_amarilla";
  alternative.regla = { clave: "roya_amarilla_open_meteo", version: "1", estado: "vigente", prioridad: 1 };
  assert.equal(representativeRuleForDefinition({ reglas: [complete, alternative] }, "enfermedades_foliares"), alternative);
});
