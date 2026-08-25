import { randomBytes } from "node:crypto";
import { query } from "@/lib/db/postgres";
import { hashApiKey } from "@/lib/security/api-keys";
import type { ApiKeyAdmin, ApiKeyConUso, ApiKeyCreada } from "@/types";

// Todas las consultas listan columnas explícitas: key_hash no debe poder
// filtrarse a una respuesta de API, igual que password_hash en usuarios_admin.
const COLUMNAS = "id, nombre, empresa_id, scopes, activa, revocada_at::text, expira_at::text, limite_mensual, created_at::text";

export async function getApiKeysPorEmpresa(empresaId: string): Promise<ApiKeyConUso[]> {
  const result = await query<ApiKeyConUso>(
    `select k.id, k.nombre, k.empresa_id, k.scopes, k.activa, k.revocada_at::text, k.expira_at::text, k.limite_mensual, k.created_at::text,
       (select count(*)::int from api_uso u where u.api_key_id = k.id and u.created_at >= date_trunc('month', now())) as uso_mes_actual
     from api_keys k where k.empresa_id = $1 order by k.created_at desc`,
    [empresaId],
  );
  return result.rows;
}

export async function createApiKey(input: { empresaId: string; nombre: string; scopes: string[]; limiteMensual?: number | null; expiraEn?: string | null }): Promise<ApiKeyCreada> {
  const key = randomBytes(32).toString("hex");
  const result = await query<ApiKeyAdmin>(
    `insert into api_keys(nombre,key_hash,empresa_id,scopes,limite_mensual,expira_at)
     values($1,$2,$3,$4,$5,$6) returning ${COLUMNAS}`,
    [input.nombre, hashApiKey(key), input.empresaId, input.scopes, input.limiteMensual ?? null, input.expiraEn ?? null],
  );
  return { ...result.rows[0], key };
}

export async function revocarApiKey(id: string) {
  const result = await query<ApiKeyAdmin>(
    `update api_keys set activa = false, revocada_at = now() where id = $1 returning ${COLUMNAS}`,
    [id],
  );
  return result.rows[0] ?? null;
}
