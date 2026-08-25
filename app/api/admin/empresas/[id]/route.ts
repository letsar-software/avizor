import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminEmpresaPatchSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { getEmpresaById, updateEmpresa } from "@/lib/empresas/repository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "empresas", "read");
    const id = parseAdminId((await params).id);
    const empresa = await getEmpresaById(id);
    if (!empresa) throw new DomainError("EMPRESA_NO_ENCONTRADA", "Empresa no encontrada.", 404);
    return success(empresa, rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "empresas", "write");
    const id = parseAdminId((await params).id);
    const body = parseInput(adminEmpresaPatchSchema, await readJsonBody(request));

    const before = await getEmpresaById(id);
    if (!before) throw new DomainError("EMPRESA_NO_ENCONTRADA", "Empresa no encontrada.", 404);

    const after = await updateEmpresa(id, body);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'actualizar','empresa',$3,$4::jsonb,$5::jsonb,$6)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify(before), JSON.stringify(after), rid],
    );
    return success(after, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
