import { requireAdminAccess } from "@/lib/admin/access";
import { query } from "@/lib/db/postgres";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminLotCreateSchema, parseInput } from "@/lib/security/validation";
import { createLot, listLots } from "@/lib/lots/repository";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    await requireAdminAccess(request, "datos_campo", "read");
    return success(await listLots(), id);
  } catch (error) {
    return failure(error, id);
  }
}

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "datos_campo", "write");
    const value = parseInput(adminLotCreateSchema, await readJsonBody(request));
    const lot = await createLot({ ...value, creado_por: actor.actorId });
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'crear','lote',$3,null,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, lot.id, JSON.stringify(lot), id],
    );
    return success(lot, id, {}, 201);
  } catch (error) {
    return failure(error, id);
  }
}
