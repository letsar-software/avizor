import { query } from "@/lib/db/postgres";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminCropCreateSchema, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createCultivo, getCultivos } from "@/lib/cultivos/repository";

export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "plagas_cultivos_fenologia", "read");
    return success(await getCultivos(), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "plagas_cultivos_fenologia", "write");
    const body = parseInput(adminCropCreateSchema, await readJsonBody(request));
    const cultivo = await createCultivo(body);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','cultivo',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, cultivo.id, JSON.stringify(cultivo), rid],
    );
    return success(cultivo, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
