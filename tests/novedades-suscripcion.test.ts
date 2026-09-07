import test from "node:test";
import assert from "node:assert/strict";
import { esSuscriptorActivo } from "../lib/consultas/interesados";
import { RETENTION_SQL } from "../lib/maintenance/retention";

const now = new Date("2026-09-07T00:00:00.000Z");
const recent = "2026-09-06T00:00:00.000Z";

test("alta normal es activa y baja la excluye inmediatamente", () => {
  assert.equal(esSuscriptorActivo({ consentimiento: true, baja_en: null, ultima_interaccion_en: recent, created_at: recent }, now), true);
  assert.equal(esSuscriptorActivo({ consentimiento: false, baja_en: recent, ultima_interaccion_en: recent, created_at: recent }, now), false);
});

test("las retenciones separan activos inactivos y supresiones vencidas", () => {
  const sql = RETENTION_SQL.map(([, statement]) => statement).join("\n");
  assert.match(sql, /consentimiento = true and baja_en is null/);
  assert.match(sql, /baja_en is not null and baja_en < now\(\) - interval '24 months'/);
});

test("un consentimiento nuevo explícito puede reactivar una baja", () => {
  assert.equal(esSuscriptorActivo({ consentimiento: true, baja_en: null, ultima_interaccion_en: recent, created_at: recent }, now), true);
});
