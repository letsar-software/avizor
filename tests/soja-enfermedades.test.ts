import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RulesEngineV2 } from "../lib/rules/engine-v2";
import { ScoreEngineV2 } from "../lib/rules/score-v2";
import { buildConsultationSummary } from "../lib/results/consultation-summary";
import { parseInput, ruleDefinitionSchema } from "../lib/security/validation";
import type { ReglaAgronomicaV2, SerieClimaticaDiaria } from "../types";

const migration = readFileSync(new URL("../db/migrations/009_soja_enfermedades_v2.sql", import.meta.url), "utf8");
const tuplePattern = /\('([a-z_]+)','[a-z_]+',(\d+),'[^']*','[^']*','(\{"niveles"[\s\S]*?\})'\)(?:,|\s*\))/g;
const experimentalKeys = new Set(["antracnosis", "sclerotinia", "mancha_ojo_rana", "tizon_bacteriano", "pustula_bacteriana"]);
const rules = new Map<string, ReglaAgronomicaV2>();
for (const match of migration.matchAll(tuplePattern)) {
  const definition = JSON.parse(match[3]);
  parseInput(ruleDefinitionSchema, definition);
  rules.set(match[1], {
    id: match[1], clave: match[1], version: "2.0", cultivo: "soja", estado: experimentalKeys.has(match[1]) ? "experimental" : "vigente",
    nombre: match[1], categoria: "fixture", evaluabilidad: "PARCIALMENTE_EVALUABLE",
    ventana_dias: Number(match[2]), fuente_tecnica: "fixture", limitaciones_declaradas: "fixture",
    validado_por: "fixture", validado_en: "2026-08-24", condiciones_revision: "fixture",
    decisiones_pendientes: [], definicion: definition,
  });
}

assert.equal(rules.size, 10, "la migración debe contener las 10 reglas activas defendibles");
const engine = new RulesEngineV2();
const at = "2026-08-24T12:00:00.000Z";

function days(count: number, overrides: Partial<{
  temp: number; min: number; max: number; hr: number; rain: number; wind: number;
}> = {}): SerieClimaticaDiaria[] {
  const value = { temp: 25, min: 18, max: 30, hr: 90, rain: 2, wind: 12, ...overrides };
  return Array.from({ length: count }, (_, index) => ({
    fecha: `2026-08-${String(1 + index).padStart(2, "0")}`,
    temperaturaMedia: value.temp, temperaturaMinima: value.min, temperaturaMaxima: value.max,
    humedadRelativa: value.hr, precipitacion: value.rain, vientoMedio: value.wind,
    puntoRocio: null, deficitPresionVapor: null, evapotranspiracion: null, et0: null,
    humedadSuelo: { profundidad0a1cm: null, profundidad1a3cm: null, profundidad3a9cm: null, profundidad9a27cm: null, profundidad27a81cm: null },
    temperaturaSuelo: { profundidad0cm: null, profundidad6cm: null, profundidad18cm: null, profundidad54cm: null },
    radiacionSolar: null,
  }));
}

