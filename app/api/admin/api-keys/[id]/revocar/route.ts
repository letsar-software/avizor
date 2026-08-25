import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { parseAdminId } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { revocarApiKey } from "@/lib/empresas/api-keys-repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "empresas", "write");
    const id = parseAdminId((await params).id);
    const apiKey = await revocarApiKey(id);
    if (!apiKey) throw new DomainError("API_KEY_NO_ENCONTRADA", "API key no encontrada.", 404);

    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'revocar','api_key',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify(apiKey), rid],
    );
    return success(apiKey, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
