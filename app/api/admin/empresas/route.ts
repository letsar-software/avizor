import { query } from "@/lib/db/postgres";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminEmpresaCreateSchema, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createEmpresa, getEmpresas } from "@/lib/empresas/repository";

export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "empresas", "read");
    return success(await getEmpresas(), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "empresas", "write");
    const body = parseInput(adminEmpresaCreateSchema, await readJsonBody(request));
    const empresa = await createEmpresa(body);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','empresa',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, empresa.id, JSON.stringify(empresa), rid],
    );
    return success(empresa, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
