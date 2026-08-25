import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminModeloFenologicoCreateSchema, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createModelo, getModelosAdministrables } from "@/lib/fenologia/repository";

export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "plagas_cultivos_fenologia", "read");
    return success(await getModelosAdministrables(), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "plagas_cultivos_fenologia", "write");
    const body = parseInput(adminModeloFenologicoCreateSchema, await readJsonBody(request));

    let modelo;
    try {
      modelo = await createModelo({ cultivo: body.cultivo, version: body.version, proveedor: body.proveedor, parametros: body.parametros, fuenteTecnica: body.fuente_tecnica });
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as { code?: string }).code === "23505") {
        throw new DomainError("VERSION_YA_EXISTE", "Ya existe un modelo con ese cultivo y versión.", 409);
      }
      throw error;
    }

    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','modelo_fenologico',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, modelo.id, JSON.stringify(modelo), rid],
    );
    return success(modelo, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
