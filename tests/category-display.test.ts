import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RulesEngineV2 } from "../lib/rules/engine-v2";
import { consolidateCategoryRisks } from "../lib/rules/consolidation";
import { DISPLAY_STATUS, displayStatus } from "../lib/rules/display";
import { categoriesForResult, presentCategory } from "../lib/results/category-presentation";
import { CategoryRiskCard } from "../components/results/CategoryRiskCard";
import type {
  AgronomicAdvisory,
  ContextoFenologico,
  ReglaAgronomicaV2,
  ResultadoConsultaV2Publica,
  ResultadoReglaV2,
  RiskCategory,
  SerieClimaticaDiaria,
  StoredCategoryRisk,
} from "../types";

const at = "2026-10-19T12:00:00.000Z";
const engine = new RulesEngineV2();
const noPhenology: ContextoFenologico = { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
const FORBIDDEN = [/No evaluable/i, /No hay condiciones suficientes/i, /Faltan datos para evaluar/i, /Experimental/i, /Regla incompleta/i, /Modelo no validado/i, /no se pudo/i];

const categories: RiskCategory[] = [
  { id: "1", key: "enfermedades_foliares", name: "Patógenos" },
  { id: "2", key: "plagas", name: "Plagas" },
  { id: "3", key: "heladas", name: "Heladas" },
  { id: "4", key: "estres_hidrico", name: "Estrés hídrico" },
  { id: "5", key: "exceso_hidrico", name: "Exceso hídrico" },
];

function rule(overrides: Partial<ReglaAgronomicaV2> & Pick<ReglaAgronomicaV2, "clave" | "cultivo" | "categoria">, niveles: ReglaAgronomicaV2["definicion"]["niveles"]): ReglaAgronomicaV2 {
  return {
    id: overrides.clave, version: "1.0", estado: "vigente", ventana_dias: 5, fuente_tecnica: "fixture",
    limitaciones_declaradas: "fixture", validado_por: null, validado_en: null, condiciones_revision: null, decisiones_pendientes: [],
    definicion: { niveles, sin_coincidencia: { estado: "sin_condiciones" } }, ...overrides,
  };
}

function level(clave: string, etiqueta: string, condiciones: ReglaAgronomicaV2["definicion"]["niveles"][number]["condiciones"]) {
  return { orden: 1, clave, orden_visual: 1, etiqueta, recomendacion: "Monitorear el lote durante los próximos 5 días.", condiciones };
}

function series({ temp = 12, min = 5, rain = 0, wetness = null as number | null } = {}): SerieClimaticaDiaria[] {
  return Array.from({ length: 5 }, (_, i) => ({
    fecha: `2026-10-${String(14 + i).padStart(2, "0")}`, temperaturaMedia: temp, temperaturaMinima: min, temperaturaMaxima: temp + 5,
    humedadRelativa: 70, precipitacion: rain, vientoMedio: 10, puntoRocio: null, deficitPresionVapor: null, evapotranspiracion: null, et0: 2,
    humedadSuelo: { profundidad0a1cm: null, profundidad1a3cm: null, profundidad3a9cm: null, profundidad9a27cm: null, profundidad27a81cm: null },
    temperaturaSuelo: { profundidad0cm: null, profundidad6cm: null, profundidad18cm: null, profundidad54cm: null },
    radiacionSolar: null, leafWetnessHours: wetness,
  }));
}

const temp = (valor: [number, number]) => ({ variable: "temperatura_media" as const, agregador: "media_ventana" as const, operador: "between" as const, valor, unidad: "°C" });
const wetness = { variable: "leaf_wetness_hours" as const, agregador: "media_ventana" as const, operador: "gte" as const, valor: 6, unidad: "h" };
const frost = { variable: "temperatura_min" as const, agregador: "min_ventana" as const, operador: "lte" as const, valor: 0, unidad: "°C" };
const rainSum = (operador: "gte" | "lte", valor: number) => ({ variable: "precipitacion" as const, agregador: "suma_ventana" as const, operador, valor, unidad: "mm" });

// Reglas de dos cultivos, con la misma forma configurable que entrega la base.
// Mismas listas que la migración 031, con los nombres de la API genérica (alias).
const royaTemperatura = rule({ clave: "roya_amarilla", nombre: "Roya amarilla", cultivo: "trigo", categoria: "enfermedades_foliares", prioridad: 1,
  critical_required_variables: ["temperature_c"], complementary_required_variables: ["leaf_wetness_hours", "zadoks_stage", "cultivar_susceptibility", "manual_observation"] },
  [level("vigilancia", "La temperatura es compatible con roya amarilla.", [temp([10, 15])])]);
const royaCompleta = rule({ clave: "roya_amarilla_mojado", nombre: "Roya amarilla", cultivo: "trigo", categoria: "enfermedades_foliares", prioridad: 10,
  critical_required_variables: ["temperature_c", "leaf_wetness_hours"], complementary_required_variables: ["zadoks_stage", "cultivar_susceptibility", "manual_observation"] },
  [level("favorable", "Condiciones favorables para monitoreo de roya amarilla", [temp([10, 15]), wetness])]);
const heladas = (cultivo: string) => rule({ clave: `heladas_${cultivo}`, cultivo, categoria: "heladas" }, [level("favorable", "Temperaturas bajo el umbral", [frost])]);
const estres = (cultivo: string) => rule({ clave: `estres_${cultivo}`, cultivo, categoria: "estres_hidrico", zadoks_desde: 30, zadoks_hasta: 70, variables_requeridas: ["codigo_zadoks", "humedad_suelo_0_1cm"] }, [level("moderado", "Déficit hídrico", [rainSum("lte", 5)])]);
const exceso = (cultivo: string) => rule({ clave: `exceso_${cultivo}`, cultivo, categoria: "exceso_hidrico" }, [level("critico", "Período crítico por lluvias acumuladas", [rainSum("gte", 100)])]);
const soyFoliar = rule({ clave: "enfermedades_foliares", cultivo: "soja", categoria: "enfermedades_foliares", texto_no_evaluable: "Monitorear hojas mientras se suma el mojado foliar del lote." },
  [level("favorable", "Favorables", [temp([18, 28]), wetness])]);

function evaluate(rules: ReglaAgronomicaV2[], climate: SerieClimaticaDiaria[], phenology = noPhenology) {
  return rules.map((item) => engine.evaluate(item, climate, at, phenology));
}

function resultFor(cultivo: string, evaluated: ResultadoReglaV2[], advisories: AgronomicAdvisory[] = []) {
  return { cultivo, reglas: evaluated, categorias: consolidateCategoryRisks(categories, evaluated, advisories) } as unknown as ResultadoConsultaV2Publica;
}

function render(result: ResultadoConsultaV2Publica) {
  return categoriesForResult(result).map((category) => renderToStaticMarkup(React.createElement(CategoryRiskCard, { category, basePath: "/resultado" })));
}

const advisory = (status: AgronomicAdvisory["status"], category_key: string): AgronomicAdvisory => ({
  id: "a1", crop_id: null, category_id: "c", category_key, scope_type: "global", scope_id: null, status, title: "Alerta INTA",
  message: "Lluvias acumuladas por encima de lo habitual en la región.", recommended_action: "Revisar anegamiento en bajos.", starts_at: at, ends_at: null,
  active: true, priority: 5, source_type: "official_alert", source_name: "INTA", source_url: null, validated_by: "Agrónoma", reviewed_at: at, notes: null,
});

test("trigo y soja usan el mismo componente y la misma lógica de presentación", () => {
  const climate = series({ temp: 12, min: 4, rain: 2 });
  const trigo = render(resultFor("trigo", evaluate([royaTemperatura, royaCompleta, heladas("trigo"), estres("trigo"), exceso("trigo")], climate)));
  const soja = render(resultFor("soja", evaluate([soyFoliar, heladas("soja"), estres("soja"), exceso("soja")], climate)));
  assert.equal(trigo.length, categories.length);
  assert.equal(soja.length, categories.length);
  for (const html of [...trigo, ...soja]) assert.match(html, /data-testid="category-card-/);
  // Ningún módulo de presentación ni consolidación conoce cultivos.
  for (const file of ["lib/rules/consolidation.ts", "lib/rules/display.ts", "lib/rules/required-data.ts", "lib/results/category-presentation.ts", "components/results/CategoryRiskCard.tsx"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /\b(trigo|soja|maiz|roya)\b/i, file);
  }
});

test("con textos configurados aptos, ninguna tarjeta muestra lenguaje interno del motor", () => {
  const scenarios = [
    resultFor("trigo", evaluate([royaTemperatura, royaCompleta, heladas("trigo"), estres("trigo"), exceso("trigo")], series())),
    resultFor("soja", evaluate([soyFoliar, heladas("soja"), estres("soja"), exceso("soja")], series({ temp: 22 }))),
    resultFor("trigo", evaluate([royaCompleta], series({ temp: 12, wetness: 8 }))),
    resultFor("trigo", []),
  ];
  for (const html of scenarios.flatMap(render)) {
    for (const pattern of FORBIDDEN) assert.doesNotMatch(html, pattern);
    assert.match(html, new RegExp(Object.values(DISPLAY_STATUS).map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")));
  }
});

test("si faltan datos muestra Monitoreo recomendado y sólo los datos que usa la regla", () => {
  const [, , , drought] = categoriesForResult(resultFor("trigo", evaluate([estres("trigo")], series())));
  assert.equal(drought.display_status, "Monitoreo recomendado");
  assert.equal(drought.calculation_completeness, "needs_data");
  assert.equal(drought.resolution_source, "monitoring_fallback");
  assert.deepEqual(drought.required_data.map((item) => item.label), ["Etapa fenológica actual", "Humedad de suelo o balance hídrico"]);
  const html = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: drought, basePath: "/resultado" }));
  assert.match(html, /Para completar la evaluación:/);
  assert.match(html, /Etapa fenológica actual/);
  assert.doesNotMatch(html, /mojado foliar/i);
});

test("roya amarilla 10–15 °C sin mojado: vigilancia, Monitoreo recomendado y mojado como dato", () => {
  const evaluated = evaluate([royaTemperatura, royaCompleta], series({ temp: 12 }));
  assert.equal(evaluated[0].estado, "vigilancia");
  assert.equal(evaluated[1].estado, "no_evaluable");
  const [pathogens] = categoriesForResult(resultFor("trigo", evaluated));
  assert.equal(pathogens.display_status, "Monitoreo recomendado");
  assert.equal(pathogens.message, "La temperatura es compatible con roya amarilla.");
  assert.equal(pathogens.calculation_completeness, "partial");
  const labels = pathogens.required_data.map((item) => item.label);
  assert.equal(labels[0], "Horas de mojado foliar medidas o calculadas por un modelo calibrado");
  assert.deepEqual(labels.slice(1), ["Etapa fenológica actual", "Cultivar y susceptibilidad", "Observaciones de campo"]);
  const html = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: pathogens, basePath: "/resultado" }));
  assert.doesNotMatch(html, /Condiciones favorables para monitoreo/);
});

