import { createHash } from "node:crypto";
import { getPool } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";

export async function authenticateApiKey(request: Request, usage?: { requestId: string; endpoint: string }) {
  const raw = request.headers.get("x-api-key");
  if (!raw) throw new DomainError("API_KEY_INVALIDA", "API key inválida.", 401);
  const hash = createHash("sha256").update(raw).digest("hex");
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await client.query<{ id: string; limite_mensual: number | null; uso: string }>(`select k.id::text, k.limite_mensual,
      (select count(*)::text from api_uso u where u.api_key_id=k.id and u.created_at >= date_trunc('month', now())) uso
      from api_keys k where k.key_hash=$1 and k.activa=true and k.revocada_at is null and (k.expira_at is null or k.expira_at>now())
      for update of k`, [hash]);
    const key = result.rows[0];
    if (!key) throw new DomainError("API_KEY_INVALIDA", "API key inválida, revocada o expirada.", 401);
    if (key.limite_mensual !== null && Number(key.uso) >= key.limite_mensual) throw new DomainError("LIMITE_EXCEDIDO", "Se alcanzó el límite de consultas.", 429);
    if (usage) await client.query("insert into api_uso(api_key_id,request_id,endpoint,status,duracion_ms) values($1,$2,$3,$4,$5)", [key.id, usage.requestId, usage.endpoint, 102, 0]);
    await client.query("commit");
    return key.id;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
