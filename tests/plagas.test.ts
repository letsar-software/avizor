import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PestRulesEngine } from "../lib/pests/engine";
import type { AsociacionRegionalPlaga, ContextoFenologico, ReglaPlaga, SerieClimaticaDiaria } from "../types";

const textos: ReglaPlaga["textos"] = { por_que_se_muestra: "Contexto.", estado: "Estado.", que_significa: "No indica presencia.", que_observar: "Observar.", seguimiento: "Monitorear.", evidencia_tecnica: "Experimental." };
const trips: ReglaPlaga = { id: "P-01", version: "1.0", cultivo: "soja", grupo_plaga: "trips", especies: ["caliothrips_phaseoli"], tipo_regla: "climatica", estado: "experimental", activa: true, nivel_evidencia_climatica: "alto", variables_requeridas: ["temp_media_7d", "precip_7d", "dias_con_lluvia_7d"], fenologia_desde: null, fenologia_hasta: null, configuracion: { umbral_dia_lluvia_mm: 1, niveles: [
  { orden: 1, estado: "favorabilidad_alta", combinador: "all", condiciones: [{ indicador: "temp_media_7d", operador: "gte", valor: 25 }, { indicador: "precip_7d", operador: "lt", valor: 10 }, { indicador: "dias_con_lluvia_7d", operador: "lte", valor: 1 }] },
  { orden: 2, estado: "favorabilidad_moderada", combinador: "all", condiciones: [{ indicador: "temp_media_7d", operador: "gte", valor: 20 }, { indicador: "precip_7d", operador: "lt", valor: 25 }] },
  { orden: 3, estado: "sin_condiciones_destacadas", combinador: "any", condiciones: [{ indicador: "precip_7d", operador: "gte", valor: 25 }, { indicador: "dias_con_lluvia_7d", operador: "gte", valor: 3 }] },
] }, textos };
const region: AsociacionRegionalPlaga = { id: "r", zona_agronomica: "zona_nucleo", prioridad: "principal", meses_desde: null, meses_hasta: null, aplicable: true, version: "1.0" };
const noPhenology: ContextoFenologico = { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };

function series(temp: number, rains: Array<number | null>, length = 7): SerieClimaticaDiaria[] {
  return Array.from({ length }, (_, index) => ({ fecha: `2026-01-${String(index + 1).padStart(2, "0")}`, temperaturaMedia: temp, temperaturaMinima: temp - 5, temperaturaMaxima: temp + 5, humedadRelativa: 50, precipitacion: rains[index] ?? null, vientoMedio: null, puntoRocio: null, deficitPresionVapor: null, evapotranspiracion: null, et0: null, humedadSuelo: { profundidad0a1cm: null, profundidad1a3cm: null, profundidad3a9cm: null, profundidad9a27cm: null, profundidad27a81cm: null }, temperaturaSuelo: { profundidad0cm: null, profundidad6cm: null, profundidad18cm: null, profundidad54cm: null }, radiacionSolar: null }));
}

function evaluate(temp: number, rain: Array<number | null>, length = 7) {
  return new PestRulesEngine().evaluate({ rule: trips, region, series: series(temp, rain, length), phenology: noPhenology, fechaRef: "2026-01-08", evaluatedAt: "2026-01-08T12:00:00Z" });
}

test("P-01 respeta el borde 25 °C y prioriza N1 sobre N2", () => assert.equal(evaluate(25, [0,0,0,0,0,0,0]).estado, "favorabilidad_alta"));
test("P-01 debajo de 25 °C cae en N2", () => assert.equal(evaluate(24.99, [0,0,0,0,0,0,0]).estado, "favorabilidad_moderada"));
test("P-01 precipitación 10 mm excluye N1 pero permite N2", () => assert.equal(evaluate(25, [10,0,0,0,0,0,0]).estado, "favorabilidad_moderada"));
test("P-01 precipitación 25 mm activa N3", () => assert.equal(evaluate(19, [25,0,0,0,0,0,0]).estado, "sin_condiciones_destacadas"));
test("P-01 tres días de lluvia activa N3 y 1 mm cuenta como lluvia", () => assert.equal(evaluate(19, [1,1,1,0,0,0,0]).estado, "sin_condiciones_destacadas"));
test("P-01 sin coincidencia queda indeterminado", () => { const result = evaluate(18, [6,6,0,0,0,0,0]); assert.equal(result.estado, "indeterminado"); assert.equal(result.motivo, "sin_nivel_coincidente"); });
test("P-01 no convierte lluvia null en cero", () => { const result = evaluate(26, [0,0,0,null,0,0,0]); assert.equal(result.estado, "indeterminado"); assert.equal(result.motivo, "datos_insuficientes"); });
test("P-01 exige cobertura completa de 7 días", () => { const result = evaluate(26, [0,0,0,0,0,0], 6); assert.equal(result.estado, "indeterminado"); assert.equal(result.calidad_dato, "media"); });

