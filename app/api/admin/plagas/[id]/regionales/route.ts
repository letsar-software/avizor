import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminRegionalCreateSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createRegional, getPlagaById, getRegionalesByPlaga } from "@/lib/plagas/repository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "plagas_cultivos_fenologia", "read");
    const plagaId = parseAdminId((await params).id);
    return success(await getRegionalesByPlaga(plagaId), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "plagas_cultivos_fenologia", "write");
    const plagaId = parseAdminId((await params).id);
    const body = parseInput(adminRegionalCreateSchema, await readJsonBody(request));

    const plaga = await getPlagaById(plagaId);
    if (!plaga) throw new DomainError("PLAGA_NO_ENCONTRADA", "Plaga no encontrada.", 404);

    const regional = await createRegional({ ...body, plaga_id: plagaId });
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','plaga_regional',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, regional.id, JSON.stringify(regional), rid],
    );
    return success(regional, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
