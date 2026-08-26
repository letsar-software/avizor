import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminAcceptInvitationSchema, parseInput } from "@/lib/security/validation";
import { enforceRateLimit, RATE_LIMITS, resolveClientIp } from "@/lib/security/rate-limit";
import { acceptAdminInvitation, createAdminSession, getAdminInvitation, touchAdminLastAccess } from "@/lib/admin/auth";
import { setAdminSessionCookie } from "@/lib/admin/session-cookie";

// Ruta pública (sin sesión): la autorización la da conocer el token, no un login previo.
export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) throw new DomainError("INVITACION_INVALIDA", "El enlace de invitación no es válido o venció.", 410);
    const invitacion = await getAdminInvitation(token);
    if (!invitacion) throw new DomainError("INVITACION_INVALIDA", "El enlace de invitación no es válido o venció.", 410);
    return success({ email: invitacion.email, nombre: invitacion.nombre }, rid);
  } catch (error) {
    return failure(error, rid);
  }
}

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const body = parseInput(adminAcceptInvitationSchema, await readJsonBody(request));
    await enforceRateLimit(RATE_LIMITS.adminInviteAccept, resolveClientIp(request));

    const usuario = await acceptAdminInvitation(body.token, body.password);
    const session = await createAdminSession(usuario.id);
    await touchAdminLastAccess(usuario.id);
    await setAdminSessionCookie(session.token, session.expiraEn);

    return success({ id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