test("prioridad de monitoreo nunca produce favorabilidad y exige fenología cuando está configurada", () => {
  const rule: ReglaPlaga = { ...trips, id: "P-05", grupo_plaga: "chinches", tipo_regla: "prioridad_monitoreo", variables_requeridas: [], fenologia_desde: "R3", fenologia_hasta: "R6", configuracion: { umbral_dia_lluvia_mm: 1 } };
  const missing = new PestRulesEngine().evaluate({ rule, region, series: series(22, [0,0,0,0,0,0,0]), phenology: noPhenology, fechaRef: "2026-01-08", evaluatedAt: "x" });
  assert.deepEqual([missing.estado, missing.motivo], ["indeterminado", "fenologia_no_disponible"]);
  const phenology: ContextoFenologico = { disponible: true, estadio_estimado: "R4", modifica_reglas: false };
  const applicable = new PestRulesEngine().evaluate({ rule, region, series: series(22, [0,0,0,0,0,0,0]), phenology, fechaRef: "2026-01-08", evaluatedAt: "x" });
  assert.equal(applicable.estado, "periodo_relevante_monitoreo");
});

test("zona sin evidencia suficiente no equivale a ausencia biológica", () => {
  const result = new PestRulesEngine().evaluate({ rule: trips, region: { ...region, prioridad: "sin_evidencia_suficiente", aplicable: false }, series: series(26, [0,0,0,0,0,0,0]), phenology: noPhenology, fechaRef: "2026-01-08", evaluatedAt: "x" });
  assert.deepEqual([result.estado, result.motivo], ["no_evaluada", "fuera_zona"]);
});

test("estacionalidad es débil para reglas climáticas y no silencia una señal fuerte", () => {
  const result = new PestRulesEngine().evaluate({ rule: trips, region: { ...region, meses_desde: 6, meses_hasta: 8 }, series: series(26, [0,0,0,0,0,0,0]), phenology: noPhenology, fechaRef: "2026-01-08", evaluatedAt: "x" });
  assert.equal(result.estado, "favorabilidad_alta");
  assert.equal(result.fuera_periodo_habitual, true);
});

test("P-02 queda estructurada e inactiva sin inventar el criterio térmico", () => {
  const migration = readFileSync("db/migrations/013_soja_plagas_rules.sql", "utf8");
  assert.match(migration, /'P-02'[\s\S]*?'experimental',false,'alto'/);
  assert.match(migration, /"tipo_agregacion_termica":null,"umbral_termico":null,"cantidad_dias_minima":null/);
});

test("la migración persiste las siete zonas y el catálogo completo", () => {
  const migration = readFileSync("db/migrations/013_soja_plagas_rules.sql", "utf8");
  for (const zone of ["noa","nea","litoral","zona_nucleo","centro","pampeana_sur","buenos_aires_sudeste"]) assert.match(migration, new RegExp(`'${zone}'`));
  for (const pest of ["caliothrips_phaseoli","tetranychus_urticae","rachiplusia_nu","anticarsia_gemmatalis","chrysodeixis_includens","spodoptera_cosmioides","helicoverpa_gelotopoeon","rhyssomatus_subtilis","complejo"]) assert.match(migration, new RegExp(`'${pest}'`));
  assert.match(migration, /insert into catalogo_plagas/);
  assert.match(migration, /insert into plagas_regionales\(plaga_id,zona_id/);
  assert.doesNotMatch(migration, /create table if not exists plagas_regionales/);
});