test("roya amarilla sin mojado foliar nunca devuelve ni muestra favorable", () => {
  for (const climate of [series({ temp: 12 }), series({ temp: 14 }), series({ temp: 10 })]) {
    const evaluated = evaluate([royaTemperatura, royaCompleta], climate);
    assert.ok(evaluated.every((item) => item.estado !== "favorable"));
    const [pathogens] = consolidateCategoryRisks(categories, evaluated, []);
    assert.notEqual(pathogens.internal_status, "favorable");
    assert.notEqual(pathogens.display_status, DISPLAY_STATUS.favorable);
  }
});

test("vigilancia siempre muestra Monitoreo recomendado", () => {
  assert.equal(DISPLAY_STATUS.vigilancia, "Monitoreo recomendado");
  assert.equal(displayStatus("vigilancia"), "Monitoreo recomendado");
  const vigilance = rule({ clave: "v", cultivo: "girasol", categoria: "heladas" }, [level("vigilancia", "Frío cercano al umbral.", [frost])]);
  const [, , frosts] = categoriesForResult(resultFor("girasol", evaluate([vigilance], series({ min: -1 }))));
  assert.equal(frosts.display_status, "Monitoreo recomendado");
});

test("no hay filtrado de mensajes por palabras: el texto configurado se muestra tal cual", () => {
  const source = ["lib/rules/display.ts", "lib/rules/consolidation.ts", "lib/results/category-presentation.ts", "components/results/CategoryRiskCard.tsx"]
    .map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(source, /userFacingText|INTERNAL_LANGUAGE|hasInternalLanguage|no se pudo|no evaluable|datos insuficientes/i);
  const configured = "Ambiente experimental; no se pudo medir el viento. Revisar el lote.";
  const odd = rule({ clave: "o", cultivo: "girasol", categoria: "heladas" }, [level("vigilancia", configured, [frost])]);
  const [, , frosts] = consolidateCategoryRisks(categories, evaluate([odd], series({ min: -1 })), []);
  assert.equal(frosts.message, configured);
});

