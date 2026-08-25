import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PARAMETROS_FENOLOGICOS, PhenologyProvider } from "../lib/phenology/provider";
import { CalculatedPhenologyProvider } from "../lib/phenology/provider-v2";
import type { ModeloFenologico, ModeloFenologicoParametros } from "../types";

test("PhenologyProvider con el modelo por defecto reproduce el cálculo original", () => {
  const provider = new PhenologyProvider();
  const result = provider.estimate({ fechaSiembra: "2025-11-01", grupoMadurez: "IV corto", fechaConsulta: new Date("2026-01-15T12:00:00Z") });
  assert.equal(result.estadio_actual_estimado, "R1");
  assert.equal(result.fecha_estimada, "2025-12-29");
  assert.equal(result.margen_dias, 4);
});

test("PhenologyProvider respeta coeficientes personalizados en vez de los hardcodeados", () => {
  const parametros: ModeloFenologicoParametros = {
    hitos: DEFAULT_PARAMETROS_FENOLOGICOS.hitos,
    offsets_dias: { ...DEFAULT_PARAMETROS_FENOLOGICOS.offsets_dias, "IV corto": [1, 2, 3, 4, 5] },
    margen_dias: 10,
  };
  const provider = new PhenologyProvider(parametros);
  const result = provider.estimate({ fechaSiembra: "2026-01-01", grupoMadurez: "IV corto", fechaConsulta: new Date("2026-01-04T12:00:00Z") });
  assert.equal(result.estadio_actual_estimado, "R1");
  assert.equal(result.fecha_estimada, "2026-01-03");
  assert.equal(result.margen_dias, 10);
});

test("CalculatedPhenologyProvider usa el modelo que devuelve el loader inyectado", async () => {
  const modelo: ModeloFenologico = {
    id: "m1", cultivo: "soja", version: "9.9", estado: "vigente", proveedor: "propio",
    parametros: { ...DEFAULT_PARAMETROS_FENOLOGICOS, margen_dias: 1 },
    fuente_tecnica: null, validado_por: "test", validado_en: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  };
  const provider = new CalculatedPhenologyProvider(async () => modelo);
  const result = await provider.estimarEstadio({ fechaSiembra: "2025-11-01", grupoMadurez: "IV corto", latitud: 0, longitud: 0, fechaRef: "2026-01-15" });
  assert.equal(result.disponible, true);
  if (result.disponible) {
    assert.match(result.fuente ?? "", /v9\.9/);
    assert.equal(result.detalle?.margen_dias, 1);
  }
});

test("CalculatedPhenologyProvider degrada al modelo por defecto si no hay uno vigente", async () => {
  const provider = new CalculatedPhenologyProvider(async () => null);
  const result = await provider.estimarEstadio({ fechaSiembra: "2025-11-01", grupoMadurez: "IV corto", latitud: 0, longitud: 0, fechaRef: "2026-01-15" });
  assert.equal(result.disponible, true);
  if (result.disponible) assert.match(result.fuente ?? "", /default/);
});

test("CalculatedPhenologyProvider degrada al default si falla la lectura del modelo (no rompe la consulta)", async () => {
  const provider = new CalculatedPhenologyProvider(async () => { throw new Error("db caída"); });
  const result = await provider.estimarEstadio({ fechaSiembra: "2025-11-01", grupoMadurez: "IV corto", latitud: 0, longitud: 0, fechaRef: "2026-01-15" });
  assert.equal(result.disponible, true);
});
