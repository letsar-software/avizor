import { createHash } from "node:crypto";
import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";

export async function authenticateApiKey(request: Request) {
  const raw = request.headers.get("x-api-key");
  if (!raw) throw new DomainError("API_KEY_INVALIDA", "API key inválida.", 401);
  const hash = createHash("sha256").update(raw).digest("hex");
  const result = await query<{ id: string; limite_mensual: number | null; uso: string }>(`select k.id::text, k.limite_mensual,
    (select count(*)::text from api_uso u where u.api_key_id=k.id and u.created_at >= date_trunc('month', now())) uso
    from api_keys k where k.key_hash=$1 and k.activa=true and k.revocada_at is null and (k.expira_at is null or k.expira_at>now())`, [hash]);
  const key = result.rows[0];
  if (!key) throw new DomainError("API_KEY_INVALIDA", "API key inválida, revocada o expirada.", 401);
  if (key.limite_mensual !== null && Number(key.uso) >= key.limite_mensual) throw new DomainError("LIMITE_EXCEDIDO", "Se alcanzó el límite de consultas.", 429);
  return key.id;
}
