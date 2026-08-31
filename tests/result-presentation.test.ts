import assert from "node:assert/strict";
import test from "node:test";
import { representativeRuleForDefinition, statusLabel } from "../lib/results/presentation";
import type { ResultadoReglaV2 } from "../types";

function rule(estado: string, etiqueta?: string) { return { estado, etiqueta } as ResultadoReglaV2; }

test("los estados activos explican el fenómeno y no muestran favorable aislado", () => {
  assert.equal(statusLabel(rule("favorables", "Favorable"), "Enfermedades foliares"), "Condiciones que pueden favorecer enfermedades foliares");
  assert.equal(statusLabel(rule("condiciones_detectadas", "Favorable"), "Estrés hídrico"), "Precipitación acumulada baja");
});

test("elimina duplicaciones de presentación sin alterar el estado", () => {
  const value = rule("personalizado", "Favorable - Favorable");
  assert.equal(statusLabel(value), "Favorable");
  assert.equal(value.estado, "personalizado");
});

test("sin condiciones queda asociado a la categoría", () => {
  assert.equal(statusLabel(rule("sin_condiciones"), "Heladas"), "Sin condiciones asociadas a heladas");
});

test("enfermedades foliares usa las reglas específicas cuando la regla genérica fue retirada", () => {
  const detected = rule("condiciones_detectadas", "Ambiente compatible con roya asiática");
  detected.riesgo = "roya_asiatica";
  detected.regla = { ...detected.regla, clave: "roya_asiatica", categoria: "foliar", nombre: "Roya asiática de la soja" };
  const calm = rule("sin_condiciones", "Sin coincidencia");
  calm.riesgo = "oidio";
  calm.regla = { ...calm.regla, clave: "oidio", categoria: "foliar", nombre: "Oídio" };
  const result = { reglas: [calm, detected] } as Parameters<typeof representativeRuleForDefinition>[0];
  assert.equal(representativeRuleForDefinition(result, "enfermedades_foliares"), detected);
});
