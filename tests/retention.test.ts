import test from "node:test";
import assert from "node:assert/strict";
import { RETENTION_SQL } from "../lib/maintenance/retention";

test("el mantenimiento cubre las retenciones definidas sin conservar consultas detalladas", () => {
  const sql = RETENTION_SQL.map(([, statement]) => statement).join("\n");
  assert.match(sql, /consultas where created_at < now\(\) - interval '18 months'/);
  assert.match(sql, /consulta_logs.*90 days/);
  assert.match(sql, /api_uso.*18 months/);
  assert.match(sql, /auditoria.*24 months/);
  assert.match(sql, /sesiones_admin where expira_en <= now/);
  assert.match(sql, /invitaciones_admin where expira_en <= now/);
});
