import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DomainError } from "../lib/consultas/service";
import { MAX_JSON_BODY_BYTES, readJsonBody } from "../lib/http/json-body";
import { consumeRateLimit, RATE_LIMITS, resolveClientIp, type RateLimitDefinition } from "../lib/security/rate-limit";
import { consultaV2Schema, guardarSchema, observacionV2Schema, parseInput, parsePublicId, ruleDefinitionSchema } from "../lib/security/validation";
import { validateDatabaseSecurityConfig } from "../lib/db/postgres";
import type { query } from "../lib/db/postgres";
import { POST as createPublicConsultation } from "../app/api/public/consultas/route";
import { POST as createInterested } from "../app/api/interesados/route";
import { failure } from "../lib/http/responses";

function fakeRateLimitDatabase() {
  const counts = new Map<string, number>();
  let window = 0;
  const queryImpl = (async (sql: string, values: unknown[] = []) => {
    if (/^delete/i.test(sql.trim())) return { rows: [], rowCount: 0 } as never;
    const [scope, identity, , limit] = values as [string, string, number, number];
    const key = `${scope}:${identity}:${window}`;
    const current = counts.get(key) ?? 0;
    if (current >= limit) return { rows: [], rowCount: 0 } as never;
    counts.set(key, current + 1);
    return { rows: [{ request_count: current + 1, retry_after: 60 }], rowCount: 1 } as never;
  }) as typeof query;
  return { queryImpl, nextWindow: () => { window += 1; } };
}

async function expectLimited(limit: RateLimitDefinition, identity: string, queryImpl: typeof query) {
  await assert.rejects(() => consumeRateLimit(limit, identity, queryImpl), (error: DomainError) => error.status === 429 && error.code === "RATE_LIMIT_EXCEDIDO");
}

test("rate limiter permite requests dentro del límite y rechaza el siguiente", async () => {
  const db = fakeRateLimitDatabase();
  const limit = { scope: "test", limit: 3, windowSeconds: 60 };
  for (let index = 0; index < 3; index += 1) await consumeRateLimit(limit, "ip-a", db.queryImpl);
  await expectLimited(limit, "ip-a", db.queryImpl);
});

test("rate limiter separa identidades y ventanas", async () => {
  const db = fakeRateLimitDatabase();
  const limit = { scope: "test", limit: 1, windowSeconds: 60 };
  await consumeRateLimit(limit, "ip-a", db.queryImpl);
  await consumeRateLimit(limit, "ip-b", db.queryImpl);
  await expectLimited(limit, "ip-a", db.queryImpl);
  db.nextWindow();
  await consumeRateLimit(limit, "ip-a", db.queryImpl);
});

test("mismo email alcanza el límite de tres guardados", async () => {
  const db = fakeRateLimitDatabase();
  for (let index = 0; index < 3; index += 1) await consumeRateLimit(RATE_LIMITS.emailSave, "email-hash", db.queryImpl);
  await expectLimited(RATE_LIMITS.emailSave, "email-hash", db.queryImpl);
});

test("concurrencia no permite superar el límite", async () => {
  const db = fakeRateLimitDatabase();
  const results = await Promise.allSettled(Array.from({ length: 40 }, () => consumeRateLimit(RATE_LIMITS.publicConsultation, "same-ip", db.queryImpl)));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 20);
  assert.equal(results.filter((result) => result.status === "rejected").length, 20);
});

