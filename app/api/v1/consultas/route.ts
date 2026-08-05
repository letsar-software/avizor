import { ConsultaService } from "@/lib/consultas/service";
import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { failure, requestId, success } from "@/lib/http/responses";
import { authenticateApiKey } from "@/lib/security/api-keys";
import type { ConsultaInput } from "@/types";

export async function POST(request: Request) {
  const id = requestId(request); const started = performance.now(); let keyId: string | null = null; let status = 201;
  try {
    keyId = await authenticateApiKey(request);
    const body = await request.json() as ConsultaInput;
    const result = await new ConsultaService().ejecutar({ ...body, canal: "api_empresa" }, id);
    return success(result, id, { version: "v1" }, status);
  } catch (error) { status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500; return failure(error, id); }
  finally { if (keyId && hasDatabaseConfig()) await query("insert into api_uso(api_key_id,request_id,endpoint,status,duracion_ms) values($1,$2,$3,$4,$5)", [keyId,id,"POST /api/v1/consultas",status,Math.round(performance.now()-started)]).catch(() => undefined); }
}
