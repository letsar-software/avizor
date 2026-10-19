import test, { before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { migratedDatabase, loadRules } from "./helpers/migrated-db";
import { RulesEngineV2 } from "../lib/rules/engine-v2";
import { consolidateCategoryRisks } from "../lib/rules/consolidation";
import { categoriesForResult } from "../lib/results/category-presentation";
import { CategoryRiskCard } from "../components/results/CategoryRiskCard";
import { CategoryMatches } from "../components/results/CategoryMatches";
import { currentFieldData, type FieldDatum } from "../lib/field-data/current";
import { ConsultaService, type DomainError } from "../lib/consultas/service";
import { RulesEvaluationService } from "../lib/rules/evaluation-service";
import type { Lot, LotActor } from "../lib/lots/access";
import type { ClimateSeriesProvider } from "../lib/climate/contract";
import type { ContextoFenologico, ReglaAgronomicaV2, RiskCategory, SerieClimaticaDiaria } from "../types";

// Módulos CommonJS del runner y del chequeo de esquema.
const { EXPECTED_TABLES } = require("../scripts/lib/clean-schema.js");

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
const FORBIDDEN = [/No evaluable/i, /No hay condiciones suficientes/i, /Experimental/i, /No se pudo evaluar/i];

function series({ temp = 12, soil = 0.28, days = 14 } = {}): SerieClimaticaDiaria[] {
  return Array.from({ length: days }, (_, i) => ({
    fecha: `2026-10-${String(6 + i).padStart(2, "0")}`, temperaturaMedia: temp, temperaturaMinima: temp - 7, temperaturaMaxima: temp + 7,
    humedadRelativa: 78, precipitacion: 2, vientoMedio: 12, puntoRocio: temp - 4, deficitPresionVapor: 0.6, evapotranspiracion: 2.5, et0: 3,
    humedadSuelo: { profundidad0a1cm: soil, profundidad1a3cm: soil, profundidad3a9cm: soil, profundidad9a27cm: soil, profundidad27a81cm: soil },
    temperaturaSuelo: { profundidad0cm: temp, profundidad6cm: temp, profundidad18cm: temp, profundidad54cm: temp },
    radiacionSolar: 210, leafWetnessHours: null,
  }));
}

/** Regla sintética de vigilancia por temperatura (para empates controlados). */
function tempRule(clave: string, nombre: string, estado = "vigilancia", overrides: Partial<ReglaAgronomicaV2> = {}): ReglaAgronomicaV2 {
  return {
    id: clave, clave, nombre, version: "1.0", cultivo: "girasol", estado: "vigente", categoria_clave: "enfermedades_foliares", prioridad: 0,
    ventana_dias: 5, fuente_tecnica: "fixture", limitaciones_declaradas: null, validado_por: null, validado_en: null, condiciones_revision: null,
    decisiones_pendientes: [], evidence_level: "media",
    definicion: { niveles: [{ orden: 1, clave: estado, orden_visual: 1, etiqueta: `Temperatura compatible con ${nombre.toLowerCase()}.`, condiciones: [
      { variable: "temperatura_media", agregador: "media_ventana", operador: "between", valor: [10, 15], unidad: "°C" },
    ] }], sin_coincidencia: { estado: "sin_condiciones" } },
    ...overrides,
  };
}

function datum(variable_key: string, value: unknown, overrides: Partial<FieldDatum> = {}): FieldDatum {
  return { id: `dato-${variable_key}`, field_id: LOT.id, variable_key, value, observed_at: "2026-10-18T10:00:00.000Z", status: "vigente", source: "manual", recorded_by: "agronoma-1", ...overrides };
}

const LOT: Lot = { id: "6f1b2c4e-1a2b-4c3d-9e8f-0a1b2c3d4e5f", empresa_id: "empresa-a", nombre: "Lote ilustrativo", cultivo: "trigo", activo: true };
const empresaA: LotActor = { kind: "empresa", empresaId: "empresa-a" };

let trigoRules: ReglaAgronomicaV2[];
let royaYMancha: ReglaAgronomicaV2[];
before(async () => {
  const { query } = await migratedDatabase({ until: "033" });
  trigoRules = await loadRules(query, "r.cultivo = 'trigo' and r.activa = true and r.estado in ('vigente', 'experimental')");
  royaYMancha = trigoRules.filter((rule) => rule.clave.startsWith("roya_amarilla") || rule.clave === "mancha_amarilla");
});

const climate = (serie: SerieClimaticaDiaria[]): ClimateSeriesProvider => ({
  obtenerSerie: async (input) => ({
    proveedor: "fixture", coordenadas: { latitud: input.localidad.latitud, longitud: input.localidad.longitud }, fechaConsulta: input.fechaRef,
    rangoTemporal: { desde: serie[0].fecha, hasta: serie.at(-1)!.fecha }, variablesDisponibles: [], variablesFaltantes: [], diasSolicitados: 14,
    diasDisponibles: 14, obtenidoEn: at, cobertura: 1, errores: [], adapterVersion: "test", serie, prevision: [],
  }),
});

function consultaService(rules: ReglaAgronomicaV2[], fieldRecords: FieldDatum[] = [], calls = { lot: 0 }) {
  return new ConsultaService({
    climate: climate(series()), loadRules: async () => rules, persist: async () => null,
    phenology: { estimarEstadio: async () => noPhenology },
    loadCategories: async () => categories, loadAdvisories: async () => [], loadVariableLabels: async () => new Map(),
    loadLot: async (id) => { calls.lot += 1; return id === LOT.id ? LOT : null; },
    loadFieldData: async (_lotId, when) => currentFieldData(fieldRecords, when),
  });
}

test("1. dos enfermedades con igual severidad y prioridad aparecen ambas como coincidencias", () => {
  const evaluated = royaYMancha.map((rule) => engine.evaluate(rule, series(), at, noPhenology));
  const [pathogens] = consolidateCategoryRisks(categories, evaluated, []);
  assert.equal(pathogens.internal_status, "vigilancia");
  assert.deepEqual(pathogens.matched_rules.map((match) => match.rule_name), ["Roya amarilla", "Mancha amarilla"]);
  assert.equal(pathogens.additional_matches_count, 0);
});

test("2. el empate no se resuelve por orden alfabético ni descarta reglas", () => {
  const zeta = tempRule("zeta", "Zeta");
  const alfa = tempRule("alfa", "Alfa");
  for (const order of [[zeta, alfa], [alfa, zeta]]) {
    const evaluated = order.map((rule) => engine.evaluate(rule, series(), at, noPhenology));
    const [pathogens] = consolidateCategoryRisks(categories, evaluated, []);
    // Mismo estado, prioridad, evidencia y revisión: se conserva el orden configurado.
    assert.deepEqual(pathogens.matched_rules.map((match) => match.rule_name), order.map((rule) => rule.nombre));
  }
  const evidence = [tempRule("alfa", "Alfa", "vigilancia", { evidence_level: "limitada" }), tempRule("zeta", "Zeta", "vigilancia", { evidence_level: "alta" })];
  const [byEvidence] = consolidateCategoryRisks(categories, evidence.map((rule) => engine.evaluate(rule, series(), at, noPhenology)), []);
  assert.deepEqual(byEvidence.matched_rules.map((match) => match.rule_name), ["Zeta", "Alfa"]);
});

test("3. una coincidencia de mayor severidad sigue siendo el resultado principal sin elevar las demás", () => {
  const rules = [tempRule("a", "Mancha"), tempRule("b", "Roya", "moderado"), tempRule("c", "Septoria")];
  const [pathogens] = consolidateCategoryRisks(categories, rules.map((rule) => engine.evaluate(rule, series(), at, noPhenology)), []);
  assert.equal(pathogens.internal_status, "moderado");
  assert.equal(pathogens.display_status, "Riesgo moderado");
  assert.equal(pathogens.message, "Temperatura compatible con roya.");
  assert.deepEqual(pathogens.matched_rules.map((match) => [match.rule_name, match.internal_status]), [["Roya", "moderado"], ["Mancha", "vigilancia"], ["Septoria", "vigilancia"]]);
  const [ties] = consolidateCategoryRisks(categories, [tempRule("a", "Mancha"), tempRule("c", "Septoria")].map((rule) => engine.evaluate(rule, series(), at, noPhenology)), []);
  assert.equal(ties.internal_status, "vigilancia", "varias coincidencias no elevan la severidad");
});

test("4. la tarjeta resume tres coincidencias y el detalle lista todas", () => {
  const names = ["Uno", "Dos", "Tres", "Cuatro", "Cinco"];
  const evaluated = names.map((name) => engine.evaluate(tempRule(name.toLowerCase(), name), series(), at, noPhenology));
  const [card] = categoriesForResult({ reglas: evaluated, categorias: consolidateCategoryRisks(categories, evaluated, []) });
  assert.deepEqual(card.matches.names, ["Uno", "Dos", "Tres"]);
  assert.equal(card.matches.additional, 2);
  const cardHtml = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: card, basePath: "/resultado" }));
  assert.match(cardHtml, /Condiciones compatibles con:/);
  assert.match(cardHtml, /Y 2 condiciones adicionales para monitorear/);
  assert.doesNotMatch(cardHtml, /Cuatro|Cinco/);
  const detail = renderToStaticMarkup(React.createElement(CategoryMatches, { matches: card.matched_rules }));
  assert.equal(detail.match(/data-testid="category-match"/g)?.length, 5);
  for (const name of names) assert.match(detail, new RegExp(name));
});

