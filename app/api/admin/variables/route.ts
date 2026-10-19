import { requireAdminAccess } from "@/lib/admin/access";
import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { getReglasAdministrables } from "@/lib/rules/repository-v2";
import { adminVariableCreateSchema, parseInput } from "@/lib/security/validation";
import { CONFIGURED_CLIMATE_PROVIDER, catalogEntries } from "@/lib/variables/catalog";
import { createVariable, listVariables, variableUsage } from "@/lib/variables/repository";

/** Catálogo con cobertura del proveedor configurado y uso por regla/cultivo. */
export async function GET(request: Request) {
  const id = requestId(request);
  try {
    await requireAdminAccess(request, "reglas", "read");
    const [catalog, rules] = await Promise.all([listVariables(), getReglasAdministrables()]);
    const usage = variableUsage(rules);
    return success({
      proveedor: CONFIGURED_CLIMATE_PROVIDER,
      administrable: catalog.administrable,
      variables: catalogEntries(catalog.variables, usage),
    }, id);
  } catch (error) {
    return failure(error, id);
  }
}

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "reglas", "write");
    const value = parseInput(adminVariableCreateSchema, await readJsonBody(request));
    const catalog = await listVariables();
    if (!catalog.administrable) throw new DomainError("MIGRACION_PENDIENTE", "Para crear variables hay que aplicar la migración 032.", 409);
    if (catalog.variables.some((variable) => variable.clave === value.clave)) {
      throw new DomainError("VARIABLE_EXISTENTE", `La variable "${value.clave}" ya existe en el catálogo.`, 409);
    }
    const created = await createVariable({ ...value, creado_por: actor.actorId });
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'crear','variable_agronomica',$3,null,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, created.clave, JSON.stringify(created), id],
    );
    return success(created, id, {}, 201);
  } catch (error) {
    return failure(error, id);
  }
}