test("una variable complementaria faltante no vuelve la regla no_evaluable", () => {
  const configured = { ...exceso("trigo"), critical_required_variables: ["precipitation_accumulated_mm"], complementary_required_variables: ["soil_moisture_pct", "field_drainage_status", "manual_observation", "zadoks_stage"] };
  const [result] = evaluate([configured], series({ rain: 30 }));
  assert.equal(result.estado, "critico");
  assert.deepEqual(result.missing_complementary_variables, ["humedad_suelo_0_1cm", "estado_drenaje", "observacion_manual", "codigo_zadoks"]);
});

test("una variable crítica faltante impide elevar el resultado a riesgo confirmado", () => {
  const withCriticalWetness = { ...exceso("trigo"), critical_required_variables: ["precipitacion", "leaf_wetness_hours"] };
  const [result] = evaluate([withCriticalWetness], series({ rain: 30 }));
  assert.equal(result.estado, "no_evaluable");
  const [, , , , excess] = consolidateCategoryRisks(categories, [result], []);
  assert.ok(!["favorable", "moderado", "alto", "critico"].includes(excess.internal_status));
  assert.equal(excess.display_status, "Monitoreo recomendado");
});

test("la tarjeta muestra los complementarios faltantes en Para completar la evaluación", () => {
  const configured = { ...exceso("soja"), critical_required_variables: ["precipitacion"], complementary_required_variables: ["estado_drenaje", "anegamiento_observado"] };
  const [, , , , excess] = categoriesForResult(resultFor("soja", evaluate([configured], series({ rain: 30 }))));
  assert.equal(excess.display_status, "Situación crítica");
  assert.equal(excess.calculation_completeness, "partial");
  const html = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: excess, basePath: "/resultado" }));
  assert.match(html, /Para completar la evaluación:/);
  assert.match(html, /Estado de drenaje del lote/);
  assert.match(html, /Presencia de anegamiento observada en campo/);
  assert.doesNotMatch(html, /complementari/i);
});