test("5. la consulta con lot_id usa los datos de campo vigentes y valida el acceso", async () => {
  const result = await consultaService(royaYMancha, [datum("leaf_wetness_hours", 8, { source: "sensor" })])
    .ejecutar({ cultivo: "trigo", localidad: "Tandil", fechaRef: "2026-10-19", lotId: LOT.id }, "req-1", { actor: empresaA });
  assert.equal(result.lot_id, LOT.id);
  const pathogens = result.categorias!.find((category) => category.category === "enfermedades_foliares")!;
  assert.ok("internal_status" in pathogens && pathogens.internal_status === "favorable");
  assert.deepEqual(result.data_provenance?.variables.find((item) => item.key === "leaf_wetness_hours"), {
    key: "leaf_wetness_hours", source: "sensor", observed_at: "2026-10-18T10:00:00.000Z", field_datum_id: "dato-leaf_wetness_hours",
  });
  assert.equal(result.data_provenance?.variables.find((item) => item.key === "temperatura_media")?.source, "weather");
  const service = consultaService(royaYMancha);
  await assert.rejects(() => service.ejecutar({ cultivo: "trigo", localidad: "Tandil", lotId: LOT.id }, "req-2", { actor: { kind: "anonymous" } }),
    (error: DomainError) => error.code === "LOTE_REQUIERE_AUTENTICACION");
  await assert.rejects(() => service.ejecutar({ cultivo: "trigo", localidad: "Tandil", lotId: LOT.id }, "req-3", { actor: { kind: "empresa", empresaId: "otra" } }),
    (error: DomainError) => error.code === "LOTE_NO_ENCONTRADO");
});

