import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminRulePatchSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { hasAccess } from "@/lib/admin/permissions";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "reglas", "read");
    const id = parseAdminId((await params).id);
    const r = await query("select * from reglas_agronomicas where id::text=$1", [id]);
    if (!r.rows[0]) throw new DomainError("REGLA_NO_ENCONTRADA", "Regla no encontrada.", 404);
    return success(r.rows[0], rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "reglas", "write");
    const id = parseAdminId((await params).id);
    const body = parseInput(adminRulePatchSchema, await readJsonBody(request));

    const before = await query("select * from reglas_agronomicas where id::text=$1", [id]);
    if (!before.rows[0]) throw new DomainError("REGLA_NO_ENCONTRADA", "Regla no encontrada.", 404);

    // RN-004: una regla vigente no se edita in place; hay que crear una nueva versión.
    if (before.rows[0].estado === "vigente" && body.definicion !== undefined) {
      throw new DomainError("REGLA_VIGENTE_INMUTABLE", "No se puede editar la definición de una regla vigente. Creá una nueva versión.", 409);
    }

    if (body.estado === "vigente") {
      // RN-013: no promover a vigente sin validación agronómica registrada.
      const validadoPor = body.validado_por ?? before.rows[0].validado_por;
      const validadoEn = body.validado_en ?? before.rows[0].validado_en;
      if (!validadoPor || !validadoEn) {
        throw new DomainError("VALIDACION_REQUERIDA", "No se puede promover a vigente sin validado_por y validado_en.", 422);
      }
      // Promover a vigente es una acción distinta de editar: solo administrador (actor de servicio queda exento).
      if (actor.rol && !hasAccess(actor.rol, "reglas_promover", "write")) {
        throw new DomainError("NO_AUTORIZADO", "Solo un administrador puede promover una regla a vigente.", 403);
      }
    }

    const r = await query(
      `update reglas_agronomicas set
         estado=coalesce($2,estado),
         definicion=coalesce($3::jsonb,definicion),
         validado_por=coalesce($4,validado_por),
         validado_en=coalesce($5::timestamptz,validado_en),
         updated_at=now()
       where id::text=$1 returning *`,
      [id, body.estado ?? null, body.definicion ? JSON.stringify(body.definicion) : null, body.validado_por ?? null, body.validado_en ?? null],
    );

    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'actualizar','regla',$3,$4::jsonb,$5::jsonb,$6)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify(before.rows[0]), JSON.stringify(r.rows[0]), rid],
    );

    return success(r.rows[0], rid);
  } catch (error) {
    return failure(error, rid);
  }
}
