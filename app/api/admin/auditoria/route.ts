import { failure, requestId, success } from "@/lib/http/responses";
import { requireAdminAccess } from "@/lib/admin/access";
import { getAuditoria } from "@/lib/auditoria/repository";

export async function GET(request: Request) {
  const rid = requestId(request);
  try {
    await requireAdminAccess(request, "auditoria", "read");
    const params = new URL(request.url).searchParams;
    const entidad = params.get("entidad") ?? undefined;
    const accion = params.get("accion") ?? undefined;
    return success(await getAuditoria({ entidad, accion }), rid);
  } catch (error) {
    return failure(error, rid);
  }
}
