import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminModeloFenologicoPatchSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { getModeloById, updateModelo } from "@/lib/fenologia/repository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "plagas_cultivos_fenologia", "read");
    const id = parseAdminId((await params).id);
    const modelo = await getModeloById(id);
    if (!modelo) throw new DomainError("MODELO_NO_ENCONTRADO", "Modelo fenológico no encontrado.", 404);
    return success(modelo, rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "plagas_cultivos_fenologia", "write");
    const id = parseAdminId((await params).id);
    const body = parseInput(adminModeloFenologicoPatchSchema, await readJsonBody(request));

    const before = await getModeloById(id);
    if (!before) throw new DomainError("MODELO_NO_ENCONTRADO", "Modelo fenológico no encontrado.", 404);

    // RN-004 (mismo criterio que reglas_agronomicas): un modelo vigente no se edita
    // in place — hay que cargar una nueva versión.
    if (before.estado === "vigente" && body.parametros !== undefined) {
      throw new DomainError("MODELO_VIGENTE_INMUTABLE", "No se pueden editar los parámetros de un modelo vigente. Creá una nueva versión.", 409);
    }

    if (body.estado === "vigente") {
      // RN-013 (mismo criterio que reglas_agronomicas): no promover sin validación agronómica registrada.
      const validadoPor = body.validado_por ?? before.validado_por;
      const validadoEn = body.validado_en ?? before.validado_en;
      if (!validadoPor || !validadoEn) {
        throw new DomainError("VALIDACION_REQUERIDA", "No se puede promover a vigente sin validado_por y validado_en.", 422);
      }
    }

    const after = await updateModelo(id, { estado: body.estado, parametros: body.parametros, fuenteTecnica: body.fuente_tecnica, validadoPor: body.validado_por, validadoEn: body.validado_en });
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'actualizar','modelo_fenologico',$3,$4::jsonb,$5::jsonb,$6)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify(before), JSON.stringify(after), rid],
    );
    return success(after, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
