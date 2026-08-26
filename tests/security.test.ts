import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clearClimateCache, getClimateCache, setClimateCache } from "../lib/climate/cache";
import { requireInternalAuth } from "../lib/security/internal-auth";
import type { ClimateSeriesResult } from "../lib/climate/contract";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("las rutas públicas autorizan exclusivamente mediante share_token", async () => {
  for (const path of ["app/api/public/consultas/[id]/route.ts", "lib/consultas/interactions-v2.ts"]) {
    const contents = await source(path);
    assert.match(contents, /where share_token=\$1/);
    assert.doesNotMatch(contents, /id::text\s*=\s*\$1\s+or\s+share_token/i);
  }
});

test("la cuota empresarial se reserva bajo bloqueo antes de ejecutar la consulta", async () => {
  const auth = await source("lib/security/api-keys.ts");
  const route = await source("app/api/v1/consultas/route.ts");
  assert.match(auth, /for update of k/i);
  assert.match(auth, /insert into api_uso/);
  assert.match(route, /authenticateApiKey\(request,\s*"consultas:crear",\s*\{/);
  assert.match(route, /update api_uso set status/);
});

test("una API key sin el scope requerido no llega a consumir cuota", async () => {
  const auth = await source("lib/security/api-keys.ts");
  const scopeCheck = /if \(!key\.scopes\.includes\(requiredScope\)\) throw new DomainError\("SCOPE_NO_AUTORIZADO"/;
  const limitCheck = /if \(key\.limite_mensual/;
  assert.match(auth, scopeCheck);
  const scopeIndex = auth.search(scopeCheck);
  const limitIndex = auth.search(limitCheck);
  assert.ok(scopeIndex > 0 && scopeIndex < limitIndex, "el chequeo de scope debe ocurrir antes que el de límite mensual");
});

test("la conexión PostgreSQL verifica certificados por defecto", async () => {
  const contents = await source("lib/db/postgres.ts");
  assert.match(contents, /DATABASE_SSL_REJECT_UNAUTHORIZED !== "false"/);
  assert.doesNotMatch(contents, /rejectUnauthorized:\s*false/);
});

test("el actor de auditoría no se toma de x-actor-id", () => {
  const previousToken = process.env.AVIZOR_INTERNAL_TOKEN;
  const previousActor = process.env.AVIZOR_INTERNAL_ACTOR_ID;
  process.env.AVIZOR_INTERNAL_TOKEN = "test-secret";
  process.env.AVIZOR_INTERNAL_ACTOR_ID = "credential-bound-actor";
  try {
    const request = new Request("http://localhost", { headers: { authorization: "Bearer test-secret", "x-actor-id": "forged" } });
    assert.equal(requireInternalAuth(request), "credential-bound-actor");
  } finally {
    if (previousToken === undefined) delete process.env.AVIZOR_INTERNAL_TOKEN; else process.env.AVIZOR_INTERNAL_TOKEN = previousToken;
    if (previousActor === undefined) delete process.env.AVIZOR_INTERNAL_ACTOR_ID; else process.env.AVIZOR_INTERNAL_ACTOR_ID = previousActor;
  }
});

test("el cache climático expulsa entradas al alcanzar su capacidad", () => {
  clearClimateCache();
  const value = {} as ClimateSeriesResult;
  for (let index = 0; index <= 500; index += 1) setClimateCache(`key-${index}`, value);
  assert.equal(getClimateCache("key-0"), null);
  assert.strictEqual(getClimateCache("key-500"), value);
  clearClimateCache();
});

test("los fallbacks de persistencia no registran payloads completos", async () => {
  for (const path of ["lib/consultas/interesados.ts", "lib/consultas/repository.ts"]) {
    const contents = await source(path);
    assert.doesNotMatch(contents, /console\.info\([^\n]*\.\.\.input/);
  }
});

test("la aplicación impide framing y MIME sniffing mediante headers", async () => {
  const contents = await source("next.config.js");
  assert.match(contents, /frame-ancestors 'none'/);
  assert.match(contents, /X-Content-Type-Options/);
  assert.match(contents, /Strict-Transport-Security/);
});
