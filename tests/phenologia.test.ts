import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PARAMETROS_FENOLOGICOS, PhenologyProvider } from "../lib/phenology/provider";
import { CalculatedPhenologyProvider } from "../lib/phenology/provider-v2";
import { parametrosFenologicosSchema } from "../lib/security/validation";
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

test("PhenologyProvider soporta un set de hitos distinto al default (docs/panel-admin-pendientes.md, punto 6)", () => {
  const grupoUnico = { III: [10, 40, 70], "IV corto": [10, 40, 70], "IV largo": [10, 40, 70], V: [10, 40, 70] };
  const parametros: ModeloFenologicoParametros = {
    hitos: [{ codigo: "VE", nombre: "Emergencia" }, { codigo: "V6", nombre: "Sexta hoja" }, { codigo: "R2", nombre: "Plena floración" }],
    offsets_dias: grupoUnico,
    margen_dias: 3,
  };
  const provider = new PhenologyProvider(parametros);
  const result = provider.estimate({ fechaSiembra: "2026-01-01", grupoMadurez: "III", fechaConsulta: new Date("2026-02-15T12:00:00Z") });
  assert.equal(result.hitos.length, 3);
  assert.equal(result.estadio_actual_estimado, "V6");
  assert.equal(result.fecha_estimada, "2026-02-10");
});

test("parametrosFenologicosSchema acepta una cantidad de hitos distinta de 5", () => {
  const offsets = { III: [1, 2], "IV corto": [1, 2], "IV largo": [1, 2], V: [1, 2] };
  const parsed = parametrosFenologicosSchema.parse({ hitos: [{ codigo: "E", nombre: "Emergencia" }, { codigo: "R8", nombre: "Madurez plena" }], offsets_dias: offsets, margen_dias: 5 });
  assert.equal(parsed.hitos.length, 2);
});

test("parametrosFenologicosSchema rechaza offsets_dias desalineado con la cantidad de hitos", () => {
  const offsets = { III: [1, 2, 3], "IV corto": [1, 2], "IV largo": [1, 2], V: [1, 2] };
  assert.throws(() => parametrosFenologicosSchema.parse({ hitos: [{ codigo: "E", nombre: "Emergencia" }, { codigo: "R1", nombre: "Floración" }], offsets_dias: offsets, margen_dias: 5 }));
});

test("parametrosFenologicosSchema rechaza códigos de hito repetidos", () => {
  const offsets = { III: [1, 2], "IV corto": [1, 2], "IV largo": [1, 2], V: [1, 2] };
  assert.throws(() => parametrosFenologicosSchema.parse({ hitos: [{ codigo: "R1", nombre: "A" }, { codigo: "r1", nombre: "B" }], offsets_dias: offsets, margen_dias: 5 }));
});

test("parametrosFenologicosSchema rechaza un código con formato inválido", () => {
  const offsets = { III: [1], "IV corto": [1], "IV largo": [1], V: [1] };
  assert.throws(() => parametrosFenologicosSchema.parse({ hitos: [{ codigo: "floracion", nombre: "Floración" }], offsets_dias: offsets, margen_dias: 5 }));
});
