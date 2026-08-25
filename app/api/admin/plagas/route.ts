import { query } from "@/lib/db/postgres";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminPlagaCreateSchema, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createPlaga, getCatalogoPlagas } from "@/lib/plagas/repository";

export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "plagas_cultivos_fenologia", "read");
    const cultivo = new URL(request.url).searchParams.get("cultivo") ?? undefined;
    return success(await getCatalogoPlagas(cultivo), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "plagas_cultivos_fenologia", "write");
    const body = parseInput(adminPlagaCreateSchema, await readJsonBody(request));
    const plaga = await createPlaga(body);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','plaga',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, plaga.id, JSON.stringify(plaga), rid],
    );
    return success(plaga, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
