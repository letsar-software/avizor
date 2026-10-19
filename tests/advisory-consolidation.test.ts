import test, { before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { migratedDatabase, loadRules } from "./helpers/migrated-db";
import { RulesEngineV2 } from "../lib/rules/engine-v2";
import { consolidateCategoryRisks } from "../lib/rules/consolidation";
import { overallFromCategories } from "../lib/rules/overall-status";
import { ScoreEngineV2 } from "../lib/rules/score-v2";
import { advisoryDecision, referenceWindow, type AdvisoryContext } from "../lib/advisories/applicability";
import { selectAdvisories } from "../lib/rules/evaluation-core";
import { calculateAnalysisQuality } from "../lib/results/analysis-quality";
import { categoriesForResult } from "../lib/results/category-presentation";
import { CategoryRiskCard } from "../components/results/CategoryRiskCard";
import { ConsultaService } from "../lib/consultas/service";
import type { ClimateSeriesProvider } from "../lib/climate/contract";
import type { AgronomicAdvisory, ContextoFenologico, ReglaAgronomicaV2, RiskCategory, RiskStatus, SerieClimaticaDiaria } from "../types";

const NOW = new Date("2026-10-19T20:00:00.000Z"); // 17:00 en Argentina
const FECHA = "2026-10-19";
const noPhenology: ContextoFenologico = { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
const categories: RiskCategory[] = [
  { id: "1", key: "enfermedades_foliares", name: "Patógenos" },
  { id: "2", key: "plagas", name: "Plagas" },
  { id: "3", key: "heladas", name: "Heladas" },
  { id: "4", key: "estres_hidrico", name: "Estrés hídrico" },
  { id: "5", key: "exceso_hidrico", name: "Exceso hídrico" },
];

function advisory(overrides: Partial<AgronomicAdvisory> = {}): AgronomicAdvisory {
  return {
    id: "alerta-1", crop_id: "trigo", category_id: "c5", category_key: "exceso_hidrico", scope_type: "global", scope_id: null,
    status: "critico", title: "Lluvias acumuladas", message: "Período crítico por lluvias acumuladas.",
    recommended_action: "Recorrer los bajos del lote y registrar anegamiento.",
    // Publicada hoy a las 15:00 de Argentina: después del mediodía UTC con que se evaluaba antes.
    starts_at: "2026-10-19T18:00:00.000Z", ends_at: null, active: true, priority: 10, source_type: "agronomic_validation",
    source_name: "Equipo agronómico", source_url: null, validated_by: "Agrónoma responsable", reviewed_at: "2026-10-17T13:00:00.000Z", notes: null,
    ...overrides,
  };
}

function series({ temp = 12 as number | null, rain = 2 as number | null } = {}): SerieClimaticaDiaria[] {
  return Array.from({ length: 14 }, (_, i) => ({
    fecha: `2026-10-${String(6 + i).padStart(2, "0")}`, temperaturaMedia: temp, temperaturaMinima: temp === null ? null : temp - 7,
    temperaturaMaxima: temp === null ? null : temp + 7, humedadRelativa: temp === null ? null : 78, precipitacion: rain, vientoMedio: null,
    puntoRocio: null, deficitPresionVapor: null, evapotranspiracion: null, et0: null,
    humedadSuelo: { profundidad0a1cm: null, profundidad1a3cm: null, profundidad3a9cm: null, profundidad9a27cm: null, profundidad27a81cm: null },
    temperaturaSuelo: { profundidad0cm: null, profundidad6cm: null, profundidad18cm: null, profundidad54cm: null },
    radiacionSolar: null, leafWetnessHours: null,
  }));
}

const climate = (serie: SerieClimaticaDiaria[]): ClimateSeriesProvider => ({
  obtenerSerie: async (input) => ({
    proveedor: "fixture", coordenadas: { latitud: input.localidad.latitud, longitud: input.localidad.longitud }, fechaConsulta: input.fechaRef,
    rangoTemporal: { desde: serie[0].fecha, hasta: serie.at(-1)!.fecha }, variablesDisponibles: [], variablesFaltantes: [], diasSolicitados: 14,
    diasDisponibles: 14, obtenidoEn: NOW.toISOString(), cobertura: serie.some((day) => day.temperaturaMedia !== null) ? 1 : 0, errores: [],
    adapterVersion: "test", serie, prevision: [],
  }),
});

let trigoRules: ReglaAgronomicaV2[];
before(async () => {
  const { query } = await migratedDatabase({ until: "033" });
  trigoRules = await loadRules(query, "r.cultivo = 'trigo' and r.activa = true and r.estado in ('vigente', 'experimental')");
});

function service(advisories: AgronomicAdvisory[], serie = series(), extra: Partial<ConstructorParameters<typeof ConsultaService>[0]> = {}) {
  return new ConsultaService({
    climate: climate(serie), loadRules: async () => trigoRules, persist: async () => null,
    phenology: { estimarEstadio: async () => noPhenology }, loadCategories: async () => categories,
    loadAdvisories: async () => advisories, loadVariableLabels: async () => new Map(), now: () => NOW, traceAdvisories: () => undefined,
    ...extra,
  });
}

const context = (overrides: Partial<AdvisoryContext> = {}): AdvisoryContext => ({
  cropId: "trigo", ...referenceWindow(FECHA, NOW), regionKeys: ["Buenos Aires"], ...overrides,
});
const tandil = { cultivo: "trigo", localidad: "Tandil", fechaRef: FECHA };

test("1. una alerta crítica global de trigo prevalece sobre no_evaluable", async () => {
  const result = await service([advisory()]).ejecutar(tandil);
  const excess = result.categorias!.find((category) => category.category === "exceso_hidrico")!;
  const automatic = excess.evaluated_rules.map((rule) => rule.estado);
  assert.ok(automatic.every((status) => status !== "critico"), "el motor por sí solo no da crítico");
  assert.equal(excess.internal_status, "critico");
  assert.equal(excess.resolution_source, "agronomic_advisory");
  assert.ok(excess.automatic_result, "conserva el resultado automático para auditoría");
});

test("2. una alerta regional aplica sin lot_id cuando la localidad pertenece a la región", async () => {
  const regional = advisory({ scope_type: "region", scope_id: "buenos_aires" });
  const result = await service([regional]).ejecutar(tandil);
  assert.equal(result.categorias!.find((category) => category.category === "exceso_hidrico")!.internal_status, "critico");
  // Zona agronómica como región, resuelta para la localidad.
  const byZone = await service([advisory({ scope_type: "region", scope_id: "sudeste_bonaerense" })], series(), {
    resolveRegionKeys: async (localidad) => [localidad?.provincia ?? "", "sudeste_bonaerense"],
  }).ejecutar(tandil);
  assert.equal(byZone.nivel_alerta, "critico");
  assert.equal(advisoryDecision(regional, context({ regionKeys: ["Córdoba"] })), "region_distinta");
});

test("3. una alerta de lote o establecimiento no aplica sin lot_id", () => {
  const field = advisory({ scope_type: "field", scope_id: "lote-1" });
  const farm = advisory({ scope_type: "farm", scope_id: "estancia-1" });
  assert.equal(advisoryDecision(field, context()), "requiere_lote");
  assert.equal(advisoryDecision(farm, context()), "requiere_lote");
  assert.equal(advisoryDecision(field, context({ fieldId: "lote-1" })), "aplica");
  assert.equal(advisoryDecision(field, context({ fieldId: "lote-2" })), "lote_distinto");
  assert.equal(advisoryDecision(farm, context({ fieldId: "lote-1", farmId: "estancia-1" })), "aplica");
  assert.equal(advisoryDecision(farm, context({ fieldId: "lote-1", farmId: "otra" })), "establecimiento_distinto");
});

test("4. una alerta crítica cambia el estado general a ALERTA CRÍTICA DE MONITOREO", async () => {
  const result = await service([advisory()]).ejecutar(tandil);
  assert.equal(result.nivel_alerta, "critico");
  assert.equal(result.estado_general_visible, "Alerta crítica de monitoreo");
  assert.equal(result.explicacion, "Hay condiciones que requieren seguimiento prioritario.");
  assert.equal(result.estado_general, "Atención recomendada", "valor persistible por el CHECK de consultas");
  assert.match(result.resumen_consulta.descripcion, /^Hay validaciones técnicas vigentes para: Exceso hídrico\./);
  assert.match(result.resumen_consulta.destaque, /Seguimiento prioritario: Exceso hídrico/);
});

test("5. una alerta crítica cambia la tarjeta a Situación crítica con la validación técnica", async () => {
  const result = await service([advisory()]).ejecutar(tandil);
  const card = categoriesForResult(result).find((category) => category.key === "exceso_hidrico")!;
  const text = renderToStaticMarkup(React.createElement(CategoryRiskCard, { category: card, basePath: "/resultado" }))
    .replace(/<svg.*?<\/svg>/g, "").replace(/<[^>]+>/g, "|").split("|").map((part) => part.trim()).filter(Boolean);
  assert.deepEqual(text, ["Exceso hídrico", "Situación crítica", "Período crítico por lluvias acumuladas.", "Validación técnica vigente", "Revisado el: 17/10/2026"]);
});

test("6. alerta técnica + regla automática aplicable devuelven resolution_source combined", async () => {
  // Patógenos: roya y mancha coinciden a 12 °C; la alerta de vigilancia se combina con ellas.
  const result = await service([advisory({ category_key: "enfermedades_foliares", status: "vigilancia", message: "Focos de roya amarilla en la zona." })]).ejecutar(tandil);
  const pathogens = result.categorias!.find((category) => category.category === "enfermedades_foliares")!;
  assert.equal(pathogens.resolution_source, "combined");
  assert.equal(pathogens.message, "Focos de roya amarilla en la zona.");
  assert.ok(pathogens.matched_rules.length >= 2, "las reglas automáticas quedan en el detalle");
});

test("7. una alerta vencida, inactiva, futura o de otro cultivo no se aplica", async () => {
  assert.equal(advisoryDecision(advisory({ ends_at: "2026-10-18T02:59:00.000Z" }), context()), "vencida");
  assert.equal(advisoryDecision(advisory({ active: false }), context()), "inactiva");
  assert.equal(advisoryDecision(advisory({ starts_at: "2026-10-19T23:00:00.000Z" }), context()), "no_iniciada");
  assert.equal(advisoryDecision(advisory({ crop_id: "soja" }), context()), "cultivo_distinto");
  assert.equal(advisoryDecision(advisory({ crop_id: null }), context()), "aplica", "crop_id null es global");
  // Antes se evaluaba al mediodía UTC: una alerta publicada esa tarde quedaba afuera.
  assert.equal(advisoryDecision(advisory(), { ...context(), referenceAt: `${FECHA}T12:00:00.000Z` }), "no_iniciada");
  for (const stale of [advisory({ active: false }), advisory({ ends_at: "2026-10-01T00:00:00.000Z" })]) {
    const result = await service([stale]).ejecutar(tandil);
    assert.notEqual(result.categorias!.find((category) => category.category === "exceso_hidrico")!.internal_status, "critico");
    assert.notEqual(result.nivel_alerta, "critico");
  }
});

test("8. nunca 'Sin alertas activas' con una categoría crítica, alta, moderada, de vigilancia o favorable", () => {
  for (const status of ["critico", "alto", "moderado", "vigilancia", "favorable"] as RiskStatus[]) {
    const overall = overallFromCategories([{ internal_status: "sin_condiciones" }, { internal_status: status }]);
    assert.notEqual(overall.display, "Sin alertas activas", status);
    assert.notEqual(overall.legacy, "Sin alertas activas", status);
  }
  assert.equal(overallFromCategories([{ internal_status: "alto" }]).display, "Alerta de monitoreo prioritario");
  assert.equal(overallFromCategories([{ internal_status: "vigilancia" }]).display, "Monitoreo recomendado");
  assert.equal(overallFromCategories([{ internal_status: "sin_condiciones" }, { internal_status: "informativo" }]).display, "Sin alertas activas");
  // Antes: el puntaje sobre reglas ignoraba las alertas y, todo no_evaluable, decía "Sin alertas activas".
  const results = trigoRules.map((rule) => new RulesEngineV2().evaluate(rule, series({ temp: null, rain: null }), NOW.toISOString(), noPhenology));
  assert.equal(new ScoreEngineV2().evaluate(results).estadoGeneral, "Sin alertas activas");
  assert.equal(overallFromCategories(consolidateCategoryRisks(categories, results, [advisory()])).display, "Alerta crítica de monitoreo");
});

test("9. con cobertura climática cero ninguna tarjeta afirma una condición climática", async () => {
  const result = await service([], series({ temp: null, rain: null })).ejecutar(tandil);
  for (const category of result.categorias!) {
    assert.deepEqual(category.matched_rules, [], category.category);
    assert.ok(!["favorable", "vigilancia", "moderado", "alto", "critico"].includes(category.internal_status), category.category);
  }
  const pathogens = categoriesForResult(result).find((category) => category.key === "enfermedades_foliares")!;
  assert.equal(pathogens.display_status, "Monitoreo recomendado");
  assert.doesNotMatch(pathogens.message, /temperatura es compatible/i);
  assert.ok(pathogens.required_data.some((item) => item.variable === "temperatura_media"));
  // Con alerta técnica, el estado lo determina la alerta y se indica su origen.
  const advised = await service([advisory()], series({ temp: null, rain: null })).ejecutar(tandil);
  assert.equal(advised.categorias!.find((category) => category.category === "exceso_hidrico")!.resolution_source, "agronomic_advisory");
  // La cobertura no cae a 0 % por reglas pendientes de evidencia cuando la serie está completa.
  const full = trigoRules.map((rule) => new RulesEngineV2().evaluate(rule, series(), NOW.toISOString(), noPhenology));
  assert.ok(full.some((rule) => rule.motivo === "configuracion_incompleta"));
  assert.ok(calculateAnalysisQuality(full, 1).cobertura > 0);
});

test("10. funciona para cualquier cultivo, categoría y alcance, sin lógica por trigo ni Tandil", () => {
  const girasol = advisory({ crop_id: "girasol", category_key: "granizo", scope_type: "region", scope_id: "zona_nea", status: "alto" });
  const { applied, diagnostics } = selectAdvisories({ candidates: [girasol], cropId: "girasol", fechaRef: FECHA, regionKeys: ["Chaco", "zona_nea"], now: NOW, trace: () => undefined });
  assert.deepEqual(diagnostics.map((item) => item.decision), ["aplica"]);
  const [hail] = consolidateCategoryRisks([{ id: "9", key: "granizo", name: "Granizo" }], [], applied);
  assert.equal(hail.internal_status, "alto");
  assert.equal(overallFromCategories([hail]).display, "Alerta de monitoreo prioritario");
  for (const file of ["lib/advisories/applicability.ts", "lib/rules/overall-status.ts", "lib/rules/consolidation.ts", "lib/rules/evaluation-core.ts", "lib/advisories/repository.ts"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /\b(trigo|soja|tandil|exceso_hidrico)\b/i, file);
  }
});
