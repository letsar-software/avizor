import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminPlagaPatchSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { getPlagaById, updatePlaga } from "@/lib/plagas/repository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "plagas_cultivos_fenologia", "read");
    const id = parseAdminId((await params).id);
    const plaga = await getPlagaById(id);
    if (!plaga) throw new DomainError("PLAGA_NO_ENCONTRADA", "Plaga no encontrada.", 404);
    return success(plaga, rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "plagas_cultivos_fenologia", "write");
    const id = parseAdminId((await params).id);
    const body = parseInput(adminPlagaPatchSchema, await readJsonBody(request));

    const before = await getPlagaById(id);
    if (!before) throw new DomainError("PLAGA_NO_ENCONTRADA", "Plaga no encontrada.", 404);

    const after = await updatePlaga(id, body);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'actualizar','plaga',$3,$4::jsonb,$5::jsonb,$6)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify(before), JSON.stringify(after), rid],
    );
    return success(after, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
