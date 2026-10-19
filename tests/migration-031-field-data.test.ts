import test, { before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { migratedDatabase, migrationSql, loadRules } from "./helpers/migrated-db";
import { RulesEngineV2 } from "../lib/rules/engine-v2";
import { consolidateCategoryRisks } from "../lib/rules/consolidation";
import { categoriesForResult } from "../lib/results/category-presentation";
import { CategoryRiskCard } from "../components/results/CategoryRiskCard";
import { currentFieldData, type FieldDatum } from "../lib/field-data/current";
import { adminRulePatchSchema } from "../lib/security/validation";
import { validateVariableLists, initialVariableLists } from "../lib/variables/lists";
import { BASE_VARIABLES } from "../lib/variables/catalog";
import type { ContextoFenologico, ReglaAgronomicaV2, RiskCategory, SerieClimaticaDiaria } from "../types";

// Módulo CommonJS compartido con scripts/verify-migration-031-copy.js.
const { simulate, impactReport } = require("../scripts/lib/migration-031-impact.js");

const at = "2026-10-19T12:00:00.000Z";
const engine = new RulesEngineV2();
const noPhenology: ContextoFenologico = { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
const categories: RiskCategory[] = [
  { id: "1", key: "enfermedades_foliares", name: "Patógenos" },
  { id: "2", key: "plagas", name: "Plagas" },
  { id: "3", key: "heladas", name: "Heladas" },
  { id: "4", key: "estres_hidrico", name: "Estrés hídrico" },
  { id: "5", key: "exceso_hidrico", name: "Exceso hídrico" },
];

function series({ temp = 12, rain = 0, wetness = null as number | null, days = 14 } = {}): SerieClimaticaDiaria[] {
  return Array.from({ length: days }, (_, i) => ({
    fecha: `2026-10-${String(5 + i).padStart(2, "0")}`, temperaturaMedia: temp, temperaturaMinima: temp - 6, temperaturaMaxima: temp + 6,
    humedadRelativa: 75, precipitacion: rain, vientoMedio: 10, puntoRocio: null, deficitPresionVapor: null, evapotranspiracion: null, et0: 2,
    humedadSuelo: { profundidad0a1cm: 0.3, profundidad1a3cm: null, profundidad3a9cm: null, profundidad9a27cm: null, profundidad27a81cm: null },
    temperaturaSuelo: { profundidad0cm: null, profundidad6cm: null, profundidad18cm: null, profundidad54cm: null },
    radiacionSolar: null, leafWetnessHours: wetness,
  }));
}

function datum(variable_key: string, value: unknown, overrides: Partial<FieldDatum> = {}): FieldDatum {
  return { field_id: "lote-7", variable_key, value, observed_at: "2026-10-18T10:00:00.000Z", status: "vigente", source: "manual", recorded_by: "agronoma-1", ...overrides };
}

// Base real: migraciones 001–030 en PostgreSQL embebido (PGlite).
let base: Awaited<ReturnType<typeof migratedDatabase>>;
let royaRules: ReglaAgronomicaV2[];
before(async () => {
  base = await migratedDatabase({ until: "031" });
  const after031 = await migratedDatabase({ until: "033" });
  royaRules = await loadRules(after031.query, "r.cultivo = 'trigo' and r.clave like 'roya_amarilla%' and r.activa = true");
});

const ruleCopy = (clave: string, version: string, categoriaNombre: string) => `
  insert into reglas_agronomicas (cultivo, categoria_nombre, condicion, causas, recomendacion, regla_version, estado_regla, prioridad, activa,
    combinador, condiciones, clave, version, estado, ventana_dias, definicion)
  select cultivo, '${categoriaNombre}', condicion, causas, recomendacion, '${version}', estado_regla, prioridad, false,
    combinador, condiciones, '${clave}', '${version}', 'experimental', ventana_dias, definicion
  from reglas_agronomicas where cultivo = 'soja' and clave = 'precipitacion_elevada' limit 1`;

test("031 no sobrescribe un categoria_id existente", async () => {
  await base.exec("begin");
  try {
    // Asignación manual "distinta" a la derivada: 031 debe respetarla.
    await base.exec(`update reglas_agronomicas set categoria_id = (select id from categorias_agronomicas where clave = 'heladas')
      where cultivo = 'soja' and clave = 'precipitacion_elevada'`);
    const existing = await base.query<{ id: string; categoria_id: string }>("select id::text, categoria_id::text from reglas_agronomicas where categoria_id is not null");
    const report = await impactReport(base.query);
    assert.ok(report.existentes_que_difieren.some((row: { clave: string }) => row.clave === "precipitacion_elevada"));
    await base.exec(migrationSql("031_variables_criticas_complementarias.sql"));
    const after = new Map((await base.query<{ id: string; categoria_id: string }>("select id::text, categoria_id::text from reglas_agronomicas")).map((row) => [row.id, row.categoria_id]));
    for (const row of existing) assert.equal(after.get(row.id), row.categoria_id);
  } finally {
    await base.exec("rollback");
  }
});

test("031 deja sin modificar las reglas ambiguas o sin correspondencia y las reporta", async () => {
  await base.exec("begin");
  try {
    await base.exec(ruleCopy("precipitacion_elevada", "9.9", "heladas")); // clave → exceso, categoria_nombre → heladas
    await base.exec(ruleCopy("regla_sin_mapa", "1.0", "foliar"));
    const report = await impactReport(base.query);
    assert.deepEqual(report.ambiguas.map((row: { clave: string; version: string }) => `${row.clave}@${row.version}`), ["precipitacion_elevada@9.9"]);
    assert.deepEqual(report.sin_correspondencia.map((row: { clave: string }) => row.clave), ["regla_sin_mapa"]);
    await base.exec(migrationSql("031_variables_criticas_complementarias.sql"));
    const untouched = await base.query<{ clave: string; categoria_id: string | null }>(
      "select clave, categoria_id::text from reglas_agronomicas where (clave = 'precipitacion_elevada' and version = '9.9') or clave = 'regla_sin_mapa'",
    );
    assert.deepEqual(untouched.map((row) => row.categoria_id), [null, null]);
    const linked = await base.query("select regla_id from migracion_031_vinculos v join reglas_agronomicas r on r.id::text = v.regla_id where r.version = '9.9' or r.clave = 'regla_sin_mapa'");
    assert.equal(linked.length, 0);
  } finally {
    await base.exec("rollback");
  }
});

test("031 es idempotente y reversible", async () => {
  const result = await simulate(base);
  assert.equal(result.idempotente, true);
  assert.equal(result.antes.total_reglas, result.despues.total_reglas);
  assert.equal(result.despues.sin_categoria, 0);
  await base.exec("begin");
  try {
    const before031 = await base.query("select id::text, categoria_id::text, definicion from reglas_agronomicas order by id");
    await base.exec(migrationSql("031_variables_criticas_complementarias.sql"));
    const rollback = readFileSync("db/operations/031_rollback.sql", "utf8").replace(/^begin;$/m, "").replace(/^rollback;$/m, "");
    await base.exec(rollback);
    const restored = await base.query("select id::text, categoria_id::text, definicion from reglas_agronomicas order by id");
    assert.deepEqual(restored, before031);
  } finally {
    await base.exec("rollback");
  }
  // La simulación nunca deja rastros.
  assert.equal((await base.query<{ ok: boolean }>("select to_regclass('public.migracion_031_vinculos') is null as ok"))[0].ok, true);
});

test("una variable crítica faltante bloquea un riesgo confirmado", () => {
  const complete = royaRules.find((rule) => rule.clave === "roya_amarilla_mojado_foliar")!;
  assert.deepEqual(complete.critical_required_variables, ["temperatura_media", "leaf_wetness_hours"]);
  const result = engine.evaluate(complete, series({ temp: 12 }), at, noPhenology);
  assert.equal(result.estado, "no_evaluable");
  assert.ok(!["favorable", "moderado", "alto", "critico"].includes(consolidateCategoryRisks(categories, [result], [])[0].internal_status));
});

test("una variable complementaria faltante no bloquea el cálculo", () => {
  const alternative = royaRules.find((rule) => rule.clave === "roya_amarilla")!;
  const result = engine.evaluate(alternative, series({ temp: 12 }), at, noPhenology);
  assert.equal(result.estado, "vigilancia");
  assert.deepEqual(result.missing_complementary_variables, ["leaf_wetness_hours", "codigo_zadoks", "cultivar_susceptibilidad", "observacion_manual"]);
});

test("las listas no aceptan variables duplicadas", () => {
  const parse = (critical: string[], complementary: string[]) => adminRulePatchSchema.safeParse({ critical_required_variables: critical, complementary_required_variables: complementary });
  assert.equal(parse(["temperatura_media"], ["leaf_wetness_hours"]).success, true);
  assert.equal(parse(["temperatura_media", "temperatura_media"], []).success, false);
  assert.equal(parse(["temperatura_media"], ["temperatura_media"]).success, false);
  assert.equal(parse(["temperature_c"], ["temperatura_media"]).success, false, "alias y nombre canónico son la misma variable");
  assert.equal(adminRulePatchSchema.safeParse({ critical_required_variables: ["temperatura_media"] }).success, false, "se guardan juntas");
  assert.match(validateVariableLists(["x_inexistente"], [], new Set(["temperatura_media"]))[0].message, /no existe en el catálogo/);
  assert.deepEqual(initialVariableLists({ variables_requeridas: ["temperatura_media"] }), { critical: ["temperatura_media"], complementary: [], legacy: true });
});

test("un dato manual vigente de lote es usado por el motor", () => {
  const complete = royaRules.find((rule) => rule.clave === "roya_amarilla_mojado_foliar")!;
  const fieldData = currentFieldData([datum("leaf_wetness_hours", 8, { source: "sensor" })], at);
  const result = engine.evaluate(complete, series({ temp: 12 }), at, noPhenology, fieldData);
  assert.equal(result.estado, "favorable");
  assert.equal(result.observado.find((item) => item.variable === "leaf_wetness_hours")?.fuente, "sensor");
  // La etapa cargada en el lote completa la fenología y deja de pedirse.
  const alternative = royaRules.find((rule) => rule.clave === "roya_amarilla")!;
  const withStage = engine.evaluate(alternative, series({ temp: 12 }), at, noPhenology, currentFieldData([datum("zadoks_stage", 31)], at));
  assert.ok(!withStage.missing_complementary_variables?.includes("codigo_zadoks"));
});

test("un dato vencido o histórico no se usa como vigente", () => {
  const complete = royaRules.find((rule) => rule.clave === "roya_amarilla_mojado_foliar")!;
  const expired = datum("leaf_wetness_hours", 8, { observed_at: "2026-10-01T10:00:00.000Z", valid_until: "2026-10-02T10:00:00.000Z" });
  const historic = datum("leaf_wetness_hours", 8, { status: "historico" });
  const byCatalog = datum("observacion_manual", "Pústulas en hoja bandera", { observed_at: "2026-10-01T10:00:00.000Z" }); // vigencia 7 días
  const validity = new Map(BASE_VARIABLES.map((variable) => [variable.clave, variable.vigencia_dias]));
  const current = currentFieldData([expired, historic, byCatalog], at, validity);
  assert.equal(current.size, 0);
  assert.equal(engine.evaluate(complete, series({ temp: 12 }), at, noPhenology, current).estado, "no_evaluable");
  // El más reciente vigente gana sobre uno anterior.
  const newest = currentFieldData([datum("observacion_manual", "a", { observed_at: "2026-10-17T10:00:00.000Z" }), datum("observacion_manual", "b")], at, validity);
  assert.equal(newest.get("observacion_manual")?.value, "b");
});

test("la tarjeta lista sólo datos de reglas aplicables al cultivo, categoría y etapa", () => {
  const stageBound: ReglaAgronomicaV2 = { ...royaRules.find((rule) => rule.clave === "roya_amarilla")!, id: "x", clave: "solo_floracion", zadoks_desde: 60, zadoks_hasta: 69,
    complementary_required_variables: ["hospedantes_puentes_verdes"] };
  const otherCategory: ReglaAgronomicaV2 = { ...stageBound, id: "y", clave: "exceso_otro", categoria_clave: "exceso_hidrico", zadoks_desde: null, zadoks_hasta: null,
    critical_required_variables: ["precipitacion"], complementary_required_variables: ["estado_drenaje"] };
  const phenology: ContextoFenologico = { disponible: true, codigo_zadoks: 31, modifica_reglas: false };
  const evaluated = [...royaRules, stageBound, otherCategory].map((rule) => engine.evaluate(rule, series({ temp: 12 }), at, phenology));
  const [pathogens] = categoriesForResult({ reglas: evaluated, categorias: consolidateCategoryRisks(categories, evaluated, []) });
  const labels = pathogens.required_data.map((item) => item.label);
  assert.ok(!labels.includes("Cultivares, hospedantes o puentes verdes, cuando aplique"), "regla fuera de etapa");
  assert.ok(!labels.includes("Estado de drenaje del lote"), "regla de otra categoría");
  assert.ok(!labels.includes("Etapa fenológica actual"), "la etapa ya está informada");
});

test("la vista previa de roya amarilla refleja el texto actualizado con las reglas reales", () => {
  const evaluated = royaRules.map((rule) => engine.evaluate(rule, series({ temp: 12 }), at, noPhenology));
  const [pathogens] = categoriesForResult({ reglas: evaluated, categorias: consolidateCategoryRisks(categories, evaluated, []) });
  assert.equal(pathogens.title, "Patógenos");
  assert.equal(pathogens.display_status, "Monitoreo recomendado");
  assert.equal(pathogens.message, "La temperatura es compatible con roya amarilla.");
  assert.deepEqual(pathogens.required_data.map((item) => item.label), [
    "Horas de mojado foliar medidas o calculadas por un modelo calibrado",
    "Etapa fenológica actual",
    "Cultivar y susceptibilidad",
    "Observaciones de campo",
  ]);
  const html = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: pathogens, basePath: "/resultado" }));
  for (const forbidden of [/No evaluable/i, /No se pudo evaluar/i, /Condiciones insuficientes/i, /Experimental/i]) assert.doesNotMatch(html, forbidden);
});

test("la semilla de 032 coincide con el catálogo base en código", () => {
  const sql = migrationSql("032_variables_y_datos_de_campo.sql");
  for (const variable of BASE_VARIABLES) assert.ok(sql.includes(`('${variable.clave}', '${variable.etiqueta.replaceAll("'", "''")}'`), variable.clave);
});
