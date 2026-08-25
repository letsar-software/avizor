import { ConsultaService } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { requireAdminAccess } from "@/lib/admin/access";
import type { ConsultaInput } from "@/types";
import { readJsonBody } from "@/lib/http/json-body";
import { consultaV2Schema, parseInput } from "@/lib/security/validation";
export async function POST(request: Request) { const id=requestId(request); try { await requireAdminAccess(request,"laboratorio","write"); const body=parseInput(consultaV2Schema,await readJsonBody(request)) as ConsultaInput; return success(await new ConsultaService().ejecutar({...body,canal:"admin"},id),id); } catch(error) { return failure(error,id); } }