test("el SQL de rate limiting usa UPSERT condicionado, no count seguido de insert", async () => {
  const contents = await readFile(new URL("../lib/security/rate-limit.ts", import.meta.url), "utf8");
  assert.match(contents, /on conflict\(scope,identity_hash,window_start\) do update/i);
  assert.match(contents, /where rate_limit_buckets\.request_count < \$4/i);
  assert.doesNotMatch(contents, /select count\(/i);
});

test("modo Railway usa X-Real-IP válido e ignora X-Forwarded-For", () => {
  const previous = process.env.RATE_LIMIT_TRUSTED_PROXY;
  process.env.RATE_LIMIT_TRUSTED_PROXY = "railway";
  try {
    const request = new Request("http://localhost", { headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.99" } });
    assert.equal(resolveClientIp(request), "203.0.113.7");
    assert.throws(() => resolveClientIp(new Request("http://localhost", { headers: { "x-real-ip": "attacker-value" } })), (error: DomainError) => error.status === 503);
  } finally {
    if (previous === undefined) delete process.env.RATE_LIMIT_TRUSTED_PROXY; else process.env.RATE_LIMIT_TRUSTED_PROXY = previous;
  }
});

test("payload superior a 32 KiB devuelve 413 antes de parsear JSON", async () => {
  const request = new Request("http://localhost", { method: "POST", body: JSON.stringify({ value: "x".repeat(MAX_JSON_BODY_BYTES) }), headers: { "content-type": "application/json" } });
  await assert.rejects(() => readJsonBody(request), (error: DomainError) => error.status === 413);
});

test("endpoint público devuelve 413 con el contrato de error existente", async () => {
  const response = await createPublicConsultation(new Request("http://localhost/api/public/consultas", { method: "POST", body: JSON.stringify({ localidad: "x".repeat(MAX_JSON_BODY_BYTES), cultivo: "soja" }), headers: { "content-type": "application/json" } }));
  assert.equal(response.status, 413);
  const payload = await response.json();
  assert.equal(payload.error.code, "PAYLOAD_DEMASIADO_GRANDE");
});

test("endpoint de interesados rechaza email inválido con 400", async () => {
  const response = await createInterested(new Request("http://localhost/api/interesados", { method: "POST", body: JSON.stringify({ email: "invalido", consentimiento: true, consentimiento_version: "v1", consentimiento_fecha: new Date().toISOString() }), headers: { "content-type": "application/json" } }));
  assert.equal(response.status, 400);
});

test("respuesta 429 incluye Retry-After sin exponer detalles internos", () => {
  const response = failure(new DomainError("RATE_LIMIT_EXCEDIDO", "Se alcanzó el límite de solicitudes. Intentá nuevamente más tarde.", 429, { retry_after: 60 }), "00000000-0000-4000-8000-000000000001");
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
});

test("validación central rechaza localidad larga, email inválido, enum inválido y mass assignment", () => {
  assert.throws(() => parseInput(consultaV2Schema, { localidad: "x".repeat(121), cultivo: "soja" }));
  assert.throws(() => parseInput(guardarSchema, { email: "no-es-email" }));
  assert.throws(() => parseInput(observacionV2Schema, { tipo: "valor inventado" }));
  assert.throws(() => parseInput(observacionV2Schema, { tipo: "Otro", role: "admin" }));
  assert.throws(() => parsePublicId("no-es-uuid"), (error: DomainError) => error.status === 404);
});

test("todas las definiciones v2 existentes cumplen el esquema estructural", async () => {
  const migration = await readFile(new URL("../db/migrations/007_backend_v2.sql", import.meta.url), "utf8");
  const definitions: unknown[] = [];
  const pattern = /'(\{"niveles":\[[\s\S]*?\]\s*,?\s*"sin_coincidencia":\{[\s\S]*?\}\})'/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(migration)) !== null) definitions.push(JSON.parse(match[1]));
  assert.equal(definitions.length, 4);
  for (const definition of definitions) assert.doesNotThrow(() => parseInput(ruleDefinitionSchema, definition));
  assert.throws(() => parseInput(ruleDefinitionSchema, { niveles: [{ orden: 1, clave: "x", orden_visual: 1, etiqueta: "x", condiciones: [{ variable: "temperatura_min", agregador: "min_ventana", operador: "ejecutar", valor: 2, unidad: "C" }] }] }));
});

test("producción falla cerrada si se desactiva la verificación TLS", () => {
  assert.throws(() => validateDatabaseSecurityConfig({ NODE_ENV: "production", DATABASE_SSL_REJECT_UNAUTHORIZED: "false" }), /no está permitida/);
  assert.throws(() => validateDatabaseSecurityConfig({ NODE_ENV: "production", DATABASE_SSL: "false", DATABASE_SSL_REJECT_UNAUTHORIZED: "true" }), /TLS PostgreSQL es obligatorio/);
  assert.throws(() => validateDatabaseSecurityConfig({ NODE_ENV: "production", DATABASE_SSL_REJECT_UNAUTHORIZED: "true" }), /TLS PostgreSQL es obligatorio/);
  assert.doesNotThrow(() => validateDatabaseSecurityConfig({ NODE_ENV: "development", DATABASE_SSL_REJECT_UNAUTHORIZED: "false" }));
  assert.doesNotThrow(() => validateDatabaseSecurityConfig({ NODE_ENV: "production", DATABASE_SSL: "true", DATABASE_SSL_REJECT_UNAUTHORIZED: "true" }));
});
