import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminApiKeyCreateSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { getEmpresaById } from "@/lib/empresas/repository";
import { createApiKey, getApiKeysPorEmpresa } from "@/lib/empresas/api-keys-repository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "empresas", "read");
    const empresaId = parseAdminId((await params).id);
    return success(await getApiKeysPorEmpresa(empresaId), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "empresas", "write");
    const empresaId = parseAdminId((await params).id);
    const body = parseInput(adminApiKeyCreateSchema, await readJsonBody(request));

    const empresa = await getEmpresaById(empresaId);
    if (!empresa) throw new DomainError("EMPRESA_NO_ENCONTRADA", "Empresa no encontrada.", 404);

    const apiKey = await createApiKey({ empresaId, nombre: body.nombre, scopes: body.scopes, limiteMensual: body.limite_mensual, expiraEn: body.expira_en });
    // Auditamos sin la key en texto plano: solo se muestra una vez en la respuesta.
    const { key: _key, ...sinKey } = apiKey;
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','api_key',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, apiKey.id, JSON.stringify(sinKey), rid],
    );
    return success(apiKey, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
