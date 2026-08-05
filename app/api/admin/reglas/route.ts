import { getReglasAdministrables } from "@/lib/rules/repository-v2";
import { failure, requestId, success } from "@/lib/http/responses";
import { requireInternalAuth } from "@/lib/security/internal-auth";
export async function GET(request: Request) { const id=requestId(request); try { requireInternalAuth(request); return success(await getReglasAdministrables(),id); } catch(error) { return failure(error,id); } }
