import { requireAdminAccess } from "@/lib/admin/access";
import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminFieldDatumCreateSchema, parseInput } from "@/lib/security/validation";
import { createFieldDatum, listFieldData } from "@/lib/field-data/repository";
import { listVariables } from "@/lib/variables/repository";
import { canonicalVariable } from "@/lib/rules/variables";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    await requireAdminAccess(request, "datos_campo", "read");
    const fieldId = new URL(request.url).searchParams.get("field_id")?.trim() || undefined;
    return success(await listFieldData(fieldId), id);
  } catch (error) {
    return failure(error, id);
  }
}

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "datos_campo", "write");
    const value = parseInput(adminFieldDatumCreateSchema, await readJsonBody(request));
    const catalog = await listVariables();
    if (!catalog.administrable) throw new DomainError("MIGRACION_PENDIENTE", "Para cargar datos de campo hay que aplicar la migración 032.", 409);
    const variableKey = canonicalVariable(value.variable_key);
    const variable = catalog.variables.find((item) => item.clave === variableKey);
    if (!variable || !variable.activa) throw new DomainError("VARIABLE_DESCONOCIDA", `La variable "${value.variable_key}" no está en el catálogo.`, 422);
    const created = await createFieldDatum({ ...value, variable_key: variableKey, unit: value.unit ?? variable.unidad, recorded_by: actor.actorId });
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'crear','dato_campo',$3,null,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, created.id, JSON.stringify(created), id],
    );
    return success(created, id, {}, 201);
  } catch (error) {
    return failure(error, id);
  }
}
