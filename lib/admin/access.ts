import { redirect } from "next/navigation";
import { DomainError } from "@/lib/consultas/service";
import { requireInternalAuth } from "@/lib/security/internal-auth";
import { getAdminSession, type AdminRole } from "@/lib/admin/auth";
import { readAdminSessionToken } from "@/lib/admin/session-cookie";
import { hasAccess, type AdminModule } from "@/lib/admin/permissions";

export interface AdminAccessActor { actorId: string; actorTipo: "usuario_admin" | "service"; rol?: AdminRole }

// Guard para API routes: el panel llama con cookie de sesión (rol acotado por permissions.ts);
// los servicios internos siguen llamando con el token compartido (acceso total, como antes).
export async function requireAdminAccess(request: Request, modulo: AdminModule, required: "read" | "write"): Promise<AdminAccessActor> {
  const session = await getAdminSession(await readAdminSessionToken());
  if (session) {
    if (!hasAccess(session.rol, modulo, required)) throw new DomainError("NO_AUTORIZADO", "No tenés permiso para esta acción.", 403);
    return { actorId: session.id, actorTipo: "usuario_admin", rol: session.rol };
  }
  return { actorId: requireInternalAuth(request), actorTipo: "service" };
}

// Guard para páginas del panel (Server Components): si no hay sesión, a login;
// si hay sesión pero sin permiso para el módulo, vuelve al dashboard.
export async function requireAdminPageAccess(modulo: AdminModule, required: "read" | "write") {
  const actor = await getAdminSession(await readAdminSessionToken());
  if (!actor) redirect("/admin/login");
  if (!hasAccess(actor.rol, modulo, required)) redirect("/admin");
  return actor;
}
