import assert from "node:assert/strict";
import test from "node:test";
import { groupLimitations } from "../lib/results/supplementary";

test("agrupa limitaciones existentes sin modificar ni inventar contenido", () => {
  const limitations = ["Evaluación parcial: faltan variables.", "No observa mojado foliar.", "Regla experimental en validación.", "Texto ambiguo."];
  const groups = groupLimitations(limitations);
  assert.deepEqual(groups.map(group => group.title), ["Evaluación parcial", "Datos no observados / no disponibles", "Reglas experimentales", "Otras limitaciones"]);
  assert.deepEqual(groups.flatMap(group => group.items), limitations);
});
