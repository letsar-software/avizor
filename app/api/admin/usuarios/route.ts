import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminUserCreateSchema, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { createAdminInvitation } from "@/lib/admin/auth";
import { createUsuario, getUsuarioByEmail, getUsuarios } from "@/lib/usuarios/repository";

export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "usuarios", "read");
    return success(await getUsuarios(), rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "usuarios", "write");
    const body = parseInput(adminUserCreateSchema, await readJsonBody(request));

    if (await getUsuarioByEmail(body.email)) {
      throw new DomainError("EMAIL_YA_EXISTE", "Ya existe un usuario con ese email.", 409);
    }

    const invitadoPor = actor.actorTipo === "usuario_admin" ? actor.actorId : null;
    const usuario = await createUsuario({ ...body, invitadoPor });
    const invitacion = await createAdminInvitation(usuario.id);
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_nuevo,request_id) values($1,$2,'crear','usuario',$3,$4::jsonb,$5)",
      [actor.actorId, actor.actorTipo, usuario.id, JSON.stringify(usuario), rid],
    );
    // El token solo se devuelve acá, en la respuesta del alta — igual que la clave de
    // una API key nueva (fase 5). No hay envío de email; el panel lo muestra una vez
    // para que el administrador lo copie y lo comparta por el canal que use hoy.
    return success({ usuario, invitacion: { token: invitacion.token, expira_en: invitacion.expiraEn.toISOString() } }, rid, {}, 201);
  } catch (error) {
    return failure(error, rid);
  }
}
