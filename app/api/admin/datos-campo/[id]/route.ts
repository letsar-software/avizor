import { requireAdminAccess } from "@/lib/admin/access";
import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminFieldDatumPatchSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { getFieldDatum, updateFieldDatum } from "@/lib/field-data/repository";

/** Marca un dato como histórico o ajusta su vencimiento; nunca borra, para conservar trazabilidad. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "datos_campo", "write");
    const id = parseAdminId((await params).id);
    const patch = parseInput(adminFieldDatumPatchSchema, await readJsonBody(request));
    const before = await getFieldDatum(id);
    if (!before) throw new DomainError("DATO_NO_ENCONTRADO", "Dato de campo no encontrado.", 404);
    const after = await updateFieldDatum(id, patch);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'actualizar','dato_campo',$3,$4::jsonb,$5::jsonb,$6)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify(before), JSON.stringify(after), rid],
    );
    return success(after, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
