import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { parseAdminId } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createAdminInvitation } from "@/lib/admin/auth";
import { getUsuarioById } from "@/lib/usuarios/repository";

// Reenvía la invitación (enlace vencido o perdido). Solo tiene sentido mientras el
// usuario sigue 'invitado' — uno ya activo cambia de contraseña por PATCH, no por acá.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "usuarios", "write");
    const id = parseAdminId((await params).id);

    const usuario = await getUsuarioById(id);
    if (!usuario) throw new DomainError("USUARIO_NO_ENCONTRADO", "Usuario no encontrado.", 404);
    if (usuario.estado !== "invitado") throw new DomainError("USUARIO_NO_INVITADO", "Solo se puede reenviar la invitación a un usuario en estado 'invitado'.", 409);

    const invitacion = await createAdminInvitation(id);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'reenviar_invitacion','usuario',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify({ expira_en: invitacion.expiraEn.toISOString() }), rid],
    );

    return success({ token: invitacion.token, expira_en: invitacion.expiraEn.toISOString() }, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
