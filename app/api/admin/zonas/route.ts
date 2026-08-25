import { query } from "@/lib/db/postgres";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminZonaCreateSchema, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createZona, getZonas } from "@/lib/plagas/repository";

export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "plagas_cultivos_fenologia", "read");
    return success(await getZonas(), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "plagas_cultivos_fenologia", "write");
    const body = parseInput(adminZonaCreateSchema, await readJsonBody(request));
    const zona = await createZona(body);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','zona',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, zona.id, JSON.stringify(zona), rid],
    );
    return success(zona, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
