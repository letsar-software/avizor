import test from "node:test";
import assert from "node:assert/strict";
import { resolverAplicabilidad } from "../lib/rules/aplicabilidad";

test("sin aplicabilidad, siempre aplica", () => {
  assert.deepEqual(resolverAplicabilidad(undefined, {}), { aplica: true });
});

test("zona exclusion: aplica salvo en las zonas listadas", () => {
  const def = { zona: { modo: "exclusion" as const, zonas: ["nea"] } };
  assert.equal(resolverAplicabilidad(def, { zona: "nea" }).aplica, false);
  assert.equal(resolverAplicabilidad(def, { zona: "pampeana_sur" }).aplica, true);
});

test("zona prioridad: solo aplica en las zonas listadas", () => {
  const def = { zona: { modo: "prioridad" as const, zonas: ["nea"] } };
  assert.equal(resolverAplicabilidad(def, { zona: "nea" }).aplica, true);
  const fuera = resolverAplicabilidad(def, { zona: "pampeana_sur" });
  assert.equal(fuera.aplica, false);
  assert.equal(fuera.submotivo, "zona_no_prioritaria");
});

test("zona requerida sin contexto: no aplica, no asume", () => {
  const def = { zona: { modo: "prioridad" as const, zonas: ["nea"] } };
  const resultado = resolverAplicabilidad(def, {});
  assert.equal(resultado.aplica, false);
  assert.equal(resultado.submotivo, "zona_no_disponible");
});

test("periodo dentro del año calendario", () => {
  const def = { periodo: { meses_desde: 3, meses_hasta: 6 } };
  assert.equal(resolverAplicabilidad(def, { fechaRef: "2026-04-15" }).aplica, true);
  assert.equal(resolverAplicabilidad(def, { fechaRef: "2026-08-01" }).aplica, false);
});

test("periodo que cruza fin de año (nov a mar)", () => {
  const def = { periodo: { meses_desde: 11, meses_hasta: 3 } };
  assert.equal(resolverAplicabilidad(def, { fechaRef: "2026-12-20" }).aplica, true);
  assert.equal(resolverAplicabilidad(def, { fechaRef: "2026-02-10" }).aplica, true);
  assert.equal(resolverAplicabilidad(def, { fechaRef: "2026-06-01" }).aplica, false);
});

test("fenologia dentro de la ventana V4-R6", () => {
  const def = { fenologia: { desde: "V4", hasta: "R6" } };
  assert.equal(resolverAplicabilidad(def, { fenologiaEstadio: "R3" }).aplica, true);
  assert.equal(resolverAplicabilidad(def, { fenologiaEstadio: "V2" }).aplica, false);
  assert.equal(resolverAplicabilidad(def, { fenologiaEstadio: "R7" }).aplica, false);
});

test("fenologia no disponible: indeterminado, no 'no aplica' silencioso", () => {
  const def = { fenologia: { desde: "V4", hasta: "R6" } };
  const resultado = resolverAplicabilidad(def, {});
  assert.equal(resultado.aplica, false);
  assert.equal(resultado.fenologiaNoEstimable, true);
  assert.equal(resultado.submotivo, "fenologia_no_disponible");
});

test("combina dimensiones: la primera que falla corta la evaluación", () => {
  const def = { zona: { modo: "exclusion" as const, zonas: ["nea"] }, periodo: { meses_desde: 1, meses_hasta: 2 } };
  const resultado = resolverAplicabilidad(def, { zona: "pampeana_sur", fechaRef: "2026-06-01" });
  assert.equal(resultado.aplica, false);
  assert.equal(resultado.submotivo, "fuera_de_periodo");
});