test("las definiciones v2.0 son estructurales y no usan ejecución dinámica", () => {
  assert.doesNotMatch(migration, /\beval\s*\(|new\s+Function|\bexec\s*\(/);
  assert.match(migration, /drop index if exists reglas_agronomicas_unique_rule_idx/);
  assert.match(migration, /insert into auditoria/);
  assert.match(migration, /modo_avizor text check \(modo_avizor in \('ESTABLE','EXPERIMENTAL'\)\)/);
  assert.match(migration, /then 'experimental' else 'vigente' end/);
  assert.doesNotMatch(migration, /"variable":"viento_medio"/);
  assert.equal((migration.match(/'PARCIALMENTE_EVALUABLE'/g) ?? []).length >= 10, true);
  assert.match(migration, /'smv'[\s\S]*?'NO_EVALUABLE'/);
  assert.match(migration, /'amv'[\s\S]*?'NO_EVALUABLE'/);
});

for (const [key, rule] of rules) {
  test(`${key}: ventana incompleta y dato faltante no se convierten en falso`, () => {
    assert.equal(engine.evaluate(rule, days(rule.ventana_dias - 1), at).motivo, "datos_insuficientes");
    const series = days(rule.ventana_dias);
    const first = rule.definicion.niveles[0].condiciones[0].variable;
    if (first === "temperatura_media") series.forEach((day) => { day.temperaturaMedia = null; });
    else if (first === "temperatura_max") series.forEach((day) => { day.temperaturaMaxima = null; });
    assert.equal(engine.evaluate(rule, series, at).estado, "indeterminado");
  });

  const temperature = rule.definicion.niveles[0].condiciones.find((condition) => condition.variable === "temperatura_media" && condition.operador === "between");
  if (temperature && Array.isArray(temperature.valor)) {
    const range = temperature.valor;
    test(`${key}: respeta ambos bordes térmicos`, () => {
      const [low, high] = range;
      const matching = (temp: number) => engine.evaluate(rule, days(rule.ventana_dias, { temp }), at).observado.find((item) => item.variable === "temperatura_media")?.cumple;
      assert.equal(matching(low), true);
      assert.equal(matching(low - 0.1), false);
      assert.equal(matching(high), true);
      assert.equal(matching(high + 0.1), false);
    });
  }

  const humidity = rule.definicion.niveles[0].condiciones.find((condition) => condition.variable === "humedad_relativa" && ["gt", "gte"].includes(condition.operador));
  if (humidity && typeof humidity.valor === "number" && humidity.agregador === "media_ventana") {
    test(`${key}: respeta el umbral exacto de HR`, () => {
      const atThreshold = engine.evaluate(rule, days(rule.ventana_dias, { hr: humidity.valor as number }), at).observado.find((item) => item.variable === "humedad_relativa")?.cumple;
      const below = engine.evaluate(rule, days(rule.ventana_dias, { hr: (humidity.valor as number) - 0.1 }), at).observado.find((item) => item.variable === "humedad_relativa")?.cumple;
      assert.equal(atThreshold, humidity.operador === "gte");
      assert.equal(below, false);
    });
  }
}

const golden = [
  { name: "cálido húmedo", values: { temp: 27, max: 32, hr: 92, rain: 3, wind: 18 }, include: ["antracnosis", "cercospora_kikuchii", "roya_asiatica", "sclerotinia", "mancha_ojo_rana", "pustula_bacteriana"], exclude: ["macrophomina", "mancha_marron"] },
  { name: "cálido seco", values: { temp: 32, max: 35, hr: 40, rain: 0, wind: 8 }, include: ["macrophomina"], exclude: ["roya_asiatica", "sclerotinia"] },
  { name: "fresco húmedo", values: { temp: 19, max: 22, hr: 94, rain: 2, wind: 15 }, include: ["roya_asiatica", "sclerotinia", "tizon_bacteriano", "oidio"], exclude: ["pustula_bacteriana", "mancha_ojo_rana"] },
  { name: "templado sin lluvia", values: { temp: 24, max: 28, hr: 88, rain: 0, wind: 6 }, include: ["cercospora_kikuchii"], exclude: ["roya_asiatica", "mancha_marron"] },
  { name: "reproductivo húmedo (fenología pendiente)", values: { temp: 21, max: 25, hr: 93, rain: 2, wind: 10 }, include: ["sclerotinia", "mildiu"], exclude: ["mancha_ojo_rana", "cancro_caulivora"] },
  { name: "vegetativo húmedo (sin exclusión dura)", values: { temp: 21, max: 25, hr: 93, rain: 2, wind: 10 }, include: ["sclerotinia", "mildiu"], exclude: ["macrophomina"] },
  { name: "suelo saturado sin calibración", values: { temp: 26, max: 29, hr: 95, rain: 8, wind: 5 }, include: ["roya_asiatica"], exclude: ["phytophthora_sojae", "pythium"] },
  { name: "datos incompletos", values: { temp: 22, max: 26, hr: 91, rain: 1, wind: 7 }, include: [], exclude: ["smv", "amv"] },
  { name: "solo Sclerotinia experimental", values: { temp: 12, max: 16, hr: 88, rain: 2, wind: 4 }, include: ["sclerotinia"], exclude: ["roya_asiatica"], estadoGeneral: "Sin alertas activas" },
  { name: "Roya estable y Sclerotinia experimental", values: { temp: 20, max: 24, hr: 86, rain: 2, wind: 5 }, include: ["roya_asiatica", "sclerotinia"], exclude: ["macrophomina"], estadoGeneral: "Atención recomendada" },
  { name: "bacteriosis experimental con viento mínimo", values: { temp: 17, max: 20, hr: 50, rain: 1, wind: 0.1 }, include: ["tizon_bacteriano"], exclude: ["roya_asiatica"], estadoGeneral: "Sin alertas activas" },
] as const;

for (const scenario of golden) test(`golden: ${scenario.name}`, () => {
  const series = days(14, scenario.values);
  if (scenario.name === "datos incompletos") series[13].humedadRelativa = null;
  const results = [...rules.values()].map((rule) => engine.evaluate(rule, series, at));
  const active = results.filter((result) => result.estado === "condiciones_detectadas").map((result) => result.regla.clave);
  for (const key of scenario.include) assert.ok(active.includes(key), `${key} debe aparecer; activas=${active.join(",")}`);
  for (const key of scenario.exclude) assert.ok(!active.includes(key), `${key} no debe aparecer; activas=${active.join(",")}`);
  if ("estadoGeneral" in scenario) assert.equal(new ScoreEngineV2().evaluate(results).estadoGeneral, scenario.estadoGeneral);
});

test("múltiples enfermedades no incrementan el estado ni se presentan como categorías sumadas", () => {
  const series = days(14, { temp: 27, max: 32, hr: 92, rain: 3, wind: 18 });
  const results = [...rules.values()].map((rule) => engine.evaluate(rule, series, at));
  const score = new ScoreEngineV2().evaluate(results);
  assert.equal(score.estadoGeneral, "Atención recomendada");
  assert.equal(score.explicacion, "Se detectaron una o más señales ambientales que merecen atención.");
  assert.doesNotMatch(score.explicacion, /\d+ categor/);
});

test("solo una regla estable impacta el estado general", () => {
  const result = engine.evaluate(rules.get("roya_asiatica")!, days(5, { temp: 20, hr: 80, rain: 1 }), at);
  assert.equal(result.regla.modo, "estable");
  assert.equal(new ScoreEngineV2().evaluate([result]).estadoGeneral, "Atención recomendada");
});

test("una o varias coincidencias experimentales se evalúan pero no impactan el score", () => {
  const series = days(5, { temp: 27, hr: 92, rain: 2 });
  const results = ["antracnosis", "sclerotinia", "mancha_ojo_rana", "pustula_bacteriana"].map((key) => engine.evaluate(rules.get(key)!, series, at));
  assert.ok(results.every((result) => result.estado === "condiciones_detectadas" && result.regla.modo === "experimental"));
  assert.equal(new ScoreEngineV2().evaluate(results).estadoGeneral, "Sin alertas activas");
});

test("estable más experimentales produce el mismo score que la estable sola", () => {
  const stable = engine.evaluate(rules.get("roya_asiatica")!, days(5, { temp: 20, hr: 86, rain: 1 }), at);
  const experimental = engine.evaluate(rules.get("sclerotinia")!, days(5, { temp: 20, hr: 86, rain: 1 }), at);
  assert.deepEqual(new ScoreEngineV2().evaluate([stable, experimental]), new ScoreEngineV2().evaluate([stable]));
  assert.deepEqual(buildConsultationSummary([stable, experimental]), buildConsultationSummary([stable]));
});

test("bacteriosis usa temperatura y lluvia; el viento queda sólo como observado climático", () => {
  const rule = rules.get("tizon_bacteriano")!;
  assert.ok(rule.definicion.niveles[0].condiciones.every((condition) => condition.variable !== "viento_medio"));
  const noWind = engine.evaluate(rule, days(3, { temp: 17, rain: 1, wind: 0 }), at);
  assert.equal(noWind.estado, "condiciones_detectadas");
  assert.equal(noWind.regla.modo, "experimental");
  assert.equal(new ScoreEngineV2().evaluate([noWind]).estadoGeneral, "Sin alertas activas");
});
