import assert from "node:assert/strict";
import test from "node:test";
import { failure } from "../lib/http/responses";
import { logSafeError, logSafeInfo } from "../lib/logging/safe";

const sensitive = [
  "andrea@example.com", "-37.3217", "-59.1332", "session-secret", "share-token-secret",
  "api-key-secret", "invite-token-secret", "cookie-secret", "password-secret", "hash-secret",
  "postgres://database-secret", "Bearer authorization-secret", "resultado-agronomico-completo",
];

test("el logger seguro emite únicamente la envoltura permitida", (t) => {
  const calls: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => { calls.push(args); });
  t.mock.method(console, "info", (...args: unknown[]) => { calls.push(args); });

  const rawError = new Error(`falló ${sensitive.join(" ")}`);
  logSafeError({ operation: "consulta.persistence", request_id: "request-123", error_code: "PERSISTENCIA_FALLIDA", status: 500 });
  logSafeInfo({ operation: "consulta.persistence_unavailable" });
  failure(rawError, "request-123");

  const output = calls.map((args) => args.join(" ")).join("\n");
  for (const value of sensitive) assert.doesNotMatch(output, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(output, /request-123/);
  assert.match(output, /consulta\.persistence/);
  assert.match(output, /ERROR_INTERNO/);
  assert.doesNotMatch(output, /Error:/);
});
