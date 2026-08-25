import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminUserPatchSchema, parseAdminId, parseInput } from "@/lib/security/validation";
import { requireAdminAccess } from "@/lib/admin/access";
import { getUsuarioById, updateUsuario } from "@/lib/usuarios/repository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "usuarios", "read");
    const id = parseAdminId((await params).id);
    const usuario = await getUsuarioById(id);
    if (!usuario) throw new DomainError("USUARIO_NO_ENCONTRADO", "Usuario no encontrado.", 404);
    return success(usuario, rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid = requestId(request);
  try {
    const actor = await requireAdminAccess(request, "usuarios", "write");
    const id = parseAdminId((await params).id);
    const body = parseInput(adminUserPatchSchema, await readJsonBody(request));

    const before = await getUsuarioById(id);
    if (!before) throw new DomainError("USUARIO_NO_ENCONTRADO", "Usuario no encontrado.", 404);

    const after = await updateUsuario(id, body);
    // before/after ya vienen sin password_hash (ver lib/usuarios/repository.ts) — seguro para auditoría.
    await query(
      "insert into auditoria(actor_id,actor_tipo,accion,entidad,entidad_id,valor_anterior,valor_nuevo,request_id) values($1,$2,'actualizar','usuario',$3,$4::jsonb,$5::jsonb,$6)",
      [actor.actorId, actor.actorTipo, id, JSON.stringify(before), JSON.stringify(after), rid],
    );
    return success(after, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
