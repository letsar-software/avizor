import { getReglasAdministrables } from "@/lib/rules/repository-v2";
import { failure, requestId, success } from "@/lib/http/responses";
import { requireAdminAccess } from "@/lib/admin/access";
export async function GET(request: Request) { const id=requestId(request); try { await requireAdminAccess(request,"reglas","read"); return success(await getReglasAdministrables(),id); } catch(error) { return failure(error,id); } }
