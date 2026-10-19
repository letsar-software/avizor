import test from "node:test";
import assert from "node:assert/strict";
import { consolidateCategoryRisks } from "@/lib/rules/consolidation";
import type { AgronomicAdvisory, ResultadoReglaV2, RiskCategory } from "@/types";

const category: RiskCategory = { id: "c1", key: "exceso_hidrico", name: "Exceso hídrico" };
const rule = (estado: ResultadoReglaV2["estado"]): ResultadoReglaV2 => ({
  riesgo: "rain", regla: { clave: "rain", version: "1", estado: "vigente", categoria: "exceso_hidrico", prioridad: 10 }, estado,
  ventana: { desde: "2026-10-01", hasta: "2026-10-01", dias: 1 }, observado: [],
  calidad_dato: { cobertura_min: 0, dias_faltantes: 1, distancia_punto_km: null }, evaluado_en: "2026-10-17T00:00:00Z",
});
const advisory = (status: AgronomicAdvisory["status"], scope_id: string | null = null): AgronomicAdvisory => ({
  id: "a1", crop_id: "trigo", category_id: "c1", category_key: "exceso_hidrico", scope_type: scope_id ? "field" : "global", scope_id,
  status, title: "Validación vigente", message: "Contexto técnico", recommended_action: "Revisar lote", starts_at: "2026-10-01T00:00:00Z", ends_at: null,
  active: true, priority: 5, source_type: "agronomic_validation", source_name: "INTA", source_url: null, validated_by: "Natali", reviewed_at: "2026-10-17T00:00:00Z", notes: null,
});

test("una alerta crítica prevalece sobre no evaluable y conserva la regla", () => {
  const [result] = consolidateCategoryRisks([category], [rule("no_evaluable")], [advisory("critico")]);
  assert.equal(result.internal_status, "critico");
  assert.equal(result.resolution_source, "agronomic_advisory");
  assert.equal(result.display_status, "Situación crítica");
  assert.equal(result.automatic_result?.status, "no_evaluable");
  assert.equal(result.evaluated_rules.length, 1);
});

test("una alternativa de vigilancia prevalece sobre no evaluable", () => {
  const [result] = consolidateCategoryRisks([category], [rule("no_evaluable"), rule("vigilancia")], []);
  assert.equal(result.internal_status, "vigilancia");
  assert.equal(result.resolution_source, "automatic_rule");
  assert.equal(result.calculation_completeness, "partial");
});

test("sin alerta ni alternativa, conserva no evaluable internamente y muestra monitoreo con datos", () => {
  const incomplete = { ...rule("no_evaluable"), detalle: { variable: "soil_moisture_pct" } };
  const [result] = consolidateCategoryRisks([category], [incomplete], []);
  assert.equal(result.internal_status, "no_evaluable");
  assert.equal(result.display_status, "Monitoreo recomendado");
  assert.equal(result.resolution_source, "monitoring_fallback");
  assert.deepEqual(result.automatic_result?.missing_variables, ["soil_moisture_pct"]);
  assert.deepEqual(result.required_data.map((item) => item.label), ["Humedad de suelo o balance hídrico"]);
});

test("una alerta vencida no se consolida: el repositorio sólo entrega vigentes", () => {
  const [result] = consolidateCategoryRisks([category], [rule("sin_condiciones")], []);
  assert.equal(result.internal_status, "sin_condiciones");
});