test("6. sin lot_id la respuesta mantiene el contrato anterior", async () => {
  const calls = { lot: 0 };
  const result = await consultaService(royaYMancha, [datum("leaf_wetness_hours", 8)], calls).ejecutar({ cultivo: "trigo", localidad: "Tandil", fechaRef: "2026-10-19" });
  assert.equal(calls.lot, 0);
  assert.equal("lot_id" in result, false);
  assert.equal("data_provenance" in result, false);
  for (const key of ["id", "request_id", "share_token", "estado_general", "explicacion", "resumen_consulta", "localidad", "cultivo", "fecha_ref", "reglas", "categorias", "contexto_fenologico", "clima"]) {
    assert.ok(key in result, key);
  }
  const pathogens = result.categorias!.find((category) => category.category === "enfermedades_foliares")!;
  assert.ok("internal_status" in pathogens && pathogens.internal_status === "vigilancia", "sin lote, el dato de campo no se aplica");
});

test("7. un dato de campo vencido no se utiliza", async () => {
  const expired = datum("leaf_wetness_hours", 8, { observed_at: "2026-10-01T10:00:00.000Z", valid_until: "2026-10-02T10:00:00.000Z" });
  const result = await consultaService(royaYMancha, [expired]).ejecutar({ cultivo: "trigo", localidad: "Tandil", fechaRef: "2026-10-19", lotId: LOT.id }, "r", { actor: empresaA });
  const pathogens = result.categorias!.find((category) => category.category === "enfermedades_foliares")!;
  assert.ok("internal_status" in pathogens && pathogens.internal_status !== "favorable");
  assert.ok(pathogens.required_data?.some((item) => item.variable === "leaf_wetness_hours"));
  assert.equal(result.data_provenance?.variables.some((item) => item.key === "leaf_wetness_hours"), false);
});

test("8. un dato vigente prevalece sobre la estimación cuando la regla lo usa", () => {
  const soilRule: ReglaAgronomicaV2 = { ...tempRule("suelo_saturado", "Suelo saturado", "alto"), categoria_clave: "exceso_hidrico",
    definicion: { niveles: [{ orden: 1, clave: "alto", orden_visual: 1, etiqueta: "Suelo saturado.", condiciones: [
      { variable: "humedad_suelo_0_1cm", agregador: "media_ventana", operador: "gte", valor: 0.4, unidad: "m³/m³" },
    ] }], sin_coincidencia: { estado: "sin_condiciones" } } };
  assert.equal(engine.evaluate(soilRule, series({ soil: 0.28 }), at, noPhenology).estado, "sin_condiciones");
  const measured = engine.evaluate(soilRule, series({ soil: 0.28 }), at, noPhenology, currentFieldData([datum("soil_moisture_pct", 0.45)], at));
  assert.equal(measured.estado, "alto");
  assert.equal(measured.observado[0].fuente, "field_data");
  assert.equal(measured.observado[0].valor, 0.45);
});

