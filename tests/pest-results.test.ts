import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PestResults, PestSummaryCard, visiblePestEvaluations } from "../components/results/PestResults";
import type { EvaluacionPlaga, ResultadoConsultaV2Publica } from "../types";

const baseEvaluation: EvaluacionPlaga = {
  grupo: "trips", especies: ["caliothrips_phaseoli"], tipo_regla: "climatica", estado: "favorabilidad_alta", zona: "zona_nucleo", prioridad_regional: "principal",
  fenologia: { estado: "R3", tipo: "estimada" }, regla: "P-01", version: "1.0", nivel_evidencia_climatica: "alto", calidad_dato: "alta",
  indicadores: { temp_media_7d: 26, precip_7d: 4 }, cobertura: { temp_media_7d: 1, precip_7d: 1 }, evaluado_en: "2026-08-25T12:00:00Z",
  textos: { por_que_se_muestra: "Contexto entregado por backend.", estado: "Estado backend.", que_significa: "El clima coincide con condiciones asociadas. No indica presencia.", que_observar: "Revisar folíolos.", seguimiento: "Complementar con monitoreo.", evidencia_tecnica: "Regla experimental P-01." },
};

function result(evaluations?: EvaluacionPlaga[]): ResultadoConsultaV2Publica { return { estado_general: "Sin alertas activas", reglas: [], plagas: evaluations ? { evaluaciones: evaluations, disponibilidad: "disponible" } : undefined } as unknown as ResultadoConsultaV2Publica; }
function markup(evaluations?: EvaluacionPlaga[]) { return renderToStaticMarkup(React.createElement(PestResults, { result: result(evaluations) })); }

test("flag OFF o consulta histórica sin plagas no renderiza categoría ni altera el estado general", () => { const historical = result(); assert.equal(visiblePestEvaluations(historical).length, 0); assert.equal(renderToStaticMarkup(React.createElement(PestSummaryCard, { result: historical })), ""); assert.equal(historical.estado_general, "Sin alertas activas"); });
test("el resumen conserva la sección de plagas sin inventar evaluaciones cuando no está disponible", () => { const html = renderToStaticMarkup(React.createElement(PestResults, { result: result(), compact: true })); assert.match(html, /Plagas monitoreadas/); assert.match(html, /no está disponible para esta consulta/); assert.doesNotMatch(html, /Sin plagas|No hay plagas/); });
test("P-01 alta muestra Trips, favorabilidad y aclaración recibida sin cambiar score", () => { const value = result([baseEvaluation]); const html = markup(value.plagas!.evaluaciones); assert.match(html, /Trips/); assert.match(html, /Favorabilidad ambiental alta/); assert.match(html, /No indica presencia/); assert.equal(value.estado_general, "Sin alertas activas"); });
test("P-01 moderada usa la etiqueta de presentación correspondiente", () => assert.match(markup([{ ...baseEvaluation, estado: "favorabilidad_moderada" }]), /Favorabilidad ambiental moderada/));
test("favorabilidad siempre nombra la plaga aun si el texto contextual no aplica", () => assert.match(markup([{ ...baseEvaluation, textos: { ...baseEvaluation.textos, estado: "Estado backend." } }]), /Favorabilidad ambiental alta para trips/));
test("sin condiciones destacadas nunca se presenta como ausencia o sin riesgo", () => { const html = markup([{ ...baseEvaluation, estado: "sin_condiciones_destacadas" }]); assert.match(html, /Sin condiciones destacadas/); assert.doesNotMatch(html, /Sin riesgo|No hay plagas|Plaga ausente/); });
test("prioridad de monitoreo se distingue de favorabilidad y no usa riesgo", () => { const html = markup([{ ...baseEvaluation, grupo: "chinches", tipo_regla: "prioridad_monitoreo", estado: "periodo_relevante_monitoreo" }]); assert.match(html, /Período relevante para monitoreo/); assert.doesNotMatch(html, /riesgo/i); });
test("indeterminado es informativo y expone el motivo", () => { const html = markup([{ ...baseEvaluation, estado: "indeterminado", motivo: "datos_insuficientes" }]); assert.match(html, /No fue posible completar la evaluación/); assert.match(html, /datos insuficientes/); assert.doesNotMatch(html, /Favorabilidad ambiental alta/); });
test("no evaluada y arreglo vacío se omiten sin afirmar ausencia", () => { assert.equal(markup([]), ""); assert.equal(markup([{ ...baseEvaluation, estado: "no_evaluada", motivo: "fuera_zona" }]), ""); assert.doesNotMatch(markup([]), /Sin plagas/); });
test("fenología se identifica explícitamente como estimada", () => assert.match(markup([baseEvaluation]), /Etapa estimada: R3/));