test("la categoría administrable (categoria_id) agrupa la regla aunque el catálogo no la tenga", () => {
  const climateRule = rule({ clave: "precipitacion_elevada", cultivo: "soja", categoria: undefined, categoria_clave: "exceso_hidrico" }, [level("critico", "Período crítico por lluvias acumuladas", [rainSum("gte", 100)])]);
  const [, , , , excess] = consolidateCategoryRisks(categories, evaluate([climateRule], series({ rain: 30 })), []);
  assert.equal(excess.evaluated_rules.length, 1);
  assert.equal(excess.internal_status, "critico");
});

test("una alerta técnica vigente prevalece sobre el resultado automático incompleto", () => {
  const evaluated = evaluate([estres("trigo")], series());
  const [, , , drought] = consolidateCategoryRisks(categories, evaluated, [advisory("alto", "estres_hidrico")]);
  assert.equal(drought.internal_status, "alto");
  assert.equal(drought.display_status, "Riesgo alto");
  assert.equal(drought.resolution_source, "agronomic_advisory");
  assert.equal(drought.automatic_result?.status, "no_evaluable");
  assert.ok(drought.required_data.length, "conserva los datos que completan la evaluación automática");
});

test("con datos suficientes y sin reglas cumplidas muestra Sin condiciones de riesgo relevantes", () => {
  const [, , frosts, , excess] = categoriesForResult(resultFor("soja", evaluate([heladas("soja"), exceso("soja")], series({ min: 8, rain: 1 }))));
  for (const category of [frosts, excess]) {
    assert.equal(category.display_status, "Sin condiciones de riesgo relevantes");
    assert.equal(category.calculation_completeness, "complete");
    assert.deepEqual(category.required_data, []);
  }
});

test("exceso hídrico crítico sólo cuando se cumple la condición de la regla", () => {
  const [, , , , excess] = categoriesForResult(resultFor("trigo", evaluate([exceso("trigo")], series({ rain: 30 }))));
  assert.equal(excess.display_status, "Situación crítica");
  assert.equal(excess.message, "Período crítico por lluvias acumuladas");
});

