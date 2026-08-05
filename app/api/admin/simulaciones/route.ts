import { ConsultaService } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { requireInternalAuth } from "@/lib/security/internal-auth";
import type { ConsultaInput } from "@/types";
export async function POST(request: Request) { const id=requestId(request); try { requireInternalAuth(request); const body=await request.json() as ConsultaInput; return success(await new ConsultaService().ejecutar({...body,canal:"admin"},id),id); } catch(error) { return failure(error,id); } }