test("9. la consulta y /api/rules/evaluate usan el mismo motor y la misma precedencia", async () => {
  for (const file of ["lib/consultas/service.ts", "lib/rules/evaluation-service.ts"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /evaluateRules\(/, file);
    assert.match(source, /loadLotContext\(/, file);
    assert.doesNotMatch(source, /new RulesEngineV2\(|\.evaluate\(rule/, file);
  }
  const roya = royaYMancha.filter((rule) => rule.clave.startsWith("roya_amarilla")).map((rule) => ({ ...rule, ventana_dias: 1 }));
  const records = [datum("leaf_wetness_hours", 8, { source: "sensor" })];
  const consulta = await consultaService(roya, records).ejecutar({ cultivo: "trigo", localidad: "Tandil", fechaRef: "2026-10-19", lotId: LOT.id }, "r", { actor: empresaA });
  const evaluate = await new RulesEvaluationService({
    loadRules: async () => roya, loadCategories: async () => categories, loadAdvisories: async () => [], loadVariableLabels: async () => new Map(),
    loadLot: async () => LOT, loadFieldData: async (_id, when) => currentFieldData(records, when),
  }).evaluate({ crop_id: "trigo", lot_id: LOT.id, weather: { temperature_c: 12 } }, { actor: empresaA, evaluatedAt: "2026-10-19T12:00:00.000Z" });
  const summary = (rules: { regla: { clave: string }; estado: string; observado: { variable: string; fuente?: string }[] }[]) =>
    rules.map((rule) => [rule.regla.clave, rule.estado, rule.observado.map((item) => `${item.variable}:${item.fuente ?? "weather"}`).join(",")]).sort();
  const fromEvaluate = evaluate.categories.flatMap((category) => category.evaluated_rules);
  assert.deepEqual(summary(fromEvaluate), summary(consulta.reglas));
  assert.deepEqual(evaluate.data_provenance?.variables.find((item) => item.key === "leaf_wetness_hours")?.source, "sensor");
});

test("10. 030, 031 y 032 quedan registradas en el runner, en orden y sin ejecutarse", () => {
  const runner = readFileSync("scripts/apply-migrations.js", "utf8");
  const listed = [...runner.matchAll(/"db\/migrations\/(\d{3}_[^"]+\.sql)"/g)].map((match) => match[1]).filter((file) => file !== "021_schema_migrations.sql" && file !== "003_dedupe_reglas_agronomicas.sql");
  const tail = listed.slice(-3);
  assert.deepEqual(tail, ["030_agronomic_advisories.sql", "031_variables_criticas_complementarias.sql", "032_variables_y_datos_de_campo.sql"]);
  const files = readdirSync("db/migrations").filter((file) => file.endsWith(".sql"));
  for (const file of files) assert.ok(runner.includes(`db/migrations/${file}`), `${file} registrada`);
  assert.match(runner, /AVIZOR_MIGRATIONS_STOP_BEFORE/);
});

test("11. el esquema esperado por db:migrate:clean coincide con aplicar todas las migraciones", async () => {
  const { query } = await migratedDatabase({ until: "999" });
  const tables = (await query<{ tablename: string }>("select tablename from pg_tables where schemaname = 'public' order by tablename")).map((row) => row.tablename);
  // schema_migrations la crea 021, que el runner aplica primero; PGlite la crea igual.
  assert.deepEqual(tables, [...EXPECTED_TABLES].sort());
});

test("12. la vista previa muestra roya amarilla y mancha amarilla con los datos para completar", () => {
  const evaluated = royaYMancha.map((rule) => engine.evaluate(rule, series(), at, noPhenology));
  const [pathogens] = categoriesForResult({ reglas: evaluated, categorias: consolidateCategoryRisks(categories, evaluated, []) });
  const html = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: pathogens, basePath: "/resultado" }));
  const text = html.replace(/<svg.*?<\/svg>/g, "").replace(/<[^>]+>/g, "|").split("|").map((part) => part.trim()).filter(Boolean);
  assert.deepEqual(text, [
    "Patógenos", "Monitoreo recomendado", "Condiciones compatibles con:", "•", "Roya amarilla", "•", "Mancha amarilla",
    "Para completar la evaluación:", "•", "Horas de mojado foliar medidas o calculadas por un modelo calibrado", "•", "Etapa fenológica actual",
    "•", "Cultivar y susceptibilidad", "•", "Observaciones de campo",
  ]);
  for (const pattern of FORBIDDEN) assert.doesNotMatch(html, pattern);
  // Con lote: el mojado foliar del sensor completa la variable y deja de pedirse.
  const withLot = royaYMancha.map((rule) => engine.evaluate(rule, series(), at, noPhenology, currentFieldData([datum("leaf_wetness_hours", 8, { source: "sensor" })], at)));
  const [completed] = categoriesForResult({ reglas: withLot, categorias: consolidateCategoryRisks(categories, withLot, []) });
  assert.equal(completed.display_status, "Condiciones favorables para monitoreo");
  assert.ok(!completed.required_data.some((item) => item.variable === "leaf_wetness_hours"));
});