test("no hay favorable, alto ni crítico sin las variables críticas de la regla", () => {
  const climates = [series({ temp: 12 }), series({ temp: 12, wetness: null }), series({ temp: 30 })];
  for (const climate of climates) {
    for (const category of consolidateCategoryRisks(categories, evaluate([royaCompleta, soyFoliar, exceso("x")], climate.map((day) => ({ ...day, precipitacion: null }))), [])) {
      assert.ok(!["favorable", "alto", "critico"].includes(category.internal_status), `${category.category}: ${category.internal_status}`);
    }
  }
  const [complete] = consolidateCategoryRisks(categories, evaluate([royaCompleta], series({ temp: 12, wetness: 8 })), []);
  assert.equal(complete.internal_status, "favorable");
  assert.equal(complete.display_status, "Condiciones favorables para monitoreo");
});

test("una regla histórica con sólo variables_requeridas las trata como críticas, sin listas por cultivo", () => {
  const configured = rule({ clave: "x", cultivo: "girasol", categoria: "estres_hidrico", evaluabilidad: "PENDIENTE_EVIDENCIA", variables_requeridas: ["capacidad_agua_suelo", "fecha_ultima_lluvia_riego", "indice_nuevo_del_lote"] }, [level("moderado", "x", [rainSum("lte", 5)])]);
  const [result] = evaluate([configured], series());
  assert.deepEqual(result.regla.critical_required_variables, ["capacidad_agua_suelo", "fecha_ultima_lluvia_riego", "indice_nuevo_del_lote"]);
  const [, , , drought] = consolidateCategoryRisks(categories, [result], []);
  assert.deepEqual(drought.required_data.map((item) => item.label), [
    "Tipo de suelo o capacidad de almacenamiento de agua",
    "Fecha de última lluvia o riego",
    "Indice nuevo del lote",
  ]);
});

test("un cultivo, categoría y regla nuevos se muestran sin cambios en motor ni componente", () => {
  const granizo: RiskCategory = { id: "9", key: "granizo", name: "Granizo" };
  const nueva = rule({ clave: "granizo_girasol", cultivo: "girasol", categoria: "granizo" }, [level("vigilancia", "Tormentas convectivas en la ventana", [rainSum("gte", 5)])]);
  const consolidated = consolidateCategoryRisks([granizo], evaluate([nueva], series({ rain: 2 })), []);
  const [card] = categoriesForResult({ reglas: [], categorias: consolidated });
  const html = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: card, basePath: "/resultado" }));
  assert.match(html, /Granizo/);
  assert.match(html, /Monitoreo recomendado/);
  assert.match(html, /href="\/resultado\/granizo"/);
});

test("una categoría sin umbral climático muestra Información para el monitoreo", () => {
  const [, pests] = consolidateCategoryRisks(categories, [], []);
  assert.equal(pests.display_status, "Información para el monitoreo");
  assert.deepEqual(pests.required_data, []);
});

test("las reglas fuera de su ventana fenológica no piden datos ni inventan riesgo", () => {
  const phenology: ContextoFenologico = { disponible: true, codigo_zadoks: 12, modifica_reglas: false };
  const stageBound = rule({ clave: "estres_etapa", cultivo: "trigo", categoria: "estres_hidrico", zadoks_desde: 30, zadoks_hasta: 70, variables_requeridas: ["codigo_zadoks"] }, [level("moderado", "Déficit hídrico", [rainSum("lte", 5)])]);
  const [, , , drought] = consolidateCategoryRisks(categories, evaluate([stageBound], series(), phenology), []);
  assert.equal(drought.display_status, "Sin condiciones de riesgo relevantes");
  assert.deepEqual(drought.required_data, []);
});

test("resultados guardados con el contrato anterior se presentan igual", () => {
  const stored = {
    category: "exceso_hidrico", status: "no_evaluable", title: "Exceso hídrico", message: "No hay una regla o validación técnica vigente aplicable.",
    recommended_action: "Mantener el monitoreo habitual del lote.", resolution_source: "automatic",
    automatic_result: { status: "no_evaluable", missing_variables: ["soil_moisture_pct"] }, evaluated_rules: [], applied_advisories: [],
  } as StoredCategoryRisk;
  const card = presentCategory(stored);
  assert.equal(card.display_status, "Monitoreo recomendado");
  assert.deepEqual(card.required_data.map((item) => item.label), ["Humedad de suelo o balance hídrico"]);
  assert.equal(presentCategory({ ...stored, status: "critico", resolution_source: "combined", applied_advisories: [advisory("critico", "exceso_hidrico")] } as StoredCategoryRisk).resolution_source, "combined");
});
